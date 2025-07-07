import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const debug = {
      tables: [],
      projects: [],
      analyses: [],
      inferences: {}
    };

    // Check tables
    try {
      const tablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      debug.tables = tablesResult.rows;
    } catch (error) {
      debug.tables = [`Error: ${error}`];
    }

    // Check projects
    try {
      const projectsResult = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
      debug.projects = projectsResult.rows;
    } catch (error) {
      debug.projects = [`Error: ${error}`];
    }

    // Check analyses
    try {
      const analysesResult = await sql`SELECT * FROM project_analyses ORDER BY analysis_date DESC LIMIT 10`;
      debug.analyses = analysesResult.rows;
    } catch (error) {
      debug.analyses = [`Error: ${error}`];
    }

    // Test inference function
    const testCases = ['App', 'Hektas', 'Craftolia', 'Efor Takip', 'Mobile App', 'Shop System'];
    
    const inferProjectTypeFromName = (projectName: string): string => {
      const name = projectName.toLowerCase();
      
      if (name.includes('app') || name.includes('mobile') || name.includes('ios') || name.includes('android')) {
        return 'Mobil Uygulama';
      } else if (name.includes('shop') || name.includes('store') || name.includes('ecommerce') || name.includes('e-commerce')) {
        return 'E-ticaret';
      } else if (name.includes('game') || name.includes('oyun')) {
        return 'Oyun';
      } else if (name.includes('api') || name.includes('backend') || name.includes('service')) {
        return 'API/Backend';
      } else if (name.includes('crm') || name.includes('erp')) {
        return 'CRM/ERP';
      } else if (name.includes('blog') || name.includes('website') || name.includes('site')) {
        return 'Kurumsal Website';
      }
      
      return 'Web Uygulaması';
    };

    testCases.forEach(projectName => {
      debug.inferences[projectName] = inferProjectTypeFromName(projectName);
    });

    res.status(200).json(debug);

  } catch (error) {
    res.status(500).json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}