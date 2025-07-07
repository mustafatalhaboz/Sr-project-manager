import { AIAnalysisResult, ClickUpTask, Project, ClickUpListData } from './types';

export async function createTask(
  analysis: AIAnalysisResult,
  project: Project,
  clickupListId?: string
): Promise<ClickUpTask> {
  try {
    const response = await fetch('/api/clickup/create-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysis, project, clickupListId }),
    });

    if (!response.ok) {
      let errorMessage = 'ClickUp task oluşturulamadı';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('API\'den boş yanıt alındı');
    }

    const result = JSON.parse(responseText);
    if (!result.data) {
      throw new Error('API yanıtında data bulunamadı');
    }
    
    return result.data;
  } catch (error) {
    console.error('ClickUp task oluşturma hatası:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ClickUp task oluşturulamadı. Lütfen tekrar deneyin.');
  }
}

// Fetch ClickUp workspace lists
export async function fetchWorkspaceLists(signal?: AbortSignal): Promise<ClickUpListData[]> {
  try {
    // Check if we're on server-side (no window object)
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: directly call ClickUp API
      return await fetchClickUpListsDirect(signal);
    }
    
    // Client-side: use our API endpoint
    const response = await fetch('/api/clickup/lists', {
      signal // Pass AbortSignal to fetch
    });
    
    if (!response.ok) {
      let errorMessage = 'ClickUp list\'leri alınamadı';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('API\'den boş yanıt alındı');
    }

    const result = JSON.parse(responseText);
    if (!result.data) {
      throw new Error('API yanıtında data bulunamadı');
    }
    
    return result.data;
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request aborted');
    }
    
    console.error('ClickUp list\'leri çekme hatası:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ClickUp list\'leri alınamadı. Lütfen tekrar deneyin.');
  }
}

// Test function for ClickUp connectivity
export async function testClickUpConnection(): Promise<{ success: boolean; message: string; user?: unknown }> {
  try {
    const response = await fetch('/api/clickup/test');
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.error || 'ClickUp bağlantı testi başarısız'
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      user: result.user
    };
  } catch {
    return {
      success: false,
      message: 'ClickUp bağlantı testi sırasında hata oluştu'
    };
  }
}

// Server-side direct ClickUp API call
async function fetchClickUpListsDirect(signal?: AbortSignal): Promise<ClickUpListData[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const axios = require('axios');
  const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
  
  // Environment variable kontrolü
  if (!process.env.CLICKUP_API_TOKEN) {
    throw new Error('ClickUp API yapılandırması eksik. CLICKUP_API_TOKEN environment variable\'ını ayarlayın.');
  }

  if (!process.env.CLICKUP_TEAM_ID) {
    throw new Error('ClickUp Team ID yapılandırması eksik. CLICKUP_TEAM_ID environment variable\'ını ayarlayın.');
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
        },
        timeout: 10000,
        signal // AbortSignal support
      }
    );

    const spaces = spacesResponse.data.spaces;
    
    if (!spaces || spaces.length === 0) {
      throw new Error('Herhangi bir space bulunamadı');
    }

    // Tüm space'lerdeki list'leri topla
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRawLists: any[] = [];

    for (const space of spaces) {
      try {
        // Check if aborted
        if (signal?.aborted) {
          throw new Error('Request aborted');
        }
        
        // Folderless list'leri al
        const folderlessResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/list?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            },
            timeout: 5000,
            signal
          }
        );

        if (folderlessResponse.data.lists) {
          allRawLists.push(...folderlessResponse.data.lists);
        }

        // Folder'lardaki list'leri al
        const foldersResponse = await axios.get(
          `${CLICKUP_API_URL}/space/${space.id}/folder?archived=false`,
          {
            headers: {
              'Authorization': process.env.CLICKUP_API_TOKEN,
              'Content-Type': 'application/json'
            },
            timeout: 5000,
            signal
          }
        );

        if (foldersResponse.data.folders) {
          for (const folder of foldersResponse.data.folders) {
            // Check if aborted
            if (signal?.aborted) {
              throw new Error('Request aborted');
            }
            
            const folderListsResponse = await axios.get(
              `${CLICKUP_API_URL}/folder/${folder.id}/list?archived=false`,
              {
                headers: {
                  'Authorization': process.env.CLICKUP_API_TOKEN,
                  'Content-Type': 'application/json'
                },
                timeout: 5000,
                signal
              }
            );

            if (folderListsResponse.data.lists) {
              allRawLists.push(...folderListsResponse.data.lists);
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
    const formattedLists: ClickUpListData[] = allRawLists.map(list => ({
      id: list.id,
      name: list.name,
      spaceName: list.space?.name || 'Unknown Space',
      folderName: list.folder?.name || null,
      displayName: list.name // Sadece proje adı göster
    }));

    return formattedLists;

  } catch (error: unknown) {
    console.error('ClickUp Direct API Error:', error);
    
    // Handle abort errors
    if (error instanceof Error && error.message === 'Request aborted') {
      throw error;
    }
    
    let errorMessage = 'ClickUp list\'leri alınamadı.';
    
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
    
    throw new Error(errorMessage);
  }
}