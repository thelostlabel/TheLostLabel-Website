# The Lost Label - Müzik Yönetim Platformu

## 📋 Proje Hakkında

**The Lost Label**, bağımsız sanatçılar için geliştirilmiş kapsamlı bir müzik yönetim ve dağıtım platformudur. Platform, sanatçıların müziklerini Spotify, Apple Music, YouTube Music gibi dijital müzik platformlarına dağıtmalarına, gelirlerini takip etmelerine, sözleşme yönetimine ve hayranlarıyla etkileşim kurmalarına olanak tanır.

### 🎯 Projenin Hedefleri

1. **Dijital Müzik Dağıtımı**: Sanatçıların müziklerini tüm platformlara tek bir yerden dağıtabilmesi
2. **Gelir Takibi**: Streaming gelirlerinin detaylı takibi ve raporlanması
3. **Sözleşme Yönetimi**: Sanatçı-labelsözleşmelerinin dijital ortamda yönetilmesi
4. **Demo Yönetimi**: Yeni sanatçı adaylarından gelen demoların değerlendirilmesi
5. **Discord Entegrasyonu**: Topluluk yönetimi ve sanatçı-notification sistemi
6. **Spotify Entegrasyonu**: Sanatçı istatistiklerinin otomatik çekilmesi

---

## 🏗️ Teknik Mimari

### Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 16 (React 19), Tailwind CSS |
| **Backend** | Next.js API Routes, Python (Discord Bot) |
| **Database** | PostgreSQL (Prisma ORM) |
| **Discord Bot** | Discord.py, Python |
| **Scraping** | Playwright (Spotify scraping) |
| **Docker** | Docker & Docker Compose |

### Proje Yapısı

```
Lost Website/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Yönetici API'leri
│   │   │   ├── scrape/          # Spotify scraping
│   │   │   ├── cron/            # Zamanlanmış görevler
│   │   │   ├── requests/        # İstek yönetimi
│   │   │   ├── artists/         # Sanatçı yönetimi
│   │   │   └── ...
│   │   ├── artist/              # Sanatçı API'leri
│   │   ├── auth/                # Kimlik doğrulama
│   │   ├── contracts/           # Sözleşme API'leri
│   │   ├── earnings/            # Gelir API'leri
│   │   ├── payments/            # Ödeme API'leri
│   │   └── discord/             # Discord OAuth
│   ├── components/              # React bileşenleri
│   └── page.js                  # Ana sayfa
├── prisma/                      # Veritabanı şeması
├── lib/                         # Yardımcı kütüphaneler
├── Discord Bot/                 # Discord botu (Python)
│   ├── bot.py                   # Ana bot dosyası
│   ├── src/
│   │   ├── services/            # Bot servisleri
│   │   └── ui/                  # Bot arayüzü
│   └── Dockerfile
└── ...
```

---

## 🔐 Erişim Bilgileri

### 🌐 URL'ler

| Hizmet | URL |
|--------|-----|
| **Web Sitesi** | `https://the-lost-label-website-mwaq2s-d4f40a-152-53-142-222.traefik.me` |
| **Bot Panel** | `https://bot.thelostlabel.com` |
| **Database** | `152.53.142.222:5432` |

### 🔑 Veritabanı Bilgileri

#### Ana Veritabanı (Website)
```
Host: 152.53.142.222
Port: 5432
Database: postgres
User: postgres
Password: <set in secret manager>
```

#### Bot Veritabanı
```
Host: 152.53.142.222
Port: 5432
Database: postgres
User: postgres
Password: <set in secret manager>
```

### 🤖 Discord Bot Token
```
Token: <set in secret manager>
Client ID: 1341478186730389595
Client Secret: <set in secret manager>
```

### 🎵 Spotify API
```
Client ID: <set in secret manager>
Client Secret: <set in secret manager>
```

### 📧 SMTP (E-posta)
```
Host: smtp.turkticaret.net
Port: 465
User: noreply@thelostlabel.com
Password: <set in secret manager>
Secure: true
```

### 🔒 Güvenlik Anahtarları
```
NEXTAUTH_SECRET: <set in secret manager>
CRON_SECRET: <set in secret manager>
BOT_INTERNAL_TOKEN: <set in secret manager>
BOT_INTERNAL_SIGNING_SECRET: <set in secret manager>
```

---

## 🐳 Docker Yapısı

### Container'lar

| Container | Port | Açıklama |
|-----------|------|----------|
| `lost-website` | 3000 | Next.js web uygulaması |
| `lost-bot` | - | Discord bot (Python) |

### Docker Compose Komutları

```bash
# Tüm servisleri başlat
docker-compose up -d

# Log'ları takip et
docker-compose logs -f

# Container'ları yeniden başlat
docker-compose restart

# Container'ları durdur
docker-compose down
```

### Volume'lar

| Volume | Açıklama |
|--------|----------|
| `bot_data` | Discord bot verileri |
| `lost_site_uploads` | Yüklenen dosyalar (sözleşme, demo, release) |
| `playwright_data` | Playwright browser cache |

---

## 📊 Veritabanı Şeması

### Ana Tablolar

| Model | Açıklama |
|-------|----------|
| `User` | Sistem kullanıcıları (sanatçılar, adminler) |
| `Artist` | Sanatçı profilleri |
| `ArtistStatsHistory` | Spotify istatistik geçmişi |
| `Release` | Yayınlanan müzikler |
| `Contract` | Sözleşmeler |
| `Demo` | Demo parçalar |
| `Earning` | Gelir kayıtları |
| `Payment` | Ödeme kayıtları |
| `RoyaltySplit` | Telif hakkı paylaşımları |

### Önemli Model Detayları

#### ArtistStatsHistory (İstatistik Geçmişi)
```prisma
model ArtistStatsHistory {
  id               String   @id @default(uuid())
  artistId         String
  monthlyListeners Int
  followers        Int?
  date             DateTime @default(now())
  popularity       Int?
  
  @@unique([artistId, date])  // Aynı gün için tek kayıt
  @@index([artistId, date])
}
```

---

## 🔌 Entegrasyonlar

### Spotify Entegrasyonu
- **API**: Resmi Spotify Web API (followers, popularity)
- **Scraping**: Playwright ile aylık dinleyici sayısı çekimi
- **Cron**: Otomatik istatistik güncelleme (24 saatte bir)

### Discord Entegrasyonu
- **OAuth2**: Kullanıcı girişi
- **Bot**: Komut yanıtlama, rol yönetimi
- **Webhook**: Bildirimler (sözleşme, demo, gelir)
- **Event Outbox**: Güvenilir event işleme

### E-posta Bildirimleri
- Sözleşme onayları
- Demo değerlendirme sonuçları
- Gelir bildirimleri
- Destek talep yanıtları

---

## 📁 Önemli Dosyalar

### API Endpoints

| Dosya | Endpoint | Açıklama |
|-------|----------|----------|
| `app/api/admin/scrape/route.js` | `POST /api/admin/scrape` | Tek artist scrape |
| `app/api/admin/scrape/batch/route.js` | `POST /api/admin/scrape/batch` | Toplu scrape |
| `app/api/admin/scrape/refresh/route.js` | `POST /api/admin/scrape/refresh` | Otomatik yenileme |
| `app/api/cron/sync-spotify/route.js` | `GET /api/admin/cron/sync-spotify` | Spotify senkronizasyonu |
| `app/api/cron/sync-playlist/route.js` | `GET /api/cron/sync-playlist` | Playlist senkronizasyonu |
| `app/api/contracts/route.js` | `GET/POST /api/contracts` | Sözleşme yönetimi |
| `app/api/earnings/route.js` | `GET/POST /api/earnings` | Gelir yönetimi |

### Kütüphaneler

| Dosya | Açıklama |
|-------|----------|
| `lib/spotify.js` | Spotify API helper'ları |
| `lib/scraper.js` | Playwright scraping |
| `lib/auth.js` | NextAuth yapılandırması |
| `lib/prisma.js` | Prisma client |
| `lib/discord-bridge-db.js` | Discord veritabanı köprüsü |

### Scriptler

| Script | Açıklama |
|--------|----------|
| `scripts/ssh-tunnel-postgres.sh` | SSH tunnel ile DB bağlantısı |
| `seed_earnings.js` | Gelir verisi seedleme |
| `seed-genres.js` | Tür verisi seedleme |

---

## 🚀 Deployment

### Production Deployment

```bash
# Build
docker-compose build

# Deploy
docker-compose up -d

# Health check
curl https://the-lost-label-website-mwaq2s-d4f40a-152-53-142-222.traefik.me/api/health
```

### Cron Job'lar

```bash
# Spotify senkronizasyonu
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://the-lost-label-website-mwaq2s-d4f40a-152-53-142-222.traefik.me/api/admin/cron/sync-spotify
```

---

## 🔧 Ortam Değişkenleri

### Ana Proje (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:<db-password>@<db-host>:5432/postgres

# Auth
NEXTAUTH_URL=https://the-lost-label-website-mwaq2s-d4f40a-152-53-142-222.traefik.me
NEXTAUTH_SECRET=<set in secret manager>

# Spotify
SPOTIFY_CLIENT_ID=<spotify-client-id>
SPOTIFY_CLIENT_SECRET=<spotify-client-secret>

# Email
SMTP_HOST=smtp.turkticaret.net
SMTP_PORT=465
SMTP_USER=noreply@thelostlabel.com
SMTP_PASS=<smtp-password>
SMTP_SECURE=true

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CLIENT_ID=<discord-client-id>
DISCORD_CLIENT_SECRET=<discord-client-secret>
CRON_SECRET=<set in secret manager>

# Bot
BOT_INTERNAL_TOKEN=<set in secret manager>
BOT_INTERNAL_SIGNING_SECRET=<set in secret manager>
BOT_PANEL_URL=https://bot.thelostlabel.com
```

---

## 📝 Notlar

- **Unique Constraint**: `ArtistStatsHistory` tablosunda `artistId + date` kombinasyonu unique'tir. Aynı gün içinde birden fazla scrape yapılırsa veriler güncellenir, duplicate oluşmaz.
- **SSH Tunnel**: Uzaktan DB'ye bağlanmak için `scripts/ssh-tunnel-postgres.sh` kullanılabilir
- **Playwright**: Spotify scraping için Playwright kullanılır, ilk çalıştırmada browser indirilir

---

*Son güncellenme: 2026-03-10*
