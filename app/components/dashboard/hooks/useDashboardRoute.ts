"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type QueryValue = string | number | boolean | null | undefined;
export type DashboardQueryPatch = Record<string, QueryValue>;

type NavigateOptions = {
  replace?: boolean;
  scroll?: boolean;
};

type SetViewOptions = NavigateOptions & {
  params?: DashboardQueryPatch;
  preserveRecordId?: boolean;
};

const applyPatch = (params: URLSearchParams, patch: DashboardQueryPatch) => {
  Object.entries(patch).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  return params;
};

export function useDashboardRoute<TView extends string = string>() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawView = searchParams.get("view") as TView | null;
  const recordId = searchParams.get("id");

  const navigateWithPatch = useCallback(
    (patch: DashboardQueryPatch, options: NavigateOptions = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextParams = applyPatch(params, patch);
      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      if (options.replace) {
        router.replace(href, { scroll: options.scroll ?? false });
        return;
      }

      router.push(href, { scroll: options.scroll ?? false });
    },
    [pathname, router, searchParams],
  );

  const pushQuery = useCallback(
    (patch: DashboardQueryPatch, options: Omit<NavigateOptions, "replace"> = {}) => {
      navigateWithPatch(patch, { ...options, replace: false });
    },
    [navigateWithPatch],
  );

  const replaceQuery = useCallback(
    (patch: DashboardQueryPatch, options: Omit<NavigateOptions, "replace"> = {}) => {
      navigateWithPatch(patch, { ...options, replace: true });
    },
    [navigateWithPatch],
  );

  const setView = useCallback(
    (view: TView, options: SetViewOptions = {}) => {
      const patch: DashboardQueryPatch = {
        view,
        ...(options.params ?? {}),
      };

      if (!options.preserveRecordId && !("id" in patch)) {
        patch.id = null;
      }

      navigateWithPatch(patch, options);
    },
    [navigateWithPatch],
  );

  const setRecordId = useCallback(
    (id: string, options: NavigateOptions = {}) => {
      navigateWithPatch({ id }, options);
    },
    [navigateWithPatch],
  );

  const clearRecordId = useCallback(
    (options: NavigateOptions = {}) => {
      navigateWithPatch({ id: null }, options);
    },
    [navigateWithPatch],
  );

  return useMemo(
    () => ({
      pathname,
      rawView,
      recordId,
      searchParams,
      pushQuery,
      replaceQuery,
      setView,
      setRecordId,
      clearRecordId,
    }),
    [
      clearRecordId,
      pathname,
      pushQuery,
      rawView,
      recordId,
      replaceQuery,
      searchParams,
      setRecordId,
      setView,
    ],
  );
}
