import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withRateLimit } from '../../../lib/rateLimit';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Environment variable kontrolü
    if (!process.env.CLICKUP_API_TOKEN) {
      return res.status(500).json({ 
        error: 'ClickUp API yapılandırması eksik. Lütfen sistem yöneticisi ile iletişime geçin.'
      });
    }

    // ClickUp user bilgilerini al (bağlantı testi)
    const response = await axios.get(`${CLICKUP_API_URL}/user`, {
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const user = response.data.user;
    
    res.status(200).json({ 
      message: 'ClickUp API bağlantısı başarılı!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('ClickUp Test API Error:', error);
    
    let errorMessage = 'ClickUp API bağlantısı başarısız.';
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      
      if (axiosError.response?.status === 401) {
        errorMessage = 'ClickUp API anahtarı geçersiz.';
      } else if (axiosError.response?.status === 403) {
        errorMessage = 'ClickUp API erişim izni yok.';
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

export default withRateLimit(handler, 'clickup');