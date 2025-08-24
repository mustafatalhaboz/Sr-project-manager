import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment variables kontrolü
  const hasToken = !!process.env.CLICKUP_API_TOKEN;
  const hasTeamId = !!process.env.CLICKUP_TEAM_ID;
  
  const debugInfo = {
    environment: {
      hasClickUpToken: hasToken,
      hasTeamId: hasTeamId,
      tokenLength: hasToken ? process.env.CLICKUP_API_TOKEN?.length : 0,
      teamId: hasTeamId ? process.env.CLICKUP_TEAM_ID : 'Not set',
      nodeEnv: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString(),
    message: 'ClickUp Debug Info'
  };

  console.log('Debug API called:', debugInfo);
  
  return res.status(200).json({
    success: true,
    data: debugInfo
  });
}