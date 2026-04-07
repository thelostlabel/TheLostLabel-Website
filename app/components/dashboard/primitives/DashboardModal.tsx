"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { Modal } from "@heroui/react";

type DashboardModalProps = PropsWithChildren<{
  title: string;
  description?: ReactNode;
  width?: number;
  onClose: () => void;
}>;

export default function DashboardModal({
  title,
  description,
  width = 460,
  onClose,
  children,
}: DashboardModalProps) {
  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop />
      <Modal.Container>
        <Modal.Dialog className="w-full relative" style={{ maxWidth: `${width}px` }}>
          <div className="mb-[18px]">
            <h3 className="text-sm tracking-[0.18em] font-[900] m-0 uppercase">
              {title}
            </h3>
            {description ? (
              <div className="mt-2 text-xs leading-relaxed ds-text-muted">
                {description}
              </div>
            ) : null}
          </div>
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
