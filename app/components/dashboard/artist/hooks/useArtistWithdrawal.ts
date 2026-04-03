"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";

type UseArtistWithdrawalOptions = {
  availableBalance: number;
  showToast: (message: string, type?: string) => void;
  onSubmitted: () => Promise<void> | void;
};

export function useArtistWithdrawal({
  availableBalance,
  showToast,
  onSubmitted,
}: UseArtistWithdrawalOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [notes, setNotes] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAmount("");
    setMethod("BANK_TRANSFER");
    setNotes("");
    setWiseEmail("");
  };

  const close = () => {
    setIsOpen(false);
    reset();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!amount || Number.parseFloat(amount) <= 0) {
      showToast("Please enter a valid amount.", "warning");
      return;
    }

    if (Number.parseFloat(amount) > availableBalance) {
      showToast("Amount exceeds the available balance.", "error");
      return;
    }

    if (method === "WISE" && !wiseEmail.trim()) {
      showToast("Please enter your Wise account email.", "warning");
      return;
    }

    setSubmitting(true);

    // For Wise payments, embed the account email at the start of notes so admins can find it.
    const compiledNotes =
      method === "WISE" && wiseEmail.trim()
        ? [`Wise: ${wiseEmail.trim()}`, notes.trim()].filter(Boolean).join("\n")
        : notes;

    try {
      await dashboardRequestJson("/api/artist/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          method,
          notes: compiledNotes,
        }),
        context: "submit withdrawal request",
        retry: false,
      });

      showToast("Withdrawal request submitted successfully.", "success");
      close();
      await onSubmitted();
    } catch (error) {
      showToast(
        getDashboardErrorMessage(error, "Failed to submit the withdrawal request."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isOpen,
    open: () => setIsOpen(true),
    close,
    amount,
    setAmount,
    method,
    setMethod,
    notes,
    setNotes,
    wiseEmail,
    setWiseEmail,
    submitting,
    handleSubmit,
  };
}
