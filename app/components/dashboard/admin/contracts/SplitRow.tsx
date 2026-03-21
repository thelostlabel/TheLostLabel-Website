"use client";

import { Trash2 } from 'lucide-react';
import type { Split } from './contract-utils';
import ArtistPicker from './ArtistPicker';

type SplitRowProps = {
  split: Split;
  index: number;
  onUpdate: (updated: Split) => void;
  onRemove: () => void;
  onMakePrimary: () => void;
  artists: any[];
  effectiveShare: string;
  canRemove?: boolean;
};

export default function SplitRow({
  split,
  index,
  onUpdate,
  onRemove,
  onMakePrimary,
  artists,
  effectiveShare,
  canRemove = true,
}: SplitRowProps) {
  const isPrimary = split.role === 'primary';
  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        border: isPrimary ? '1px solid rgba(57,255,20,0.15)' : '1px solid var(--border)',
        background: isPrimary ? 'rgba(57,255,20,0.02)' : 'rgba(255,255,255,0.01)',
      }}
    >
      {/* Header Bar */}
      <div
        className="flex justify-between items-center px-4 py-2.5"
        style={{
          background: isPrimary ? 'rgba(57,255,20,0.05)' : 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex gap-2.5 items-center">
          <span
            className="text-[8px] font-[950] py-[3px] px-2 rounded-sm tracking-[1.5px]"
            style={{
              background: isPrimary ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)',
              color: isPrimary ? 'var(--accent)' : '#666',
              border: isPrimary
                ? '1px solid rgba(57,255,20,0.25)'
                : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {(split.role || 'featured').toUpperCase()}
          </span>
          <span className="text-[10px] text-[#9a9a9a] font-[800] tracking-[0.04em]">
            #{index + 1} {split.name ? `- ${split.name}` : ''}
          </span>
          {effectiveShare && (
            <span className="text-[9px] font-[900] text-[var(--accent)] bg-[rgba(57,255,20,0.08)] py-[2px] px-2 rounded-sm">
              {effectiveShare}% OF TOTAL
            </span>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          {!isPrimary && (
            <button type="button" onClick={onMakePrimary} className="dash-btn !py-[3px] !px-2 !text-[8px] !tracking-[1px]">
              SET PRIMARY
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className={`bg-transparent border-none p-1 ${
              canRemove ? 'text-[var(--status-error)] cursor-pointer' : 'text-[#333] cursor-not-allowed'
            }`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Row */}
      <div className="p-4 grid gap-3">
        <div className="split-row-inner">
          <div>
            <label className="dash-label block">ARTIST NAME</label>
            <input
              placeholder="Stage name"
              value={split.name}
              onChange={(e) => {
                const newName = e.target.value;
                const match = artists.find(
                  (a: any) => a.name.toLowerCase() === newName.toLowerCase()
                );
                const update: any = { ...split, name: newName };
                if (match) {
                  update.artistId = match.id;
                  update.userId = match.userId || '';
                  update.legalName =
                    match.user?.legalName || match.user?.fullName || split.legalName || '';
                  update.phoneNumber = match.user?.phoneNumber || split.phoneNumber || '';
                  update.address = match.user?.address || split.address || '';
                  update.email = match.user?.email || split.email || '';
                }
                onUpdate(update);
              }}
              className="dash-input !py-2.5 !px-3"
            />
          </div>
          <div>
            <label className="dash-label block">SHARE %</label>
            <div className="relative">
              <input
                type="number"
                placeholder="50"
                value={split.percentage}
                onChange={(e) => onUpdate({ ...split, percentage: Number(e.target.value) })}
                className="dash-input !py-2.5 !px-3 !pr-6"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#444]">
                %
              </span>
            </div>
          </div>
          <div>
            <label className="dash-label block">ROLE</label>
            <select
              value={split.role || 'featured'}
              onChange={(e) => onUpdate({ ...split, role: e.target.value })}
              className="dash-input !py-2.5 !px-3"
            >
              <option value="primary">Primary</option>
              <option value="featured">Featured</option>
              <option value="producer">Producer</option>
              <option value="writer">Writer</option>
            </select>
          </div>
          <div>
            <label className="dash-label block">LINK PROFILE</label>
            <ArtistPicker
              artists={artists}
              value={split.artistId}
              placeholder="Search artist..."
              onChange={(a) =>
                onUpdate({
                  ...split,
                  artistId: a.id,
                  userId: a.user?.id || '',
                  name: a.name,
                  legalName:
                    a.user?.legalName || a.user?.fullName || split.legalName || '',
                  phoneNumber: a.user?.phoneNumber || split.phoneNumber || '',
                  address: a.user?.address || split.address || '',
                  email: a.user?.email || split.email || '',
                })
              }
              onClear={() => onUpdate({ ...split, artistId: '', userId: '' })}
            />
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="dash-label block">LEGAL NAME</label>
            <input
              placeholder="Full legal name"
              value={split.legalName || ''}
              onChange={(e) => onUpdate({ ...split, legalName: e.target.value })}
              className="dash-input !py-2 !px-2.5 !text-[11px]"
            />
          </div>
          <div>
            <label className="dash-label block">EMAIL</label>
            <input
              placeholder="artist@email.com"
              value={split.email || ''}
              onChange={(e) => onUpdate({ ...split, email: e.target.value })}
              className="dash-input !py-2 !px-2.5 !text-[11px]"
            />
          </div>
          <div>
            <label className="dash-label block">PHONE</label>
            <input
              placeholder="+1 234 567 890"
              value={split.phoneNumber || ''}
              onChange={(e) => onUpdate({ ...split, phoneNumber: e.target.value })}
              className="dash-input !py-2 !px-2.5 !text-[11px]"
            />
          </div>
        </div>
        <div>
          <label className="dash-label block">ADDRESS</label>
          <input
            placeholder="Full address"
            value={split.address || ''}
            onChange={(e) => onUpdate({ ...split, address: e.target.value })}
            className="dash-input !py-2 !px-2.5 !text-[11px]"
          />
        </div>
      </div>
    </div>
  );
}
