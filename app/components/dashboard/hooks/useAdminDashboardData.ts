"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import {
  getAdminViewLoaders,
  hasAdminViewData,
} from "@/app/components/dashboard/admin-view-registry";
import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import type {
  DashboardArtist,
  DashboardContract,
  DashboardDiscordBridge,
  DashboardEarning,
  DashboardPagination,
  DashboardPayment,
  DashboardRequest,
  DashboardSiteContentItem,
  DashboardUser,
  DashboardWebhook,
  DashboardDemo,
} from "@/app/components/dashboard/types";

export type AdminDatasetKey =
  | "content"
  | "requests"
  | "submissions"
  | "artists"
  | "users"
  | "webhooks"
  | "contracts"
  | "earnings"
  | "payments"
  | "releases"
  | "discordBridge";

type AdminDashboardData = {
  submissions: DashboardDemo[];
  artists: DashboardArtist[];
  users: DashboardUser[];
  requests: DashboardRequest[];
  siteContent: DashboardSiteContentItem[];
  webhooks: DashboardWebhook[];
  contracts: DashboardContract[];
  earnings: DashboardEarning[];
  payments: DashboardPayment[];
  releases: Array<Record<string, unknown>>;
  discordBridge: DashboardDiscordBridge | null;
};

type DatasetResponseMap = {
  content: DashboardSiteContentItem[];
  requests: { requests?: DashboardRequest[] };
  submissions: { demos?: DashboardDemo[] };
  artists: { artists?: DashboardArtist[] };
  users: { users?: DashboardUser[] };
  webhooks: DashboardWebhook[];
  contracts: { contracts?: DashboardContract[] };
  earnings: { earnings?: DashboardEarning[]; pagination?: DashboardPagination };
  payments: { payments?: DashboardPayment[] };
  releases: { releases?: Array<Record<string, unknown>> };
  discordBridge: DashboardDiscordBridge | null;
};

const INITIAL_DATA: AdminDashboardData = {
  submissions: [],
  artists: [],
  users: [],
  requests: [],
  siteContent: [],
  webhooks: [],
  contracts: [],
  earnings: [],
  payments: [],
  releases: [],
  discordBridge: null,
};

const INITIAL_PAGINATION: DashboardPagination = {
  page: 1,
  pages: 1,
  total: 0,
  limit: 50,
};

const DATASET_KEYS: AdminDatasetKey[] = [
  "content",
  "requests",
  "submissions",
  "artists",
  "users",
  "webhooks",
  "contracts",
  "earnings",
  "payments",
  "releases",
  "discordBridge",
];

const getDatasetQueryKey = (key: AdminDatasetKey, page = 1) =>
  ["dashboard", "admin", key, key === "earnings" ? page : "base"] as const;

const fetchAdminDataset = async <TKey extends AdminDatasetKey>(
  key: TKey,
  page = 1,
): Promise<DatasetResponseMap[TKey]> => {
  switch (key) {
    case "content":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/content", {
        context: "admin content",
      });
    case "requests":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/requests?limit=50", {
        context: "admin requests",
      });
    case "submissions":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/demo?limit=50", {
        context: "admin submissions",
      });
    case "artists":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/artists?limit=50", {
        context: "admin artists",
      });
    case "users":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/users?limit=50", {
        context: "admin users",
      });
    case "webhooks":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/webhooks", {
        context: "admin webhooks",
      });
    case "contracts":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/contracts?all=true&limit=50", {
        context: "admin contracts",
      });
    case "earnings":
      return dashboardRequestJson<DatasetResponseMap[TKey]>(`/api/earnings?page=${page}&limit=50`, {
        context: "admin earnings",
      });
    case "payments":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/payments?limit=50", {
        context: "admin payments",
      });
    case "releases":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/releases?limit=50", {
        context: "admin releases",
      });
    case "discordBridge":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/admin/discord-bridge", {
        context: "discord bridge",
      });
  }
};

const getDashboardDataForKey = (
  key: AdminDatasetKey,
  payload: DatasetResponseMap[AdminDatasetKey] | undefined,
): AdminDashboardData[keyof AdminDashboardData] => {
  switch (key) {
    case "content":
      return Array.isArray(payload) ? payload : [];
    case "requests":
      return (payload as DatasetResponseMap["requests"] | undefined)?.requests || [];
    case "submissions":
      return (payload as DatasetResponseMap["submissions"] | undefined)?.demos || [];
    case "artists":
      return (payload as DatasetResponseMap["artists"] | undefined)?.artists || [];
    case "users":
      return (payload as DatasetResponseMap["users"] | undefined)?.users || [];
    case "webhooks":
      return Array.isArray(payload) ? payload : [];
    case "contracts":
      return (payload as DatasetResponseMap["contracts"] | undefined)?.contracts || [];
    case "earnings":
      return (payload as DatasetResponseMap["earnings"] | undefined)?.earnings || [];
    case "payments":
      return (payload as DatasetResponseMap["payments"] | undefined)?.payments || [];
    case "releases":
      return (payload as DatasetResponseMap["releases"] | undefined)?.releases || [];
    case "discordBridge":
      return (payload as DatasetResponseMap["discordBridge"]) || null;
  }
};

export function useAdminDashboardData(view: string) {
  const queryClient = useQueryClient();
  const [earningsPage, setEarningsPage] = useState(1);
  const viewLoaderKeys = useMemo(
    () => (getAdminViewLoaders(view) || []) as AdminDatasetKey[],
    [view],
  );

  const activeQueries = useQueries({
    queries: viewLoaderKeys.map((key) => ({
      queryKey: getDatasetQueryKey(key, key === "earnings" ? earningsPage : 1),
      queryFn: () => fetchAdminDataset(key, key === "earnings" ? earningsPage : 1),
      enabled: Boolean(viewLoaderKeys.length),
    })),
  });

  const queryStateByKey = useMemo(
    () =>
      Object.fromEntries(
        viewLoaderKeys.map((key, index) => [key, activeQueries[index]]),
      ) as Partial<Record<AdminDatasetKey, (typeof activeQueries)[number]>>,
    [activeQueries, viewLoaderKeys],
  );

  const data = useMemo<AdminDashboardData>(() => {
    const nextData = { ...INITIAL_DATA };

    DATASET_KEYS.forEach((key) => {
      const page = key === "earnings" ? earningsPage : 1;
      const queryState = queryStateByKey[key];
      const payload =
        queryState?.data ??
        queryClient.getQueryData<DatasetResponseMap[typeof key]>(
          getDatasetQueryKey(key, page),
        );

      switch (key) {
        case "content":
          nextData.siteContent = getDashboardDataForKey(key, payload) as DashboardSiteContentItem[];
          break;
        case "requests":
          nextData.requests = getDashboardDataForKey(key, payload) as DashboardRequest[];
          break;
        case "submissions":
          nextData.submissions = getDashboardDataForKey(key, payload) as DashboardDemo[];
          break;
        case "artists":
          nextData.artists = getDashboardDataForKey(key, payload) as DashboardArtist[];
          break;
        case "users":
          nextData.users = getDashboardDataForKey(key, payload) as DashboardUser[];
          break;
        case "webhooks":
          nextData.webhooks = getDashboardDataForKey(key, payload) as DashboardWebhook[];
          break;
        case "contracts":
          nextData.contracts = getDashboardDataForKey(key, payload) as DashboardContract[];
          break;
        case "earnings":
          nextData.earnings = getDashboardDataForKey(key, payload) as DashboardEarning[];
          break;
        case "payments":
          nextData.payments = getDashboardDataForKey(key, payload) as DashboardPayment[];
          break;
        case "releases":
          nextData.releases = getDashboardDataForKey(key, payload) as Array<Record<string, unknown>>;
          break;
        case "discordBridge":
          nextData.discordBridge = getDashboardDataForKey(key, payload) as DashboardDiscordBridge | null;
          break;
      }
    });

    return nextData;
  }, [earningsPage, queryClient, queryStateByKey]);

  const earningsPagination = useMemo(
    () =>
      (
        queryStateByKey.earnings?.data as DatasetResponseMap["earnings"] | undefined
      )?.pagination ||
      queryClient.getQueryData<DatasetResponseMap["earnings"]>(
        getDatasetQueryKey("earnings", earningsPage),
      )?.pagination ||
      INITIAL_PAGINATION,
    [earningsPage, queryClient, queryStateByKey.earnings?.data],
  );

  const loadView = useCallback(
    async (targetView: string, page = 1) => {
      const keys = (getAdminViewLoaders(targetView) || []) as AdminDatasetKey[];
      if (!keys.length) return;

      if (keys.includes("earnings")) {
        setEarningsPage(page);
      }

      await Promise.all(
        keys.map((key) =>
          queryClient.fetchQuery({
            queryKey: getDatasetQueryKey(key, key === "earnings" ? page : 1),
            queryFn: () => fetchAdminDataset(key, key === "earnings" ? page : 1),
          }),
        ),
      );
    },
    [queryClient],
  );

  const refreshView = useCallback(
    async (target: string | AdminDatasetKey | Array<string | AdminDatasetKey>, page = 1) => {
      const targets = Array.isArray(target) ? target : [target];
      const datasetKeys = targets.flatMap((entry) => {
        if (DATASET_KEYS.includes(entry as AdminDatasetKey)) {
          return [entry as AdminDatasetKey];
        }

        return (getAdminViewLoaders(entry) || []) as AdminDatasetKey[];
      });

      if (datasetKeys.includes("earnings")) {
        setEarningsPage(page);
      }

      await Promise.all(
        datasetKeys.map((key) =>
          queryClient.fetchQuery({
            queryKey: getDatasetQueryKey(key, key === "earnings" ? page : 1),
            queryFn: () => fetchAdminDataset(key, key === "earnings" ? page : 1),
          }),
        ),
      );
    },
    [queryClient],
  );

  const isViewLoading = viewLoaderKeys.some(
    (key) => queryStateByKey[key]?.isPending || queryStateByKey[key]?.isFetching,
  );
  const viewError =
    viewLoaderKeys
      .map((key) =>
        queryStateByKey[key]?.error
          ? getDashboardErrorMessage(queryStateByKey[key]?.error, `Failed to load ${key}`)
          : null,
      )
      .find(Boolean) || null;
  const hasViewData = hasAdminViewData(view, {
    ...data,
    discordBridge: data.discordBridge,
  });

  return useMemo(
    () => ({
      ...data,
      earningsPagination,
      datasetStatus: Object.fromEntries(
        DATASET_KEYS.map((key) => [
          key,
          queryStateByKey[key]?.isPending
            ? "loading"
            : queryStateByKey[key]?.error
              ? "error"
              : queryClient.getQueryState(getDatasetQueryKey(key, key === "earnings" ? earningsPage : 1))
                ?.dataUpdatedAt
                ? "success"
                : "idle",
        ]),
      ),
      datasetError: Object.fromEntries(
        DATASET_KEYS.map((key) => [
          key,
          queryStateByKey[key]?.error
            ? getDashboardErrorMessage(queryStateByKey[key]?.error, `Failed to load ${key}`)
            : null,
        ]),
      ),
      hasViewData,
      isViewLoading,
      viewError,
      loadView,
      refreshView,
    }),
    [
      data,
      earningsPage,
      earningsPagination,
      hasViewData,
      isViewLoading,
      loadView,
      queryClient,
      queryStateByKey,
      refreshView,
      viewError,
    ],
  );
}
