# ClickUp Data Sayfası - Troubleshooting

## Sorun: "Henüz veri bulunamadı" Hatası

### 1. Environment Variables Kontrolü

**Problem:** ClickUp API credentials ayarlanmamış.

**Çözüm:**
```bash
# .env.local dosyası oluştur
cp .env.local.example .env.local

# Aşağıdaki değerleri ayarla:
CLICKUP_API_TOKEN=pk_your_actual_token
CLICKUP_TEAM_ID=your_actual_team_id
```

**ClickUp Token Alma:**
1. https://app.clickup.com/settings/apps adresine git
2. "Create an App" tıkla veya mevcut app'i kullan
3. API Token'ı kopyala

**Team ID Bulma:**
- ClickUp URL'den: `https://app.clickup.com/2182798/...` → Team ID: `2182798`

### 2. Debug Adımları

#### Adım 1: Environment Variables Test Et
```
http://localhost:3000/api/clickup/debug
```
Response'da `hasClickUpToken: true` ve `hasTeamId: true` görmelisin.

#### Adım 2: Console Loglarını İncele
1. Browser'da F12 → Console tab
2. `/data` sayfasını yenile
3. Şu logları ara:
   - `🚀 DataView: Starting workspace data fetch...`
   - `Team name: RED and GREY`
   - `Available spaces: [...]`
   - `📋 Found X total tasks in list`

#### Adım 3: Network Tab Kontrolü
1. F12 → Network tab
2. Sayfa yenile
3. `/api/clickup/workspace-tasks` isteğini bul
4. Response'u kontrol et

### 3. Yaygın Sorunlar ve Çözümleri

#### Sorun: API Token Geçersiz
**Belirtiler:** `401 Unauthorized` hatası
**Çözüm:** Yeni token oluştur ve `.env.local`'ı güncelle

#### Sorun: Team ID Yanlış  
**Belirtiler:** `404 Not Found` veya boş response
**Çözüm:** ClickUp URL'den doğru team ID'yi al

#### Sorun: Task'lar Filtreleniyor
**Belirtiler:** Space'ler var ama task yok
**Debug:** Console'da task statuslarını kontrol et:
```
🔍 All statuses in "List Name": ["To Do", "In Progress", "Done"]
```

#### Sorun: Space'ler Yanlış Dağıtılmış
**Belirtiler:** Yanlış workspace altında görünüyor
**Debug:** Console'da distribution loglarını kontrol et:
```
Single RED and GREY workspace detected. Distributing 3 spaces: 2 to RED, 1 to GREY
```

### 4. Production (Vercel) Deployment

**Vercel Environment Variables:**
1. Vercel dashboard → Project → Settings → Environment Variables
2. Şu değişkenleri ekle:
   - `CLICKUP_API_TOKEN`
   - `CLICKUP_TEAM_ID` 
3. Redeploy et

### 5. Task Status Keywords

Sistem şu statusları "in-progress" olarak kabul eder:
- progress, doing, development, active
- in progress, in-progress, working, started
- devam, çalışıyor, yapılıyor, geliştirilme, aktif

Eğer farklı status isimleri kullanıyorsan, `workspace-tasks.ts` dosyasındaki `inProgressKeywords` array'ini güncelle.

### 6. Debug API Endpoints

- **Environment Check:** `/api/clickup/debug`
- **ClickUp Test:** `/api/clickup/test`
- **Workspaces:** `/api/clickup/workspaces`  
- **Tasks:** `/api/clickup/workspace-tasks`

Her endpoint için response'ları kontrol et ve hata mesajlarını analiz et.