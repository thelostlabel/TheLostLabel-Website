"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import type {
  ArtistOverviewStats,
  DashboardContract,
  DashboardDemo,
  DashboardEarning,
  DashboardPagination,
  DashboardPayment,
  DashboardRequest,
} from "@/app/components/dashboard/types";

export type ArtistDatasetKey =
  | "overview"
  | "demos"
  | "contracts"
  | "earnings"
  | "payments"
  | "requests";

type ArtistDashboardState = {
  stats: ArtistOverviewStats;
  releases: Array<Record<string, unknown>>;
  demos: DashboardDemo[];
  contracts: DashboardContract[];
  earnings: DashboardEarning[];
  payments: DashboardPayment[];
  requests: DashboardRequest[];
};

type DatasetResponseMap = {
  overview: {
    stats?: ArtistOverviewStats;
    releases?: Array<Record<string, unknown>>;
  };
  demos: { demos?: DashboardDemo[] };
  contracts: { contracts?: DashboardContract[] };
  earnings: { earnings?: DashboardEarning[]; pagination?: DashboardPagination };
  payments: { payments?: DashboardPayment[] };
  requests: DashboardRequest[];
};

const INITIAL_STATE: ArtistDashboardState = {
  stats: {
    releases: 0,
    listeners: 0,
    pendingRequests: 0,
    earnings: 0,
    withdrawn: 0,
    paid: 0,
    pending: 0,
    available: 0,
    balance: 0,
    trends: [],
    trendsDaily: [],
    listenerTrend: [],
  },
  releases: [],
  demos: [],
  contracts: [],
  earnings: [],
  payments: [],
  requests: [],
};

const INITIAL_PAGINATION: DashboardPagination = {
  page: 1,
  pages: 1,
  total: 0,
  limit: 50,
};

const DATASET_KEYS: ArtistDatasetKey[] = [
  "overview",
  "demos",
  "contracts",
  "earnings",
  "payments",
  "requests",
];

export const getArtistViewDatasets = (view: string): ArtistDatasetKey[] => {
  switch (view) {
    case "overview":
      return ["overview", "demos"];
    case "demos":
      return ["demos"];
    case "contracts":
      return ["contracts"];
    case "earnings":
      return ["earnings", "payments"];
    case "support":
      return ["requests"];
    default:
      return [];
  }
};

const getDatasetQueryKey = (dataset: ArtistDatasetKey, page = 1) =>
  ["dashboard", "artist", dataset, dataset === "earnings" ? page : "base"] as const;

const fetchArtistDataset = async <TKey extends ArtistDatasetKey>(
  dataset: TKey,
  page = 1,
): Promise<DatasetResponseMap[TKey]> => {
  switch (dataset) {
    case "overview":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/artist/dashboard", {
        context: "artist overview",
      });
    case "demos":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/demo?filter=mine&limit=50", {
        context: "artist demos",
      });
    case "contracts":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/contracts?limit=50", {
        context: "artist contracts",
      });
    case "earnings":
      return dashboardRequestJson<DatasetResponseMap[TKey]>(`/api/earnings?page=${page}&limit=50`, {
        context: "artist earnings",
      });
    case "payments":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/payments?limit=50", {
        context: "artist payments",
      });
    case "requests":
      return dashboardRequestJson<DatasetResponseMap[TKey]>("/api/artist/requests", {
        context: "artist support",
      });
  }
};

export function useArtistDashboardData(view: string) {
  const queryClient = useQueryClient();
  const [earningsPage, setEarningsPage] = useState(1);
  const viewDatasets = getArtistViewDatasets(view);

  const activeQueries = useQueries({
    queries: viewDatasets.map((dataset) => ({
      queryKey: getDatasetQueryKey(dataset, dataset === "earnings" ? earningsPage : 1),
      queryFn: () => fetchArtistDataset(dataset, dataset === "earnings" ? earningsPage : 1),
      enabled: Boolean(viewDatasets.length),
    })),
  });

  const queryStateByKey = useMemo(
    () =>
      Object.fromEntries(
        viewDatasets.map((dataset, index) => [dataset, activeQueries[index]]),
      ) as Partial<Record<ArtistDatasetKey, (typeof activeQueries)[number]>>,
    [activeQueries, viewDatasets],
  );

  const data = useMemo<ArtistDashboardState>(() => {
    const nextData = { ...INITIAL_STATE };

    DATASET_KEYS.forEach((dataset) => {
      const page = dataset === "earnings" ? earningsPage : 1;
      const payload =
        queryStateByKey[dataset]?.data ??
        queryClient.getQueryData<DatasetResponseMap[typeof dataset]>(
          getDatasetQueryKey(dataset, page),
        );

      switch (dataset) {
        case "overview":
          nextData.stats =
            (payload as DatasetResponseMap["overview"] | undefined)?.stats || INITIAL_STATE.stats;
          nextData.releases = Array.isArray(
            (payload as DatasetResponseMap["overview"] | undefined)?.releases,
          )
            ? ((payload as DatasetResponseMap["overview"]).releases as Array<Record<string, unknown>>)
            : [];
          break;
        case "demos":
          nextData.demos = (payload as DatasetResponseMap["demos"] | undefined)?.demos || [];
          break;
        case "contracts":
          nextData.contracts =
            (payload as DatasetResponseMap["contracts"] | undefined)?.contracts || [];
          break;
        case "earnings":
          nextData.earnings =
            (payload as DatasetResponseMap["earnings"] | undefined)?.earnings || [];
          break;
        case "payments":
          nextData.payments =
            (payload as DatasetResponseMap["payments"] | undefined)?.payments || [];
          break;
        case "requests":
          nextData.requests = Array.isArray(payload) ? payload : [];
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
      const datasets = getArtistViewDatasets(targetView);
      if (!datasets.length) return;

      if (datasets.includes("earnings")) {
        setEarningsPage(page);
      }

      await Promise.all(
        datasets.map((dataset) =>
          queryClient.fetchQuery({
            queryKey: getDatasetQueryKey(dataset, dataset === "earnings" ? page : 1),
            queryFn: () => fetchArtistDataset(dataset, dataset === "earnings" ? page : 1),
          }),
        ),
      );
    },
    [queryClient],
  );

  const refreshView = useCallback(
    async (target: string | ArtistDatasetKey | Array<string | ArtistDatasetKey>, page = 1) => {
      const targets = Array.isArray(target) ? target : [target];
      const datasets = targets.flatMap((entry) => {
        if (DATASET_KEYS.includes(entry as ArtistDatasetKey)) {
          return [entry as ArtistDatasetKey];
        }

        return getArtistViewDatasets(entry);
      });

      if (datasets.includes("earnings")) {
        setEarningsPage(page);
      }

      await Promise.all(
        datasets.map((dataset) =>
          queryClient.fetchQuery({
            queryKey: getDatasetQueryKey(dataset, dataset === "earnings" ? page : 1),
            queryFn: () => fetchArtistDataset(dataset, dataset === "earnings" ? page : 1),
          }),
        ),
      );
    },
    [queryClient],
  );

  const isViewLoading = useCallback(
    (targetView: string) => {
      const datasets = getArtistViewDatasets(targetView);
      return datasets.some(
        (dataset) => queryStateByKey[dataset]?.isPending || queryStateByKey[dataset]?.isFetching,
      );
    },
    [queryStateByKey],
  );

  const viewError = useCallback(
    (targetView: string) => {
      const datasets = getArtistViewDatasets(targetView);
      return (
        datasets
          .map((dataset) =>
            queryStateByKey[dataset]?.error
              ? getDashboardErrorMessage(
                  queryStateByKey[dataset]?.error,
                  `Failed to load ${dataset}`,
                )
              : null,
          )
          .find(Boolean) || null
      );
    },
    [queryStateByKey],
  );

  const hasViewData = useCallback(
    (targetView: string) => {
      switch (targetView) {
        case "overview":
          return data.releases.length > 0 || Number(data.stats.releases || 0) > 0;
        case "demos":
          return data.demos.length > 0;
        case "contracts":
          return data.contracts.length > 0;
        case "earnings":
          return data.earnings.length > 0 || data.payments.length > 0;
        case "support":
          return data.requests.length > 0;
        case "submit":
        case "profile":
        case "releases":
          return true;
        default:
          return false;
      }
    },
    [data],
  );

  return useMemo(
    () => ({
      ...data,
      datasetStatus: Object.fromEntries(
        DATASET_KEYS.map((dataset) => [
          dataset,
          queryStateByKey[dataset]?.isPending
            ? "loading"
            : queryStateByKey[dataset]?.error
              ? "error"
              : queryClient.getQueryState(
                  getDatasetQueryKey(dataset, dataset === "earnings" ? earningsPage : 1),
                )?.dataUpdatedAt
                ? "success"
                : "idle",
        ]),
      ),
      datasetError: Object.fromEntries(
        DATASET_KEYS.map((dataset) => [
          dataset,
          queryStateByKey[dataset]?.error
            ? getDashboardErrorMessage(
                queryStateByKey[dataset]?.error,
                `Failed to load ${dataset}`,
              )
            : null,
        ]),
      ),
      earningsPagination,
      loadView,
      refreshView,
      isViewLoading,
      viewError,
      hasViewData,
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
