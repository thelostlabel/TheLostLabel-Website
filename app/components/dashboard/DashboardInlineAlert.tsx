"use client";

import { Alert } from "@heroui/react";

type DashboardInlineAlertProps = {
  message: string;
};

export default function DashboardInlineAlert({ message }: DashboardInlineAlertProps) {
  if (!message) return null;

  return (
    <Alert color="warning" className="mb-3.5">
      <Alert.Description className="text-xs font-bold">{message}</Alert.Description>
    </Alert>
  );
}
