# Dashboard → HeroUI v3 Migration Plan

> **Durum Takip Dosyası** — Her tamamlanan adımı `[x]` ile işaretle.
> Değişiklikler şu an local'de, henüz git'e push edilmedi.

---

## Kritik Ön Bilgi

### HeroUI Durumu
- [ ] **HeroUI kurulu DEĞİL** — `package.json`'da hiç `@heroui/*` paketi yok
- Kullanıcı "zaten HeroUI v3'e çekili" dedi ama bağımlılık olarak yok
- **Faz 0 tamamlanmadan hiçbir faza başlama**

### Mevcut Mimari Özeti
- Framework: Next.js 16 App Router + React 19
- Styling: Tailwind v4 + CSS Modules + inline `style={{}}` + global CSS classes
- Dashboard: Single-page view-switching (`?view=...` param)
- Mevcut custom sınıflar: `glass-card`, `glass-section`, `dash-btn`, `dash-btn-primary`, `dash-btn-danger`, `dash-input`, `dash-th`, `dash-td`, `dash-badge`, `dash-modal-overlay`, `dash-modal`, vb.
- **Sorun:** Bu sınıflar tanımlı ama bileşenler büyük çoğunlukla `style={{}}` kullanıyor, sınıfları yok sayıyor

### Bilinen Bug'lar (Migration sırasında düzelt)
- `var(--accent-10)` `globals.css`'de tanımlı değil → `ContractTable.tsx`'de silent bug
- `FeaturedAnnouncements.tsx` light theme kullanıyor (`#fff` bg, `#111` text) — tüm dashboard dark theme iken
- `rgba(57,255,20,...)` (eski neon yeşil accent) bazı dosyalarda hâlâ kullanılıyor, `--accent: #E5E7EB` ile çelişiyor

---

## Sayfa ve Bileşen Envanteri

### Route Pages
| Route | Dosya | Inline Style Yoğunluğu |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Orta |
| `/dashboard` layout | `app/dashboard/layout.tsx` | Yok |
| `/dashboard/demo/[id]` | `app/dashboard/demo/[id]/page.js` | — |
| `/dashboard/demo/[id]/finalize` | `app/dashboard/demo/[id]/finalize/page.js` | — |
| `/dashboard/settings` | `app/dashboard/settings/page.js` | — |

### Shell & Primitives
| Bileşen | Dosya | Inline Style Yoğunluğu |
|---|---|---|
| Shell | `shell/DashboardShell.tsx` + `.module.css` | Yüksek (CSS Module) |
| Card | `primitives/DashboardCard.tsx` | Düşük |
| Button | `primitives/DashboardButton.tsx` | Düşük |
| Modal | `primitives/DashboardModal.tsx` | Orta |
| Table | `primitives/DashboardTable.tsx` | Düşük |
| Input/Select/Textarea | `primitives/DashboardInput.tsx` | Düşük |
| Badge | `primitives/DashboardBadge.tsx` | Düşük |
| Loader | `DashboardLoader.js` | Çok Yüksek |

### Admin Views (13 view)
| View | Dosya | Inline Style Yoğunluğu | `<style jsx>` |
|---|---|---|---|
| HomeView | `admin/HomeView.js` | Yüksek | Var |
| SubmissionsView | `admin/SubmissionsView.js` | Yüksek | 250+ satır |
| ArtistsView | `admin/ArtistsView.js` | Yüksek | Yok |
| UsersView | `admin/UsersView.js` | Yüksek | Var |
| RequestsView | `admin/RequestsView.js` | Yüksek | Yok |
| EarningsView | `admin/EarningsView.js` | Yüksek | Var |
| PaymentsView | `admin/PaymentsView.js` | Yüksek | Var |
| AnnouncementsView | `admin/AnnouncementsView.tsx` | Orta | Yok |
| CommunicationsView | `admin/CommunicationsView.js` | Orta | Var |
| ContractsView | `admin/contracts/ContractsView.tsx` | Düşük | Yok |
| ContractTable | `admin/contracts/ContractTable.tsx` | Yüksek | Var |
| ContractForm | `admin/contracts/ContractForm.tsx` | Yüksek | Var |
| ArtistPicker | `admin/contracts/ArtistPicker.tsx` | Orta | Yok |
| ContentView | `admin/ContentView.js` | Yüksek | Yok |
| ReleasesView | `admin/ReleasesView.js` | Yüksek | Yok |
| SettingsView | `admin/SettingsView.js` | Yüksek | Yok |
| WebhooksView | `admin/WebhooksView.js` | Orta | Yok |
| DiscordBridgeView | `admin/DiscordBridgeView.js` | Orta | Yok |

### Artist Views (8 view)
| View | Dosya | Inline Style Yoğunluğu | `<style jsx>` |
|---|---|---|---|
| ArtistOverviewView | `artist/views/ArtistOverviewView.tsx` | Yüksek | Var |
| ArtistEarningsView | `artist/views/ArtistEarningsView.tsx` | Yüksek | Yok |
| ArtistContractsView | `artist/views/ArtistContractsView.tsx` | Orta | Yok |
| ArtistProfileView | `artist/views/ArtistProfileView.tsx` | Yüksek | Yok |
| FeaturedAnnouncements | `artist/views/FeaturedAnnouncements.tsx` | Orta | Yok |
| ArtistCatalogViews | `artist/ArtistCatalogViews.js` | Yüksek | Yok |
| ArtistSupportViews | `artist/ArtistSupportViews.js` | Orta | Var |

### Paylaşılan / Diğer
| Bileşen | Dosya | Not |
|---|---|---|
| ContractSigningModal | `ContractSigningModal.js` | Local duplicate style objects |
| AdminView | `AdminView.tsx` | Orta inline style |
| ArtistView | `ArtistView.tsx` | Orta inline style |
| Theme constants | `lib/theme.ts` | @deprecated style objects |
| Admin styles bridge | `admin/styles.js` | theme.ts re-export, silinecek |

---

## Faz 0 — HeroUI Kurulumu ve Konfigürasyon

> **Öncelik: KRİTİK** — Bu adım olmadan hiçbir şey çalışmaz.

### 0.1 — Paket Kurulumu
- [ ] `@heroui/react` veya bireysel paketleri kur:
  ```bash
  npm install @heroui/react framer-motion
  ```
  Ya da bireysel (tree-shaking için daha iyi):
  ```bash
  npm install @heroui/button @heroui/card @heroui/input @heroui/modal \
    @heroui/table @heroui/chip @heroui/badge @heroui/select \
    @heroui/tabs @heroui/switch @heroui/skeleton @heroui/spinner \
    @heroui/progress @heroui/autocomplete @heroui/checkbox \
    @heroui/listbox @heroui/pagination @heroui/tooltip \
    @heroui/scroll-shadow @heroui/avatar @heroui/image
  ```

### 0.2 — HeroUI Provider
- [ ] `app/dashboard/layout.tsx`'e `HeroUIProvider` ekle:
  ```tsx
  import { HeroUIProvider } from "@heroui/react";
  // <HeroUIProvider> ile sar
  ```

### 0.3 — Tailwind Config HeroUI Entegrasyonu
- [ ] `tailwind.config.js`'e HeroUI plugin ekle:
  ```js
  const { heroui } = require("@heroui/react");
  plugins: [heroui()]
  ```

### 0.4 — Dark Theme Konfigürasyonu
- [ ] Mevcut CSS token'larını HeroUI tema sistemiyle eşleştir
- [ ] Default theme: `dark`
- [ ] `--accent: #E5E7EB` → HeroUI `primary` rengi olarak kaydet

### 0.5 — Eksik CSS Token Düzeltmesi
- [ ] `globals.css`'e `--accent-10: rgba(229, 231, 235, 0.1)` ekle
- [ ] `FeaturedAnnouncements.tsx` light theme sorununu kayıt altına al (Faz 5'te çözülecek)

---

## Faz 1 — Primitives Katmanı (Temel Bileşenler)

> **Öncelik: Yüksek** — Tüm view'lar bu primitives'leri kullandığından önce bunlar değişmeli.
> Her primitive değişince tüm dashboard'da etkisi otomatik yayılır.

### 1.1 — DashboardButton → HeroUI Button
- [ ] `primitives/DashboardButton.tsx` güncelle
- Hedef: `dash-btn` / `dash-btn-primary` / `dash-btn-danger` class'larını HeroUI `Button` ile değiştir
- HeroUI eşleşmeleri:
  - `variant="default"` → `<Button variant="flat">`
  - `variant="primary"` → `<Button color="primary">` (veya `<Button variant="solid">`)
  - `variant="danger"` → `<Button color="danger" variant="flat">`
  - `variant="ghost"` → `<Button variant="ghost">`
  - `isLoading` prop → HeroUI `Button` built-in `isLoading`
- [ ] `primitives/index.ts`'de export güncelle

### 1.2 — DashboardInput/Select/Textarea → HeroUI Input/Select/Textarea
- [ ] `primitives/DashboardInput.tsx` güncelle
- `<input>` → `<Input>` (label prop ile, `dash-label` + `dash-input` eliminasyon)
- `<select>` → `<Select>` + `<SelectItem>`
- `<textarea>` → `<Textarea>`
- `dash-input`, `dash-label` sınıflarına gerek kalmayacak

### 1.3 — DashboardBadge → HeroUI Chip
- [ ] `primitives/DashboardBadge.tsx` güncelle
- `dash-badge-success` → `<Chip color="success" variant="flat">`
- `dash-badge-warning` → `<Chip color="warning" variant="flat">`
- `dash-badge-error` → `<Chip color="danger" variant="flat">`
- `dash-badge-info` → `<Chip color="primary" variant="flat">`
- `dash-badge-neutral` → `<Chip color="default" variant="flat">`

### 1.4 — DashboardModal → HeroUI Modal
- [ ] `primitives/DashboardModal.tsx` güncelle
- `dash-modal-overlay` + `dash-modal` → `<Modal>`, `<ModalContent>`, `<ModalHeader>`, `<ModalBody>`, `<ModalFooter>`
- `zIndex: 1200` inline → HeroUI Modal kendi z-index yönetimi
- `background: "#0a0a0c"` hardcode → CSS token

### 1.5 — DashboardTable → HeroUI Table
- [ ] `primitives/DashboardTable.tsx` güncelle
- `<table>` + `dash-th` + `dash-td` + `admin-responsive-table` → HeroUI `<Table>`, `<TableHeader>`, `<TableColumn>`, `<TableBody>`, `<TableRow>`, `<TableCell>`
- Responsive davranış HeroUI Table built-in

### 1.6 — DashboardCard → HeroUI Card
- [ ] `primitives/DashboardCard.tsx` güncelle
- `glass-card` → `<Card>` (dark theme ile glass efekt)
- `glass-section` → `<Card>` + `<CardBody>` ile `padding` prop

### 1.7 — Diğer Primitives
- [ ] `DashboardSectionHeader.tsx` → HeroUI tipografi bileşenleri
- [ ] `DashboardEmptyState.tsx` → `<Card>` ile centered content
- [ ] `DashboardConfirmDialog.tsx` → `<Modal>` + confirm/cancel `<Button>`
- [ ] `DashboardFormField.tsx` → HeroUI Input ile label entegrasyonu

---

## Faz 2 — Shell ve Ana Layout

> **Öncelik: Orta** — Kullanıcı görmeden arka plan değişiklikleri.

### 2.1 — DashboardShell.tsx CSS Variables Temizliği
- [ ] `style={{ "--shell-background": ..., "--shell-color": ... }}` → CSS token'lar sabit dark olduğundan static CSS'e taşı
- [ ] `style={{ width: ${railWidth}px }}` → Tailwind `w-[216px]`
- [ ] `style={{ marginLeft: ${railWidth}px }}` → Tailwind `ml-[216px]`
- [ ] `style={{ position: "relative" }}` → Tailwind `relative`
- [ ] Hardcoded renkleri CSS token'larla değiştir (`#0a0a0a` → `var(--background)`)

### 2.2 — DashboardShell.module.css → Tailwind Geçişi
- [ ] CSS Module sınıflarını Tailwind utility'lerine dönüştür
- [ ] `.rail` sınıfı → Tailwind `flex flex-col` vb.
- [ ] `.toolbar` → Tailwind
- [ ] Global override'ları (`:global(.dashboard-view ...)`) kaldır
- [ ] `DashboardShell.module.css` sonunda silinecek

### 2.3 — app/dashboard/page.tsx Pending/Rejected States
- [ ] Pending gate block → HeroUI `<Card>` + `<Button>` (16 inline style sil)
- [ ] Rejected gate block → HeroUI `<Card>` (10 inline style sil)
- [ ] `"dashboard-view"` class → HeroUI layout

---

## Faz 3 — Admin Views (Yüksek Öncelik)

> **Öncelik: Yüksek** — En fazla inline style ve `<style jsx>` bu grupta.

### 3.1 — SubmissionsView.js
- [ ] 250+ satır `<style jsx global>` bloğunu sil
- [ ] Filter tabs → `<Tabs>` + `<Tab>`
- [ ] Search input → `<Input startContent={<Search />}>`
- [ ] Custom CSS grid table → HeroUI `<Table>` + `<TableColumn sortable>`
- [ ] Status badge (`renderStatusBadge`) → `<Chip color>` (fonksiyonu tamamen sil)
- [ ] Genre pill → `<Chip variant="flat" size="sm">`
- [ ] REVIEW/DEL buttons → `<Button size="sm">`
- [ ] Empty state → `<Card>` centered
- [ ] `getStatusColor()` fonksiyonu → HeroUI `color` prop ile değiştir

### 3.2 — UsersView.js
- [ ] Hand-rolled modal overlay → `<Modal>`
- [ ] 2-column form grid → HeroUI `<Input>` (label built-in)
- [ ] Permission checkboxes → `<CheckboxGroup>` + `<Checkbox>`
- [ ] Status badge → `<Chip color="success|warning|danger">`
- [ ] Role badge → `<Chip size="sm">`
- [ ] Table → HeroUI `<Table>`
- [ ] `<style jsx>` responsive block sil
- [ ] Verified email icon → `<Tooltip>` + icon
- [ ] Delete/Edit/Approve → `<Button color="danger|default|success" variant="flat">`

### 3.3 — PaymentsView.js
- [ ] Decision modal → `<Modal>`
- [ ] Amount input → `<Input startContent={<span>$</span>}>`
- [ ] `<select>` method/status → `<Select>` + `<SelectItem>` (`option style={{color:'#000'}}` hack sil)
- [ ] Status chip → `<Chip color="success|warning|danger">`
- [ ] Method chip → `<Chip variant="flat">`
- [ ] Table → HeroUI `<Table>`
- [ ] `onMouseEnter/onMouseLeave` style mutation → `<Button>` hover built-in
- [ ] Admin note textarea → `<Textarea>`
- [ ] `<style jsx>` block sil

### 3.4 — EarningsView.js
- [ ] Stat cards → `<Card>` + `<CardBody>`
- [ ] Loading skeleton → `<Skeleton>`
- [ ] Progress bars → `<Progress>`
- [ ] Source/artist pay chips → `<Chip>`
- [ ] Search input → `<Input startContent>`
- [ ] Form inputs/selects → `<Input>`, `<Select>`
- [ ] Table → HeroUI `<Table>`
- [ ] EDIT/DEL buttons → `<Button size="sm" color>`
- [ ] `<style jsx>` `.earn-form-grid` sil

### 3.5 — RequestsView.js
- [ ] Comment scroll → `<ScrollShadow>` wrapper
- [ ] Send form → `<Input endContent={<Button>SEND</Button>}>`
- [ ] Status badge → `<Chip color>`
- [ ] 5 status action buttons → `<Button color>` group
- [ ] Admin note textarea → `<Textarea>`
- [ ] Master table → HeroUI `<Table>`
- [ ] Detail panel → `<Card>`
- [ ] Back button → `<Button variant="light">` + arrow icon
- [ ] Image thumbnails → `<Image>` from HeroUI

### 3.6 — HomeView.js
- [ ] Recharts `<XAxis/YAxis>` tick renkleri → CSS token
- [ ] Custom `Card` wrapper component → HeroUI `<Card>`
- [ ] `PillToggle` → `<ButtonGroup>` + `<Button variant="flat">`
- [ ] Loading skeleton → `<Skeleton>`
- [ ] KPI stat cards → `<Card>` + `<CardBody>`
- [ ] Spinning loader div → `<Spinner>`
- [ ] Local `T` theme object → CSS token'lar (hardcoded `#22C55E` vb. kaldır)
- [ ] `ChartTooltip` hardcoded renkleri → CSS token

---

## Faz 4 — Admin Views (Orta Öncelik)

### 4.1 — ArtistPicker.tsx → Autocomplete
- [ ] 135 satır custom dropdown → `<Autocomplete>` + `<AutocompleteItem>`
- [ ] Keyboard navigation, search, clear otomatik gelir
- [ ] En yüksek ROI değişimi (135 satır → ~15 satır)

### 4.2 — ContractTable.tsx
- [ ] Custom CSS grid table → HeroUI `<Table>`
- [ ] `<style jsx>` responsive block sil
- [ ] Status badge → `<Chip color="success|default">`
- [ ] EDIT/DEL → `<Button size="sm" color>`
- [ ] PDF link → `<Button as="a" size="sm">`
- [ ] Split tags → `<Chip size="sm" variant="flat">`
- [ ] `var(--accent-10)` missing token bug'ını düzelt

### 4.3 — ContractForm.tsx
- [ ] Form `<input>/<select>/<textarea>` → HeroUI `<Input>`, `<Select>`, `<Textarea>`
- [ ] Status chips → `<Chip color>`
- [ ] Section cards → `<Card>` + `<CardBody>`
- [ ] Submit/Cancel → `<Button color="primary">` / `<Button variant="bordered">`
- [ ] `<style jsx>` form grid sil
- [ ] `ArtistPicker` otomatik faydalanır (4.1 tamamlandıktan sonra)

### 4.4 — ArtistsView.js
- [ ] `UserLinker` search dropdown → `<Autocomplete>`
- [ ] Artist image → `<Avatar>` HeroUI (fallback built-in)
- [ ] Progress bar → `<Progress>`
- [ ] Section cards → `<Card>`
- [ ] UNLINK/Sync buttons → `<Button color="danger|default" variant="flat">`
- [ ] Release thumbnails → `<Image>` HeroUI
- [ ] List table → HeroUI `<Table>`
- [ ] `onMouseEnter/onMouseLeave` hover hack'leri sil

### 4.5 — AnnouncementsView.tsx
- [ ] NEW ANNOUNCEMENT → `<Button startContent={<Plus />}>`
- [ ] Form inputs → `<Input>`, `<Textarea>`
- [ ] Active toggle button → `<Switch>`
- [ ] Type chip on list items → `<Chip variant="flat" size="sm">`
- [ ] Power/Edit/Delete icon buttons → `<Button isIconOnly variant="light">`
- [ ] List items → `<Card>`
- [ ] Empty state → `<Card>` centered

### 4.6 — ReleasesView.js
- [ ] Tab bar → `<Tabs>` + `<Tab>`
- [ ] Search → `<Input startContent>`
- [ ] Release cards → `<Card isPressable>`
- [ ] Status badge → `<Chip>`
- [ ] Modal → `<Modal>`
- [ ] Form inputs → `<Input>`, `<DatePicker>`
- [ ] Overlay action buttons → `<Button isIconOnly color="danger">`

### 4.7 — SettingsView.js
- [ ] 7 tab buttons → `<Tabs>` + `<Tab>` (büyük simplification)
- [ ] Toggle rows → `<Switch>` (custom track+knob HTML tamamen sil)
- [ ] Genre chips with remove → `<Chip onClose>`
- [ ] Genre input → `<Input onKeyDown>`
- [ ] System stat cards → `<Card>`
- [ ] All inputs → `<Input>`
- [ ] Select → `<Select>` + `<SelectItem>`
- [ ] Save → `<Button color="primary">`

### 4.8 — WebhooksView.js
- [ ] Modal → `<Modal>`
- [ ] Event chips → `<CheckboxGroup>` + `<Chip>`
- [ ] Table → HeroUI `<Table>`
- [ ] Status toggle → `<Switch>` (neon `#00ff88` kaldır)
- [ ] Delete/Edit buttons → `<Button color>`

### 4.9 — DiscordBridgeView.js
- [ ] `StatCard` → `<Card>` + `<CardBody>`
- [ ] `Toggle` checkbox → `<Switch>`
- [ ] Inputs → `<Input>`
- [ ] Select → `<Select>`
- [ ] Table → HeroUI `<Table>`
- [ ] Buttons → `<Button>`

### 4.10 — CommunicationsView.js
- [ ] Subject `<Input>`, message `<Textarea>` (label built-in, div'leri sil)
- [ ] Send button → `<Button isLoading>` (sending ternary sil)
- [ ] ALL/SELECTIVE → `<ButtonGroup>` + 2x `<Button>`
- [ ] Artist search → `<Input startContent={<Search />}>`
- [ ] SELECT ALL/DESELECT ALL → `<Button>` pair
- [ ] Artist rows → `<Listbox>` + `<ListboxItem>` (selected state, checkmark, hover built-in)
- [ ] Artist list scroll → `<ScrollShadow>`
- [ ] Panels → `<Card>` + `<CardHeader>` + `<CardBody>`
- [ ] `<style jsx>` responsive block sil

### 4.11 — ContentView.js
- [ ] Content type cards → `<Card>`
- [ ] FAQ inputs → `<Input>` + `<Textarea>`
- [ ] Remove → `<Button color="danger" size="sm">`
- [ ] Commission rows → `<Input>` inline
- [ ] Save/Discard → `<Button color="primary">` / `<Button variant="ghost">`
- [ ] `rgba(255,102,0,0.05)` hardcoded orange → theme token ile değiştir

---

## Faz 5 — Artist Portal Views

### 5.1 — ArtistProfileView.tsx
- [ ] Form alanları → `<Input>` (label, readOnly, type built-in)
- [ ] Address → `<Textarea>`
- [ ] Notification toggles → `<Switch>` (custom knob/track HTML sil)
- [ ] Save/Update buttons → `<Button color="primary">` / `<Button variant="bordered">`
- [ ] Conditional `cursor: "not-allowed"` → HeroUI `isDisabled` prop

### 5.2 — ArtistEarningsView.tsx
- [ ] Stat cards → `<Card>` + `<CardBody>`
- [ ] Tables (2 adet) → HeroUI `<Table>` (module-level `tableHeadStyle`/`tableCellStyle` sil)
- [ ] Status badges → `<Chip color>`
- [ ] Pagination → `<Pagination>` component
- [ ] Progress bars → `<Progress>`
- [ ] Local `earningsTone` token objesi → CSS token'lar

### 5.3 — ArtistContractsView.tsx
- [ ] Contract cards → `<Card>` + `<CardBody>` + `<CardFooter>`
- [ ] Status badge → `<Chip color="success|default">`
- [ ] "Collaborator" badge → `<Chip size="sm" color="success" variant="flat">`
- [ ] "View Agreement" → `<Button as="a" color="primary">`
- [ ] `rgba(57,255,20,...)` eski neon accent → CSS token ile düzelt

### 5.4 — FeaturedAnnouncements.tsx
- [ ] **Light theme bug'ını düzelt** — `rgba(255,255,255,0.95)` bg dark tema ile uyumlu hale getir
- [ ] Entire banner → `<Alert>` HeroUI component
- [ ] "Learn more" → `<Button size="sm" as="a" variant="bordered">`
- [ ] `onMouseOver/onMouseOut` style mutation → HeroUI hover built-in

### 5.5 — ArtistOverviewView.tsx
- [ ] KPI cards → `<Card>` + `<CardBody>`
- [ ] `ArtistQuickAccessBar` nav buttons → `<ButtonGroup>` + `<Button>`
- [ ] Recharts axis colors → CSS token
- [ ] `<style jsx>` responsive block sil
- [ ] `ChartTooltip` inline styles → token veya CSS

### 5.6 — ArtistCatalogViews.js
- [ ] Request modal → `<Modal>`
- [ ] Request type `<select>` → `<Select>` + `<SelectItem>`
- [ ] `ReleaseCard` → `<Card isPressable>` (hover style mutation kaldır)
- [ ] Status bar strip → `<Chip color>`
- [ ] Play/Pause → `<Button isIconOnly size="sm">`

### 5.7 — ArtistSupportViews.js
- [ ] Support list items → `<Listbox>` + `<ListboxItem>`
- [ ] Status badge → `<Chip color>`
- [ ] Message input+send → `<Input>` + `<Button>`
- [ ] CreateSupportForm select → `<Select>` + `<SelectItem>`
- [ ] `<style jsx>` hover block sil

---

## Faz 6 — Modal ve Loader Bileşenleri

### 6.1 — ContractSigningModal.js
- [ ] Local duplicate `glassStyle`/`inputStyle` objelerini sil (shared lib zaten var)
- [ ] Tüm yapı → `<Modal>` multi-step state ile
- [ ] Inputs → `<Input>`
- [ ] Textarea → `<Textarea>`
- [ ] Checkbox → `<Checkbox>`
- [ ] Buttons → `<Button color="primary">` / `<Button variant="bordered">`

### 6.2 — DashboardLoader.js
- [ ] `SkeletonCard` → HeroUI `<Skeleton>` (shimmer animation built-in)
- [ ] `SkeletonRow` → `<Skeleton>` satırları
- [ ] Progress bar shimmer → `<Spinner>`
- [ ] Logo render logic ayır (branding component)
- [ ] 377 satırı ~100 satıra indir

### 6.3 — AdminView.tsx ve ArtistView.tsx
- [ ] Spotify sync form modal → `<Modal>` + `<Input>` + `<Button>`
- [ ] Access-denied/placeholder blocks → `<Card>` centered
- [ ] Withdrawal modal form → `<Input>`, `<Select>`, `<Textarea>`, `<Button>`
- [ ] Header card → `<Card>`

---

## Faz 7 — Temizlik ve Debt Çözümü

> **Öncelik: Son** — Tüm fazlar tamamlandıktan sonra.

### 7.1 — theme.ts ve styles.js
- [ ] `app/components/dashboard/admin/styles.js` dosyasını sil
- [ ] `lib/theme.ts`'deki @deprecated style object'leri kaldır:
  - `glassStyle`, `glassCardStyle`, `statCardStyle`, `glassSectionStyle`
  - `thStyle`, `tdStyle`, `btnStyle`, `btnPrimaryStyle`
  - `inputStyle`, `modalOverlayStyle`, `modalStyle`, `tableContainerStyle`
- [ ] `DASHBOARD_COLORS` sabit → sadece Recharts için gereken renkleri bırak

### 7.2 — globals.css Temizliği
- [ ] Artık kullanılmayan custom class'ları kaldır:
  - `glass-card`, `glass-section` (HeroUI Card'a geçince)
  - `dash-btn`, `dash-btn-primary`, `dash-btn-danger` (HeroUI Button'a geçince)
  - `dash-input`, `dash-label` (HeroUI Input'a geçince)
  - `dash-th`, `dash-td` (HeroUI Table'a geçince)
  - `dash-badge-*` (HeroUI Chip'e geçince)
  - `dash-modal-overlay`, `dash-modal` (HeroUI Modal'e geçince)
  - `admin-responsive-table` (HeroUI Table built-in responsive)

### 7.3 — DashboardShell.module.css
- [ ] Tüm sınıflar Tailwind'e taşındıktan sonra dosyayı sil

### 7.4 — Bug Düzeltmeleri
- [ ] `var(--accent-10)` token'ını globals.css'e ekle (Faz 0.5'te yapılmıştı, verify et)
- [ ] Tüm `rgba(57,255,20,...)` eski neon green → `var(--accent)` ile değiştir
- [ ] `FeaturedAnnouncements.tsx` light theme tutarlılığı (Faz 5.4'te çözüldü, verify et)
- [ ] `ContentView.js`'deki `rgba(255,102,0,0.05)` orange mismatch → theme token

### 7.5 — Son Kontrol
- [ ] Tüm `style={{}}` inline object'leri için proje geneli grep: sıfır olmalı
- [ ] Tüm `<style jsx>` block'ları için grep: sıfır olmalı
- [ ] `onMouseEnter/onMouseLeave` style mutation için grep: sıfır olmalı
- [ ] `#ff4444`, `#00ff88`, `#fff000` gibi hard-coded renk grep: sıfır olmalı

---

## HeroUI Bileşen → Dashboard Kullanım Haritası

| HeroUI Bileşen | Dashboard Kullanım Yerleri |
|---|---|
| `Button` | Her view (50+ yer) |
| `Input` | Her view form alanı (40+ yer) |
| `Select` + `SelectItem` | UsersView, PaymentsView, ContractForm, SettingsView, ArtistCatalog... |
| `Textarea` | RequestsView, ContractForm, ArtistProfile, ContractSigning... |
| `Card` + `CardBody` | Her view (30+ yer) |
| `Chip` | Her status badge (25+ yer — renderStatusBadge fonksiyonları sil) |
| `Modal` + `ModalContent` | UsersView, PaymentsView, ReleasesView, ContractSigning, AdminView... (7 modal) |
| `Table` + alt bileşenler | SubmissionsView, UsersView, PaymentsView, EarningsView, ContractTable... (10+ table) |
| `Tabs` + `Tab` | SubmissionsView, ReleasesView, SettingsView, AdminView nav |
| `Switch` | ArtistProfile (5 toggle), SettingsView (6 toggle), DiscordBridge... |
| `Skeleton` | DashboardLoader (tüm skeleton UI) |
| `Spinner` | DashboardLoader inline mode, button loading states |
| `Progress` | ArtistsView, EarningsView, ArtistEarnings, ArtistOverview |
| `Autocomplete` | ArtistPicker → Autocomplete (135 satır → 15 satır) |
| `Checkbox` + `CheckboxGroup` | UsersView permissions, WebhooksView events |
| `Listbox` + `ListboxItem` | CommunicationsView artist list, ArtistSupportViews |
| `Pagination` | ArtistEarningsView |
| `Avatar` | ArtistsView artist images |
| `Image` | ArtistsView releases, RequestsView thumbnails |
| `ScrollShadow` | RequestsView comments, CommunicationsView artist list |
| `Tooltip` | UsersView email verified, FeaturedAnnouncements |
| `Alert` | FeaturedAnnouncements banner |

---

## İlerleme Özeti

```
Faz 0 (Kurulum)      [ ] [ ] [ ] [ ] [ ]          0/5
Faz 1 (Primitives)   [ ] [ ] [ ] [ ] [ ] [ ] [ ]  0/7
Faz 2 (Shell)        [ ] [ ] [ ]                   0/3
Faz 3 (Admin - High) [ ] [ ] [ ] [ ] [ ] [ ]       0/6
Faz 4 (Admin - Mid)  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]  0/11
Faz 5 (Artist)       [ ] [ ] [ ] [ ] [ ] [ ] [ ]   0/7
Faz 6 (Modal/Loader) [ ] [ ] [ ]                   0/3
Faz 7 (Temizlik)     [ ] [ ] [ ] [ ] [ ]           0/5
─────────────────────────────────────────────────
TOPLAM                                              0/47 grup
```

---

## Öneri: Başlangıç Sırası

1. **Faz 0** → HeroUI kur (blocker)
2. **Faz 1** → Primitives değiştir (cascade etkisi en yüksek)
3. **Faz 3.1** → SubmissionsView (en fazla `<style jsx>`, en görünür iyileştirme)
4. **Faz 4.1** → ArtistPicker (135 satır → 15 satır, en yüksek ROI)
5. **Faz 3.2** → UsersView (hand-rolled modal kaldır)
6. Sonrasını iteratif ilerlet

---

*Son güncelleme: 2026-03-25 | Worktree: claude/upbeat-tereshkova*
