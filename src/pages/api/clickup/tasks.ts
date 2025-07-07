import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withRateLimit } from '../../../lib/rateLimit';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  tags: Array<{
    name: string;
    tag_fg: string;
    tag_bg: string;
  }>;
  custom_fields?: Array<{
    id: string;
    name: string;
    value?: string;
  }>;
}

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

  const { listId, limit = 10 } = req.query;

  if (!listId || typeof listId !== 'string') {
    return res.status(400).json({ error: 'listId parametresi gerekli' });
  }

  try {
    // Belirtilen list'in task'larını al
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
          limit: Math.min(Number(limit), 50) // Maximum 50 task
        }
      }
    );

    const tasks = tasksResponse.data.tasks || [];
    
    // Task'ları formatla - sadece analiz için gerekli bilgileri al
    const formattedTasks = tasks.map((task: ClickUpTask) => ({
      id: task.id,
      name: task.name,
      description: task.description || '',
      tags: task.tags?.map(tag => tag.name) || [],
      customFields: task.custom_fields?.map(field => ({
        name: field.name,
        value: field.value || ''
      })) || []
    }));

    res.status(200).json({ 
      data: formattedTasks,
      count: formattedTasks.length,
      listId: listId
    });

  } catch (error: unknown) {
    console.error('ClickUp Tasks API Error:', error);
    
    let errorMessage = 'ClickUp task\'ları alınamadı.';
    
    if (error && typeof error === 'object') {
      if ('code' in error && error.code === 'ECONNABORTED') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if ('response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { err?: string } } };
        
        if (axiosError.response?.status === 401) {
          errorMessage = 'ClickUp API anahtarı geçersiz.';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Bu liste erişim izniniz yok.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Liste bulunamadı.';
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

export default withRateLimit(handler, 'clickup');