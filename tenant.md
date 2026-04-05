# Multi-Tenant Mimari Dokümantasyonu

Bu dosya, bu repo'nun multi-tenant yapısını açıklar. AI agent'lar ve geliştiriciler bu dokümanı referans alarak tenant-aware değişiklikler yapmalıdır.

---

## 1. Deployment Modeli

Bu proje **tenant başına ayrı deployment** modeli kullanır. Her müzik label'ı (tenant) aynı repo'dan deploy edilir, ancak her birinin:

- **Ayrı Dokploy projesi** vardır
- **Ayrı PostgreSQL veritabanı** vardır
- **Ayrı env değişkenleri** vardır
- **Ayrı domain'i** vardır

Bu, "shared multi-tenant" (tek instance, çok tenant) DEĞİLDİR. Her deploy birbirinden tamamen izole çalışır.

### Mevcut Tenant'lar

| Tenant | Slug | Domain | DB Port |
|--------|------|--------|---------|
| THE LOST LABEL | `lost` | thelostlabel.com | 5432 |
| ELYSIAN RECORDS | `elysian` | - | 6543 |
| OCEN | `ocen` | - | - |

### Deployment Akışı

```
Aynı Git Repo (label-platform)
    │
    ├─→ Dokploy: "The Lost Label"   → DATABASE_URL=lost_db,   TENANT_ID=lost
    ├─→ Dokploy: "Elysian"          → DATABASE_URL=elysian_db, TENANT_ID=elysian
    ├─→ Dokploy: "Ocen"             → DATABASE_URL=ocen_db,   TENANT_ID=ocen
    └─→ Dokploy: "Label Panels"     → CONTROL_DB_URL=control_db (kontrol paneli)
```

---

## 2. Tenant Yapılandırma Kaynakları

Tenant config **üç katmandan** okunur (öncelik sırası):

### Katman 1: SystemSettings (DB — öncelikli)

Her tenant'ın kendi DB'sindeki `SystemSettings` tablosu (id="default") feature flag'leri ve branding bilgilerini JSON olarak tutar. **Admin dashboard'dan değiştirilebilir, redeploy gerekmez.**

```
Admin Dashboard → Settings → FEATURES tab  → feature toggle'ları
Admin Dashboard → Settings → BRANDING tab  → shortName, fullName, logo, renk
```

Feature flag alanları:
- `featureSubmissions`, `featureContracts`, `featureEarnings`, `featurePayments`
- `featureReleases`, `featureCommunications`, `featureDiscordBridge`
- `featureWisePayouts`, `featureSpotifySync`, `featureInvoices`, `featureAnnouncements`

Branding alanları:
- `brandingShortName`, `brandingFullName`, `brandingDotName`
- `brandingPrimaryColor`, `brandingLogoUrl`, `brandingSupportEmail`

### Katman 2: Control Panel DB (opsiyonel)

Ayrı bir PostgreSQL veritabanında `Tenant` tablosu var. `control-panel/` alt projesi bu DB'yi yönetir. Ana uygulama `CONTROL_DB_URL` env'i set edilmişse bu DB'den okur.

- Schema: `control-panel/prisma/schema.prisma`
- Client: `lib/control-db.ts` (dinamik require, type `any`)
- Config reader: `lib/tenant-config.ts`

### Katman 3: Env Değişkenleri (fallback)

DB'de değer yoksa env'den okunur:

```env
TENANT_ID=lost
NEXT_PUBLIC_SITE_NAME=LOST
NEXT_PUBLIC_SITE_FULL_NAME=THE LOST LABEL
NEXT_PUBLIC_FEATURE_SUBMISSIONS=true
NEXT_PUBLIC_FEATURE_DISCORD=false
NEXT_PUBLIC_FEATURE_WISE=true
# ... diğer feature flag'ler
```

---

## 3. Kritik Dosyalar ve Sorumlulukları

### Tenant Config Zinciri

| Dosya | Rol |
|-------|-----|
| `lib/system-settings.ts` | `SystemSettingsConfig` type tanımı, feature flag + branding alanları dahil. `normalizeSystemSettingsConfig()` ile parsing. |
| `lib/public-settings.ts` | DB'den SystemSettings okur, `unstable_cache` ile cache'ler. `PublicSettings` type'ını export eder. |
| `lib/dashboard-features.ts` | `ADMIN_DASHBOARD_FEATURES` (env fallback) + `getAdminFeaturesFromSettings()` (DB'den). |
| `lib/branding.ts` | `BRANDING` (env fallback) + `getBrandingFromSettings()` (DB'den). |
| `lib/tenant-config.ts` | Control DB'den tenant config okur (opsiyonel). Type tanımları: `TenantBranding`, `TenantFeatures`, `TenantConfig`. |
| `lib/tenant.js` | `TENANT` objesi (env-based, sync). `getActiveTenantConfig()` (async, control DB + fallback). |
| `lib/control-db.ts` | Control Panel DB'ye bağlantı. `CONTROL_DB_URL` yoksa `null` döner. Type: `any`. |

### Feature Flag Kullanımı

```
DashboardShell.tsx
    → usePublicSettings() ile DB'den feature flag'leri alır
    → getAdminFeaturesFromSettings() ile sidebar menüsünü filtreler
    → Kapalı feature'ın menü item'ı sidebar'da görünmez
```

### Branding Kullanımı

```
app/layout.js
    → getPublicSettings() → PublicSettingsProvider → client'a geçirir
    → brandingShortName, brandingFullName vs. kullanılabilir

lib/branding.ts
    → BRANDING (static, env fallback)
    → getBrandingFromSettings(config) (DB'den)
```

---

## 4. Yeni Tenant Ekleme

### Otomatik (script ile)

```bash
./scripts/create-tenant.sh <slug> <db-name> <pg-host> <pg-port> <pg-user> <pg-password>

# Örnek:
./scripts/create-tenant.sh ocean ocean_db 152.53.142.222 5432 postgres mypassword
```

Bu script:
1. PostgreSQL'de yeni DB oluşturur
2. `prisma migrate deploy` çalıştırır
3. `scripts/seed-tenant.ts` ile default data yükler (SystemSettings, SiteContent, EmailTemplate)
4. `scripts/.env.<slug>` dosyasında env template üretir

### Manuel

1. PostgreSQL'de DB oluştur
2. `DATABASE_URL=... npx prisma migrate deploy`
3. `DATABASE_URL=... npx tsx scripts/seed-tenant.ts <slug>`
4. Dokploy'da yeni proje oluştur, env'leri set et, deploy et

### Seed Edilen Data

- `SystemSettings` (id="default"): Tüm feature flag'ler + branding + genel ayarlar
- `SiteContent`: FAQ, terms, privacy, genres, commissions, home content
- `EmailTemplate`: account-approved, demo-received, payout-processed

---

## 5. Feature Flag'leri Değiştirme

### Yöntem A: Admin Dashboard (önerilen — redeploy gerekmez)

1. Tenant'ın admin paneline gir
2. Settings → FEATURES tab
3. İstenen feature'ı toggle et
4. Save Changes
5. Sayfa yenilenince sidebar güncellenir

### Yöntem B: Doğrudan DB (acil müdahale)

```sql
-- Wise Payouts'u aç
UPDATE "SystemSettings" 
SET config = config::jsonb || '{"featureWisePayouts": true}'::jsonb
WHERE id = 'default';
```

### Yöntem C: Env değişkeni (eski yöntem — redeploy gerekir)

```env
NEXT_PUBLIC_FEATURE_WISE=true
```

---

## 6. Control Panel (Label Panels)

Ayrı bir Next.js projesi: `control-panel/`

- **DB**: Kendi PostgreSQL'i (`CONTROL_DB_URL`)
- **Schema**: `control-panel/prisma/schema.prisma` (Tenant + ControlPanelSession)
- **Auth**: Basit password auth (`CONTROL_PANEL_PASSWORD` env)
- **Özellikler**: Tenant listesi, yeni tenant ekleme, branding/feature düzenleme

Ana uygulama `CONTROL_DB_URL` set edilmişse control panel DB'den tenant config okuyabilir. Ama **asıl feature/branding yönetimi artık her tenant'ın kendi SystemSettings'inden yapılır**.

---

## 7. Geliştirici Rehberi

### Yeni feature flag ekleme

1. `lib/system-settings.ts` → `PublicSettings` ve `SystemSettingsConfig` type'larına ekle
2. `lib/system-settings.ts` → `DEFAULT_PUBLIC_SETTINGS`'e default değer ekle
3. `lib/system-settings.ts` → `normalizeSystemSettingsConfig()`'e parsing ekle
4. `lib/system-settings.ts` → `pickPublicSettings()`'e ekle
5. `lib/dashboard-features.ts` → `getAdminFeaturesFromSettings()`'e ekle
6. `app/components/dashboard/admin/SettingsView.tsx` → Features tab'ına toggle ekle
7. İlgili view'ın `ADMIN_VIEW_DEFINITIONS`'daki `featureKey`'ini set et (`lib/dashboard-view-registry.ts`)

### Yeni branding alanı ekleme

1. `lib/system-settings.ts` → type'lara ve default'lara ekle
2. `lib/system-settings.ts` → normalize ve pickPublicSettings'e ekle
3. `app/components/dashboard/admin/SettingsView.tsx` → Branding tab'ına field ekle
4. Kullanıldığı yerde `usePublicSettings()` veya `getBrandingFromSettings()` ile oku

### Önemli kurallar

- **Env değişkenleri fallback'tir** — DB'deki değer önceliklidir
- **ADMIN_DASHBOARD_FEATURES** (env-based) hâlâ var — client-side ve build-time fallback olarak kullanılır
- **`lib/prisma.ts`** tek bir PrismaClient export eder — her deploy kendi DB'sine bağlıdır, runtime'da tenant switching YOKTUR
- **Session'da tenant bilgisi YOKTUR** — her deploy tek bir tenant'a hizmet eder
- **Tablolarda tenantId YOKTUR** — DB-per-tenant modeli sayesinde gerek yok

---

## 8. Mimari Kararlar ve Gerekçeleri

| Karar | Gerekçe |
|-------|---------|
| DB-per-tenant (ayrı DB) | Tam izolasyon, bir tenant'ın bug'ı diğerini etkilemez |
| Ayrı deployment | Bağımsız deploy cycle, rollback kolaylığı |
| Feature flag'ler DB'de | Redeploy gerekmeden admin panelden yönetim |
| Env fallback | Backward compat, DB'ye seed edilmemiş tenant'lar çalışmaya devam eder |
| Control panel ayrı proje | Platform-level monitoring, tenant CRUD |
| Tek Prisma schema | Tüm tenant DB'leri aynı schema'yı kullanır, migration tek yerden |
