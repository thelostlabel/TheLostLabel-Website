"use client";

import type { PropsWithChildren } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Portal({ children }: PropsWithChildren) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return mounted ? createPortal(children, document.body) : null;
}
