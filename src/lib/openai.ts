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
      const errorData = await response.json();
      throw new Error(errorData.error || 'API çağrısı başarısız');
    }

    const result = await response.json();
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'API çağrısı başarısız');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('AI refinement hatası:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AI analiz düzenlemesi yapılamadı. Lütfen tekrar deneyin.');
  }
}
