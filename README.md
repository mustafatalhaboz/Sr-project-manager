# Müşteri Talep Yönetim Sistemi

AI destekli müşteri talep analizi ve ClickUp entegrasyonu ile otomatik proje yönetimi sistemi.

## Özellikler

- **AI Destekli Analiz**: OpenAI GPT-4 ile otomatik talep analizi
- **ClickUp Entegrasyonu**: Otomatik task oluşturma ve yönetimi
- **Proje Bazlı Yönetim**: Çoklu proje desteği
- **Responsive Design**: Mobil uyumlu modern arayüz
- **3 Adımlı Workflow**: Talep → Analiz → Doğrulama
- **Real-time Processing**: Canlı analiz durumu takibi

## Teknoloji Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript
- **Styling**: TailwindCSS, Lucide Icons
- **AI**: OpenAI GPT-4 API
- **Integration**: ClickUp API
- **State Management**: React Hooks

## Proje Yapısı

```
src/
├── components/
│   ├── layout/
│   │   └── Layout.tsx          # Ana layout wrapper
│   └── ui/
│       ├── RequestForm.tsx     # Talep giriş formu
│       ├── ProcessingView.tsx  # AI analiz ekranı
│       ├── ValidationView.tsx  # Sonuç doğrulama
│       ├── ProjectSelector.tsx # Proje seçici
│       └── StepIndicator.tsx   # Adım göstergesi
├── lib/
│   ├── types.ts               # TypeScript tanımları
│   ├── openai.ts              # OpenAI servis katmanı
│   ├── clickup.ts             # ClickUp servis katmanı
│   └── projects.ts            # Proje yönetimi
├── data/
│   └── projects.json          # Proje konfigürasyonları
├── pages/
│   ├── index.tsx              # Ana sayfa - Talep girişi
│   ├── processing.tsx         # AI analiz sayfası
│   ├── validation.tsx         # Sonuç doğrulama sayfası
│   ├── _app.tsx               # Global app konfigürasyonu
│   └── _document.tsx          # HTML document özelleştirmesi
└── styles/
    └── globals.css            # TailwindCSS ve özel stiller
```

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
# veya
yarn install
```

### 2. Çevre Değişkenlerini Ayarla

`.env.local` dosyasını oluşturun:

```bash
cp .env.example .env.local
```

Gerekli API anahtarlarını doldurun:

```env
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_CLICKUP_API_TOKEN=your_clickup_api_token_here
NEXT_PUBLIC_CLICKUP_TEAM_ID=your_clickup_team_id_here
```

### 3. Proje Konfigürasyonunu Düzenle

`src/data/projects.json` dosyasında projelerinizi tanımlayın:

```json
{
  "projects": [
    {
      "id": "your-project-id",
      "name": "Proje Adı",
      "clickupListId": "your-clickup-list-id",
      "description": "Proje açıklaması",
      "techStack": ["Next.js", "React", "TypeScript"],
      "aiContext": "Bu proje için AI analiz bağlamı"
    }
  ]
}
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
# veya
yarn dev
```

[http://localhost:3000](http://localhost:3000) adresinde uygulamayı görüntüleyin.

## API Konfigürasyonu

### OpenAI API

1. [OpenAI Platform](https://platform.openai.com) hesabı oluşturun
2. API anahtarınızı alın
3. `.env.local` dosyasında `NEXT_PUBLIC_OPENAI_API_KEY` değişkenini ayarlayın

### ClickUp API

1. [ClickUp](https://clickup.com) hesabınızda API token oluşturun
2. Team ID'nizi alın
3. Proje listelerinizin ID'lerini alın
4. `.env.local` dosyasında ilgili değişkenleri ayarlayın

## Kullanım

### 1. Talep Girişi
- Proje seçin
- Talep açıklamasını yazın
- Öncelik ve türü belirleyin
- "AI Analizi Başlat" butonuna tıklayın

### 2. AI Analizi
- Otomatik olarak AI analiz süreci başlar
- Real-time progress takibi
- Analiz tamamlandığında otomatik yönlendirme

### 3. Sonuç Doğrulama
- AI analiz sonuçlarını inceleyin
- Gerekirse geri bildirim vererek düzeltirin
- Onayladığınızda otomatik ClickUp task oluşturur

## Deployment

### Vercel

```bash
npm run build
vercel --prod
```

### Diğer Platformlar

```bash
npm run build
npm run start
```

## Özelleştirme

### Yeni Proje Ekleme

1. `src/data/projects.json` dosyasına yeni proje ekleyin
2. ClickUp'ta ilgili list ID'yi alın
3. AI context'i projeye uygun şekilde ayarlayın

### AI Prompt Özelleştirme

`src/lib/openai.ts` dosyasında `analyzeRequest` fonksiyonundaki prompt'u düzenleyin.

### UI Özelleştirme

- `src/styles/globals.css` - Global stiller
- `tailwind.config.ts` - TailwindCSS konfigürasyonu
- Component dosyalarında stil değişiklikleri

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Destek

Sorularınız için issue açabilir veya doğrudan iletişime geçebilirsiniz.
