import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { withRateLimit } from '../../lib/rateLimit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProjectTask {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment variable kontrolü
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key yapılandırması eksik.'
    });
  }

  try {
    const { projectName, tasks }: { projectName: string; tasks: ProjectTask[] } = req.body;

    if (!projectName || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'projectName ve tasks bilgileri gerekli' });
    }

    // Task'ları analiz için hazırla
    const taskSummary = tasks.slice(0, 10).map(task => ({
      name: task.name,
      description: task.description?.substring(0, 200) || '',
      tags: task.tags?.slice(0, 5) || []
    }));

    const prompt = `
Bir yazılım projesinin türünü belirlemek için proje adı ve task'larını analiz et.

Proje Adı: ${projectName}

Task'lar:
${taskSummary.map((task, index) => `
${index + 1}. ${task.name}
   Açıklama: ${task.description}
   Etiketler: ${task.tags.join(', ')}
`).join('')}

Bu proje verilerine bakarak, projenin hangi kategoride olduğunu belirle:

Kategoriler:
- "E-ticaret" (online mağaza, ürün yönetimi, sipariş, ödeme)
- "Mobil Uygulama" (iOS/Android uygulama, native, react native)
- "Web Uygulaması" (web tabanlı sistem, SaaS, dashboard)
- "Kurumsal Website" (tanıtım sitesi, blog, şirket web sitesi)
- "CRM/ERP" (müşteri yönetimi, iş süreçleri, enterprise)
- "Oyun" (game development, unity, oyun mekanikleri)
- "API/Backend" (microservices, API, database, server)
- "Mobil Oyun" (mobile game, casual game, puzzle)
- "E-öğrenme" (education, course, learning management)
- "Fintech" (banking, payment, financial services)
- "Sağlık" (healthcare, medical, hospital management)
- "Emlak" (real estate, property management)
- "Sosyal Medya" (social platform, community, messaging)
- "İçerik Yönetimi" (CMS, blog platform, publishing)
- "Lojistik" (shipping, delivery, warehouse management)

Sadece en uygun kategori adını döndür, başka açıklama yapma.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Sen bir yazılım proje kategorilendirme uzmanısın. Proje adı ve task'larına bakarak projenin türünü doğru şekilde belirleyebilirsin."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    const projectType = completion.choices[0].message.content?.trim() || 'Web Uygulaması';
    
    res.status(200).json({ 
      projectType: projectType,
      projectName: projectName,
      tasksAnalyzed: taskSummary.length,
      confidence: 0.8 // Static confidence for now
    });

  } catch (error) {
    console.error('Project Type Analysis Error:', error);
    
    let errorMessage = 'Proje türü analizi yapılamadı.';
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'OpenAI API anahtarı geçersiz.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'OpenAI API kotası aşıldı.';
      } else if (error.message.includes('rate_limit')) {
        errorMessage = 'Çok fazla istek gönderildi.';
      }
    }
    
    res.status(500).json({ error: errorMessage });
  }
}

export default withRateLimit(handler, 'ai');