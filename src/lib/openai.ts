import { AIAnalysisResult, Project, RequestData } from './types';

export async function analyzeRequest(
  request: RequestData,
  project: Project
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request, project }),
    });

    if (!response.ok) {
      let errorMessage = 'API çağrısı başarısız';
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
    console.error('AI analiz hatası:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AI analiz yapılamadı. Lütfen tekrar deneyin.');
  }
}

export async function refineAnalysis(
  analysis: AIAnalysisResult,
  feedback: string,
  project: Project
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/refine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysis, feedback, project }),
    });

    if (!response.ok) {
      let errorMessage = 'API çağrısı başarısız';
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
    console.error('AI refinement hatası:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AI analiz düzenlemesi yapılamadı. Lütfen tekrar deneyin.');
  }
}
