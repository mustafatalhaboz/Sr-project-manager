import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { AIAnalysisResult, Project } from '../../lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { analysis, feedback, project }: { 
      analysis: AIAnalysisResult; 
      feedback: string; 
      project: Project 
    } = req.body;

    if (!analysis || !feedback || !project) {
      return res.status(400).json({ error: 'Analysis, feedback ve project bilgileri gerekli' });
    }

    const prompt = `
Mevcut analiz:
${JSON.stringify(analysis, null, 2)}

Kullanıcı geri bildirimi:
${feedback}

Proje: ${project.name}
Teknoloji Stack: ${project.techStack.join(', ')}

Lütfen analizi geri bildirime göre düzenle ve aynı JSON formatında yanıtla:

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

Türkçe yanıtla.
`;

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

    // JSON parse et
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Geçersiz JSON formatı');
    }

    const refinedAnalysis = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    
    res.status(200).json({ data: refinedAnalysis });

  } catch (error) {
    console.error('OpenAI Refine API Error:', error);
    
    let errorMessage = 'AI analiz düzenlemesi yapılamadı. Lütfen tekrar deneyin.';
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'API anahtarı geçersiz. Lütfen yapılandırmayı kontrol edin.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'API kotası aşıldı. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message.includes('rate_limit')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen bekleyip tekrar deneyin.';
      }
    }
    
    res.status(500).json({ error: errorMessage });
  }
}