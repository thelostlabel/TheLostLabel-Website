"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Button,
  Toolbar,
  Separator,
  Modal,
  ScrollShadow,
} from '@heroui/react';
import { Upload, Plus } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { usePublicSettings } from '@/app/components/PublicSettingsContext';
import { useDashboardRoute } from '@/app/components/dashboard/hooks/useDashboardRoute';
import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from '@/app/components/dashboard/lib/dashboard-request';
import {
  createEmptySplit,
  createDefaultContractForm,
  hydrateContractForm,
} from './contract-utils';
import type { ContractForm as ContractFormType } from './contract-utils';
import ContractForm from './ContractForm';
import ContractTable from './ContractTable';
import ContractTemplates from './ContractTemplates';
import type { ContractTemplate } from './ContractTemplates';

type ContractsViewProps = {
  contracts: any[];
  onRefresh: () => Promise<void>;
  artists: any[];
  releases: any[];
  demos?: any[];
};

type ContractUploadParsedMetadata = {
  artistShare?: number;
  labelShare?: number;
  extractedTextLength?: number;
  parsedText?: string;
};

type ContractUploadResponse =
  | {
      success: true;
      pdfUrl: string;
      parsedMetadata?: ContractUploadParsedMetadata;
    }
  | {
      success: false;
      error?: string;
      parsedMetadata?: ContractUploadParsedMetadata;
    };

export default function ContractsView({
  contracts,
  onRefresh,
  artists,
  releases,
  demos = [],
}: ContractsViewProps) {
  const { showToast, showConfirm } = useToast() as any;
  const publicSettings = usePublicSettings();
  const { recordId, setRecordId, clearRecordId } = useDashboardRoute();
  const [showAdd, setShowAdd] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContractFormType>(createDefaultContractForm);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Deep link to contract
  useEffect(() => {
    if (!recordId) {
      setEditingContract(null);
      return;
    }
    const contract = contracts.find((c) => c.id === recordId);
    if (contract) {
      setEditingContract(contract);
      setForm(hydrateContractForm(contract));
      setShowAdd(true);
    }
  }, [contracts, recordId]);

  const closeEditor = ({ replace = true } = {}) => {
    setShowAdd(false);
    setEditingContract(null);
    setForm(createDefaultContractForm());
    clearRecordId({ replace });
  };

  const handleBatchAutoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBatchProcessing(true);
    showToast(`Processing ${files.length} contracts...`, 'info');
    let successCount = 0;
    let failCount = 0;

    const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const uploadData = await dashboardRequestJson<ContractUploadResponse>(
          '/api/contracts/upload',
          {
          method: 'POST',
          body: formData,
          context: 'upload contract pdf',
          retry: false,
          }
        );
        if (!uploadData.success) throw new Error(uploadData.error || 'Upload failed');

        const meta = uploadData.parsedMetadata || {};
        const pdfText: string = meta.parsedText || '';

        // STEP 0: DETECT MULTI-LABEL / PARTNER LABEL
        let partnerLabel: any = null;
        const labelName = (publicSettings.brandingFullName || 'THE LOST LABEL').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const headerMatch = pdfText.match(
          new RegExp(`${labelName}\\s*[Xx\\u00d7]\\s*(.+?)(?:\\s*\\n|Exclusive)`, 'i')
        );
        if (headerMatch) {
          const partnerName = headerMatch[1].trim();
          const partnerBlock = pdfText.match(
            new RegExp(
              'Label\\s*-\\s*' +
                partnerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                '[\\s\\S]*?' +
                'Representative:\\s*(.+?)\\n[\\s\\S]*?Address:\\s*(.+?)\\n[\\s\\S]*?Email:\\s*(.+?)\\n(?:[\\s\\S]*?Phone:\\s*(.+?)\\n)?',
              'i'
            )
          );
          partnerLabel = {
            name: partnerName,
            representative: partnerBlock?.[1]?.trim() || '',
            address: partnerBlock?.[2]?.trim() || '',
            email: partnerBlock?.[3]?.trim() || '',
            phone: partnerBlock?.[4]?.trim() || '',
          };
        }

        // STEP 1: EXTRACT DOCUMENT ID, PREPARED DATE, REVENUE SHARE
        const docIdMatch = pdfText.match(/Document ID:\s*(.+?)(?=\s*Prepared:|\n)/i);
        const agreementRef = docIdMatch ? docIdMatch[1].trim() : '';
        const preparedMatch = pdfText.match(/Prepared:\s*(\d{4}-\d{2}-\d{2})/i);
        const preparedDate = preparedMatch
          ? preparedMatch[1]
          : new Date().toISOString().split('T')[0];
        const revenueMatch = pdfText.match(
          /Revenue Share:\s*(\d+)%\s*Artist\s*\/\s*(\d+)%\s*Label/i
        );
        let artistShare = meta.artistShare || 0.5;
        let labelShare = meta.labelShare || 0.5;
        if (revenueMatch) {
          artistShare = parseInt(revenueMatch[1], 10) / 100;
          labelShare = parseInt(revenueMatch[2], 10) / 100;
        }

        // STEP 2: EXTRACT ARTISTS
        const artistInfoBlocks: any[] = [];

        // Strategy A: Full "Primary Artist" blocks
        const blockRegex =
          /Primary Artist\s*-\s*(.+?)[\n\r]+\s*Name:\s*(.+?)[\n\r]+\s*Address:\s*(.+?)[\n\r]+\s*City\/Town:\s*(.+?)[\n\r]+\s*Country:\s*(.+?)[\n\r]+\s*Email:\s*(.+?)[\n\r]+\s*Phone:\s*(.+?)(?=[\n\r])/gi;
        let m;
        while ((m = blockRegex.exec(pdfText)) !== null) {
          const phone = m[7].trim();
          artistInfoBlocks.push({
            stageName: m[1].trim(),
            legalName: m[2].trim(),
            address: [m[3].trim(), m[4].trim(), m[5].trim()].filter(Boolean).join(', '),
            email: m[6].trim(),
            phone: phone === '-' || phone === '' ? '' : phone,
          });
        }

        // Strategy B: p/k/a
        if (artistInfoBlocks.length === 0) {
          const pkaMatches = [
            ...pdfText.matchAll(/(\S.+?)\s+p\/k\/a\s*"?\s*([^"\u201c\u201d\n,]+)"?/gi),
          ];
          for (const pk of pkaMatches) {
            artistInfoBlocks.push({
              stageName: pk[2].trim(),
              legalName: pk[1].trim(),
            });
          }
        }

        // Strategy C: Parse Schedule 1
        let schedule1: any = null;
        const scheduleSection = pdfText.match(
          /SCHEDULE\s*1[\s\S]*?Song Title\(s\)\s*(?:Name of Artist\(s\)[^\n]*?(?:Shares\s*)?[\n\r]+)([\s\S]*?)(?=\n\s*\n|\s*$)/i
        );
        if (scheduleSection) {
          const dataLine = scheduleSection[1].trim();
          const rowMatch =
            dataLine.match(/^(.+?)\s{2,}(.+?)\s{2,}([\d%\s\/]+)$/m) ||
            dataLine.match(
              /^(.+?)\s+([\w!@#$%^&*]+(?:\s*,\s*[\w!@#$%^&*\s]+)*)\s+(\d+%\s*\/\s*\d+%)/m
            );
          if (rowMatch) {
            schedule1 = {
              songTitle: rowMatch[1].trim(),
              artistNames: rowMatch[2].trim().split(/\s*,\s*/),
              sharesRaw: rowMatch[3].trim(),
            };
          }
        }

        if (artistInfoBlocks.length === 0 && schedule1?.artistNames?.length) {
          for (const name of schedule1.artistNames) {
            if (name.trim()) artistInfoBlocks.push({ stageName: name.trim() });
          }
        }

        // STEP 3: EXTRACT & RESOLVE SONG TITLE
        let guessedTitle = '';
        if (schedule1?.songTitle) guessedTitle = schedule1.songTitle;
        if (!guessedTitle && agreementRef) guessedTitle = agreementRef;
        if (!guessedTitle) {
          guessedTitle = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[_\s]+/g, ' ')
            .replace(/\(\d+\)/, '')
            .trim();
        }

        artistInfoBlocks.forEach((a: any) => {
          const sn = a.stageName;
          if (sn && guessedTitle.toLowerCase().endsWith(sn.toLowerCase())) {
            guessedTitle = guessedTitle.substring(0, guessedTitle.length - sn.length).trim();
          }
        });
        guessedTitle = guessedTitle.replace(/[_\s]+$/, '').trim();

        // STEP 4: PARSE SPLIT PERCENTAGES
        let splitPercentages: number[] = [];
        if (schedule1?.sharesRaw) {
          const pcts = schedule1.sharesRaw.match(/(\d+)%/g);
          if (pcts) splitPercentages = pcts.map((p: string) => parseInt(p, 10));
        }

        // STEP 5: FUZZY MATCH TO EXISTING RELEASE
        const targetNorm = normalize(guessedTitle);
        const refNorm = normalize(agreementRef);

        let matchedRelease = (releases || []).find((r: any) => {
          const rNameNorm = normalize(r.name);
          return rNameNorm === targetNorm || rNameNorm === refNorm;
        });
        if (!matchedRelease) {
          matchedRelease = (releases || []).find((r: any) => {
            const rNameNorm = normalize(r.name);
            return (
              (rNameNorm.length > 3 && targetNorm.includes(rNameNorm)) ||
              (targetNorm.length > 3 && rNameNorm.includes(targetNorm))
            );
          });
        }

        if (matchedRelease) guessedTitle = matchedRelease.name;


        // STEP 6: RESOLVE / CREATE ARTISTS
        const resolutionResults: any[] = [];
        for (let i = 0; i < artistInfoBlocks.length; i++) {
          const block = artistInfoBlocks[i];
          if (!block.stageName) continue;

          let existing = artists.find((a: any) => {
            const nameMatch = normalize(a.name) === normalize(block.stageName);
            const legalMatch =
              block.legalName &&
              a.user?.legalName &&
              normalize(a.user.legalName) === normalize(block.legalName);
            const emailMatch =
              block.email &&
              a.user?.email &&
              a.user.email.toLowerCase() === block.email.toLowerCase();
            return nameMatch || legalMatch || emailMatch;
          });

          if (!existing) {
            try {
              existing = await dashboardRequestJson('/api/admin/artists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: block.stageName,
                  email: block.email || null,
                  status: 'active',
                }),
                context: 'create artist',
                retry: false,
              });
              artists.push(existing);
            } catch (createErr) {
              showToast(
                getDashboardErrorMessage(
                  createErr,
                  `Failed to create artist ${block.stageName}`
                ),
                'warning'
              );
            }
          }

          const splitPct =
            splitPercentages[i] || Math.floor(100 / artistInfoBlocks.length);

          resolutionResults.push({
            id: existing?.id || null,
            userId: existing?.userId || null,
            name: block.stageName,
            legalName: block.legalName || existing?.user?.legalName || '',
            email: block.email || existing?.user?.email || '',
            phone: block.phone || existing?.user?.phoneNumber || '',
            address: block.address || existing?.user?.address || '',
            percentage: splitPct,
          });
        }

        const primary = resolutionResults[0];

        // STEP 7: BUILD CONTRACT BODY
        const partnerLabelNote = partnerLabel
          ? `[Partner Label: ${partnerLabel.name}] Rep: ${partnerLabel.representative}, Email: ${partnerLabel.email}, Address: ${partnerLabel.address}${partnerLabel.phone ? ', Phone: ' + partnerLabel.phone : ''}`
          : '';

        const body = {
          releaseId: matchedRelease?.id || null,
          artistId: primary?.id || '',
          userId: primary?.userId || '',
          primaryArtistName: primary?.name || 'Unknown Artist',
          primaryArtistEmail: primary?.email || '',
          title: guessedTitle,
          isDemo: false,
          artistShare,
          labelShare,
          pdfUrl: uploadData.pdfUrl,
          status: 'active',
          contractDetails: {
            agreementReferenceNo: agreementRef,
            effectiveDate: preparedDate,
            deliveryDate: preparedDate,
            isrc: matchedRelease?.isrc || '',
            songTitles: guessedTitle,
            artistLegalName: primary?.legalName || '',
            artistPhone: primary?.phone || '',
            artistAddress: primary?.address || '',
          },
          notes: partnerLabelNote || undefined,
          splits: resolutionResults.map((a, i) => ({
            name: a.name,
            percentage: a.percentage,
            userId: a.userId || '',
            artistId: a.id || '',
            legalName: a.legalName,
            phoneNumber: a.phone,
            address: a.address,
            email: a.email,
            role: i === 0 ? 'primary' : 'featured',
          })),
          featuredArtists: resolutionResults.map((a, i) => ({
            name: a.name,
            percentage: a.percentage,
            userId: a.userId || null,
            artistId: a.id || null,
            legalName: a.legalName,
            phoneNumber: a.phone,
            address: a.address,
            email: a.email,
            role: i === 0 ? 'primary' : 'featured',
          })),
        };

        await dashboardRequestJson('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          context: 'create contract',
          retry: false,
        });
        successCount++;
      } catch (err) {
        showToast(getDashboardErrorMessage(err, `Failed to process ${file.name}`), 'error');
        failCount++;
      }
    }

    await onRefresh?.();
    showToast(
      `Batch complete: ${successCount} added, ${failCount} failed.`,
      successCount > 0 ? 'success' : 'error'
    );
    setBatchProcessing(false);
    if (e.target) e.target.value = '';
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await dashboardRequestJson<ContractUploadResponse>(
        '/api/contracts/upload',
        {
        method: 'POST',
        body: formData,
        context: 'upload contract pdf',
        retry: false,
        }
      );
      if (data.success) {
        setForm({ ...form, pdfUrl: data.pdfUrl });
        showToast('PDF uploaded successfully', 'success');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast(getDashboardErrorMessage(err, 'Error uploading PDF'), 'error');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = '/api/contracts';
      const method = editingContract ? 'PATCH' : 'POST';
      const validSplits = form.splits.filter((s: any) => s.name.trim() !== '');
      const primaryContributor =
        validSplits.find((s: any) => (s.role || '').toLowerCase() === 'primary') ||
        validSplits[0] ||
        null;
      const body: any = {
        ...form,
        contractDetails: {
          ...form.contractDetails,
          artistLegalName:
            primaryContributor?.legalName || form.contractDetails.artistLegalName || '',
          artistPhone:
            primaryContributor?.phoneNumber || form.contractDetails.artistPhone || '',
          artistAddress:
            primaryContributor?.address || form.contractDetails.artistAddress || '',
        },
        splits: validSplits.map((s: any) => ({
          name: s.name,
          percentage: Number(s.percentage || 0),
          userId: s.userId || '',
          artistId: s.artistId || '',
          email: s.email || '',
        })),
        featuredArtists: validSplits.map((s: any, idx: number) => ({
          name: s.name,
          percentage: Number(s.percentage || 0),
          userId: s.userId || null,
          artistId: s.artistId || null,
          email: s.email || null,
          legalName: s.legalName || null,
          phoneNumber: s.phoneNumber || null,
          address: s.address || null,
          role: s.role || (idx === 0 ? 'primary' : 'featured'),
        })),
      };
      if (editingContract) body.id = editingContract.id;

      await dashboardRequestJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        context: editingContract ? 'update contract' : 'create contract',
        retry: false,
      });
      closeEditor();
      showToast(
        `Contract ${editingContract ? 'updated' : 'created'} successfully`,
        'success'
      );
      await onRefresh?.();
    } catch (err) {
      showToast(getDashboardErrorMessage(err, 'Error saving contract'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContract = async (id: string) => {
    showConfirm(
      'DELETE CONTRACT?',
      'Are you sure you want to delete this contract? All linked earnings and data will be lost forever.',
      async () => {
        try {
          await dashboardRequestJson(`/api/contracts?id=${id}`, {
            method: 'DELETE',
            context: 'delete contract',
            retry: false,
          });
          if (editingContract?.id === id) {
            closeEditor();
          }
          showToast('Contract deleted', 'success');
          await onRefresh?.();
        } catch (err) {
          showToast(getDashboardErrorMessage(err, 'Error deleting contract'), 'error');
        }
      }
    );
  };

  const setPrimaryContributor = (targetIndex: number) => {
    setForm((prev: ContractFormType) => {
      const newSplits = prev.splits.map((s: any, idx: number) => ({
        ...s,
        role:
          idx === targetIndex
            ? 'primary'
            : s.role === 'primary'
              ? 'featured'
              : s.role || 'featured',
      }));
      const primary = newSplits[targetIndex];
      return {
        ...prev,
        artistId: primary?.artistId || prev.artistId,
        userId: primary?.userId || prev.userId,
        primaryArtistName: primary?.name || prev.primaryArtistName,
        splits: newSplits,
      };
    });
  };

  const addContributor = () => {
    setForm((prev: ContractFormType) => ({
      ...prev,
      splits: [...prev.splits, createEmptySplit()],
    }));
  };

  const removeContributor = (removeIndex: number) => {
    setForm((prev: ContractFormType) => {
      if (prev.splits.length <= 1) return prev;
      const wasPrimary = prev.splits[removeIndex]?.role === 'primary';
      let newSplits = prev.splits.filter((_: any, idx: number) => idx !== removeIndex);
      if (wasPrimary && newSplits.length > 0) {
        newSplits = newSplits.map((s: any, idx: number) => ({
          ...s,
          role:
            idx === 0
              ? 'primary'
              : s.role === 'primary'
                ? 'featured'
                : s.role || 'featured',
        }));
      }
      const primary = newSplits.find((s: any) => s.role === 'primary') || newSplits[0];
      return {
        ...prev,
        artistId: primary?.artistId || '',
        userId: primary?.userId || '',
        primaryArtistName: primary?.name || '',
        splits: newSplits,
      };
    });
  };

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setForm(hydrateContractForm(contract));
    setShowAdd(true);
    setRecordId(contract.id);
  };

  return (
    <div className="space-y-6">
      {/* Header + Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-black tracking-[0.18em] uppercase text-foreground">
              Contracts
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              {contracts.length} contract{contracts.length !== 1 ? 's' : ''} total. Manage artist agreements and royalty splits.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              multiple
              accept="application/pdf"
              id="batch-upload-pdf"
              className="hidden"
              onChange={handleBatchAutoUpload}
            />
            <Button
              variant="tertiary"
              size="sm"
              onPress={() => document.getElementById('batch-upload-pdf')?.click()}
              isDisabled={batchProcessing}
            >
              <Upload size={14} />
              <span className="hidden sm:inline">{batchProcessing ? 'Processing' : 'Batch Upload'}</span>
              <span className="sm:hidden">{batchProcessing ? '...' : 'Upload'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                setForm(createDefaultContractForm());
                setEditingContract(null);
                clearRecordId({ replace: true });
                setShowAdd(true);
              }}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Contract</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
      </div>

      {/* Contract Form Modal */}
      <Modal.Backdrop isOpen={showAdd} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <Modal.Container>
          <Modal.Dialog className="w-full max-w-4xl h-[90vh] flex flex-col">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {editingContract ? 'Edit Contract' : 'New Contract'}
              </Modal.Heading>
            </Modal.Header>
            <ScrollShadow hideScrollBar className="flex-1 overflow-y-auto px-6 pb-6">
              {!editingContract && (
                <div className="mb-6">
                  <ContractTemplates
                    currentForm={form}
                    onApply={(template: ContractTemplate) => {
                      setForm((prev: ContractFormType) => ({
                        ...prev,
                        artistShare: template.artistShare,
                        labelShare: template.labelShare,
                        notes: template.notes || prev.notes,
                        splits: template.splitPreset.map((sp, i) => ({
                          ...createEmptySplit(),
                          role: sp.role,
                          percentage: sp.percentage,
                          ...(i === 0 && prev.splits[0] ? {
                            name: prev.splits[0].name,
                            userId: prev.splits[0].userId,
                            artistId: prev.splits[0].artistId,
                            email: prev.splits[0].email,
                          } : {}),
                        })),
                      }));
                      showToast(`Template "${template.name}" applied`, 'success');
                    }}
                  />
                </div>
              )}
              <ContractForm
                form={form}
                setForm={setForm}
                editingContract={editingContract}
                artists={artists}
                releases={releases}
                demos={demos}
                saving={saving}
                uploadingPdf={uploadingPdf}
                pdfInputRef={pdfInputRef}
                onSubmit={handleSubmitContract}
                onCancel={() => closeEditor()}
                onPdfUpload={handlePdfUpload}
                onAddContributor={addContributor}
                onRemoveContributor={removeContributor}
                onSetPrimaryContributor={setPrimaryContributor}
              />
            </ScrollShadow>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Table */}
      <ContractTable
        contracts={contracts}
        onEdit={handleEdit}
        onDelete={handleDeleteContract}
      />
    </div>
  );
}
