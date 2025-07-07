import { NextApiRequest, NextApiResponse } from 'next';
import { getProjects } from '../../lib/projects';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Loading projects from API endpoint...');
    const projects = await getProjects();
    console.log(`✅ Loaded ${projects.length} projects successfully`);
    
    res.status(200).json({
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('❌ Projects API error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Projeler yüklenemedi',
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}