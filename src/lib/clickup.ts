import axios from 'axios';
import { AIAnalysisResult, ClickUpTask, Project } from './types';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

const clickUpClient = axios.create({
  baseURL: CLICKUP_API_URL,
  headers: {
    'Authorization': process.env.NEXT_PUBLIC_CLICKUP_API_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Priority mapping
const priorityMap = {
  'low': 4,
  'medium': 3,
  'high': 2,
  'urgent': 1
};

export async function createTask(
  analysis: AIAnalysisResult,
  project: Project
): Promise<ClickUpTask> {
  try {
    const taskData = {
      name: analysis.title,
      description: `${analysis.description}\n\n**Teknik Gereksinimler:**\n${analysis.technicalRequirements.map(req => `- ${req}`).join('\n')}\n\n**Kabul Kriterleri:**\n${analysis.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}`,
      priority: priorityMap[analysis.priority],
      status: 'to do',
      tags: analysis.tags,
      time_estimate: convertTimeToMilliseconds(analysis.estimatedTime),
      due_date: analysis.dueDate ? new Date(analysis.dueDate).getTime() : undefined
    };

    const response = await clickUpClient.post(
      `/list/${project.clickupListId}/task`,
      taskData
    );

    const task = response.data;
    
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: task.status.status,
      url: task.url
    };
  } catch (error) {
    console.error('ClickUp task oluşturma hatası:', error);
    throw new Error('ClickUp task oluşturulamadı. API anahtarlarınızı kontrol edin.');
  }
}

export async function updateTask(
  taskId: string,
  analysis: AIAnalysisResult
): Promise<ClickUpTask> {
  try {
    const updateData = {
      name: analysis.title,
      description: `${analysis.description}\n\n**Teknik Gereksinimler:**\n${analysis.technicalRequirements.map(req => `- ${req}`).join('\n')}\n\n**Kabul Kriterleri:**\n${analysis.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}`,
      priority: priorityMap[analysis.priority],
      tags: analysis.tags,
      time_estimate: convertTimeToMilliseconds(analysis.estimatedTime),
      due_date: analysis.dueDate ? new Date(analysis.dueDate).getTime() : undefined
    };

    const response = await clickUpClient.put(`/task/${taskId}`, updateData);
    const task = response.data;
    
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: task.status.status,
      url: task.url
    };
  } catch (error) {
    console.error('ClickUp task güncelleme hatası:', error);
    throw new Error('ClickUp task güncellenemedi.');
  }
}

export async function getTasksByList(listId: string): Promise<ClickUpTask[]> {
  try {
    const response = await clickUpClient.get(`/list/${listId}/task`);
    const tasks = response.data.tasks;
    
    return tasks.map((task: any) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: task.status.status,
      url: task.url
    }));
  } catch (error) {
    console.error('ClickUp task listesi alma hatası:', error);
    throw new Error('ClickUp task listesi alınamadı.');
  }
}

function convertTimeToMilliseconds(timeString: string): number {
  // "1-2 gün" formatını milisaniyeye çevir
  const match = timeString.match(/(\d+)-?(\d+)?\s*(gün|saat|hafta)/i);
  if (!match) return 0;
  
  const [, min, max, unit] = match;
  const avgTime = max ? (parseInt(min) + parseInt(max)) / 2 : parseInt(min);
  
  switch (unit.toLowerCase()) {
    case 'saat':
      return avgTime * 60 * 60 * 1000;
    case 'gün':
      return avgTime * 8 * 60 * 60 * 1000; // 8 saatlik iş günü
    case 'hafta':
      return avgTime * 5 * 8 * 60 * 60 * 1000; // 5 günlük iş haftası
    default:
      return 0;
  }
}
