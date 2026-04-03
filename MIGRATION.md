# JS → TSX Migration Plan

Tüm dashboard `.js` dosyalarını TypeScript'e geçirme planı.
Her fazın sonunda ✅ işaretlenir.

---

## Faz 1 — Altyapı & Küçük Yardımcılar ✅

Bağımlılığı az, kısa dosyalar. Geçiş sırasında tip altyapısı kurulur.

| # | Dosya | Boyut | Durum |
|---|-------|-------|-------|
| 1 | `app/components/dashboard/admin/styles.js` | ~400 B | ✅ |
| 2 | `app/components/dashboard/admin/Charts.js` | ~9.6 KB | ✅ |
| 3 | `app/components/dashboard/admin-view-registry.js` | ~1.9 KB | ✅ |
| 4 | `app/components/dashboard/discord/useDiscordLink.js` | küçük | ✅ |
| 5 | `app/components/dashboard/discord/DiscordLinkSoftBlockNotice.js` | küçük | ✅ |
| 6 | `app/components/dashboard/discord/DiscordAccountPanel.js` | küçük | ✅ |

---

## Faz 2 — Artist Views ✅

Artist tarafındaki view dosyaları. Zaten bir kısmı `.tsx` olarak var, kalanlar geçirilir.

| # | Dosya | Boyut | Durum |
|---|-------|-------|-------|
| 7 | `app/components/dashboard/artist/ArtistCatalogViews.js` | orta | ✅ |

---

## Faz 3 — Admin Views (küçük-orta) ✅

| # | Dosya | Boyut | Durum |
|---|-------|-------|-------|
| 8  | `app/components/dashboard/admin/SubmissionsView.js` | ~14 KB | ✅ |
| 9  | `app/components/dashboard/admin/WebhooksView.js` | ~15 KB | ✅ |
| 10 | `app/components/dashboard/admin/SettingsView.js` | ~17 KB | ✅ |
| 11 | `app/components/dashboard/admin/DiscordBridgeView.js` | ~18 KB | ✅ |
| 12 | `app/components/dashboard/admin/ContentView.js` | ~21 KB | ✅ |
| 13 | `app/components/dashboard/admin/RequestsView.js` | ~22 KB | ✅ |
| 14 | `app/components/dashboard/admin/CommunicationsView.js` | ~25 KB | ✅ |

---

## Faz 4 — Admin Views (büyük) ⬜

| # | Dosya | Boyut | Durum |
|---|-------|-------|-------|
| 15 | `app/components/dashboard/admin/EarningsView.js` | ~25 KB | ⬜ |
| 16 | `app/components/dashboard/admin/PaymentsView.js` | ~28 KB | ⬜ |
| 17 | `app/components/dashboard/admin/UsersView.js` | ~29 KB | ⬜ |
| 18 | `app/components/dashboard/admin/ReleasesView.js` | ~26 KB | ⬜ |
| 19 | `app/components/dashboard/admin/ArtistsView.js` | ~66 KB | ⬜ |
| 20 | `app/components/dashboard/admin/HomeView.js` | ~41 KB | ⬜ |

---

## Faz 5 — Dashboard Shell & Modal ⬜

Core loader ve modal dosyaları — en son çünkü her şeyin tipi hazır olmalı.

| # | Dosya | Boyut | Durum |
|---|-------|-------|-------|
| 21 | `app/components/dashboard/DashboardLoader.js` | ~14 KB | ⬜ |
| 22 | `app/components/dashboard/ContractSigningModal.js` | ~9 KB | ⬜ |
| 23 | `app/components/dashboard/StudioPlayer.js` | ~14 KB | ⬜ |
| 24 | `app/components/dashboard/ProjectView.js` | ~24 KB | ⬜ |

---

## Faz 6 — Page Routes ⬜

Next.js page dosyaları. En son — diğer component'ler tipli olunca bunlar kolay olur.

| # | Dosya | Boyut | Durum |
|---|-------|-------|-------|
| 25 | `app/dashboard/settings/page.js` | ~15 KB | ⬜ |
| 26 | `app/dashboard/demo/[id]/page.js` | ~41 KB | ⬜ |
| 27 | `app/dashboard/demo/[id]/finalize/page.js` | ~53 KB | ⬜ |
| 28 | `app/dashboard/head.js` | ~250 B | ⬜ |

---

## Kurallar

- Geçiş sırasında mantık **değiştirilmez**, sadece tip eklenir
- `any` kullanımı geçici olarak kabul edilir, `// TODO: type` yorumuyla işaretlenir
- Her dosya geçildikten sonra eski `.js` silinir
- Build kırılmadan bir sonraki faza geçilir
