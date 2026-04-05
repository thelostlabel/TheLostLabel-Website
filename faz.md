# Faz Raporu — Performans Optimizasyonu & Dashboard Temizligi

Tarih: Nisan 2026

---

## 1. Mobil Performans Optimizasyonu

### Problem
Anasayfa mobilde ciddi frame drop ve kasma yasiyordu. Sorunun kaynaklari:
- SVG `feTurbulence` filtreleri (scroll-atmosphere)
- Canvas `requestAnimationFrame` particle loop (floating-particles)
- `backdrop-blur` ve `filter: blur()` CSS animasyonlari
- Film grain overlay katmanlari (her section'da tekrar)
- 3D `perspective` + `rotateX` transformlari
- Fazla DOM node sayisi (artist card duplication)

### Cozum

#### `lib/is-mobile.ts` (YENI)
SSR-safe mobil tespit utility'si. Tum homepage componentlerinde ortak kullanilir.
```ts
export const IS_MOBILE =
  typeof window !== "undefined" &&
  (window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
```

#### `components/ui/scroll-atmosphere.tsx`
- Mobilde tamamen devre disi (SVG feTurbulence + scroll-driven opacity cok agir)
- Component ikiye ayrildi: `ScrollAtmosphere` (wrapper, mobile check) + `ScrollAtmosphereInner` (hooks + render)
- Neden ikiye ayrildi: React hooks kurali — hooks kosullu cagrilamaz

#### `components/ui/floating-particles.tsx`
- Canvas rAF loop `useEffect` icinde `if (IS_MOBILE) return;` ile durduruldu
- JSX return oncesinde `if (IS_MOBILE) return null;`
- Hooks hep cagrilir (kural ihlali yok), sadece efekt calismaz

#### `components/ui/cinematic-landing-hero.tsx`
- Mobil: film-grain div, bg-grid-theme div, perspective, willChange kaldirildi
- Mobil scroll animasyonu: blur/scale yerine sadece opacity fade
- Mobil intro animasyonu: blur/rotationX yok, kisa sure
- Desktop pin: 1400 → 900

#### `components/ui/lost-releases-section.tsx`
- Mobil: `backdrop-blur-xl` overlay'den kaldirildi
- Mobil: play button `backdropFilter: "blur(20px)"` kaldirildi
- Mobil: heading blur animasyonu kaldirildi
- Pin: `count * 1400 + 900` → desktop `count * 900 + 500`, mobil `count * 600 + 300`

#### `components/ui/stats-process-section.tsx`
- Mobil: glow elementi (`blur(40px)`) gizlendi
- Mobil: `rotateX` 3D transformlar ve `perspective` kaldirildi
- Mobil: stat number'lardaki `drop-shadow` kaldirildi
- Pin: 5000 → desktop 3000, mobil 1800

#### `components/ui/artist-showcase-section.tsx`
- Mobil: film grain hem section hem individual card'lardan kaldirildi
- Mobil: artist card duplicate sayisi 3x → 2x (90 → 60 DOM node)
- Pin: 2800 → desktop 1800, mobil 1200

#### `components/ui/cta-section.tsx`
- Mobil: tum blur animasyonlari → basit opacity/translate
- Mobil: `backdrop-filter: blur(12px)` sadece `@media (min-width: 768px)` icinde
- Pin: 3000 → desktop 1800, mobil 1200

---

## 2. Desktop Scroll Mesafesi

### Problem
ScrollTrigger pin sureleri cok uzundu, kullanici asiri scroll yapiyordu.

### Cozum
Tum 5 section'da pin degerleri ~%40 azaltildi. Her biri icin ayri desktop/mobil deger:

| Section | Eski | Yeni Desktop | Yeni Mobil |
|---------|------|-------------|------------|
| cinematic-hero | 1400 | 900 | — |
| lost-releases | count*1400+900 | count*900+500 | count*600+300 |
| stats-process | 5000 | 3000 | 1800 |
| artist-showcase | 2800 | 1800 | 1200 |
| cta-section | 3000 | 1800 | 1200 |

---

## 3. Yuklenme Ekrani Scroll Kilidi

### Problem
`page-reveal.tsx` — "The Lost Company" loading animasyonu sirasinda mobilde scroll yapilabiliyordu ve bu sayfa icindeki elemanlari bozuyordu.

### Cozum
- Body'ye `position: fixed`, `top: -scrollY`, `overflow: hidden` uygulandi
- HTML + body'ye `overflow: hidden`
- Overlay div'e `touch-none overscroll-none` classlari
- Animasyon tamamlandiginda scroll pozisyonu restore ediliyor

---

## 4. Dashboard Admin Kod Temizligi

### 4.1 useDebouncedSearch Hook (YENI)

**Dosya:** `app/components/dashboard/hooks/useDebouncedSearch.ts`

9 admin view'da tekrar eden pattern:
```ts
const [searchTerm, setSearchTerm] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
  return () => clearTimeout(timer);
}, [searchTerm]);
```

Tek hook'a tasindi:
```ts
export function useDebouncedSearch(delay = 300) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  return [searchTerm, setSearchTerm, debouncedSearch] as const;
}
```

**Uygulanan view'lar:** SubmissionsView, ReleasesView, PaymentsView, EarningsView, UsersView, ArtistsView, RequestsView, WisePayoutsView (+ 1 daha)

### 4.2 SearchField v3 Standardizasyonu

Manuel search input pattern'i:
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2" />
  <Input className="pl-9" placeholder="Search..." />
</div>
```

HeroUI v3 compound component'e donusturuldu:
```tsx
<SearchField aria-label="..." value={...} onChange={...}>
  <SearchField.Group>
    <SearchField.SearchIcon />
    <SearchField.Input placeholder="..." />
    <SearchField.ClearButton />
  </SearchField.Group>
</SearchField>
```

**Uygulanan view'lar:** SubmissionsView, EarningsView, PaymentsView, WisePayoutsView, CommunicationsView, AuditLogsView

### 4.3 AnalyticsView Duzeltmeleri

- 6 adet inline `style={{ display: 'grid', gridTemplateColumns: '...' }}` → Tailwind grid classlari
- `style={{ padding: '0 0 48px 0' }}` → `className="pb-12"`

### 4.4 AuditLogsView Duzeltmeleri

- Raw `<input>` → HeroUI `SearchField`
- `<select>` CSS variable'lari (`var(--ds-item-border)`) → Tailwind classlari (`border-border bg-surface`)
- Empty state: `py-20` → `py-16`, CSS variable → Tailwind
- Header: `text-[16px]` → `text-sm tracking-widest`

### 4.5 Silinen Olu Dosyalar

| Dosya | Sebep | Satir |
|-------|-------|-------|
| `admin/ArtistsView.js` | Eski JS kopyasi, .tsx kullaniliyor | 1061 |
| `admin/HomeView.js` | Eski JS kopyasi, .tsx kullaniliyor | 726 |
| `admin/codex-test.txt` | Test artifakti ("hi") | 1 |
| `admin/styles.ts` | Deprecated, hicbir import yok | — |

---

## 5. Kod Butunlugu Duzeltmeleri

### React Hooks Kurali Ihlalleri

**FloatingParticles:** `if (IS_MOBILE) return null;` satirini `useRef` cagrilarindan once koymusdum → hooks kuralini ihlal ediyordu. Cozum: hooks hep cagrilir, `useEffect` icinde `if (IS_MOBILE) return;`, JSX oncesinde `if (IS_MOBILE) return null;`.

**ScrollAtmosphere:** Ayni sorun. Cozum: component ikiye bolundu — `ScrollAtmosphere` (mobile check wrapper) ve `ScrollAtmosphereInner` (tum hooks + render).

### Kullanilmayan Import Temizligi

- `scroll-atmosphere.tsx`: `useState` import'u refactoring sonrasi gereksiz kalmisti, silindi.
