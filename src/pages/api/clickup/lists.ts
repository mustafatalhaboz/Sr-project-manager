import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { withRateLimit } from '../../../lib/rateLimit';

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

interface ClickUpList {
  id: string;
  name: string;
  space: {
    id: string;
    name: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  status?: {
    status: string;
    color: string;
  };
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

  if (!process.env.CLICKUP_TEAM_ID) {
    return res.status(500).json({ 
      error: 'ClickUp Team ID yapılandırması eksik. CLICKUP_TEAM_ID environment variable\'ını ayarlayın.'
    });
  }

  try {
    // Belirtilen team'in space'lerini al
    const teamId = process.env.CLICKUP_TEAM_ID;
    const spacesResponse = await axios.get(
      `${CLICKUP_API_URL}/team/${teamId}/space?archived=false`,
      {
        headers: {
          'Authorization': process.env.CLICKUP_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    const spaces = spacesResponse.data.spaces;
    
    if (!spaces || spaces.length === 0) {
      return res.status(404).json({ error: 'Herhangi bir space bulunamadı' });
    }

    // Tüm space'lerdeki list'leri topla
    const allLists: ClickUpList[] = [];

    for (const space of spaces) {
      try {
        // Folderless list'leri al
        const folderlessResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/list?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        if (folderlessResponse.data.lists) {
          allLists.push(...folderlessResponse.data.lists);
        }

        // Folder'lardaki list'leri al
        const foldersResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/folder?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        if (foldersResponse.data.folders) {
          for (const folder of foldersResponse.data.folders) {
            const folderListsResponse = await axios.get(
              `${CLICKUP_API_URL}/folder/${folder.id}/list?archived=false`,
              {
                headers: {
                  'Authorization': process.env.CLICKUP_API_TOKEN,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (folderListsResponse.data.lists) {
              allLists.push(...folderListsResponse.data.lists);
            }
          }
        }
      } catch (spaceError) {
        console.warn(`Space ${space.id} list'leri alınamadı:`, spaceError);
        // Tek space hatası tüm işlemi durdurmasın
        continue;
      }
    }

    // List'leri formatla
    const formattedLists = allLists.map(list => ({
      id: list.id,
      name: list.name,
      spaceName: list.space.name,
      folderName: list.folder?.name || null,
      displayName: list.folder ? 
        `${list.space.name} / ${list.folder.name} / ${list.name}` : 
        `${list.space.name} / ${list.name}`
    }));

    res.status(200).json({ 
      data: formattedLists,
      count: formattedLists.length,
      teamId: teamId
    });

  } catch (error: unknown) {
    console.error('ClickUp Lists API Error:', error);
    
    let errorMessage = 'ClickUp list\'leri alınamadı.';
    
    if (error && typeof error === 'object' && 'response' in error) {
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
    
    res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

export default withRateLimit(handler, 'clickup');