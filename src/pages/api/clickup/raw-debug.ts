import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.CLICKUP_API_TOKEN || !process.env.CLICKUP_TEAM_ID) {
    return res.status(500).json({ 
      error: 'Missing ClickUp configuration',
      hasToken: !!process.env.CLICKUP_API_TOKEN,
      hasTeamId: !!process.env.CLICKUP_TEAM_ID
    });
  }

  try {
    const teamId = process.env.CLICKUP_TEAM_ID;
    
    // Get team info
    const teamResponse = await axios.get(`${CLICKUP_API_URL}/team/${teamId}`, {
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Get spaces
    const spacesResponse = await axios.get(`${CLICKUP_API_URL}/team/${teamId}/space?archived=false`, {
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const debugData = {
      team: {
        id: teamResponse.data.team?.id,
        name: teamResponse.data.team?.name,
      },
      spaces: spacesResponse.data.spaces?.map((space: { id: string; name: string; private?: boolean }) => ({
        id: space.id,
        name: space.name,
        private: space.private
      })) || [],
      spacesCount: spacesResponse.data.spaces?.length || 0
    };

    console.log('🔍 RAW DEBUG DATA:', JSON.stringify(debugData, null, 2));

    return res.status(200).json({
      success: true,
      data: debugData
    });

  } catch (error: unknown) {
    console.error('❌ Raw debug error:', error);
    return res.status(500).json({
      error: 'API request failed',
      details: (error as { response?: { data?: unknown }; message?: string })?.response?.data || (error as Error)?.message
    });
  }
}