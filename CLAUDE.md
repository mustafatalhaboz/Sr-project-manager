# Müşteri Talep Yönetim Sistemi - AI Rehberi

## Proje Özeti
AI destekli müşteri talep analizi ve ClickUp entegrasyonu. 3 aşamalı workflow: Talep → AI Analiz → ClickUp Task.

**Stack:** Next.js 14, OpenAI GPT-4, ClickUp API, TypeScript, TailwindCSS

## Workflow
1. **Talep Girişi** (`/`) - Proje seçimi ve talep detayları
2. **AI Analiz** (`/processing`) - GPT-4 ile otomatik analiz
3. **Doğrulama** (`/validation`) - Sonuç onayı ve ClickUp task oluşturma

## Kritik Dosyalar
```
src/
├── components/ui/
│   ├── RequestForm.tsx         # Talep giriş formu
│   ├── ProcessingView.tsx      # AI analiz UI
│   └── ValidationView.tsx      # Sonuç doğrulama
├── lib/
│   ├── types.ts               # Tüm TypeScript tipleri
│   ├── openai.ts              # AI API client
│   ├── clickup.ts             # ClickUp API client
│   └── rateLimit.ts           # API koruma
├── data/
│   └── projects.json          # Proje konfigürasyonları
└── pages/api/
    ├── analyze.ts             # AI analiz endpoint
    ├── refine.ts              # AI düzenleme endpoint
    └── clickup/create-task.ts # ClickUp task oluşturma
```

## Veri Modelleri

### RequestData - Kullanıcı Talebi
```typescript
interface RequestData {
  text: string;                    // Talep açıklaması
  projectId: string;               // Seçilen proje
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'bug' | 'feature' | 'improvement' | 'question';
}
```

### AIAnalysisResult - AI Analiz Sonucu
```typescript
interface AIAnalysisResult {
  title: string;                   // Task başlığı
  description: string;             // Detaylı açıklama
  category: string;                // Frontend/Backend/Database
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: string;           // "1-2 gün"
  technicalRequirements: string[];
  acceptanceCriteria: string[];
  tags: string[];
  assignee?: string;
  dueDate?: string;
}
```

### Project - Proje Konfigürasyonu
```typescript
interface Project {
  id: string;                      // Unique ID
  name: string;                    // Proje adı
  clickupListId: string;           // ClickUp list ID
  description: string;
  techStack: string[];
  aiContext: string;               // AI için context
}
```

## API Endpoints

### `/api/analyze` - AI Analiz
- **Input:** RequestData + Project
- **Output:** AIAnalysisResult
- **OpenAI Model:** GPT-4
- **Rate Limit:** 10 req/min

### `/api/refine` - AI Düzenleme
- **Input:** AIAnalysisResult + feedback + Project
- **Output:** AIAnalysisResult (düzenlenmiş)
- **Rate Limit:** 10 req/min

### `/api/clickup/create-task` - Task Oluşturma
- **Input:** AIAnalysisResult + Project
- **Output:** ClickUpTask
- **Rate Limit:** 30 req/min

## Ortam Değişkenleri
```env
OPENAI_API_KEY=sk-...             # OpenAI API key
CLICKUP_API_TOKEN=pk_...          # ClickUp API token
```

## Yaygın Hatalar

### OpenAI API
- **401:** API key kontrol et
- **insufficient_quota:** Kota aşımı
- **rate_limit:** Çok fazla istek

### ClickUp API
- **401:** Token geçersiz
- **404:** List ID bulunamadı
- **403:** Workspace erişim yok

### Veri Hataları
- **JSON Parse:** AI response format kontrolü
- **URL Encoding:** Validation data encode/decode

## Geliştirme Notları

### AI Prompt Optimizasyonu
- **Sistem Rolü:** "Yazılım proje yöneticisi ve teknik analiz uzmanı"
- **Sıcaklık:** 0.7
- **Max Tokens:** 1000
- **JSON Çıktı:** Regex ile parse

### ClickUp Priority Mapping
```typescript
const priorityMap = {
  'low': 4,
  'medium': 3,
  'high': 2,
  'urgent': 1
};
```

### Rate Limiting
- **AI Endpoints:** 10 req/min
- **ClickUp:** 30 req/min
- **Genel:** 100 req/min

## Yeni Proje Ekleme
1. `src/data/projects.json` düzenle
2. ClickUp'ta list oluştur ve ID'sini al
3. AI context'i tanımla

## Test Komutları
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint kontrol
```

## Gerekli Kontroller
- [ ] API key'leri doğrula
- [ ] ClickUp list ID'leri test et
- [ ] Proje konfigürasyonlarını kontrol et
- [ ] Rate limit ayarlarını gözden geçir

Bu dosya projenin çalışma prensiplerini ve AI geliştirmeleri için kritik bilgileri içerir.