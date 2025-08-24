import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withRateLimit } from '../../../lib/rateLimit';
import { WorkspaceData, ClickUpTaskWithStatus } from '../../../lib/types';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment variable kontrolü
  if (!process.env.CLICKUP_API_TOKEN) {
    return res.status(500).json({ 
      error: 'ClickUp API yapılandırması eksik. Lütfen sistem yöneticisi ile iletişime geçin.'
    });
  }

  if (!process.env.CLICKUP_TEAM_ID) {
    return res.status(500).json({
      error: 'ClickUp Team ID yapılandırması eksik. CLICKUP_TEAM_ID environment variable\'ını ayarlayın.'
    });
  }

  try {
    const teamId = process.env.CLICKUP_TEAM_ID;
    
    // Team'in tüm space'lerini al
    const spacesResponse = await axios.get(
      `${CLICKUP_API_URL}/team/${teamId}/space?archived=false`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const allSpaces = spacesResponse.data.spaces || [];
    
    // RED ve GREY workspace'lerini filtrele
    const redSpaces = allSpaces.filter((space: { name: string }) => 
      space.name.toUpperCase().includes('RED')
    );
    
    const greySpaces = allSpaces.filter((space: { name: string }) => 
      space.name.toUpperCase().includes('GREY') || space.name.toUpperCase().includes('GRAY')
    );

    const workspaceData: WorkspaceData[] = [];

    // RED workspace verilerini topla
    if (redSpaces.length > 0) {
      const redWorkspaceData = await getWorkspaceTasksData('RED Workspace', redSpaces);
      workspaceData.push(redWorkspaceData);
    }

    // GREY workspace verilerini topla
    if (greySpaces.length > 0) {
      const greyWorkspaceData = await getWorkspaceTasksData('GREY Workspace', greySpaces);
      workspaceData.push(greyWorkspaceData);
    }

    res.status(200).json({ 
      data: workspaceData,
      count: workspaceData.length
    });

  } catch (error: unknown) {
    console.error('ClickUp Workspace Tasks API Error:', error);
    
    let errorMessage = 'ClickUp workspace task\'ları alınamadı.';
    
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
        } else if (axiosError.response?.data?.err) {
          errorMessage = `ClickUp API hatası: ${axiosError.response.data.err}`;
        }
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

// Workspace task verilerini topla
async function getWorkspaceTasksData(workspaceName: string, spaces: { id: string; name: string }[]): Promise<WorkspaceData> {
  const workspaceData: WorkspaceData = {
    workspaceName,
    spaces: []
  };

  for (const space of spaces) {
    try {
      const spaceData = {
        spaceName: space.name,
        lists: [] as {
          listId: string;
          listName: string;
          folderName?: string;
          inProgressTasks: ClickUpTaskWithStatus[];
        }[]
      };

      // Space'teki tüm list'leri al
      const allLists: { id: string; name: string; folderName?: string | null }[] = [];

      // Folderless list'leri al
      try {
        const folderlessResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/list?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        if (folderlessResponse.data.lists) {
          allLists.push(...folderlessResponse.data.lists.map((list: { id: string; name: string }) => ({
            ...list,
            folderName: null
          })));
        }
      } catch (error) {
        console.warn(`Space ${space.id} folderless lists alınamadı:`, error);
      }

      // Folder'lardaki list'leri al
      try {
        const foldersResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/folder?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        if (foldersResponse.data.folders) {
          for (const folder of foldersResponse.data.folders as { id: string; name: string }[]) {
            try {
              const folderListsResponse = await axios.get(
                `${CLICKUP_API_URL}/folder/${folder.id}/list?archived=false`,
                {
                  headers: {
                    'Authorization': process.env.CLICKUP_API_TOKEN,
                    'Content-Type': 'application/json'
                  },
                  timeout: 5000
                }
              );

              if (folderListsResponse.data.lists) {
                allLists.push(...folderListsResponse.data.lists.map((list: { id: string; name: string }) => ({
                  ...list,
                  folderName: folder.name
                })));
              }
            } catch (error) {
              console.warn(`Folder ${folder.id} lists alınamadı:`, error);
            }
          }
        }
      } catch (error) {
        console.warn(`Space ${space.id} folders alınamadı:`, error);
      }

      // Her list için in-progress task'ları al
      for (const list of allLists) {
        try {
          const tasksResponse = await axios.get(
            `${CLICKUP_API_URL}/list/${list.id}/task`,
            {
              headers: {
                'Authorization': process.env.CLICKUP_API_TOKEN,
                'Content-Type': 'application/json'
              },
              timeout: 5000,
              params: {
                page: 0,
                order_by: 'created',
                reverse: true,
                subtasks: false,
                include_closed: false, // Sadece açık task'lar
                limit: 100
              }
            }
          );

          const tasks = tasksResponse.data.tasks || [];
          
          // In-progress olan task'ları filtrele
          const inProgressTasks: ClickUpTaskWithStatus[] = tasks
            .filter((task: { status?: { status?: string } }) => 
              task.status?.status.toLowerCase().includes('progress') ||
              task.status?.status.toLowerCase().includes('doing') ||
              task.status?.status.toLowerCase().includes('development') ||
              task.status?.status.toLowerCase().includes('active')
            )
            .map((task: {
              id: string;
              name: string;
              description?: string;
              status?: { id?: string; status?: string; color?: string; type?: string; orderindex?: number };
              priority?: { id: string; priority: string; color: string; orderindex: number } | null;
              tags?: { name: string }[];
              assignees?: { id: string; username: string; email: string }[];
              due_date?: string;
              start_date?: string;
              time_estimate?: number;
            }) => ({
              id: task.id,
              name: task.name,
              description: task.description || '',
              status: {
                id: task.status?.id || '',
                status: task.status?.status || 'Unknown',
                color: task.status?.color || '#cccccc',
                type: task.status?.type || '',
                orderindex: task.status?.orderindex || 0
              },
              priority: task.priority ? {
                id: task.priority.id,
                priority: task.priority.priority,
                color: task.priority.color,
                orderindex: task.priority.orderindex
              } : null,
              tags: task.tags?.map((tag: { name: string }) => tag.name) || [],
              list: {
                id: list.id,
                name: list.name
              },
              folder: list.folderName ? {
                id: '',
                name: list.folderName
              } : undefined,
              space: {
                id: space.id,
                name: space.name
              },
              assignees: task.assignees?.map((assignee: { id: string; username: string; email: string }) => ({
                id: assignee.id,
                username: assignee.username,
                email: assignee.email
              })) || [],
              due_date: task.due_date,
              start_date: task.start_date,
              time_estimate: task.time_estimate
            }));

          if (inProgressTasks.length > 0) {
            spaceData.lists.push({
              listId: list.id,
              listName: list.name,
              folderName: list.folderName,
              inProgressTasks
            });
          }
        } catch (error) {
          console.warn(`List ${list.id} task'ları alınamadı:`, error);
        }
      }

      if (spaceData.lists.length > 0) {
        workspaceData.spaces.push(spaceData);
      }
    } catch (error) {
      console.warn(`Space ${space.id} verisi alınamadı:`, error);
    }
  }

  return workspaceData;
}

export default withRateLimit(handler, 'clickup');