import { NextApiRequest, NextApiResponse } from 'next';
import { clearProjectsCache } from '../../../lib/projects';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear server-side cache
    clearProjectsCache();
    
    res.status(200).json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      error: 'Cache temizlenirken hata oluştu'
    });
  }
}