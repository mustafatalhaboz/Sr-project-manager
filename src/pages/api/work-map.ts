import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withRateLimit } from '../../lib/rateLimit';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: {
    status: string;
    color: string;
  };
  priority: {
    priority: string;
    color: string;
  } | null;
  assignees: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  tags: Array<{
    name: string;
    tag_fg: string;
    tag_bg: string;
  }>;
  time_estimate?: number;
  due_date?: string;
  date_created: string;
  list: {
    id: string;
    name: string;
  };
}

interface TaskData {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: number;
  assignees: string[];
  tags: string[];
  timeEstimate: number;
  projectName: string;
  dueDate: string;
  createdDate: string;
}

interface WorkMapStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  funnyTasks: TaskData[];
  longestTask: TaskData | null;
  shortestTask: TaskData | null;
  mostTaggedTask: TaskData | null;
  urgentWithoutAssignee: TaskData[];
  oldestTask: TaskData | null;
  weekendWarriors: TaskData[];
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    return res.status(500).json({ 
      error: 'ClickUp API yapılandırması eksik'
    });
  }

  if (!process.env.CLICKUP_TEAM_ID) {
    return res.status(500).json({ 
      error: 'ClickUp Team ID yapılandırması eksik'
    });
  }

  try {
    // Get all lists from team
    const teamId = process.env.CLICKUP_TEAM_ID;
    const spacesResponse = await axios.get(
      `${CLICKUP_API_URL}/team/${teamId}/space?archived=false`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const spaces = spacesResponse.data.spaces;
    const allTasks: TaskData[] = [];

    // Get tasks from all lists in all spaces
    for (const space of spaces) {
      try {
        // Get folderless lists
        const folderlessResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/list?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (folderlessResponse.data.lists) {
          for (const list of folderlessResponse.data.lists) {
            const tasks = await getTasksFromList(list.id, list.name);
            allTasks.push(...tasks);
          }
        }

        // Get tasks from folders
        const foldersResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/folder?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (foldersResponse.data.folders) {
          for (const folder of foldersResponse.data.folders) {
            const folderListsResponse = await axios.get(
              `${CLICKUP_API_URL}/folder/${folder.id}/list?archived=false`,
              {
                headers: {
                  'Authorization': process.env.CLICKUP_API_TOKEN,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );

            if (folderListsResponse.data.lists) {
              for (const list of folderListsResponse.data.lists) {
                const tasks = await getTasksFromList(list.id, list.name);
                allTasks.push(...tasks);
              }
            }
          }
        }
      } catch (spaceError) {
        console.warn(`Space ${space.id} tasks could not be fetched:`, spaceError);
        continue;
      }
    }

    // Analyze tasks and generate stats
    const stats = analyzeTasksForFun(allTasks);

    res.status(200).json({
      tasks: allTasks,
      stats: stats,
      count: allTasks.length
    });

  } catch (error: unknown) {
    console.error('Work Map API Error:', error);
    
    let errorMessage = 'İş haritası oluşturulamadı.';
    
    if (error && typeof error === 'object') {
      if ('code' in error && error.code === 'ECONNABORTED') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if ('response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { err?: string } } };
        
        if (axiosError.response?.status === 401) {
          errorMessage = 'ClickUp API anahtarı geçersiz.';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Bu workspace\'e erişim izniniz yok.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Workspace veya team bulunamadı.';
        }
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

async function getTasksFromList(listId: string, listName: string): Promise<TaskData[]> {
  try {
    const tasksResponse = await axios.get(
      `${CLICKUP_API_URL}/list/${listId}/task`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        params: {
          page: 0,
          order_by: 'created',
          reverse: true,
          subtasks: false,
          include_closed: true,
          limit: 100
        }
      }
    );

    const tasks = tasksResponse.data.tasks || [];
    
    return tasks.map((task: ClickUpTask) => ({
      id: task.id,
      name: task.name,
      description: task.description || '',
      status: task.status.status,
      priority: convertPriority(task.priority?.priority),
      assignees: task.assignees.map(a => a.username),
      tags: task.tags.map(t => t.name),
      timeEstimate: task.time_estimate ? Math.round(task.time_estimate / 3600000) : 0, // Convert ms to hours
      projectName: listName,
      dueDate: task.due_date || '',
      createdDate: task.date_created
    }));

  } catch (error) {
    console.warn(`Tasks from list ${listId} could not be fetched:`, error);
    return [];
  }
}

function convertPriority(priority?: string): number {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 1;
    case 'high': return 2;
    case 'normal': return 3;
    case 'low': return 4;
    default: return 5;
  }
}

function analyzeTasksForFun(tasks: TaskData[]): WorkMapStats {
  const now = new Date();
  
  const completedTasks = tasks.filter(t => 
    t.status.toLowerCase().includes('done') || 
    t.status.toLowerCase().includes('complete') ||
    t.status.toLowerCase().includes('closed')
  );

  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < now && !completedTasks.includes(t)
  );

  // Find funny/interesting tasks
  const funnyTasks = tasks.filter(task => {
    const name = task.name.toLowerCase();
    const desc = task.description.toLowerCase();
    
    // Komik kelimeler ve durumlar
    const funnyKeywords = [
      'bug', 'hata', 'çalışmıyor', 'neden', 'wtf', 'acil', 'asap',
      'pizza', 'kahve', 'coffee', 'uyku', 'yorgun', 'stress',
      'test', 'deneme', 'temp', 'geçici', 'fix', 'düzelt',
      'magic', 'sihir', 'nasıl', 'niye', 'kim', 'ne zaman',
      'deadline', 'rush', 'panic', 'help', 'yardım', 'sos'
    ];
    
    return funnyKeywords.some(keyword => 
      name.includes(keyword) || desc.includes(keyword)
    ) || task.name.length > 100 || task.tags.length > 10;
  });

  // Statistical analysis
  const tasksWithEstimate = tasks.filter(t => t.timeEstimate > 0);
  const longestTask = tasksWithEstimate.reduce((max, task) => 
    task.timeEstimate > (max?.timeEstimate || 0) ? task : max, null as TaskData | null
  );

  const shortestTask = tasksWithEstimate.reduce((min, task) => 
    task.timeEstimate < (min?.timeEstimate || Infinity) ? task : min, null as TaskData | null
  );

  const mostTaggedTask = tasks.reduce((max, task) => 
    task.tags.length > (max?.tags.length || 0) ? task : max, null as TaskData | null
  );

  const urgentWithoutAssignee = tasks.filter(t => 
    t.priority <= 2 && t.assignees.length === 0
  );

  const oldestTask = tasks.reduce((oldest, task) => 
    new Date(task.createdDate) < new Date(oldest?.createdDate || Date.now()) ? task : oldest, null as TaskData | null
  );

  // Weekend warriors (tasks created on weekends)
  const weekendWarriors = tasks.filter(task => {
    const date = new Date(task.createdDate);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  });

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    funnyTasks: funnyTasks,
    longestTask,
    shortestTask,
    mostTaggedTask,
    urgentWithoutAssignee,
    oldestTask,
    weekendWarriors
  };
}

export default withRateLimit(handler, 'clickup');