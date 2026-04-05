# Lost Website Agent Guide

Bu dosya, bu repoda calisacak insan veya AI agent'ler icin operasyonel referans dokumanidir. Amac, projeyi hizli anlamak, yanlis varsayimlarla sistemi bozmamak ve degisiklikleri repo gerceklerine uygun sekilde yapmaktir.

## 1. Projenin Amaci

Lost Website, bagimsiz sanatcilar icin gelistirilmis bir muzik yonetim platformudur. Sistem temel olarak su alanlari kapsar:

- Sanatci hesap ve profil yonetimi
- Demo toplama ve degerlendirme
- Sozlesme olusturma ve imzalama
- Release ve katalog yonetimi
- Gelir ve odeme takibi
- Spotify veri cekimi ve dinleyici senkronizasyonu
- Discord entegrasyonu ve topluluk otomasyonlari
- Admin paneli uzerinden operasyon yonetimi

Repo yalnizca tek bir web sitesi degildir. Iki ana runtime vardir:

1. Ana web uygulamasi: Next.js App Router tabanli website + API surface
2. Discord botu: Python tabanli worker ve buna bagli entegrasyon katmani

Bu iki sistem ortak is mantigini ve ortak PostgreSQL veritabanini paylasir, ancak tablo cakismazligi olmamasi icin ayrik schema kullanimi vardir.

## 2. Yuksek Seviye Mimari

### Ana Bilesenler

- `app/`: Next.js App Router, sayfalar ve API route'lar
- `app/components/`: Public site, dashboard ve ortak UI bilesenleri
- `lib/`: Auth, permissions, validation, mail, Discord bridge, Spotify, sync ve ortak business logic
- `prisma/`: Ana website veritabani modeli ve migration'lar
- `scripts/`: Elle calistirilan operasyon, cron, debug ve migration yardimcilari
- `docs/`: Operasyonel bilgi, logging, server yonetimi ve onceki ajan hatalari
- `Discord Bot/`: Ayrik Python bot uygulamasi
- `Discord Bot/frontend/`: Botla ilgili frontend/parca dashboard yuzeyi

### Teknoloji Yigini

- Frontend: Next.js 16, React 19
- Styling: Tailwind CSS 4 + custom CSS/module CSS
- Backend: Next.js route handlers
- ORM: Prisma
- Database: PostgreSQL
- Bot: Python + discord.py
- Scraping/automation: Playwright
- Deployment: Docker / Docker Compose / Dokploy / Docker Swarm

## 3. Repo Yapisi ve Sorumluluklar

### Website tarafi

- `app/page.js`, `app/HomeClient.js`: Landing ve public experience
- `app/dashboard/`: Dashboard shell ve ana dashboard route'lari
- `app/components/dashboard/`: Artist/admin dashboard gorunumleri
- `app/api/`: Tum HTTP endpoint'ler

Ozel olarak dikkat edilmesi gereken route gruplari:

- `app/api/admin/`: Admin operasyonlari
- `app/api/cron/`: Zamanlanmis gorev endpoint'leri
- `app/api/internal/discord/`: Bot ile website arasindaki dahili entegrasyon katmani
- `app/api/files/`: Ozel dosya erisimi ve indirme akisleri
- `app/api/contracts/`, `app/api/earnings/`, `app/api/payments/`: Kritik finansal ve hukuki akislar

### Core library katmani

`lib/` altindaki dosyalar hafif util siniflari degil; bir kismi sistem cekirdegidir. Ozellikle sunlara dikkat edin:

- `lib/auth.ts`, `lib/auth-schemas.ts`, `lib/auth-types.ts`: Kimlik dogrulama ve auth veri contract'lari
- `lib/permissions.ts`: Yetki kararlarinin merkezi yeri
- `lib/prisma.ts`: Prisma client lifecycle
- `lib/security.ts`: Guvenlik yardimcilari
- `lib/api-errors.ts`, `lib/logger.js`: Production-safe hata ve log davranisi
- `lib/spotify.ts`, `lib/scraper.js`: Spotify entegrasyonu ve scraping
- `lib/sync-jobs.ts`: Senkronizasyon job mantigi
- `lib/discord-bridge-*.js`: Website ile Discord worker arasindaki kopru katmani
- `lib/cron-auth.js`: Cron endpoint authentication
- `lib/release-artists.ts`: Release artist nested write mantigi, Prisma context farklarina duyarli

### Discord bot tarafi

`Discord Bot/` bagimsiz bir Python uygulamasidir. Ana klasorler:

- `bot.py`: Entry point
- `src/services/`: Bot davranisi ve domain servisleri
- `src/repositories/`: DB erisimi ve persistence katmani
- `src/ui/`: Embed ve Discord UI olusturuculari
- `frontend/`: Bot ile iliskili UI/runtime panel parcasi

README'ye gore bot paneli tasarim geregi primary runtime olarak kapali kabul edilir. Bot runtime ayarlari website admin paneli uzerinden yonetilir.

## 4. Calisma Ortami

### Lokal gelistirme

Ana tavsiye edilen komut:

```bash
npm run dev:all
```

Bu komut tipik olarak:

- website'i `http://localhost:3000` adresinde
- Discord worker'i ayni lokal gelistirme akisi icinde

calistirir.

Website icin temel komutlar:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
```

Ek typecheck komutlari:

```bash
npm run typecheck:app
npm run typecheck:scripts
npm run typecheck:discord
```

Manuel sync komutlari:

```bash
npm run manual:sync
npm run sync:jobs
```

### Docker

Root `docker-compose.yml` ile hem website hem bot ayağa kaldirilabilir:

```bash
docker compose up -d --build
```

Docker runtime ile ilgili kritik notlar:

- Website container: `lost-website`
- Bot container: `lost-bot`
- Playwright browser cache kalici tutulmali
- Production'da browser dependency'leri runtime sirasinda eksik kalmamali
- Ayni PostgreSQL instance kullanilir
- Bot tablolarinin ayrik schema'da tutulmasi gerekir: `BOT_DB_SCHEMA=discord_bot`

## 5. Veritabani Modeli

### Ana prensip

- Website Prisma ile `public` schema uzerinde calisir
- Discord bot asyncpg/repository mantigi ile ayrik schema uzerinde calisir
- Tek veritabani kullanilir, ancak tablo isim cakismlarini schema ayrimi cozer

### Ana domain modelleri

`prisma/schema.prisma` icinde one cikan modeller:

- `User`: sistem kullanicisi, role ve auth alanlari ile birlikte
- `Artist`: sanatci profili ve Spotify metrikleri
- `ArtistStatsHistory`: zaman serili artist istatistik gecmisi
- `Release`: muzik yayini
- `ReleaseArtist`: release ile artist arasindaki M:N bag
- `Demo`, `DemoFile`: demo yukleme ve dosya iliskisi
- `Contract`: sozlesme kaydi
- `Earning`: gelir kaydi
- `Payment`: odeme kaydi
- `RoyaltySplit`: gelir dagilimi
- `ChangeRequest`, `ChangeRequestComment`: istek ve yorum akislari
- `Webhook`, `SiteContent`, `SystemSettings`: sistem konfigurasyonu ve icerik

### Semaya mudahale ederken

- Prisma migration mantigina uygun calisin
- Relation davranislarini anlamadan `onDelete` degistirmeyin
- `ReleaseArtist` gibi composite key kullanan modellerde upsert/create/update akislarini dikkatle ele alin
- String tarih alanlari ile `DateTime` alanlarini karistirmayin
- Finansal tablolarda sessiz veri donusumu yapmayin

## 6. Kritik Uygulama Akislari

### 6.1 Auth ve kullanici erisimi

Auth alani `lib/auth.ts`, `types/next-auth.d.ts`, ilgili route'lar ve dashboard provider katmaninda dagilmistir. Role/permission davranislari tek yerde toparlanmamis gibi gorunse de pratikte `lib/permissions.ts` ve dashboard gating kodlari kritik merkezdir.

Degisiklik yaparken:

- Admin/artist ayrimini bozmayin
- Session shape degisirse frontend ve API tarafini birlikte guncelleyin
- Email verification / reset password alanlarinin mevcut oldugunu unutmayin
- Discord linkleme akislarinin auth ile iliskisini kontrol edin

### 6.2 Spotify scraping ve sync

Bu proje yalnizca resmi Spotify API'ye dayanmiyor. Bazi metrikler scraping ile cekiliyor.

Ilgili bilesenler:

- `lib/spotify.ts`
- `lib/scraper.js`
- `app/api/admin/scrape/*`
- `app/api/cron/sync-playlist/route.js`
- `app/api/cron/sync-listeners/route.js`
- `scripts/cron/*`

Riskler:

- Playwright browser availability
- Rate limit veya UI degisimi nedeniyle scrape kirilmasi
- Release ve artist sync'in kismi basari halinde veri uyumsuzlugu yaratmasi

### 6.3 Discord bridge

Discord tarafi bu projede basit bir webhook degildir. Website ile bot arasinda daha kapsamli bir bridge katmani vardir.

One cikan dosyalar:

- `lib/discord-bridge-service.js`
- `lib/discord-bridge-db.js`
- `lib/discord-bridge-outbox.js`
- `lib/discord-bridge-oauth.js`
- `lib/discord-bridge-role-sync.js`
- `lib/discord-bridge-auth.js`
- `app/api/internal/discord/*`

Bu alanda degisiklik yaparken:

- Dahili token/signing secret mekanizmasini bozmayin
- Event ack/pull ve outbox davranislarini birlikte dusunun
- Route alias'lari mevcut olabilir; duplicate-benzeri endpoint'leri silmeden once tum caller'lari kontrol edin

### 6.4 Contracts, earnings, payments

Bu alan dogrudan is kritiktir. Veri kaybi veya yanlis hesap cikar.

Kontrol edilmesi gerekenler:

- Artist/user/release baglari
- Percentage/share alanlari
- Bulk import veya seed scriptleri
- Dashboard gorunumlerinde beklenen JSON shape
- Dosya upload ve private file access akislari

## 7. API Tasarim Notlari

Projede hem `.js` hem `.ts` route'lar bir arada bulunuyor. Bu, kademeli gecis veya pragmatik gelisim sonucu olabilir. Toptan donusum yapmayin; yerel dosya desenine uyun.

API route degistirirken:

- Hata yonetiminde `lib/api-errors.ts` desenine uyun
- Production'da detayli stack trace expose etmeyin
- `logger` kullanimini koruyun
- Response shape degisimlerinde frontend etkisini kontrol edin
- Cron route'larda auth fallback davranisini koruyun

## 8. Logging ve Hata Yonetimi

Mevcut sistem production-safe olacak sekilde tasarlanmis.

Beklenen davranis:

- Client'a generic hata mesaji
- Server log'larinda detayli baglam
- Ortama gore log seviyesi degisimi

Ilgili dosyalar:

- `lib/logger.js`
- `lib/api-errors.ts`
- `docs/LOGGING.md`

Bir endpoint'e yeni kod eklerken:

- `try/catch` kullanin
- Beklenen validation hatalarini ayri ele alin
- Server tarafinda anlamli context ile log atin
- Browser'a ham exception nesnesi dondurmeyin

## 9. Dosya ve Storage Akislari

Proje file upload kullaniyor:

- kapak gorseli
- demo audio
- contract PDF
- release ile iliskili asset'ler

Ilgili route'lar:

- `app/api/upload/route.js`
- `app/api/upload/cover-art/route.js`
- `app/api/files/**`
- `app/api/contracts/upload/route.js`

Bu alanda degisiklik yaparken:

- Private/public dosya ayrimini koruyun
- Dosya yolu mantigini `lib/private-storage-paths.js` gibi yardimci katmanlarla uyumlu tutun
- Buyuk dosyalarda streaming veya memory davranisini dusunun

## 10. Ortam Degiskenleri ve Gizli Bilgiler

Repoda `.env`, `.env.local`, `.env.example` gibi dosyalar bulunuyor, ancak secret'larin canonical kaynagi production secret store olmali. Mevcut dokumanlara gore bazi degerler Dokploy/host seviyesinde tutuluyor.

Tipik secret alanlari:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- `BOT_INTERNAL_TOKEN`
- `BOT_INTERNAL_SIGNING_SECRET`
- Discord OAuth secret'lari
- Spotify API credential'lari
- SMTP credential'lari

Kurallar:

- Secret'lari dokumanlara plaintext yazmayin
- Repo icine hardcode etmeyin
- Debug icin gecici secret loglamasi yapmayin
- Yeni env degiskeni eklerseniz `.env.example` benzeri ornekleri guncellemeyi degerlendirin

## 11. Production ve Server Bilgisi

`docs/SERVER_MANAGEMENT.md` uzerinden gorunen operasyonel gercekler:

- Server mimarisi: Dokploy tarafindan yonetilen Docker Swarm
- Host IP: `152.53.142.222`
- Cron job'lar host machine root crontab uzerinden tetikleniyor
- Website aktif container'i dinamik bulunarak komut gonderiliyor
- Playwright cache volume'unun kalici olmasi bekleniyor

Bu bilgi onemli cunku deployment ortami lokal varsayimlarla birebir ayni degil.

## 12. Gecmis Ajan Hatalari ve Alinacak Dersler

`docs/AI_AGENT_FIXES.md` dosyasinda belgelenmis iki kritik hata, bu repoda calisacak her agent icin zorunlu ders niteligindedir.

### Ders 1: Runtime gercegini koddan tahmin etme

Cron endpoint auth davranisi ilk yazimda sadece `Authorization: Bearer` kabul edecek sekilde ele alinmis, ancak production cron cagrisinin `?secret=` ile geldigi sonradan ortaya cikmis.

Sonuc:

- Ortam nasil cagiriyor sorusu kontrol edilmeden auth mantigi degistirilmemeli
- Production entegrasyon sekli varsayilmamali

### Ders 2: Prisma create/update context'lerini karistirma

Nested write helper ayni anda hem `create` hem `update` icin kullanilmis, ancak Prisma bu iki context'te farkli field setleri kabul ediyor.

Sonuc:

- Tek helper fonksiyonu birden fazla nested write context'inde kullaniyorsaniz API uyumlulugunu her context icin ayri dogrulayin
- `deleteMany` gibi field'larin yalnizca update'te gecerli olabilecegini unutmayin

Bu iki hata, bu projede "gorunuste mantikli" degisikliklerin production'da kolayca kirilma yaratabilecegini gosteriyor.

## 13. Kodlama ve Degisiklik Ilkeleri

Bu repo icin tavsiye edilen calisma sekli:

1. Once etkilenen route, component ve helper katmanini birlikte incele
2. Sonra DB modelini ve veri contract'larini kontrol et
3. Ardindan ilgili script veya cron akisi varsa onu da oku
4. Sadece hedeflenen degisikligi yap
5. Mumkunse lint, typecheck veya ilgili test komutunu calistir

Ek ilkeler:

- Mevcut stil neyse onu takip et; sebepsiz genis refactor yapma
- Yari TypeScript yari JavaScript yapisini bir seferde "duzeltmeye" kalkma
- Admin ve artist dashboard gorunumlerinin farkli data contract'lari olabilecegini varsay
- Discord bridge ve cron endpoint'lerinde backward compatibility'yi koru
- Silent failure yerine kontrollu log + güvenli hata yaniti tercih et

## 14. Test ve Dogrulama Stratejisi

Bu repoda test kapsami sinirli olabilir. Bu yuzden degisiklik tipine gore uygun dogrulama secilmelidir.

### Hafif degisikliklerde

- `npm run lint`
- ilgili dosya veya route icin mantik okuma

### TypeScript etkili degisikliklerde

- `npm run typecheck:app`
- gerekiyorsa `npm run typecheck:scripts`
- Discord frontend etkileniyorsa `npm run typecheck:discord`

### Runtime etkili degisikliklerde

- ilgili API route'u elle tetikleme
- dashboard akisini lokal test etme
- gerekiyorsa script'i elle calistirma

### Deployment etkili degisikliklerde

- Docker build mantigini kontrol et
- Playwright veya volume bagimliliklarini yeniden dusun
- Production cron tetikleme semasini bozmadigindan emin ol

## 15. Ajan Icin Hizli Kontrol Listesi

Bir degisiklik yapmadan once kendine su sorulari sor:

- Bu degisiklik yalnizca UI mi, yoksa API/data contract da etkileniyor mu?
- Prisma schema veya relation mantigi etkileniyor mu?
- Bu endpoint cron, bot veya admin paneli tarafindan da kullaniliyor olabilir mi?
- Production auth davranisi lokal tahminden farkli olabilir mi?
- Bu helper create ve update context'lerinde farkli sekilde mi calisiyor?
- Bu degisiklik loglama, hata mesaji veya secret handling'i bozuyor mu?
- Private file access ya da finansal veri akisi etkileniyor mu?

## 16. Yararlı Dosyalar

- `README.md`: hizli baslangic ve container ozeti
- `docs/PROJECT_DOCUMENTATION.md`: genel proje tanimi
- `docs/SERVER_MANAGEMENT.md`: production/server operasyonlari
- `docs/LOGGING.md`: logging ve error handling yaklasimi
- `docs/AI_AGENT_FIXES.md`: gecmis agent kaynakli regression kayitlari
- `prisma/schema.prisma`: gercek veri modeli
- `package.json`: aktif script ve toolchain

## 17. Yapilan Optimizasyon ve Temizlik Calismalari (Nisan 2026)

### Anasayfa Mobil Performans Optimizasyonu

Anasayfadaki agir gorsel efektler mobilde ciddi performans sorunu yaratiyordu. Tum homepage componentleri analiz edildi ve mobilde gereksiz GPU yukunu kaldiran kosullu optimizasyonlar eklendi:

- **SVG feTurbulence filtreleri** mobilde tamamen devre disi (scroll-atmosphere)
- **Canvas particle rAF** mobilde durduruldu (floating-particles)
- **backdrop-blur, filter: blur() animasyonlari** mobilde kaldirildi veya basitlestirildi
- **Film grain katmanlari** mobilde gizlendi (cinematic-hero, lost-releases, artist-showcase)
- **3D perspective/rotateX** transformlari mobilde duz animasyonlara cevirildi
- **Artist card DOM sayisi** mobilde azaltildi (90 → 60)
- Ortak `lib/is-mobile.ts` modulu olusturuldu (SSR-safe)

### Desktop Scroll Mesafesi Azaltma

Tum ScrollTrigger pin sureleri ~%40 kisaltildi. Her section icin desktop ve mobil ayri pin degerleri tanimlandi.

### Yuklenme Ekrani Scroll Kilidi

`page-reveal.tsx`'de mobilde scroll kacagi vardi. `position: fixed` + `touch-action: none` teknigi ile animasyon sirasinda scroll engellendi.

### Dashboard Admin Kod Temizligi

- **useDebouncedSearch hook'u** olusturuldu, 9 admin view'da tekrar eden debounce pattern'i tek hook'a tasindi
- **SearchField v3 standardizasyonu**: 6 admin view'da manuel arama input'lari HeroUI v3 `SearchField` compound component'ine donusturuldu
- **AnalyticsView**: 6 inline grid style → Tailwind class'lari
- **AuditLogsView**: CSS variable'lar → Tailwind, tasarim tutarliligi duzeltmeleri
- **4 olu dosya silindi**: `ArtistsView.js`, `HomeView.js`, `codex-test.txt`, `styles.ts`

### Kod Butunlugu Duzeltmeleri

- React hooks kurali ihlalleri duzeltildi (FloatingParticles, ScrollAtmosphere)
- ScrollAtmosphere icin wrapper/inner component pattern'i uygulandi
- Kullanilmayan import'lar temizlendi

## 18. Son Not

Bu repoda en buyuk risk, sistemi "tipik bir Next.js CRUD uygulamasi" gibi gormektir. Aslinda burada:

- muzik domain mantigi
- finansal veri
- sozlesme akisleri
- scraping
- cron
- Discord worker entegrasyonu
- production container davranisi

aynı anda vardir.

Bu nedenle kucuk gorunen bir degisiklik bile birden fazla runtime'a dokunabilir. Agent, degisiklik oncesi caller ve veri akislarini kontrol etmeli; varsayimla degil, repo gercegiyle hareket etmelidir.
