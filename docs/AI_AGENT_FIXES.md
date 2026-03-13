# AI Agent Hata Kaydi ve Duzeltmeler

Bu dosya, AI agent'in onceden calisan kodu bozma vakalari ve yapilan duzeltmeleri belgelemek icin olusturulmustur.
Amac: Gelecekte ayni hatalarin tekrarlanmasini engellemek.

---

## 1. Cron Auth — Query Parameter Destegi Eksikligi

**Tarih:** 2026-03-13

**Sorun:** Dokploy cron scheduler, sync endpoint'ini `?secret=<token>` query parameter'i ile cagiriyordu. Ancak `lib/cron-auth.js` sadece `Authorization: Bearer <token>` header'ini kabul ediyordu. Sonuc: `{"error":"Unauthorized"}`.

**Neden boyle oldu:** AI agent, `cron-auth.js` dosyasini olustururken sadece Bearer header destegi ekledi. Gercek calisma ortaminda (Dokploy) cron job'larin nasil cagrildigini bilmiyordu.

**Duzeltme:** `hasValidCronAuthorization()` fonksiyonuna query parameter fallback'i eklendi. Simdi hem `Authorization: Bearer` hem `?secret=` kabul ediliyor.

**Dosya:** `lib/cron-auth.js`

```js
// Once header'i dene, sonra query parameter'a bak
const bearer = getBearerToken(req);
if (bearer && timingSafeSecretEquals(bearer, expected)) return true;

const querySecret = url.searchParams.get("secret") || "";
if (querySecret && timingSafeSecretEquals(querySecret, expected)) return true;
```

---

## 2. Prisma `deleteMany` — Create Isleminde Gecersiz Arguman

**Tarih:** 2026-03-13

**Sorun:** `buildReleaseArtistNestedWrite()` fonksiyonu her zaman `{ deleteMany: {}, create: [...] }` donuyordu. Prisma'nin `upsert.create` blogunda `deleteMany` gecerli degil — sadece `upsert.update` icinde kullanilabilir. Sonuc: `INTERNAL_SERVER_ERROR` — sync tamamen calismiyor, 9 Mart'tan beri hicbir veri senkronize edilmedi.

**Neden boyle oldu:** AI agent `buildReleaseArtistNestedWrite` fonksiyonunu yazarken, ayni fonksiyonun hem `create` hem `update` context'inde cagrildigini hesaba katmadi. Prisma'nin nested write API'si `create` ve `update` icin farkli argumanlari kabul eder:

- **update:** `deleteMany`, `create`, `connect`, `disconnect`, `set`, `updateMany` vb.
- **create:** Sadece `create`, `connect`, `connectOrCreate`, `createMany`

Tek bir fonksiyon her iki durumu da karsilamaya calisti ve `create` durumunda patladi.

**Duzeltme:** `buildReleaseArtistNestedWrite` fonksiyonuna `mode` parametresi eklendi:

**Dosya:** `lib/release-artists.ts`

```ts
export function buildReleaseArtistNestedWrite(
  artistsJson: string | null | undefined,
  mode: "update" | "create" = "update"  // <-- yeni parametre
)
```

- `mode: "update"` (varsayilan) → `{ deleteMany: {}, create: [...] }` doner
- `mode: "create"` → sadece `{ create: [...] }` doner, `deleteMany` OLMADAN

**Etkilenen dosyalar:**
- `lib/release-artists.ts` — fonksiyon tanimi
- `app/api/cron/sync-playlist/route.js` — upsert create blogunda `"create"` modu eklendi
- `app/api/demo/[id]/route.js` — release.create cagirisinda `"create"` modu eklendi

---

## Genel Ders

AI agent mevcut calisma ortamini ve Prisma API kurallarini her zaman tam olarak bilmiyor. Ozellikle:

1. **Deployment ortami:** Cron job'larin nasil tetiklendigi (header vs query param) ortama bagli — kod yazarken gercek ortam kontrol edilmeli.
2. **ORM kisitlamalari:** Prisma'nin `create` ve `update` nested write API'leri farkli argumanlar kabul eder. Ayni helper fonksiyonu her iki context icin kullaniliyorsa, context farki mutlaka ele alinmali.
3. **Tek fonksiyon, iki context = tehlike:** Bir fonksiyon birden fazla Prisma islem turunde kullaniliyorsa, her tur icin uyumluluk kontrol edilmeli.
