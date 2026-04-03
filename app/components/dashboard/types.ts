export type DashboardTrendPoint = {
  label: string;
  value: number;
  revenue?: number;
  artistShare?: number;
};

export type DashboardArtist = {
  id: string;
  userId?: string | null;
  name?: string | null;
  stageName?: string | null;
  spotifyUrl?: string | null;
  monthlyListeners?: number | null;
  image?: string | null;
  [key: string]: unknown;
};

export type DashboardUser = {
  id: string;
  email?: string | null;
  fullName?: string | null;
  legalName?: string | null;
  name?: string | null;
  stageName?: string | null;
  role?: string | null;
  status?: string | null;
  artist?: DashboardArtist | null;
  [key: string]: unknown;
};

export type DashboardDemoFile = {
  id: string;
  name?: string | null;
  url?: string | null;
  [key: string]: unknown;
};

export type DashboardDemo = {
  id: string;
  title?: string | null;
  name?: string | null;
  genre?: string | null;
  status?: string | null;
  trackLink?: string | null;
  message?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  scheduledReleaseDate?: string | Date | null;
  files?: DashboardDemoFile[];
  contract?: DashboardContract | null;
  [key: string]: unknown;
};

export type DashboardContractSplit = {
  id?: string;
  userId?: string | null;
  artistId?: string | null;
  name?: string | null;
  percentage?: string | number;
  user?: DashboardUser | null;
  [key: string]: unknown;
};

export type DashboardContract = {
  id: string;
  title?: string | null;
  status?: string | null;
  notes?: string | null;
  pdfUrl?: string | null;
  createdAt?: string | Date | null;
  userId?: string | null;
  primaryArtistEmail?: string | null;
  artistShare?: number | string | null;
  labelShare?: number | string | null;
  artist?: DashboardArtist | null;
  user?: DashboardUser | null;
  release?: {
    id?: string;
    name?: string | null;
    image?: string | null;
    [key: string]: unknown;
  } | null;
  splits?: DashboardContractSplit[];
  [key: string]: unknown;
};

export type DashboardEarning = {
  id: string;
  period?: string | null;
  source?: string | null;
  paidToArtist?: boolean | null;
  artistAmount?: number;
  labelAmount?: number;
  expenseAmount?: number;
  streams?: number;
  contract?: DashboardContract | null;
  [key: string]: unknown;
};

export type DashboardPayment = {
  id: string;
  amount: number;
  status?: string | null;
  method?: string | null;
  reference?: string | null;
  createdAt?: string | Date | null;
  processedAt?: string | Date | null;
  [key: string]: unknown;
};

export type DashboardRequestComment = {
  id: string;
  content?: string | null;
  createdAt?: string | Date | null;
  userId?: string | null;
  user?: DashboardUser | null;
  [key: string]: unknown;
};

export type DashboardRequest = {
  id: string;
  type?: string | null;
  status?: string | null;
  details?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  user?: DashboardUser | null;
  release?: {
    id?: string;
    name?: string | null;
    image?: string | null;
    spotifyUrl?: string | null;
    [key: string]: unknown;
  } | null;
  comments?: DashboardRequestComment[];
  [key: string]: unknown;
};

export type DashboardSiteContentItem = {
  id?: string;
  key?: string | null;
  value?: string | null;
  [key: string]: unknown;
};

export type DashboardWebhook = {
  id: string;
  url?: string | null;
  type?: string | null;
  active?: boolean;
  [key: string]: unknown;
};

export type DashboardDiscordBridge = Record<string, unknown>;
export type DashboardAnnouncement = {
  id: string;
  title: string;
  content: string;
  type?: string;
  active?: boolean;
  linkUrl?: string | null;
  linkText?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  [key: string]: unknown;
};

export type ArtistOverviewStats = {
  releases?: number;
  listeners?: number;
  pendingRequests?: number;
  earnings?: number;
  withdrawn?: number;
  paid?: number;
  pending?: number;
  available?: number;
  balance?: number;
  trends?: DashboardTrendPoint[];
  trendsDaily?: DashboardTrendPoint[];
  listenerTrend?: DashboardTrendPoint[];
  [key: string]: unknown;
};

export type DashboardPagination = {
  page: number;
  pages: number;
  total: number;
  limit: number;
};
