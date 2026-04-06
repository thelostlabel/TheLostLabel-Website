export type SiteContentKey =
  | "faq"
  | "join_genres"
  | "join_commissions"
  | "terms"
  | "privacy"
  | "commission_rules"
  | "home_services"
  | "home_stats"
  | "home_partners"
  | "footer_links";

export type SiteContentRecord = {
  key: SiteContentKey;
  title: string;
  content: string;
  updatedAt: string | null;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type CommissionRow = {
  released: string;
  listeners: string;
  commission: string;
};

export type HomeServiceItem = {
  iconKey: string;
  title: string;
  body: string;
  badge: string;
};

export type HomeStatItem = {
  label: string;
  value: string;
  dynamicKey?: string;
};

export type FooterLinkGroup = {
  explore: Array<{ name: string; href: string }>;
  legal: Array<{ name: string; href: string }>;
};

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    q: "How do I submit a demo?",
    a: "Register as an artist, access your portal, and use the 'NEW SUBMISSION' button. You can upload multiple files directly.",
  },
  {
    q: "How can I track my distribution?",
    a: "Once signed, our A&R team will provide updates through the portal. You can use the support system to manage revisions or metadata updates.",
  },
  {
    q: "How do royalties and payments work?",
    a: "Royalties from Spotify, Apple Music, and other DSPs are calculated monthly. You can view your detailed revenue breakdown in the 'EARNINGS' tab and request withdrawals once the threshold is met.",
  },
  {
    q: "What about legal contracts?",
    a: "All signing contracts are generated digitally. You can view, download, and track the status of your contracts in the 'CONTRACTS' section of your dashboard.",
  },
  {
    q: "Do you offer Spotify sync?",
    a: "Yes. The system syncs with your Spotify Artist profile to fetch release data and update your portal metrics.",
  },
];

export const DEFAULT_JOIN_GENRES = [
  "House (Deep House / Slap House / G-House)",
  "Pop",
  "Phonk",
  "Hardstyle",
  "HyperTechno",
  "Gaming Music (Midtempo, D&B, Trap, Future Bass)",
  "Reggaeton",
  "Other",
];

export const DEFAULT_JOIN_COMMISSION_ROWS: CommissionRow[] = [
  { released: "Yes", listeners: "0 - 250K", commission: "$25 or 1% royalties" },
  { released: "Yes", listeners: "250K - 750K", commission: "$50 or 2.5% royalties" },
  { released: "Yes", listeners: "750K+", commission: "$75 or 5% royalties" },
  { released: "No", listeners: "0 - 250K", commission: "$25 or 5% royalties" },
  { released: "No", listeners: "250K - 500K", commission: "$50 or 5% royalties" },
  { released: "No", listeners: "500K - 1M", commission: "$75 or 5% royalties" },
  { released: "No", listeners: "1M+", commission: "$100 or 7.5% royalties" },
];

export const DEFAULT_HOME_SERVICE_ITEMS: HomeServiceItem[] = [
  {
    iconKey: "rocket",
    title: "Velocity Distribution",
    body: "Direct pipes to Spotify, Apple, and TikTok. Assets delivered in under 72h with automated quality checks.",
    badge: "SPEED",
  },
  {
    iconKey: "shield-check",
    title: "Ledger-Grade Splits",
    body: "Structured royalty workflows for collaborators, statements, and payout tracking without spreadsheet drift.",
    badge: "FINANCE",
  },
  {
    iconKey: "zap",
    title: "Kinetic Marketing",
    body: "Campaign tooling and release operations that help convert traffic spikes into long-tail audience growth.",
    badge: "GROWTH",
  },
];

export const DEFAULT_HOME_STATS: HomeStatItem[] = [
  { label: "Active Artists", value: "100+", dynamicKey: "artistCount" },
  { label: "Total Streams", value: "1 Billion" },
  { label: "Payouts Processed", value: "2 Million" },
];

export const DEFAULT_HOME_PARTNERS = [
  "Spotify",
  "Apple Music",
  "TikTok",
  "YouTube",
  "Instagram",
  "Amazon Music",
  "Deezer",
  "Tidal",
  "SoundCloud",
  "Audiomack",
];

export const DEFAULT_FOOTER_LINKS: FooterLinkGroup = {
  explore: [
    { name: "Home", href: "/" },
    { name: "Artists", href: "/artists" },
    { name: "FAQ", href: "/faq" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const _SITE_NAME = process.env.NEXT_PUBLIC_SITE_FULL_NAME || "THE LOST LABEL";
const _DOT_NAME = `${process.env.NEXT_PUBLIC_SITE_NAME || "LOST"}.`;

export const DEFAULT_TERMS_CONTENT = `1. ARTIST ELIGIBILITY
By registering with ${_SITE_NAME}, you affirm that you are at least 18 years of age (or have legal guardian consent) and possess the full authority to enter into a distribution agreement for the musical works you submit.

2. DEMO SUBMISSIONS & CONTENT STANDARDS
Submitting a demo does not guarantee a release. You represent that all submissions are 100% original works. Use of uncleared samples, stolen tracks, or fraudulent content will result in immediate account termination and potential legal action.

3. GLOBAL DISTRIBUTION RIGHTS
Upon formal acceptance and contract execution, you grant ${_SITE_NAME} the exclusive, sub-licensable right to distribute, promote, and monetize your content across global Digital Service Providers, including Spotify, Apple Music, and Amazon.

4. ROYALTIES & PAYMENTS
Royalties are calculated based on net revenue received from DSPs. Payouts are made according to your active payout policy and threshold.

5. INTELLECTUAL PROPERTY
The "${_DOT_NAME}" trademark, logos, and website infrastructure remain the sole property of ${_SITE_NAME}. Artists retain ownership of their compositions unless otherwise specified in a separate written agreement.`;

export const DEFAULT_PRIVACY_CONTENT = `1. DATA COLLECTION
We collect personal identifiers, financial information for royalty processing, and musical content submitted through the portal. We also collect technical data such as IP addresses and browser cookies to improve the user experience and platform security.

2. PURPOSE OF DATA USAGE
Your data is used to manage your artist profile, evaluate demo submissions, facilitate contract execution, and process royalty payments. We may also use your contact information to provide critical system updates or A&R feedback.

3. DATA PROTECTION & DISCLOSURE
We implement professional-grade safeguards for data in transit and at rest. We do not sell your data. Disclosure only occurs to trusted third-party partners necessary to fulfill distribution, payment, or infrastructure obligations.

4. YOUR RIGHTS
You have the right to access, correct, or request deletion of your personal data at any time, subject to legal and contractual obligations.`;

export const DEFAULT_COMMISSION_RULES = `1. Only high-quality original demos are accepted.
2. No uncleared samples or copyrighted material.
3. Commissions are paid out after the signed release has been processed.
4. We reserve the right to decline any submission for quality, legal, or operational reasons.`;

export const MANAGED_SITE_CONTENT_DEFINITIONS: Array<{
  key: SiteContentKey;
  label: string;
  title: string;
}> = [
  { key: "faq", label: "FAQ / Sikca Sorulan Sorular", title: "FAQ / Sikca Sorulan Sorular" },
  { key: "join_genres", label: "Join Us: Accepted Genres", title: "Join Us: Accepted Genres" },
  { key: "join_commissions", label: "Join Us: Commission Table", title: "Join Us: Commission Table" },
  { key: "terms", label: "Terms of Service", title: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy", title: "Privacy Policy" },
  { key: "commission_rules", label: "Commission Rules", title: "Commission Rules" },
  { key: "home_services", label: "Home: Service Cards", title: "Home: Service Cards" },
  { key: "home_stats", label: "Home: Stats", title: "Home: Stats" },
  { key: "home_partners", label: "Home: Partners", title: "Home: Partners" },
  { key: "footer_links", label: "Footer Links", title: "Footer Links" },
];

export const MANAGED_SITE_CONTENT_KEYS = MANAGED_SITE_CONTENT_DEFINITIONS.map((item) => item.key);

export const SITE_CONTENT_DEFAULTS: Record<SiteContentKey, { title: string; content: string }> = {
  faq: {
    title: "FAQ / Sikca Sorulan Sorular",
    content: JSON.stringify(DEFAULT_FAQ_ITEMS),
  },
  join_genres: {
    title: "Join Us: Accepted Genres",
    content: DEFAULT_JOIN_GENRES.join("\n"),
  },
  join_commissions: {
    title: "Join Us: Commission Table",
    content: JSON.stringify(DEFAULT_JOIN_COMMISSION_ROWS),
  },
  terms: {
    title: "Terms of Service",
    content: DEFAULT_TERMS_CONTENT,
  },
  privacy: {
    title: "Privacy Policy",
    content: DEFAULT_PRIVACY_CONTENT,
  },
  commission_rules: {
    title: "Commission Rules",
    content: DEFAULT_COMMISSION_RULES,
  },
  home_services: {
    title: "Home: Service Cards",
    content: JSON.stringify(DEFAULT_HOME_SERVICE_ITEMS),
  },
  home_stats: {
    title: "Home: Stats",
    content: JSON.stringify(DEFAULT_HOME_STATS),
  },
  home_partners: {
    title: "Home: Partners",
    content: JSON.stringify(DEFAULT_HOME_PARTNERS),
  },
  footer_links: {
    title: "Footer Links",
    content: JSON.stringify(DEFAULT_FOOTER_LINKS),
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function parseJson<T>(content: string | null | undefined) {
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function normalizeLinkGroup(value: unknown, fallback: Array<{ name: string; href: string }>) {
  if (!Array.isArray(value)) {
    return clone(fallback);
  }

  const next = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const name = typeof item.name === "string" ? item.name.trim() : "";
      const href = typeof item.href === "string" ? item.href.trim() : "";

      if (!name || !href) {
        return null;
      }

      return { name, href };
    })
    .filter(Boolean) as Array<{ name: string; href: string }>;

  return next.length > 0 ? next : clone(fallback);
}

export function getDefaultSiteContentEntry(key: SiteContentKey): SiteContentRecord {
  const fallback = SITE_CONTENT_DEFAULTS[key];

  return {
    key,
    title: fallback.title,
    content: fallback.content,
    updatedAt: null,
  };
}

export function parseFaqItems(content: string | null | undefined) {
  const parsed = parseJson<FaqItem[]>(content);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return clone(DEFAULT_FAQ_ITEMS);
  }

  const next = parsed
    .map((item) => ({
      q: typeof item?.q === "string" ? item.q.trim() : "",
      a: typeof item?.a === "string" ? item.a.trim() : "",
    }))
    .filter((item) => item.q && item.a);

  return next.length > 0 ? next : clone(DEFAULT_FAQ_ITEMS);
}

export function parseJoinGenres(content: string | null | undefined) {
  const next = String(content || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return next.length > 0 ? next : clone(DEFAULT_JOIN_GENRES);
}

export function parseJoinCommissionRows(content: string | null | undefined) {
  const parsed = parseJson<CommissionRow[]>(content);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return clone(DEFAULT_JOIN_COMMISSION_ROWS);
  }

  const next = parsed
    .map((item) => ({
      released: typeof item?.released === "string" ? item.released.trim() || "No" : "No",
      listeners: typeof item?.listeners === "string" ? item.listeners.trim() : "",
      commission: typeof item?.commission === "string" ? item.commission.trim() : "",
    }))
    .filter((item) => item.listeners && item.commission);

  return next.length > 0 ? next : clone(DEFAULT_JOIN_COMMISSION_ROWS);
}

export function parseHomeServices(content: string | null | undefined) {
  const parsed = parseJson<HomeServiceItem[]>(content);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return clone(DEFAULT_HOME_SERVICE_ITEMS);
  }

  const next = parsed
    .map((item) => ({
      iconKey: typeof item?.iconKey === "string" ? item.iconKey.trim() : "",
      title: typeof item?.title === "string" ? item.title.trim() : "",
      body: typeof item?.body === "string" ? item.body.trim() : "",
      badge: typeof item?.badge === "string" ? item.badge.trim() : "",
    }))
    .filter((item) => item.iconKey && item.title && item.body && item.badge);

  return next.length > 0 ? next : clone(DEFAULT_HOME_SERVICE_ITEMS);
}

export function parseHomeStats(content: string | null | undefined) {
  const parsed = parseJson<HomeStatItem[]>(content);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return clone(DEFAULT_HOME_STATS);
  }

  const next = parsed
    .map((item) => ({
      label: typeof item?.label === "string" ? item.label.trim() : "",
      value: typeof item?.value === "string" ? item.value.trim() : "",
      dynamicKey: typeof item?.dynamicKey === "string" ? item.dynamicKey.trim() : undefined,
    }))
    .filter((item) => item.label && item.value);

  return next.length > 0 ? next : clone(DEFAULT_HOME_STATS);
}

export function parseHomePartners(content: string | null | undefined) {
  const parsed = parseJson<string[]>(content);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return clone(DEFAULT_HOME_PARTNERS);
  }

  const next = parsed
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return next.length > 0 ? next : clone(DEFAULT_HOME_PARTNERS);
}

export function parseFooterLinks(content: string | null | undefined) {
  const parsed = parseJson<FooterLinkGroup>(content);
  if (!parsed || typeof parsed !== "object") {
    return clone(DEFAULT_FOOTER_LINKS);
  }

  return {
    explore: normalizeLinkGroup(parsed.explore, DEFAULT_FOOTER_LINKS.explore),
    legal: normalizeLinkGroup(parsed.legal, DEFAULT_FOOTER_LINKS.legal),
  };
}

export function getSiteContentPreview(key: SiteContentKey, content: string | null | undefined) {
  switch (key) {
    case "faq":
      return parseFaqItems(content)
        .map((item) => `Q: ${item.q}`)
        .join("\n");
    case "join_commissions":
      return parseJoinCommissionRows(content)
        .map((item) => `${item.listeners}: ${item.commission}`)
        .join("\n");
    case "join_genres":
      return parseJoinGenres(content).join("\n");
    case "home_services":
      return parseHomeServices(content)
        .map((item) => `${item.badge}: ${item.title}`)
        .join("\n");
    case "home_stats":
      return parseHomeStats(content)
        .map((item) => `${item.label}: ${item.value}`)
        .join("\n");
    case "home_partners":
      return parseHomePartners(content).join(", ");
    case "footer_links":
      return JSON.stringify(parseFooterLinks(content), null, 2);
    default:
      return content || SITE_CONTENT_DEFAULTS[key].content;
  }
}
