import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { AIAnalysisResult, Project, ClickUpTask } from '../../../lib/types';
import { withRateLimit } from '../../../lib/rateLimit';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

// Priority mapping
const priorityMap = {
  'low': 4,
  'medium': 3,
  'high': 2,
  'urgent': 1
};

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

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment variable kontrolü
  if (!process.env.CLICKUP_API_TOKEN) {
    return res.status(500).json({ 
      error: 'ClickUp API yapılandırması eksik. Lütfen sistem yöneticisi ile iletişime geçin.'
    });
  }

  try {
    const { analysis, project }: { 
      analysis: AIAnalysisResult; 
      project: Project 
    } = req.body;

    if (!analysis || !project) {
      return res.status(400).json({ error: 'Analysis ve project bilgileri gerekli' });
    }

    if (!project.clickupListId) {
      return res.status(400).json({ error: 'Project ClickUp List ID tanımlı değil' });
    }

    // Due date validation ve processing
    let dueDateTimestamp = undefined;
    if (analysis.dueDate && analysis.dueDate !== 'null' && analysis.dueDate.trim() !== '') {
      const parsedDate = new Date(analysis.dueDate);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2020) {
        dueDateTimestamp = parsedDate.getTime();
      }
    }

    // ClickUp task data hazırla
    const taskData = {
      name: analysis.title,
      description: `${analysis.description}\n\n**Teknik Gereksinimler:**\n${analysis.technicalRequirements.map(req => `- ${req}`).join('\n')}\n\n**Kabul Kriterleri:**\n${analysis.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}`,
      priority: priorityMap[analysis.priority as keyof typeof priorityMap],
      status: 'to do',
      tags: analysis.tags,
      time_estimate: convertTimeToMilliseconds(analysis.estimatedTime),
      due_date: dueDateTimestamp
    };

    // ClickUp API çağrısı
    const response = await axios.post(
      `${CLICKUP_API_URL}/list/${project.clickupListId}/task`,
      taskData,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    const task = response.data;
    
    const clickUpTask: ClickUpTask = {
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: task.status?.status || 'to do',
      url: task.url
    };

    res.status(200).json({ data: clickUpTask });

  } catch (error: unknown) {
    console.error('ClickUp API Error:', error);
    
    let errorMessage = 'ClickUp task oluşturulamadı.';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { err?: string } } };
      
      if (axiosError.response?.status === 401) {
        errorMessage = 'ClickUp API anahtarı geçersiz.';
      } else if (axiosError.response?.status === 404) {
        errorMessage = 'ClickUp List bulunamadı. List ID\'yi kontrol edin.';
      } else if (axiosError.response?.status === 403) {
        errorMessage = 'Bu workspace\'e erişim izniniz yok.';
      } else if (axiosError.response?.data?.err) {
        errorMessage = `ClickUp API hatası: ${axiosError.response.data.err}`;
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

export default withRateLimit(handler, 'clickup');