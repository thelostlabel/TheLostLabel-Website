"use client";

import React from 'react';
import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Select,
  ListBox,
  TextArea,
  Description,
} from '@heroui/react';
import { CheckCircle, Upload, Plus } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import type { ContractForm as ContractFormType } from './contract-utils';
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

  return (
    <div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STATUS BAR */}
        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-2 px-1 pb-2">
            <Chip size="sm">Contributors: {contributorCount}</Chip>
            <Chip variant={isSplitValid ? "soft" : "secondary"} size="sm">
              Split: {totalSplit.toFixed(0)}%
            </Chip>
            <Chip variant={canSubmit ? "soft" : "secondary"} size="sm">
              {canSubmit ? 'Ready' : 'Incomplete'}
            </Chip>
          </div>
        </div>

        {/* SECTION: PARTIES */}
        <div className="md:col-span-2 mt-2">
          <Label className="text-xs font-bold tracking-widest uppercase text-default-400">Parties</Label>
        </div>

        <Card variant="secondary">
          <Card.Header className="flex flex-row justify-between items-center">
            <Card.Title className="text-sm">Primary Artist</Card.Title>
            <Button variant="ghost" size="sm" onPress={onAddContributor}>
              <Plus size={16} className="mr-2" /> Add
            </Button>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
          
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
          
          <Description>
            Don't see them? <Button variant="ghost" size="sm" className="p-0 h-auto text-primary" onPress={() => showToast('Go to Artists tab to create a profile first.', "info")}>Create Profile</Button>
          </Description>
          </Card.Content>
        </Card>

        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">Release / Demo</Card.Title></Card.Header>
          <Card.Content className="flex flex-col gap-4">
          <Select
            placeholder="Select Release or Approved Demo..."
            className="w-full"
            value={form.releaseId || form.demoId || ''}
            onChange={(val) => {
              const valStr = String(val);
              const release = releases.find(r => r.id === valStr);
              const demo = demos.find(d => d.id === valStr);

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
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {demos.length > 0 && (
                  <ListBox.Section>
                    <Label className="px-2 py-1">Approved Demos</Label>
                    {demos.map(d => (
                      <ListBox.Item key={d.id} id={d.id} textValue={`DEMO: ${d.title}`}>
                        <div className="flex flex-col py-1">
                          <span className="text-small font-semibold">DEMO: {d.title}</span>
                          <span className="text-tiny text-muted">{new Date(d.createdAt).toLocaleDateString()}</span>
                        </div>
                      </ListBox.Item>
                    ))}
                  </ListBox.Section>
                )}
                {releases.length > 0 && (
                  <ListBox.Section>
                    <Label className="px-2 py-1">Spotify Releases</Label>
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
                      return (
                        <ListBox.Item key={r.id} id={r.id} textValue={`RELEASE: ${r.name}`}>
                          <div className="flex flex-col py-1">
                            <span className="text-small font-semibold">RELEASE: {r.name}</span>
                            <span className="text-tiny text-muted truncate">{displayArtist}</span>
                          </div>
                        </ListBox.Item>
                      );
                    })}
                  </ListBox.Section>
                )}
              </ListBox>
            </Select.Popover>
          </Select>
          
          <Input 
            placeholder="Or type custom title (auto-match if exists)"
            value={form.title || ''}
            fullWidth
            onChange={(e) => {
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
          />
          </Card.Content>
        </Card>

        {/* SECTION: COMMERCIAL TERMS */}
        <div className="md:col-span-2 mt-2">
          <Label className="text-xs font-bold tracking-widest uppercase text-default-400">Commercial Terms</Label>
        </div>

        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">Artist Share (0.0 – 1.0)</Card.Title></Card.Header>
          <Card.Content className="flex flex-col gap-4">
          <Input
            type="number" step="0.01" min="0" max="1"
            value={form.artistShare}
            fullWidth
            onChange={val => {
              const raw = String(val).replace(',', '.');
              const numVal = parseFloat(raw);
              if (!isNaN(numVal) && numVal >= 0 && numVal <= 1) {
                setForm({ ...form, artistShare: numVal, labelShare: parseFloat((1 - numVal).toFixed(2)) });
              }
            }}
          />
          </Card.Content>
        </Card>

        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">Label Share (Calculated)</Card.Title></Card.Header>
          <Card.Content className="flex flex-col gap-4">
          <Input
            type="number" step="0.01" min="0" max="1"
            value={form.labelShare}
            fullWidth
            onChange={val => {
              const raw = String(val).replace(',', '.');
              const numVal = parseFloat(raw);
              if (!isNaN(numVal) && numVal >= 0 && numVal <= 1) {
                setForm({ ...form, labelShare: numVal, artistShare: parseFloat((1 - numVal).toFixed(2)) });
              }
            }}
          />
          </Card.Content>
        </Card>

        {/* SECTION: CONTRACT DETAILS */}
        <div className="md:col-span-2 mt-2">
          <Label className="text-xs font-bold tracking-widest uppercase text-default-400">Contract Details</Label>
        </div>

        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">Agreement Ref No</Card.Title></Card.Header>
          <Card.Content>
          <Input
            value={form.contractDetails.agreementReferenceNo}
            fullWidth
            onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, agreementReferenceNo: e.target.value } })}
            placeholder="LL-2026-0001"
          />
          </Card.Content>
        </Card>
        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">Effective Date</Card.Title></Card.Header>
          <Card.Content>
          <Input
            type="date"
            fullWidth
            value={form.contractDetails.effectiveDate}
            onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, effectiveDate: e.target.value } })}
          />
          </Card.Content>
        </Card>
        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">Delivery Date</Card.Title></Card.Header>
          <Card.Content>
          <Input
            type="date"
            fullWidth
            value={form.contractDetails.deliveryDate}
            onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, deliveryDate: e.target.value } })}
          />
          </Card.Content>
        </Card>
        <Card variant="secondary">
          <Card.Header><Card.Title className="text-sm">ISRC (Optional)</Card.Title></Card.Header>
          <Card.Content>
          <Input
            fullWidth
            value={form.contractDetails.isrc}
            onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, isrc: e.target.value } })}
            placeholder="TR-XXX-26-00001"
          />
          </Card.Content>
        </Card>
        <Card variant="secondary" className="md:col-span-2">
          <Card.Header><Card.Title className="text-sm">Song Title(s)</Card.Title></Card.Header>
          <Card.Content>
          <Input
            fullWidth
            value={form.contractDetails.songTitles}
            onChange={e => setForm({ ...form, contractDetails: { ...form.contractDetails, songTitles: e.target.value } })}
            placeholder="Track A, Track B"
          />
          </Card.Content>
        </Card>

        {/* SECTION: ROYALTY SPLITS */}
        <div className="md:col-span-2 mt-2">
          <Label className="text-xs font-bold tracking-widest uppercase text-default-400">Royalty Splits</Label>
        </div>

        <Card variant="secondary" className="md:col-span-2">
          <Card.Header className="flex flex-row justify-between items-center">
            <div className="flex flex-col">
              <Card.Title className="text-sm">Splits / Contributors</Card.Title>
              <Card.Description>First row = primary artist. Add featured artists, producers, writers below.</Card.Description>
            </div>
            <Button variant="tertiary" size="sm" onPress={onAddContributor}>
              <Plus size={16} className="mr-2" /> Add Contributor
            </Button>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">

          <div className="grid gap-3 mt-2">
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

          <div className={`mt-4 pt-4 border-t border-white/5 text-right font-bold ${isSplitValid ? 'text-success' : 'text-danger'}`}>
            Total Split: {totalSplit.toFixed(2)}% {isSplitValid ? '✓' : '(Must be 100%)'}
          </div>
          </Card.Content>
        </Card>

        {/* SECTION: ATTACHMENTS */}
        <div className="md:col-span-2 mt-2">
          <Label className="text-xs font-bold tracking-widest uppercase text-default-400">Attachments & Notes</Label>
        </div>

        <Card variant="secondary" className="md:col-span-2">
          <Card.Header><Card.Title className="text-sm">Signed Contract PDF</Card.Title></Card.Header>
          <Card.Content>
          <div className="flex items-center gap-4">
            <input
              type="file" accept=".pdf"
              ref={pdfInputRef}
              onChange={onPdfUpload}
              className="hidden"
            />
            <Button
              variant="tertiary"
              size="sm"
              onPress={() => pdfInputRef.current?.click()}
              className="font-semibold"
            >
              <Upload size={14} className="mr-2" />
              {uploadingPdf ? 'UPLOADING...' : form.pdfUrl ? 'REPLACE PDF' : 'SELECT PDF'}
            </Button>
            {form.pdfUrl && (
              <Chip size="sm" color="success" variant="soft">
                <CheckCircle size={14} className="mr-2" /> PDF Uploaded
              </Chip>
            )}
          </div>
          </Card.Content>
        </Card>

        <Card variant="secondary" className="md:col-span-2">
          <Card.Header><Card.Title className="text-sm">Notes</Card.Title></Card.Header>
          <Card.Content>
          <TextArea
            value={form.notes}
            fullWidth
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="min-h-[100px]"
            placeholder="Optional internal notes about this agreement..."
          />
          </Card.Content>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="md:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 pb-2">
            <Description className={canSubmit ? 'text-default-500' : 'text-danger'}>
              {canSubmit ? 'Form is ready to save.' : 'To save: add artist, provide title, and ensure 100% split.'}
            </Description>
            <div className="flex gap-4">
              <Button variant="secondary" onPress={onCancel}>Cancel</Button>
              <Button type="submit" isDisabled={saving || !canSubmit} variant="primary">
                {saving ? 'Saving...' : editingContract ? 'Save Changes' : 'Create Contract'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
