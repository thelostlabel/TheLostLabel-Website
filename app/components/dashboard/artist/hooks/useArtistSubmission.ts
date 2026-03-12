"use client";

import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRef, useState } from "react";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";

type UseArtistSubmissionOptions = {
  showToast: (message: string, type?: string) => void;
  onSuccess: () => Promise<void> | void;
};

export function useArtistSubmission({
  showToast,
  onSuccess,
}: UseArtistSubmissionOptions) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [trackLink, setTrackLink] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).filter((file) =>
      file.name.toLowerCase().endsWith(".wav"),
    );
    setFiles((previous) => [...previous, ...selectedFiles]);
  };

  const handleDrag = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.name.toLowerCase().endsWith(".wav"),
    );
    setFiles((previous) => [...previous, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
  };

  const resetForm = () => {
    setTitle("");
    setGenre("");
    setTrackLink("");
    setMessage("");
    setFiles([]);
    setUploadProgress(0);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      showToast("Please provide a track title.", "warning");
      return;
    }

    if (files.length === 0 && !trackLink.trim()) {
      showToast("Please provide either a WAV file or a track link.", "warning");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let uploadedFiles: Array<Record<string, unknown>> = [];

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const uploadData = await new Promise<{ files?: Array<Record<string, unknown>> }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload");

            xhr.upload.onprogress = (progressEvent) => {
              if (!progressEvent.lengthComputable) return;
              const percentComplete = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );
              setUploadProgress(percentComplete);
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
                return;
              }

              reject(new Error("Upload failed"));
            };

            xhr.onerror = () => reject(new Error("Upload network error"));
            xhr.send(formData);
          },
        );

        uploadedFiles = uploadData.files || [];
      }

      await dashboardRequestJson("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          genre,
          trackLink: trackLink.trim() || null,
          message,
          files: uploadedFiles,
        }),
        context: "submit demo",
        retry: false,
      });

      showToast("Demo submitted successfully.", "success");
      resetForm();
      await onSuccess();
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to submit demo."), "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    title,
    setTitle,
    genre,
    setGenre,
    trackLink,
    setTrackLink,
    message,
    setMessage,
    files,
    dragActive,
    fileInputRef,
    uploading,
    uploadProgress,
    handleDrag,
    handleDrop,
    handleFileSelect,
    removeFile,
    handleSubmit,
  };
}
