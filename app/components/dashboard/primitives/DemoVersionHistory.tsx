"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Chip } from "@heroui/react";
import { History, RotateCcw, FileAudio, Clock } from "lucide-react";

interface VersionFile {
  id: string;
  filename: string;
  filesize: number;
}

interface DemoVersion {
  id: string;
  version: number;
  title: string;
  genre?: string | null;
  message?: string | null;
  createdAt: string;
  files: VersionFile[];
}

interface DemoVersionHistoryProps {
  demoId: string;
  canRestore?: boolean;
  onRestore?: () => void;
}

export default function DemoVersionHistory({
  demoId,
  canRestore = false,
  onRestore,
}: DemoVersionHistoryProps) {
  const [versions, setVersions] = useState<DemoVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/demo/${demoId}/versions`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to load versions");
        return;
      }
      const data: DemoVersion[] = await res.json();
      setVersions(data);
      setError(null);
    } catch {
      setError("Failed to load version history");
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/demo/${demoId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to restore version");
        return;
      }
      await fetchVersions();
      onRestore?.();
    } catch {
      setError("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2">
        <Clock size={14} className="text-default-400 animate-pulse" />
        <span className="text-xs font-semibold text-default-400 tracking-wide">
          LOADING VERSIONS...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <span className="text-xs font-semibold text-danger tracking-wide">{error}</span>
        <Button size="sm" variant="ghost" onPress={fetchVersions}>
          Retry
        </Button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-10 h-10 rounded-full border border-dashed border-default-200 flex items-center justify-center">
          <History size={18} className="text-default-400" />
        </div>
        <p className="text-xs font-bold text-default-400 tracking-widest uppercase">
          No version history yet
        </p>
        <p className="text-[11px] text-default-300">
          Versions are created automatically when the demo is revised.
        </p>
      </div>
    );
  }

  return (
    <div className="demo-version-history flex flex-col gap-0">
      {versions.map((version, index) => {
        const isLatest = index === 0;
        const isLast = index === versions.length - 1;

        return (
          <div key={version.id} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0 w-5">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1 ${
                  isLatest
                    ? "border-primary bg-primary"
                    : "border-default-300 bg-default-100"
                }`}
              />
              {!isLast && (
                <div className="w-px flex-1 bg-default-200 min-h-[20px]" />
              )}
            </div>

            {/* Version content */}
            <div className="flex-1 pb-5 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-black tracking-wider text-foreground">
                    v{version.version}
                  </span>
                  {isLatest && (
                    <Chip size="sm" variant="soft" color="accent">
                      <Chip.Label>LATEST</Chip.Label>
                    </Chip>
                  )}
                  <span className="text-[11px] text-default-400 font-semibold">
                    {formatDate(version.createdAt)}
                  </span>
                </div>

                {canRestore && !isLatest && (
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={restoring !== null}
                    onPress={() => handleRestore(version.id)}
                    className="text-[10px] font-bold tracking-wider shrink-0"
                  >
                    {restoring === version.id ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    RESTORE
                  </Button>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                <p className="text-sm font-bold text-foreground/90 truncate">
                  {version.title}
                </p>
                {version.genre && (
                  <span className="text-[11px] text-default-400 font-semibold">
                    {version.genre}
                  </span>
                )}
              </div>

              {version.files.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {version.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 text-[11px] text-default-400"
                    >
                      <FileAudio size={12} className="shrink-0" />
                      <span className="truncate font-semibold">{file.filename}</span>
                      <span className="shrink-0 text-default-300">
                        {formatFileSize(file.filesize)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
