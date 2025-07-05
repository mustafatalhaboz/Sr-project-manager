import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { AIAnalysisResult, Project, RequestData } from '../../lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // NEXT_PUBLIC_ prefix'i olmadan!
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment variable kontrolü
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key tanımlı değil. Lütfen environment variables kontrolü yapın.',
      debug: {
        nodeEnv: process.env.NODE_ENV,
        hasKey: !!process.env.OPENAI_API_KEY,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI'))
      }
    });
  }

  try {
    const { request, project }: { request: RequestData; project: Project } = req.body;

    if (!request || !project) {
      return res.status(400).json({ error: 'Request ve project bilgileri gerekli' });
    }

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
    
    res.status(200).json({ data: analysisResult });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Error details için detay ver
    let errorMessage = 'AI analiz yapılamadı. Lütfen tekrar deneyin.';
    
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