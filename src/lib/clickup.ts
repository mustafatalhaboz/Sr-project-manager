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
export async function fetchWorkspaceLists(): Promise<ClickUpListData[]> {
  try {
    const response = await fetch('/api/clickup/lists');
    
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