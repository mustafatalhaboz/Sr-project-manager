import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

export default async function handler(
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
        error: 'ClickUp API token tanımlı değil.',
        debug: {
          hasToken: !!process.env.CLICKUP_API_TOKEN
        }
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

  } catch (error: any) {
    console.error('ClickUp Test API Error:', error.response?.data || error.message);
    
    let errorMessage = 'ClickUp API bağlantısı başarısız.';
    
    if (error.response?.status === 401) {
      errorMessage = 'ClickUp API anahtarı geçersiz.';
    } else if (error.response?.status === 403) {
      errorMessage = 'ClickUp API erişim izni yok.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? {
        status: error.response?.status,
        data: error.response?.data
      } : undefined
    });
  }
}