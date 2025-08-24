import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withRateLimit } from '../../../lib/rateLimit';
import { ClickUpWorkspace } from '../../../lib/types';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

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

  if (!process.env.CLICKUP_TEAM_ID) {
    return res.status(500).json({
      error: 'ClickUp Team ID yapılandırması eksik. CLICKUP_TEAM_ID environment variable\'ını ayarlayın.'
    });
  }

  try {
    const teamId = process.env.CLICKUP_TEAM_ID;
    
    // Önce team'in workspace'lerini al
    const workspacesResponse = await axios.get(
      `${CLICKUP_API_URL}/team/${teamId}`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const team = workspacesResponse.data.team;
    if (!team) {
      throw new Error('Team bilgisi alınamadı');
    }

    // Team'in tüm space'lerini al
    const spacesResponse = await axios.get(
      `${CLICKUP_API_URL}/team/${teamId}/space?archived=false`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const allSpaces = spacesResponse.data.spaces || [];
    
    // Debug: Team ismi ve space isimlerini log'la
    console.log('Team name:', team.name);
    console.log('Available spaces:', allSpaces.map((s: { name: string }) => s.name));
    
    // GEÇICI ÇÖZÜM: Workspace ismine bakma, tüm space'leri eşit dağıt
    console.log(`📊 WORKSPACE DEBUG INFO:`);
    console.log(`- Team ID: ${teamId}`);
    console.log(`- Team Name: "${team.name}"`);
    console.log(`- Total Spaces: ${allSpaces.length}`);
    console.log(`- Space Names:`, allSpaces.map((s: { name: string }) => s.name));
    
    // Tüm space'leri eşit olarak ikiye böl
    const totalSpaces = allSpaces.length;
    const halfIndex = Math.ceil(totalSpaces / 2);
    
    const redSpaces = allSpaces.slice(0, halfIndex);
    const greySpaces = allSpaces.slice(halfIndex);
    
    console.log(`🔄 FORCE DISTRIBUTION:`);
    console.log(`- RED spaces (${redSpaces.length}):`, redSpaces.map((s: { name: string }) => s.name));
    console.log(`- GREY spaces (${greySpaces.length}):`, greySpaces.map((s: { name: string }) => s.name));

    const workspaces: ClickUpWorkspace[] = [];

    // RED workspace oluştur
    if (redSpaces.length > 0) {
      workspaces.push({
        id: 'red-workspace',
        name: 'RED Workspace',
        spaces: redSpaces.map((space: { name: string; id: string; private?: boolean; color?: string; avatar?: string }) => ({
          id: space.id,
          name: space.name,
          private: space.private || false,
          color: space.color,
          avatar: space.avatar
        }))
      });
    }

    // GREY workspace oluştur
    if (greySpaces.length > 0) {
      workspaces.push({
        id: 'grey-workspace',
        name: 'GREY Workspace',
        spaces: greySpaces.map((space: { name: string; id: string; private?: boolean; color?: string; avatar?: string }) => ({
          id: space.id,
          name: space.name,
          private: space.private || false,
          color: space.color,
          avatar: space.avatar
        }))
      });
    }

    res.status(200).json({ 
      data: workspaces,
      count: workspaces.length
    });

  } catch (error: unknown) {
    console.error('ClickUp Workspaces API Error:', error);
    
    let errorMessage = 'ClickUp workspace\'leri alınamadı.';
    
    if (error && typeof error === 'object') {
      if ('code' in error && error.code === 'ECONNABORTED') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if ('response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { err?: string } } };
        
        if (axiosError.response?.status === 401) {
          errorMessage = 'ClickUp API anahtarı geçersiz.';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Bu workspace\'e erişim izniniz yok.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Workspace veya team bulunamadı.';
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