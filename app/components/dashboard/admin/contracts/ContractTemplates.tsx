"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { BookTemplate, Plus, Trash2, Check } from "lucide-react";
import type { ContractForm } from "./contract-utils";

export type ContractTemplate = {
  id: string;
  name: string;
  artistShare: number;
  labelShare: number;
  splitPreset: Array<{ role: string; percentage: number }>;
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = "contract-templates";

function loadTemplates(): ContractTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: ContractTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

const DEFAULT_TEMPLATES: ContractTemplate[] = [
  {
    id: "standard-70-30",
    name: "Standard 70/30",
    artistShare: 0.7,
    labelShare: 0.3,
    splitPreset: [{ role: "primary", percentage: 100 }],
    notes: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "premium-80-20",
    name: "Premium 80/20",
    artistShare: 0.8,
    labelShare: 0.2,
    splitPreset: [{ role: "primary", percentage: 100 }],
    notes: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "collab-50-50",
    name: "Collab 50/50 Split",
    artistShare: 0.7,
    labelShare: 0.3,
    splitPreset: [
      { role: "primary", percentage: 50 },
      { role: "featured", percentage: 50 },
    ],
    notes: "",
    createdAt: new Date().toISOString(),
  },
];

type ContractTemplatesProps = {
  onApply: (template: ContractTemplate) => void;
  currentForm?: ContractForm;
};

export default function ContractTemplates({ onApply, currentForm }: ContractTemplatesProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const stored = loadTemplates();
    setTemplates(stored.length > 0 ? stored : DEFAULT_TEMPLATES);
  }, []);

  const handleSaveFromCurrent = useCallback(() => {
    if (!newName.trim() || !currentForm) return;
    const template: ContractTemplate = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      artistShare: currentForm.artistShare,
      labelShare: currentForm.labelShare,
      splitPreset: currentForm.splits.map((s) => ({
        role: s.role,
        percentage: s.percentage,
      })),
      notes: currentForm.notes,
      createdAt: new Date().toISOString(),
    };
    const next = [...templates, template];
    setTemplates(next);
    saveTemplates(next);
    setNewName("");
    setShowCreate(false);
  }, [newName, currentForm, templates]);

  const handleDelete = useCallback(
    (id: string) => {
      const next = templates.filter((t) => t.id !== id);
      setTemplates(next);
      saveTemplates(next);
    },
    [templates],
  );

  return (
    <Card variant="secondary" className="border-default/8">
      <Card.Header className="flex flex-row items-center justify-between gap-3">
        <Card.Title className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-foreground/40">
          <BookTemplate size={14} />
          Templates
        </Card.Title>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setShowCreate((p) => !p)}
          className="text-[9px] font-black tracking-widest gap-1"
        >
          <Plus size={10} />
          {showCreate ? "Cancel" : "Save Current"}
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2 pt-0">
        {showCreate && (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveFromCurrent()}
              placeholder="Template name..."
              className="flex-1 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[11px] font-bold text-foreground outline-none"
              autoFocus
            />
            <Button
              variant="secondary"
              size="sm"
              onPress={handleSaveFromCurrent}
              isDisabled={!newName.trim()}
              className="text-[9px] font-black h-8"
            >
              Save
            </Button>
          </div>
        )}

        {templates.map((template) => (
          <div
            key={template.id}
            className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2 hover:bg-white/[0.03] transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-foreground/70 truncate">{template.name}</p>
              <p className="text-[10px] text-foreground/30">
                {Math.round(template.artistShare * 100)}/{Math.round(template.labelShare * 100)} split
                {template.splitPreset.length > 1 && ` · ${template.splitPreset.length} contributors`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onPress={() => onApply(template)}
                className="text-[9px] font-black h-7 gap-1"
              >
                <Check size={10} />
                Apply
              </Button>
              {template.id.startsWith("custom-") && (
                <button
                  type="button"
                  onClick={() => handleDelete(template.id)}
                  className="border-0 bg-transparent text-white/15 hover:text-red-400 cursor-pointer p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <p className="py-4 text-center text-[10px] font-bold text-foreground/20">
            No templates yet. Create one from the current form.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
