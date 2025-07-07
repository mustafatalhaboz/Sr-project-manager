# Müşteri Talep Yönetim Sistemi

AI destekli müşteri talep analizi ve ClickUp entegrasyonu ile otomatik proje yönetimi sistemi.

## Özellikler

- **AI Destekli Analiz**: OpenAI GPT-4 ile otomatik talep analizi
- **Dinamik Proje Tipleri**: AI ile akıllı proje kategorizasyonu
- **ClickUp Entegrasyonu**: Otomatik task oluşturma ve yönetimi
- **Veritabanı Desteği**: Vercel Postgres ile veri persistansı
- **Proje Bazlı Yönetim**: Çoklu proje desteği
- **Responsive Design**: Mobil uyumlu modern arayüz
- **3 Adımlı Workflow**: Talep → Analiz → Doğrulama
- **Real-time Processing**: Canlı analiz durumu takibi
- **Background Processing**: Performanslı batch işleme

## Teknoloji Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript
- **Database**: Vercel Postgres (Neon)
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
│   ├── projects.ts            # Proje yönetimi (hibrit sistem)
│   ├── database.ts            # Vercel Postgres entegrasyonu
│   └── rateLimit.ts           # API rate limiting
├── pages/
│   ├── index.tsx              # Ana sayfa - Talep girişi
│   ├── processing.tsx         # AI analiz sayfası
│   ├── validation.tsx         # Sonuç doğrulama sayfası
│   ├── _app.tsx               # Global app konfigürasyonu
│   ├── _document.tsx          # HTML document özelleştirmesi
│   └── api/
│       ├── analyze.ts         # AI talep analizi
│       ├── refine.ts          # AI düzenleme
│       ├── analyze-project-type.ts # AI proje tipi analizi
│       ├── clickup/
│       │   ├── tasks.ts       # ClickUp task'ları çekme
│       │   └── create-task.ts # ClickUp task oluşturma
│       └── db/
│           └── init.ts        # Database başlatma
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

Gerekli değişkenleri doldurun:

```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# ClickUp API
CLICKUP_API_TOKEN=your_clickup_api_token_here
CLICKUP_TEAM_ID=your_clickup_team_id_here

# Vercel Postgres (otomatik ayarlanır)
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NO_SSL=your_postgres_url_no_ssl
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
```

### 3. Veritabanını Başlat

İlk çalıştırmada veritabanı tablolarını oluşturmak için:

```bash
curl http://localhost:3000/api/db/init
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
3. `.env.local` dosyasında `OPENAI_API_KEY` değişkenini ayarlayın

### ClickUp API

1. [ClickUp](https://clickup.com) hesabınızda API token oluşturun
2. Team ID'nizi alın
3. Proje listelerinizin ID'lerini alın
4. `.env.local` dosyasında ilgili değişkenleri ayarlayın

### Vercel Postgres

1. Vercel Dashboard'da Postgres database oluşturun
2. Environment variables otomatik olarak eklenir
3. İlk çalıştırmada `/api/db/init` endpoint'ini çağırın

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

Projeler artık ClickUp'tan otomatik olarak yüklenir ve AI ile analiz edilir:

1. ClickUp'ta yeni workspace/list oluşturun
2. Uygulama otomatik olarak projeyi tespit eder
3. AI background'da proje tipini analiz eder
4. Sonuçlar veritabanında saklanır

### AI Prompt Özelleştirme

- **Talep Analizi**: `src/lib/openai.ts` - `analyzeRequest` fonksiyonu
- **Proje Tipi Analizi**: `src/pages/api/analyze-project-type.ts` - GPT-4 prompt'u

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
