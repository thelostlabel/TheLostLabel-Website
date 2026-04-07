"use client";

import { useState, useEffect, useMemo } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import { createPortal } from 'react-dom';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Edit2, Trash2 } from 'lucide-react';
import {
    Card, Button, Tabs, Input, Chip, Tooltip, TextField, Label, Pagination,
} from '@heroui/react';

import { useToast } from '@/app/components/ToastContext';
import { useDashboardRoute } from '@/app/components/dashboard/hooks/useDashboardRoute';
import { dashboardRequestJson, getDashboardErrorMessage } from '@/app/components/dashboard/lib/dashboard-request';
import DashboardLoader from '@/app/components/dashboard/DashboardLoader';

const PAGE_SIZE = 24;

interface Release {
    id: string;
    name?: string;
    artistName?: string;
    baseTitle?: string;
    versionName?: string;
    releaseDate?: string;
    createdAt?: string;
    image?: string;
    popularity?: number;
    streamCountText?: string;
}

interface ReleasesViewProps {
    releases: Release[];
    onRefresh?: () => Promise<void> | void;
}

export default function ReleasesView({ releases, onRefresh }: ReleasesViewProps) {
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
    const [page, setPage] = useState(1);
    const [editingRelease, setEditingRelease] = useState<Release | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const { recordId, setRecordId, clearRecordId } = useDashboardRoute();

    useEffect(() => {
        if (!recordId) { setEditingRelease(null); return; }
        const release = releases.find(r => r.id === recordId);
        if (release && release.id !== editingRelease?.id) setEditingRelease(release);
    }, [editingRelease?.id, recordId, releases]);

    const { showToast, showConfirm } = useToast();

    // Reset to page 1 when filter or search changes
    useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

    const handleDelete = (id: string): void => {
        showConfirm(
            "DELETE RELEASE?",
            "Are you sure? This will delete the release definition.",
            async () => {
                try {
                    await dashboardRequestJson(`/api/releases/${id}`, { method: 'DELETE', context: 'delete release', retry: false });
                    showToast("Release deleted", "success");
                    clearRecordId({ replace: true });
                    await onRefresh?.();
                } catch (e) { showToast(getDashboardErrorMessage(e, "Error deleting"), "error"); }
            }
        );
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSaving(true);
        try {
            await dashboardRequestJson(`/api/releases/${editingRelease!.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingRelease),
                context: 'update release',
                retry: false
            });
            showToast("Release updated", "success");
            clearRecordId({ replace: true });
            await onRefresh?.();
        } catch (e) { showToast(getDashboardErrorMessage(e, "Error updating"), "error"); }
        finally { setSaving(false); }
    };

    const filteredReleases = useMemo<Release[]>(() => {
        return releases.filter(r => {
            const matchesSearch =
                r.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                r.artistName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                r.baseTitle?.toLowerCase().includes(debouncedSearch.toLowerCase());
            const releaseDate = new Date(r.releaseDate!);
            const now = new Date();
            if (activeTab === 'upcoming') return matchesSearch && releaseDate > now;
            if (activeTab === 'released') return matchesSearch && releaseDate <= now;
            return matchesSearch;
        }).sort((a, b) => {
            const popDiff = (b.popularity || 0) - (a.popularity || 0);
            if (popDiff !== 0) return popDiff;
            return new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime();
        });
    }, [releases, debouncedSearch, activeTab]);

    const totalPages = Math.max(1, Math.ceil(filteredReleases.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * PAGE_SIZE;
    const pageReleases = filteredReleases.slice(startIdx, startIdx + PAGE_SIZE);

    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (safePage > 3) pages.push('ellipsis');
            const start = Math.max(2, safePage - 1);
            const end = Math.min(totalPages - 1, safePage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push('ellipsis');
            pages.push(totalPages);
        }
        return pages;
    };

    const openEdit = (release: Release) => {
        setEditingRelease(release);
        setRecordId(release.id);
    };

    const closeEdit = () => {
        if (!saving) clearRecordId({ replace: true });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
                    <Tabs.ListContainer>
                        <Tabs.List aria-label="Filter releases" className="*:text-[10px] *:font-black *:tracking-widest *:uppercase">
                            <Tabs.Tab id="all">ALL<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="upcoming"><Tabs.Separator />UPCOMING<Tabs.Indicator /></Tabs.Tab>
                            <Tabs.Tab id="released"><Tabs.Separator />RELEASED<Tabs.Indicator /></Tabs.Tab>
                        </Tabs.List>
                    </Tabs.ListContainer>
                </Tabs>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-widest uppercase ds-text-faint">
                        {filteredReleases.length} releases
                    </span>
                    <Input
                        placeholder="Search releases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                </div>
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`page-${safePage}-${activeTab}-${debouncedSearch}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
                >
                    {pageReleases.map((release, idx) => {
                        const isReleased = new Date(release.releaseDate!) <= new Date();
                        const displayTitle = release.baseTitle || release.name || 'Untitled';
                        const displayLabel = release.versionName
                            ? `${displayTitle} (${release.versionName})`
                            : displayTitle;

                        return (
                            <motion.div
                                key={release.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.28, delay: idx * 0.025, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Card className="overflow-hidden p-0 gap-0">
                                    {/* Album Art */}
                                    <div className="relative w-full aspect-square bg-default/5 flex items-center justify-center overflow-hidden">
                                        {release.image ? (
                                            <NextImage
                                                src={release.image.startsWith('private/') ? `/api/files/release/${release.id}` : release.image}
                                                alt={displayTitle}
                                                width={300} height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Disc size={40} className="text-default/20" />
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <Chip size="sm" variant="soft" color={isReleased ? 'default' : 'warning'}>
                                                <Chip.Label>{isReleased ? 'RELEASED' : 'UPCOMING'}</Chip.Label>
                                            </Chip>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col gap-0.5 px-3 pt-2.5 pb-2">
                                        <p className="text-[13px] font-black leading-tight line-clamp-2">
                                            {displayLabel}
                                        </p>
                                        <p className="text-[11px] ds-text-muted font-semibold truncate mt-0.5">
                                            {release.artistName || 'Unknown Artist'}
                                        </p>
                                        <p className="text-[10px] ds-text-faint font-bold tracking-wide mt-1">
                                            {new Date(release.releaseDate || release.createdAt!).toLocaleDateString('tr-TR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/30">
                                        {/* @ts-expect-error HeroUI v3 Tooltip migration pending */}
                                        <Tooltip content="Edit release">
                                            <Button size="sm" variant="ghost" isIconOnly onPress={() => openEdit(release)}>
                                                <Edit2 size={13} />
                                            </Button>
                                        </Tooltip>
                                        {/* @ts-expect-error HeroUI v3 Tooltip migration pending */}
                                        <Tooltip content="Delete release">
                                            <Button size="sm" variant="ghost" isIconOnly className="text-danger hover:bg-danger/10" onPress={() => handleDelete(release.id)}>
                                                <Trash2 size={13} />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* Empty state */}
            {filteredReleases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 ds-text-muted">
                    <Disc size={36} className="opacity-20" />
                    <p className="text-sm font-semibold">No releases found</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-2 pb-4">
                    <Pagination size="sm">
                        <Pagination.Summary className="text-[10px] font-bold tracking-wide uppercase ds-text-faint">
                            {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filteredReleases.length)} of {filteredReleases.length}
                        </Pagination.Summary>
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.Previous isDisabled={safePage === 1} onPress={() => setPage(p => p - 1)}>
                                    <Pagination.PreviousIcon />
                                    <span>Prev</span>
                                </Pagination.Previous>
                            </Pagination.Item>
                            {getPageNumbers().map((p, i) =>
                                p === 'ellipsis' ? (
                                    <Pagination.Item key={`ellipsis-${i}`}>
                                        <Pagination.Ellipsis />
                                    </Pagination.Item>
                                ) : (
                                    <Pagination.Item key={p}>
                                        <Pagination.Link isActive={p === safePage} onPress={() => setPage(p)}>
                                            {p}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                )
                            )}
                            <Pagination.Item>
                                <Pagination.Next isDisabled={safePage === totalPages} onPress={() => setPage(p => p + 1)}>
                                    <span>Next</span>
                                    <Pagination.NextIcon />
                                </Pagination.Next>
                            </Pagination.Item>
                        </Pagination.Content>
                    </Pagination>
                </div>
            )}

            {/* Edit Modal — rendered via portal to escape transform stacking context */}
            {editingRelease && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
                >
                    <Card className="w-full max-w-lg shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        {saving && <DashboardLoader overlay label="SAVING" subLabel="Updating release data..." />}
                        <Card.Header>
                            <Card.Title>Edit Release</Card.Title>
                            <Card.Description className="truncate">{editingRelease.name}</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <form id="edit-release-form" onSubmit={handleSave} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <TextField>
                                        <Label>Release Title</Label>
                                        <Input
                                            value={editingRelease.name || ''}
                                            onChange={(e) => setEditingRelease(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        />
                                    </TextField>
                                    <TextField>
                                        <Label>Artist Name</Label>
                                        <Input
                                            value={editingRelease.artistName || ''}
                                            onChange={(e) => setEditingRelease(prev => prev ? { ...prev, artistName: e.target.value } : null)}
                                        />
                                    </TextField>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <TextField>
                                        <Label>Release Date</Label>
                                        <Input
                                            type="date"
                                            value={editingRelease.releaseDate ? new Date(editingRelease.releaseDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingRelease(prev => prev ? { ...prev, releaseDate: e.target.value } : null)}
                                        />
                                    </TextField>
                                    <TextField>
                                        <Label>Total Streams</Label>
                                        <Input
                                            value={editingRelease.streamCountText || ''}
                                            placeholder="e.g. 1.2M"
                                            onChange={(e) => setEditingRelease(prev => prev ? { ...prev, streamCountText: e.target.value } : null)}
                                        />
                                    </TextField>
                                </div>
                                <TextField>
                                    <Label>Popularity (0–100)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={String(editingRelease.popularity || 0)}
                                        onChange={(e) => setEditingRelease(prev => prev ? { ...prev, popularity: parseInt(e.target.value) } : null)}
                                    />
                                </TextField>
                            </form>
                        </Card.Content>
                        <Card.Footer className="flex justify-end gap-2">
                            <Button variant="ghost" onPress={closeEdit} isDisabled={saving}>
                                Cancel
                            </Button>
                            <Button type="submit" form="edit-release-form" isDisabled={saving}>
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </Card.Footer>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
}
