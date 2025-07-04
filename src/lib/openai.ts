import OpenAI from 'openai';
import { AIAnalysisResult, Project, RequestData } from './types';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeRequest(
  request: RequestData,
  project: Project
): Promise<AIAnalysisResult> {
  const prompt = `
Bir müşteri talep yönetim sistemi için AI analiz yapıyorsun. 

Proje Bilgileri:
- Proje: ${project.name}
- Açıklama: ${project.description}
- Teknoloji Stack: ${project.techStack.join(', ')}
- AI Context: ${project.aiContext}

Müşteri Talebi:
- Metin: ${request.text}
- Tip: ${request.type}
- Öncelik: ${request.priority}

Lütfen bu talebi analiz et ve aşağıdaki JSON formatında yanıtla:

{
  "title": "Kısa ve açıklayıcı başlık",
  "description": "Detaylı açıklama",
  "category": "Frontend/Backend/Database/DevOps/UI-UX",
  "priority": "low/medium/high/urgent",
  "estimatedTime": "1-2 gün",
  "technicalRequirements": ["Gereksinim 1", "Gereksinim 2"],
  "acceptanceCriteria": ["Kriter 1", "Kriter 2"],
  "tags": ["tag1", "tag2"],
  "assignee": "Opsiyonel atanan kişi",
  "dueDate": "Opsiyonel tarih (YYYY-MM-DD)"
}

Türkçe yanıtla ve projenin teknik bağlamına uygun analiz yap.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sen bir yazılım proje yöneticisi ve teknik analiz uzmanısın. Müşteri taleplerini analiz edip ClickUp task'larına dönüştürüyorsun."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('AI yanıt alamadı');
    }

    // JSON parse et
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Geçersiz JSON formatı');
    }

    const analysisResult = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    return analysisResult;
  } catch (error) {
    console.error('OpenAI analiz hatası:', error);
    throw new Error('AI analiz yapılamadı. Lütfen tekrar deneyin.');
  }
}

export async function refineAnalysis(
  analysis: AIAnalysisResult,
  feedback: string,
  project: Project
): Promise<AIAnalysisResult> {
  const prompt = `
Mevcut analiz:
${JSON.stringify(analysis, null, 2)}

Kullanıcı geri bildirimi:
${feedback}

Proje: ${project.name}
Teknoloji Stack: ${project.techStack.join(', ')}

Lütfen analizi geri bildirime göre düzenle ve aynı JSON formatında yanıtla.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sen bir yazılım proje yöneticisi ve teknik analiz uzmanısın. Kullanıcı geri bildirimlerine göre analiz sonuçlarını düzenliyorsun."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('AI yanıt alamadı');
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Geçersiz JSON formatı');
    }

    const refinedAnalysis = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    return refinedAnalysis;
  } catch (error) {
    console.error('OpenAI refinement hatası:', error);
    throw new Error('AI analiz düzenlemesi yapılamadı. Lütfen tekrar deneyin.');
  }
}
