'use client';

import { EmailBlock } from './types';

interface BlockEditorProps {
  block: EmailBlock;
  onChange: (data: Record<string, string>) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const d = block.data;
  const update = (key: string, value: string) => onChange({ ...d, [key]: value });

  const Field = ({ label, value, field, type, placeholder, className }: {
    label: string; value: string; field: string;
    type?: string; placeholder?: string; className?: string;
  }) => (
    <div className={className || ''}>
      <label className="dash-label">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => update(field, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="dash-input resize-y min-h-[80px] font-mono text-[12px]"
        />
      ) : type === 'color' ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || '#111111'}
            onChange={(e) => update(field, e.target.value)}
            className="w-9 h-9 rounded-lg border border-default/10 cursor-pointer bg-transparent p-0.5"
          />
          <input
            value={value}
            onChange={(e) => update(field, e.target.value)}
            className="dash-input flex-1"
            placeholder="#111111"
          />
        </div>
      ) : type === 'number' ? (
        <input
          value={value}
          onChange={(e) => update(field, e.target.value)}
          type="number"
          placeholder={placeholder}
          className="dash-input"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => update(field, e.target.value)}
          placeholder={placeholder}
          className="dash-input"
        />
      )}
    </div>
  );

  const AlignSelect = ({ value, field }: { value: string; field: string }) => (
    <div>
      <label className="dash-label">ALIGN</label>
      <div className="flex rounded-lg border border-default/10 overflow-hidden">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => update(field, a)}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-wide transition-colors ${
              value === a
                ? 'bg-foreground text-background'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );

  const ListStyleSelect = ({ value, field }: { value: string; field: string }) => (
    <div>
      <label className="dash-label">STYLE</label>
      <div className="flex rounded-lg border border-default/10 overflow-hidden">
        {([
          { key: 'bullet', label: 'Bullet' },
          { key: 'number', label: 'Number' },
          { key: 'check', label: 'Check' },
        ] as const).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => update(field, s.key)}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-wide transition-colors ${
              value === s.key
                ? 'bg-foreground text-background'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  switch (block.type) {
    case 'header':
      return (
        <div className="flex flex-col gap-3">
          <Field label="TITLE" value={d.title} field="title" placeholder="{{brandName}}" />
          <Field label="SUBTITLE" value={d.subtitle} field="subtitle" placeholder="Optional subtitle" />
          <Field label="LOGO URL" value={d.logoUrl} field="logoUrl" placeholder="https://..." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="BG COLOR" value={d.bgColor} field="bgColor" type="color" />
            <Field label="TEXT COLOR" value={d.textColor} field="textColor" type="color" />
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="flex flex-col gap-3">
          <Field label="CONTENT" value={d.content} field="content" type="textarea" placeholder="Use {{variable}} for dynamic values" />
          <div className="flex items-end gap-3">
            <AlignSelect value={d.align} field="align" />
            <Field label="FONT SIZE" value={d.fontSize} field="fontSize" type="number" placeholder="15" className="flex-1" />
          </div>
        </div>
      );

    case 'button':
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="BUTTON TEXT" value={d.text} field="text" placeholder="Click Here" />
            <Field label="URL" value={d.url} field="url" placeholder="{{actionUrl}}" />
          </div>
          <div className="flex items-end gap-3">
            <Field label="BG COLOR" value={d.bgColor} field="bgColor" type="color" className="flex-1" />
            <Field label="TEXT COLOR" value={d.textColor} field="textColor" type="color" className="flex-1" />
            <AlignSelect value={d.align} field="align" />
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="flex flex-col gap-3">
          <Field label="IMAGE URL" value={d.src} field="src" placeholder="https://..." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ALT TEXT" value={d.alt} field="alt" placeholder="Image description" />
            <Field label="WIDTH (%)" value={d.width} field="width" type="number" placeholder="100" />
          </div>
        </div>
      );

    case 'spacer':
      return (
        <Field label="HEIGHT (px)" value={d.height} field="height" type="number" placeholder="24" />
      );

    case 'columns':
      return (
        <div className="flex flex-col gap-3">
          <Field label="LEFT COLUMN" value={d.left} field="left" type="textarea" placeholder="Left content" />
          <Field label="RIGHT COLUMN" value={d.right} field="right" type="textarea" placeholder="Right content" />
        </div>
      );

    case 'social':
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SPOTIFY" value={d.spotify} field="spotify" placeholder="https://open.spotify.com/..." />
            <Field label="INSTAGRAM" value={d.instagram} field="instagram" placeholder="https://instagram.com/..." />
            <Field label="TWITTER / X" value={d.twitter} field="twitter" placeholder="https://x.com/..." />
            <Field label="YOUTUBE" value={d.youtube} field="youtube" placeholder="https://youtube.com/..." />
          </div>
          <Field label="WEBSITE" value={d.website} field="website" placeholder="https://..." />
          <AlignSelect value={d.align} field="align" />
        </div>
      );

    case 'footer':
      return (
        <div className="flex flex-col gap-3">
          <Field label="FOOTER TEXT" value={d.text} field="text" type="textarea" placeholder="Footer content..." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="BG COLOR" value={d.bgColor} field="bgColor" type="color" />
            <Field label="TEXT COLOR" value={d.textColor} field="textColor" type="color" />
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="flex flex-col gap-3">
          <Field label="QUOTE" value={d.content} field="content" type="textarea" placeholder="Quote text..." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="AUTHOR" value={d.author} field="author" placeholder="Optional author name" />
            <Field label="BORDER COLOR" value={d.borderColor} field="borderColor" type="color" />
          </div>
        </div>
      );

    case 'list':
      return (
        <div className="flex flex-col gap-3">
          <Field label="ITEMS (one per line)" value={d.items} field="items" type="textarea" placeholder="First item&#10;Second item&#10;Third item" />
          <ListStyleSelect value={d.style} field="style" />
        </div>
      );

    case 'divider':
      return (
        <p className="text-[11px] text-muted m-0">
          Horizontal line separator — no options
        </p>
      );

    default:
      return null;
  }
}
