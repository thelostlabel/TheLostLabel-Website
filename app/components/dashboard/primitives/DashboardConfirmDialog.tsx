"use client";

import DashboardModal from "./DashboardModal";
import DashboardButton from "./DashboardButton";

type DashboardConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DashboardConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: DashboardConfirmDialogProps) {
  return (
    <DashboardModal title={title} description={description} onClose={onCancel} width={400}>
      <div className="flex items-center gap-3 justify-end mt-5">
        <DashboardButton variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </DashboardButton>
        <DashboardButton
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </DashboardButton>
      </div>
    </DashboardModal>
  );
}
