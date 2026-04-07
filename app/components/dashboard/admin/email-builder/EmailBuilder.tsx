'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Code,
  Pencil,
  Monitor,
  Smartphone,
  Type,
  MousePointer,
  Image,
  Minus,
  Space,
  Columns,
  Share2,
  AlignJustify,
  Quote,
  List,
  Heading1,
} from 'lucide-react';
import { EmailBlock, BlockType, BLOCK_DEFAULTS, BLOCK_LABELS } from './types';
import { blocksToHtml, extractVariables, renderWithVariables } from './renderer';
import { BlockEditor } from './BlockEditor';

interface EmailBuilderProps {
  initialBlocks?: EmailBlock[];
  initialSubject?: string;
  footerText?: string;
  onChange?: (blocks: EmailBlock[], subject: string, html: string) => void;
  onSave?: (blocks: EmailBlock[], subject: string, html: string) => void;
  onTestSend?: (html: string, subject: string) => void;
  saving?: boolean;
}

function genId() {
  return `block_${crypto.randomUUID()}`;
}

const BLOCK_ICON_MAP: Record<BlockType, React.ReactNode> = {
  header: <Heading1 size={14} />,
  text: <Type size={14} />,
  button: <MousePointer size={14} />,
  image: <Image size={14} />,
  divider: <Minus size={14} />,
  spacer: <Space size={14} />,
  columns: <Columns size={14} />,
  social: <Share2 size={14} />,
  footer: <AlignJustify size={14} />,
  quote: <Quote size={14} />,
  list: <List size={14} />,
};

const BLOCK_CATEGORIES: { label: string; types: BlockType[] }[] = [
  { label: 'Content', types: ['header', 'text', 'button', 'image'] },
  { label: 'Layout', types: ['divider', 'spacer', 'columns'] },
  { label: 'Extra', types: ['social', 'footer', 'quote', 'list'] },
];

export function EmailBuilder({
  initialBlocks,
  initialSubject = '',
  footerText,
  onChange,
  onSave,
  onTestSend,
  saving,
}: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(
    initialBlocks || [
      { id: genId(), type: 'header', data: { ...BLOCK_DEFAULTS.header } },
      { id: genId(), type: 'text', data: { ...BLOCK_DEFAULTS.text } },
      { id: genId(), type: 'button', data: { ...BLOCK_DEFAULTS.button } },
    ],
  );
  const [subject, setSubject] = useState(initialSubject);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview' | 'code'>('edit');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPalette, setShowPalette] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = blocksToHtml(blocks, footerText);
  const variables = extractVariables(blocks);

  // Update preview iframe
  useEffect(() => {
    if (iframeRef.current && tab === 'preview') {
      const sampleVars: Record<string, string> = {};
      variables.forEach((v) => {
        sampleVars[v] = `[${v}]`;
      });
      const rendered = renderWithVariables(html, sampleVars);
      iframeRef.current.srcdoc = rendered;
    }
  }, [html, tab, variables]);

  const updateBlocks = useCallback(
    (next: EmailBlock[]) => {
      setBlocks(next);
      onChange?.(next, subject, blocksToHtml(next, footerText));
    },
    [subject, footerText, onChange],
  );

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: genId(),
      type,
      data: { ...BLOCK_DEFAULTS[type] },
    };
    updateBlocks([...blocks, newBlock]);
    setSelectedId(newBlock.id);
    setShowPalette(false);
    setTab('edit');
  };

  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateBlocks(next);
  };

  const updateBlockData = (id: string, data: Record<string, string>) => {
    updateBlocks(blocks.map((b) => (b.id === id ? { ...b, data } : b)));
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const dup: EmailBlock = { ...blocks[idx], id: genId(), data: { ...blocks[idx].data } };
    const next = [...blocks];
    next.splice(idx + 1, 0, dup);
    updateBlocks(next);
    setSelectedId(dup.id);
  };

  // Drag & drop handlers
  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragId && dragId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = blocks.findIndex((b) => b.id === dragId);
    const toIdx = blocks.findIndex((b) => b.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const next = [...blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    updateBlocks(next);
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const TAB_ITEMS = [
    { key: 'edit' as const, label: 'Edit', icon: <Pencil size={13} /> },
    { key: 'preview' as const, label: 'Preview', icon: <Eye size={13} /> },
    { key: 'code' as const, label: 'Code', icon: <Code size={13} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Subject line */}
      <div>
        <label className="dash-label">SUBJECT LINE</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='Welcome to {{brandName}}'
          className="dash-input"
        />
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl border border-default/10 overflow-hidden">
          {TAB_ITEMS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold tracking-wide transition-colors ${
                tab === t.key
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Preview mode toggle (only in preview tab) */}
        {tab === 'preview' && (
          <div className="flex rounded-lg border border-default/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Monitor size={12} />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Smartphone size={12} />
              Mobile
            </button>
          </div>
        )}
      </div>

      {/* ====== EDIT TAB ====== */}
      {tab === 'edit' && (
        <div className="flex gap-4">
          {/* Block list — main area */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-2xl border border-dashed border-default/15 bg-default/3">
                <Plus size={28} className="text-muted/30" />
                <p className="text-[12px] text-muted">
                  Click the <strong>+ Add Block</strong> button to start building
                </p>
              </div>
            )}

            {blocks.map((block, idx) => {
              const isSelected = selectedId === block.id;
              const isDragOver = dragOverId === block.id;
              const isDragging = dragId === block.id;

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(block.id)}
                  onDragOver={(e) => handleDragOver(e, block.id)}
                  onDrop={(e) => handleDrop(e, block.id)}
                  onDragEnd={handleDragEnd}
                  className={`group relative rounded-xl border transition-all duration-150 ${
                    isDragging
                      ? 'opacity-40 scale-[0.98]'
                      : isDragOver
                        ? 'border-foreground/30 ring-2 ring-foreground/10'
                        : isSelected
                          ? 'border-foreground/25 shadow-sm'
                          : 'border-default/10 hover:border-default/20'
                  }`}
                >
                  {/* Block header bar */}
                  <div
                    onClick={() => setSelectedId(isSelected ? null : block.id)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none transition-colors ${
                      isSelected ? 'bg-foreground/[0.03]' : 'hover:bg-foreground/[0.02]'
                    }`}
                  >
                    {/* Drag handle */}
                    <div className="cursor-grab active:cursor-grabbing text-muted/40 hover:text-muted/70 transition-colors">
                      <GripVertical size={14} />
                    </div>

                    {/* Block icon + label */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-muted/60">{BLOCK_ICON_MAP[block.type]}</span>
                      <span className="text-[11px] font-bold tracking-wide text-muted uppercase">
                        {BLOCK_LABELS[block.type]}
                      </span>
                      {/* Mini preview of content */}
                      {block.data.content && !isSelected && (
                        <span className="text-[11px] text-muted/40 truncate max-w-[200px]">
                          — {block.data.content.slice(0, 40)}
                        </span>
                      )}
                      {block.data.title && !isSelected && (
                        <span className="text-[11px] text-muted/40 truncate max-w-[200px]">
                          — {block.data.title.slice(0, 40)}
                        </span>
                      )}
                      {block.data.text && block.type === 'button' && !isSelected && (
                        <span className="text-[11px] text-muted/40 truncate max-w-[200px]">
                          — {block.data.text}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionBtn
                        icon={<ChevronUp size={13} />}
                        onClick={() => moveBlock(block.id, -1)}
                        disabled={idx === 0}
                        title="Move up"
                      />
                      <ActionBtn
                        icon={<ChevronDown size={13} />}
                        onClick={() => moveBlock(block.id, 1)}
                        disabled={idx === blocks.length - 1}
                        title="Move down"
                      />
                      <ActionBtn
                        icon={<Copy size={12} />}
                        onClick={() => duplicateBlock(block.id)}
                        title="Duplicate"
                      />
                      <ActionBtn
                        icon={<Trash2 size={12} />}
                        onClick={() => removeBlock(block.id)}
                        title="Delete"
                        danger
                      />
                    </div>
                  </div>

                  {/* Block editor (expanded) */}
                  {isSelected && (
                    <div className="px-4 pb-4 pt-2 border-t border-default/8">
                      <BlockEditor
                        block={block}
                        onChange={(data) => updateBlockData(block.id, data)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add block button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPalette(!showPalette)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all text-[11px] font-bold tracking-wide ${
                  showPalette
                    ? 'border-foreground/20 bg-foreground/[0.03] text-foreground'
                    : 'border-default/15 text-muted hover:border-default/25 hover:text-foreground'
                }`}
              >
                <Plus size={14} />
                Add Block
              </button>

              {/* Block palette dropdown */}
              {showPalette && (
                <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-default/15 bg-background shadow-lg p-3">
                  {BLOCK_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="mb-3 last:mb-0">
                      <span className="text-[9px] font-black tracking-[0.14em] uppercase text-muted/50 mb-1.5 block">
                        {cat.label}
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {cat.types.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addBlock(type)}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-default/8 hover:border-default/20 hover:bg-foreground/[0.03] transition-all text-muted hover:text-foreground"
                          >
                            {BLOCK_ICON_MAP[type]}
                            <span className="text-[10px] font-semibold">{BLOCK_LABELS[type]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live mini-preview sidebar */}
          <div className="w-[280px] shrink-0 hidden lg:flex flex-col gap-2">
            <span className="text-[9px] font-black tracking-[0.14em] uppercase text-muted/50">
              Live Preview
            </span>
            <div className="rounded-xl border border-default/10 bg-white overflow-hidden sticky top-4">
              <iframe
                srcDoc={html}
                title="Mini Preview"
                className="w-full border-0 pointer-events-none"
                style={{ height: 500, transform: 'scale(0.47)', transformOrigin: 'top left', width: '213%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====== PREVIEW TAB ====== */}
      {tab === 'preview' && (
        <div className="flex justify-center">
          <div
            className={`rounded-xl border border-default/10 bg-white overflow-hidden transition-all duration-300 ${
              previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[700px]'
            }`}
          >
            <iframe
              ref={iframeRef}
              title="Email Preview"
              className="w-full border-0"
              style={{ height: 650 }}
            />
          </div>
        </div>
      )}

      {/* ====== CODE TAB ====== */}
      {tab === 'code' && (
        <div className="relative">
          <textarea
            readOnly
            value={html}
            className="dash-input w-full font-mono text-[12px] resize-y min-h-[400px]"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(html)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-foreground/10 text-[10px] font-bold text-muted hover:text-foreground transition-colors"
          >
            Copy HTML
          </button>
        </div>
      )}

      {/* Variables info */}
      {variables.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="font-bold">Variables:</span>
          {variables.map((v) => (
            <code
              key={v}
              className="px-2 py-0.5 rounded bg-foreground/[0.05] text-[10px] font-mono"
            >
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2 border-t border-default/8">
        {onTestSend && (
          <button
            type="button"
            onClick={() => onTestSend(html, subject)}
            className="px-5 py-2.5 rounded-xl border border-default/15 text-[11px] font-bold tracking-wide text-muted hover:text-foreground transition-colors"
          >
            SEND TEST
          </button>
        )}
        {onSave && (
          <button
            type="button"
            onClick={() => onSave(blocks, subject, html)}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-foreground text-background text-[11px] font-black tracking-[0.08em] transition-opacity disabled:opacity-50 disabled:cursor-wait hover:opacity-90"
          >
            {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
          </button>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  onClick,
  disabled,
  title,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-20 disabled:cursor-default ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-muted hover:bg-foreground/[0.06] hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  );
}
