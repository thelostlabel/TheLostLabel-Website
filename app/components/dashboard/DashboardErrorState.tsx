"use client";

import { Card, Button } from "@heroui/react";

type DashboardErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  compact?: boolean;
};

export default function DashboardErrorState({
  title,
  message,
  actionLabel = "Retry",
  onAction,
  compact = false,
}: DashboardErrorStateProps) {
  return (
    <div className={`grid place-items-center ${compact ? 'p-5' : 'min-h-[50vh] p-10'}`}>
      <Card className={`w-full ${compact ? '' : 'max-w-[520px] text-center'}`}>
        <Card.Content className={compact ? 'p-5' : 'p-7'}>
          <p className="m-0 text-[11px] font-black tracking-[0.16em] ds-text-muted uppercase">
            Dashboard Error
          </p>
          <h2 className={`mt-2.5 font-black ${compact ? 'text-lg' : 'text-2xl'}`}>
            {title}
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed ds-text-muted">
            {message}
          </p>
          {onAction ? (
            <Button
              variant="primary"
              onPress={() => { void onAction(); }}
              className="mt-[18px] min-w-[140px]"
            >
              {actionLabel}
            </Button>
          ) : null}
        </Card.Content>
      </Card>
    </div>
  );
}
