"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Upload } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { glassStyle } from '@/app/components/dashboard/lib/theme';
import type { ContractForm as ContractFormType, Split } from './contract-utils';
import { createEmptySplit } from './contract-utils';
import ArtistPicker from './ArtistPicker';
import SplitRow from './SplitRow';

type ContractFormProps = {
  form: ContractFormType;
  setForm: React.Dispatch<React.SetStateAction<ContractFormType>>;
  editingContract: any | null;
  artists: any[];
  releases: any[];
  demos: any[];
  saving: boolean;
  uploadingPdf: boolean;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddContributor: () => void;
  onRemoveContributor: (index: number) => void;
  onSetPrimaryContributor: (index: number) => void;
};

export default function ContractForm({
  form,
  setForm,
  editingContract,
  artists,
  releases,
  demos,
  saving,
  uploadingPdf,
  pdfInputRef,
  onSubmit,
  onCancel,
  onPdfUpload,
  onAddContributor,
  onRemoveContributor,
  onSetPrimaryContributor,
}: ContractFormProps) {
  const { showToast } = useToast() as any;

  const totalSplit = form.splits.reduce((s, a) => s + parseFloat(String(a.percentage || 0)), 0);
  const contributorCount = form.splits.length;
  const hasAtLeastOneNamedContributor = form.splits.some(s => s.name?.trim());
  const isSplitValid = totalSplit > 99.9 && totalSplit < 100.1;
  const canSubmit = hasAtLeastOneNamedContributor && isSplitValid && (form.releaseId || form.demoId || form.title?.trim());

  const summaryChipStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '2px',
    fontSize: '9px',
    fontWeight: 950,
    letterSpacing: '1px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.05)',
    color: '#888',
    textTransform: 'uppercase',
  };

  const sectionCardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: '2px',
    padding: '24px',
    background: 'rgba(255,255,255,0.01)',
  };

  return (
    <>
      <style jsx>{`
        .contract-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .split-row-inner {
          display: grid;
          grid-template-columns: 2fr 0.8fr 0.8fr 2fr;
          gap: 10px;
          align-items: end;
        }
        @media (max-width: 768px) {
          .contract-form-grid {
            grid-template-columns: 1fr !important;
          }
          .contract-col-span-2 {
            grid-column: span 1 !important;
          }
          .split-row-inner {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid var(--accent)' }}
      >
        <form onSubmit={onSubmit} className="contract-form-grid">
          {/* STATUS BAR */}
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 950, color: '#f1f1f1', letterSpacing: '0.05em' }}>
                {editingContract ? 'EDIT CONTRACT' : 'NEW CONTRACT'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={summaryChipStyle}>Contributors: {contributorCount}</span>
                <span style={{ ...summaryChipStyle, color: isSplitValid ? 'var(--accent)' : 'var(--status-error)', border: `1px solid ${isSplitValid ? 'rgba(57,255,20,0.2)' : 'rgba(255,0,0,0.2)'}` }}>Split: {totalSplit.toFixed(0)}%</span>
                <span style={{ ...summaryChipStyle, color: canSubmit ? 'var(--accent)' : '#cfcfcf' }}>{canSubmit ? 'READY' : 'INCOMPLETE'}</span>
              </div>
            </div>
          </div>

          {/* SECTION: PARTIES */}
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', fontSize: '9px', fontWeight: 950, color: '#555', letterSpacing: '2px', padding: '8px 0 0 2px' }}>
            PARTIES
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '10px', color: '#666', fontWeight: '800' }}>PRIMARY ARTIST</label>
              <button type="button" onClick={onAddContributor} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', cursor: 'pointer', fontWeight: 800 }}>
                + ADD
              </button>
            </div>
            <ArtistPicker
              artists={artists}
              value={form.artistId}
              onChange={(artist) => {
                const update = {
                  artistId: artist.id,
                  userId: artist.userId || '',
                  primaryArtistName: artist.name,
                  contractDetails: {
                    ...form.contractDetails,
                    artistLegalName: artist.user?.legalName || artist.user?.fullName || '',
                    artistPhone: artist.user?.phoneNumber || '',
                    artistAddress: artist.user?.address || '',
                  },
                };

                const newSplits = [...form.splits];
                if (newSplits.length === 1 && (newSplits[0].name === '' || newSplits[0].name === form.primaryArtistName)) {
                  newSplits[0] = {
                    ...createEmptySplit(),
                    name: artist.name,
                    percentage: 100,
                    userId: artist.userId || '',
                    artistId: artist.id,
                    legalName: artist.user?.legalName || artist.user?.fullName || '',
                    phoneNumber: artist.user?.phoneNumber || '',
                    address: artist.user?.address || '',
                    email: artist.user?.email || '',
                    role: 'primary',
                  };
                }

                setForm({ ...form, ...update, splits: newSplits });
              }}
              onClear={() => setForm({ ...form, artistId: '', userId: '', primaryArtistName: '' })}
            />
            <div style={{ fontSize: '9px', color: '#555', marginTop: '6px' }}>
              Don&apos;t see them? <button type="button" onClick={() => showToast('Go to Artists tab to create a profile first.', "info")} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '9px' }}>Create Profile</button>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>RELEASE / DEMO</label>
            <select
              value={form.releaseId || form.demoId || ''}
              onChange={e => {
                const val = e.target.value;
                const release = releases.find(r => r.id === val);
                const demo = demos.find(d => d.id === val);

                let newSplits = [...form.splits];
                const update = { ...form };

                if (release) {
                  update.releaseId = release.id;
                  update.demoId = '';
                  update.title = '';
                  update.contractDetails = {
                    ...form.contractDetails,
                    songTitles: form.contractDetails.songTitles || release.name || '',
                  };

                  if (release.artistsJson) {
                    try {
                      const parsedArtists = JSON.parse(release.artistsJson);
                      if (Array.isArray(parsedArtists) && parsedArtists.length > 0) {
                        newSplits = parsedArtists.map((a: any) => {
                          const regArtist = artists.find(reg => reg.name === a.name || reg.user?.stageName === a.name);
                          return {
                            ...createEmptySplit(),
                            name: a.name,
                            percentage: Math.floor(100 / parsedArtists.length),
                            userId: regArtist?.user?.id || regArtist?.userId || '',
                            artistId: regArtist?.id || '',
                            legalName: regArtist?.user?.legalName || regArtist?.user?.fullName || '',
                            phoneNumber: regArtist?.user?.phoneNumber || '',
                            address: regArtist?.user?.address || '',
                            email: regArtist?.user?.email || '',
                          };
                        });
                        if (newSplits[0]) {
                          newSplits[0].role = 'primary';
                        }
                        if (parsedArtists[0]) update.primaryArtistName = parsedArtists[0].name;
                      }
                    } catch (e) {
                      console.error("Parse splits error", e);
                    }
                  }
                } else if (demo) {
                  update.releaseId = '';
                  update.demoId = demo.id;
                  update.title = demo.title;
                  update.contractDetails = {
                    ...form.contractDetails,
                    songTitles: form.contractDetails.songTitles || demo.title || '',
                  };
                } else {
                  update.releaseId = '';
                  update.demoId = '';
                }

                update.splits = newSplits;
                setForm(update);
              }}
              style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            >
              <option value="">Optional: Select Release or Approved Demo...</option>
              <optgroup label="Approved Demos (Not Released)">
                {demos.map(d => (
                  <option key={d.id} value={d.id}>DEMO: {d.title} ({new Date(d.createdAt).toLocaleDateString()})</option>
                ))}
              </optgroup>
              <optgroup label="Spotify Releases">
                {releases.map(r => {
                  let displayArtist = r.artistName;
                  if (r.artistsJson) {
                    try {
                      const allArtists = JSON.parse(r.artistsJson);
                      if (Array.isArray(allArtists) && allArtists.length > 0) {
                        displayArtist = allArtists.map((a: any) => a.name).join(', ');
                      }
                    } catch (e) { /* ignore */ }
                  }
                  return <option key={r.id} value={r.id}>RELEASE: {r.name} - {displayArtist}</option>;
                })}
              </optgroup>
            </select>
            <div style={{ marginTop: '10px' }}>
              <input
                placeholder="Or type custom demo/release title (system will auto-match if exists)"
                value={form.title || ''}
                onChange={e => {
                  const rawTitle = e.target.value;
                  const typedTitle = rawTitle.trim();

                  const matchedRelease = releases.find((r: any) => (r.name || '').toLowerCase() === typedTitle.toLowerCase());
                  const matchedDemo = demos.find((d: any) => (d.title || '').toLowerCase() === typedTitle.toLowerCase());

                  if (typedTitle && matchedRelease) {
                    setForm({
                      ...form,
                      title: matchedRelease.name,
                      releaseId: matchedRelease.id,
                      demoId: '',
                      isDemo: false,
                    });
                    return;
                  }

                  if (typedTitle && matchedDemo) {
                    setForm({
                      ...form,
                      title: matchedDemo.title,
                      releaseId: '',
                      demoId: matchedDemo.id,
                      isDemo: true,
                    });
                    return;
                  }

                  setForm({
                    ...form,
                    title: rawTitle,
                    releaseId: '',
                    demoId: '',
                    isDemo: true,
                  });
                }}
                style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
              />
            </div>
          </div>

          {/* SECTION: COMMERCIAL TERMS */}
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', fontSize: '9px', fontWeight: 950, color: '#555', letterSpacing: '2px', padding: '8px 0 0 2px' }}>
            COMMERCIAL TERMS
          </div>

          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ARTIST SHARE (0.0 - 1.0)</label>
            <input
              type="number" step="0.01" min="0" max="1"
              value={form.artistShare}
              onChange={e => {
                const raw = String(e.target.value).replace(',', '.');
                const val = parseFloat(raw);
                if (!isNaN(val) && val >= 0 && val <= 1) {
                  setForm({ ...form, artistShare: val, labelShare: parseFloat((1 - val).toFixed(2)) });
                }
              }}
              style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>
          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>LABEL SHARE (Calculated)</label>
            <input
              type="number" step="0.01" min="0" max="1"
              value={form.labelShare}
              onChange={e => {
                const raw = String(e.target.value).replace(',', '.');
                const val = parseFloat(raw);
                if (!isNaN(val) && val >= 0 && val <= 1) {
                  setForm({ ...form, labelShare: val, artistShare: parseFloat((1 - val).toFixed(2)) });
                }
              }}
              style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>

          {/* SECTION: CONTRACT DETAILS */}
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', fontSize: '9px', fontWeight: 950, color: '#555', letterSpacing: '2px', padding: '8px 0 0 2px' }}>
            CONTRACT DETAILS
          </div>

          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>AGREEMENT REF NO</label>
            <input
              value={form.contractDetails.agreementReferenceNo}
              onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, agreementReferenceNo: e.target.value } })}
              placeholder="LL-2026-0001"
              style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>
          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>EFFECTIVE DATE</label>
            <input
              type="date"
              value={form.contractDetails.effectiveDate}
              onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, effectiveDate: e.target.value } })}
              style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>
          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>DELIVERY DATE</label>
            <input
              type="date"
              value={form.contractDetails.deliveryDate}
              onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, deliveryDate: e.target.value } })}
              style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>
          <div style={sectionCardStyle}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>ISRC (OPTIONAL)</label>
            <input
              value={form.contractDetails.isrc}
              onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, isrc: e.target.value } })}
              placeholder="TR-XXX-26-00001"
              style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', ...sectionCardStyle }}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SONG TITLE(S)</label>
            <input
              value={form.contractDetails.songTitles}
              onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, songTitles: e.target.value } })}
              placeholder="Track A, Track B"
              style={{ width: '100%', padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px' }}
            />
          </div>

          {/* SECTION: ROYALTY SPLITS */}
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', fontSize: '9px', fontWeight: 950, color: '#555', letterSpacing: '2px', padding: '8px 0 0 2px' }}>
            ROYALTY SPLITS
          </div>

          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', ...sectionCardStyle, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#999', fontWeight: '800' }}>ALL CONTRIBUTORS & SPLITS</label>
                <div style={{ fontSize: '9px', color: '#555', marginTop: '4px' }}>
                  First row = primary artist. Add featured artists, producers, writers below.
                </div>
              </div>
              <button
                type="button"
                onClick={onAddContributor}
                className="dash-btn"
                style={{ fontSize: '9px', padding: '6px 12px', letterSpacing: '1px' }}
              >
                + ADD CONTRIBUTOR
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {form.splits.map((split, index) => (
                <SplitRow
                  key={index}
                  split={split}
                  index={index}
                  artists={artists}
                  effectiveShare={((parseFloat(String(split.percentage || 0)) / 100) * form.artistShare * 100).toFixed(1)}
                  onUpdate={(updated) => {
                    const newSplits = form.splits.map((row, rowIndex) => {
                      if (rowIndex !== index) {
                        if (updated.role === 'primary' && row.role === 'primary') {
                          return { ...row, role: 'featured' };
                        }
                        return row;
                      }
                      return updated;
                    });
                    setForm({ ...form, splits: newSplits });
                  }}
                  onRemove={() => onRemoveContributor(index)}
                  onMakePrimary={() => onSetPrimaryContributor(index)}
                  canRemove={form.splits.length > 1}
                />
              ))}
            </div>

            <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '10px', color: isSplitValid ? 'var(--accent)' : 'var(--status-error)' }}>
              TOTAL SPLIT: {totalSplit.toFixed(2)}% {isSplitValid ? '(READY)' : '(MUST BE 100%)'}
            </div>
          </div>

          {/* SECTION: ATTACHMENTS */}
          <div className="contract-col-span-2" style={{ gridColumn: 'span 2', fontSize: '9px', fontWeight: 950, color: '#555', letterSpacing: '2px', padding: '8px 0 0 2px' }}>
            ATTACHMENTS & NOTES
          </div>

          <div style={{ gridColumn: 'span 2', ...sectionCardStyle }}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>SIGNED CONTRACT PDF</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file" accept=".pdf"
                ref={pdfInputRef}
                onChange={onPdfUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="dash-btn"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
              >
                {uploadingPdf ? 'UPLOADING...' : form.pdfUrl ? 'REPLACE PDF' : 'SELECT PDF'}
              </button>
              {form.pdfUrl && (
                <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '800' }}>
                  <CheckCircle size={10} style={{ marginRight: '5px' }} /> PDF UPLOADED
                </div>
              )}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', ...sectionCardStyle }}>
            <label style={{ fontSize: '10px', color: '#666', fontWeight: '800', display: 'block', marginBottom: '8px' }}>NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px', minHeight: '60px' }}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', color: canSubmit ? '#888' : 'var(--status-error)' }}>
              {canSubmit ? 'Form is ready to save.' : 'To save: add at least one artist, provide a selected item or custom title, and make total split exactly 100%.'}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onCancel} className="dash-btn">CANCEL</button>
              <button type="submit" disabled={saving || !canSubmit} className="dash-btn" style={{ background: '#fff', color: '#000', opacity: (saving || !canSubmit) ? 0.6 : 1 }}>
                {saving ? 'SAVING...' : editingContract ? 'SAVE CHANGES' : 'CREATE CONTRACT'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </>
  );
}
