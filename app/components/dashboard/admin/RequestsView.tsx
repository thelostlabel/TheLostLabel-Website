"use client";
import { useState, useEffect, useMemo, useRef, useCallback, FormEvent } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/ToastContext';
import { Avatar, Button, Card, Dropdown, Input, Label, Table, Chip, TextArea, TextField } from '@heroui/react';
import AdvancedFilter, { type FilterField } from '@/app/components/dashboard/primitives/AdvancedFilter';
import { applyFilters, countActiveFilters, type FilterFieldConfig } from '@/app/components/dashboard/lib/filter-utils';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

interface ArtistUser {
    id?: string;
    email?: string;
    stageName?: string;
    role?: string;
    image?: string;
}

interface Artist {
    image?: string;
}

interface Release {
    id?: string;
    name?: string;
    image?: string;
    spotifyUrl?: string;
}

interface AssignedTo {
    stageName?: string;
    email?: string;
}

export interface Request {
    id: string;
    type: string;
    status: string;
    details?: string;
    adminNote?: string;
    createdAt: string;
    assignedToId?: string | null;
    assignedTo?: AssignedTo | null;
    release?: Release | null;
    user?: (ArtistUser & { artist?: Artist }) | null;
}

interface Comment {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    user?: {
        email?: string;
        stageName?: string;
        role?: string;
    };
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { id: string; label: string }[] = [
    { id: 'all',          label: 'ALL STATUS' },
    { id: 'pending',      label: 'PENDING' },
    { id: 'reviewing',    label: 'REVIEWING' },
    { id: 'processing',   label: 'PROCESSING' },
    { id: 'needs_action', label: 'NEEDS ACTION' },
    { id: 'completed',    label: 'COMPLETED' },
    { id: 'rejected',     label: 'REJECTED' },
];

import { ACTION_BUTTON } from '@/app/components/dashboard/lib/action-styles';
import DashboardEmptyState from '@/app/components/dashboard/primitives/DashboardEmptyState';
import { resolveImageSrc } from '@/app/components/dashboard/artist/lib/shared';

const STATUS_COLOR_MAP: Record<string, 'success' | 'warning' | 'danger' | 'accent' | 'default'> = {
    completed: 'success',
    approved: 'success',
    processing: 'accent',
    reviewing: 'warning',
    needs_action: 'warning',
    rejected: 'danger',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitials = (value: string | null | undefined): string => {
    const normalized = String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase())
        .join('');

    return normalized || 'LO';
};

const getRequestArtworkSrc = (request: Request): string | null => {
    const artistImage = request?.user?.artist?.image;
    if (artistImage) return resolveImageSrc(artistImage, null);
    return resolveImageSrc(request?.release?.image, request?.release?.id || null);
};

const getRequestArtworkLabel = (request: Request): string =>
    request?.user?.stageName || request?.release?.name || 'Request artwork';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface RequestArtworkProps {
    request: Request;
    className?: string;
}

function RequestArtwork({ request, className = 'size-10 rounded-xl' }: RequestArtworkProps) {
    const imageSrc = getRequestArtworkSrc(request);
    const label = getRequestArtworkLabel(request);

    return (
        <Avatar
            className={`${className} shrink-0 border border-border/20 bg-surface`}
            color="accent"
            variant="soft"
        >
            <Avatar.Image
                alt={label}
                className="object-cover"
                loading="lazy"
                src={imageSrc ?? undefined}
            />
            <Avatar.Fallback className="font-black tracking-wide">
                {getInitials(label)}
            </Avatar.Fallback>
        </Avatar>
    );
}

interface RequestCommentsProps {
    request: Request;
}

function formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 0) return time;
    if (diffDays === 1) return `Yesterday ${time}`;
    if (diffDays < 7) return `${date.toLocaleDateString([], { weekday: 'short' })} ${time}`;
    return `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

function RequestComments({ request }: RequestCommentsProps) {
    const requestId = request.id;
    const { data: session } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [sending, setSending] = useState<boolean>(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [requestId]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [comments]);

    const handleSend = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newComment.trim() || sending) return;
        setSending(true);
        try {
            const res = await fetch(`/api/requests/${requestId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });
            const data: Comment = await res.json();
            if (res.ok) {
                setComments((prev) => [...prev, data]);
                setNewComment('');
            }
        } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col flex-1 gap-4 p-5">
                {[1, 2].map((i) => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-default/10" />
                        <div className="flex flex-col gap-1.5">
                            <div className="h-3 w-20 animate-pulse rounded bg-default/10" />
                            <div className="h-16 w-56 animate-pulse rounded-2xl bg-default/10" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1">
            {/* Messages area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto flex flex-col gap-4 px-5 py-5"
            >
                {/* Initial request bubble */}
                <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-default/15 text-[10px] font-black text-foreground/60">
                        {getInitials(request.user?.stageName)}
                    </div>
                    <div className="max-w-[80%]">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-black text-foreground/70">
                                {request.user?.stageName?.toUpperCase() || 'ARTIST'}
                            </span>
                            <span className="text-[10px] font-semibold text-foreground/30">{formatMessageTime(request.createdAt)}</span>
                        </div>
                        <div className="rounded-2xl rounded-tl-sm bg-default/12 px-4 py-3.5">
                            <p className="text-[9px] font-black tracking-[0.15em] text-accent mb-2">INITIAL REQUEST</p>
                            <p className="text-[13px] leading-relaxed text-foreground/75">{request.details}</p>
                        </div>
                    </div>
                </div>

                {comments.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-6">
                        <p className="text-[10px] font-black tracking-widest text-foreground/20">NO REPLIES YET</p>
                    </div>
                )}

                {comments.map((c) => {
                    const isMe = c.userId === session?.user?.id;
                    const isStaff = c.user?.role === 'admin' || c.user?.role === 'a&r';
                    const senderName = c.user?.stageName?.toUpperCase() || c.user?.email?.split('@')[0]?.toUpperCase() || 'USER';

                    return (
                        <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                isStaff ? 'bg-accent/20 text-accent' : 'bg-default/15 text-foreground/60'
                            }`}>
                                {getInitials(c.user?.stageName || c.user?.email)}
                            </div>
                            <div className={`max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                                <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'justify-end' : ''}`}>
                                    <span className={`text-[11px] font-black ${isStaff ? 'text-accent' : 'text-foreground/70'}`}>
                                        {senderName}
                                    </span>
                                    {isStaff && (
                                        <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[8px] font-black text-accent tracking-wider">
                                            STAFF
                                        </span>
                                    )}
                                    <span className="text-[10px] font-semibold text-foreground/30">{formatMessageTime(c.createdAt)}</span>
                                </div>
                                <div className={`rounded-2xl px-4 py-3.5 ${
                                    isMe
                                        ? 'rounded-tr-sm bg-accent/12'
                                        : 'rounded-tl-sm bg-default/12'
                                }`}>
                                    <p className="text-[13px] leading-relaxed text-foreground/90">{c.content}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-border/20 px-5 py-3.5">
                <TextField fullWidth aria-label="New comment" className="flex-1" value={newComment} onChange={setNewComment}>
                    <Input placeholder="Type your message..." className="dash-input" />
                </TextField>
                <Button
                    type="submit"
                    variant="primary"
                    isDisabled={sending || !newComment.trim()}
                    className="shrink-0"
                >
                    {sending ? '...' : 'Send'}
                </Button>
            </form>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface RequestsViewProps {
    requests: Request[];
    onUpdateStatus: (
        id: string,
        status: string,
        adminNote: string,
        assignedToId?: string | null
    ) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Advanced filter configuration
// ---------------------------------------------------------------------------

const REQUEST_TYPE_OPTIONS: { id: string; label: string }[] = [
    { id: 'artwork',       label: 'ARTWORK' },
    { id: 'metadata',      label: 'METADATA' },
    { id: 'distribution',  label: 'DISTRIBUTION' },
    { id: 'takedown',      label: 'TAKEDOWN' },
    { id: 'other',         label: 'OTHER' },
];

const REQUESTS_FILTER_FIELDS: FilterField[] = [
    {
        key: 'search',
        label: 'SEARCH',
        type: 'text',
        placeholder: 'Search by release, artist, details or email...',
    },
    {
        key: 'status',
        label: 'STATUS',
        type: 'select',
        options: STATUS_OPTIONS.filter((o) => o.id !== 'all'),
    },
    {
        key: 'type',
        label: 'TYPE',
        type: 'select',
        options: REQUEST_TYPE_OPTIONS,
    },
    {
        key: 'createdAt',
        label: 'DATE RANGE',
        type: 'daterange',
    },
    {
        key: 'assignedToSearch',
        label: 'ASSIGNED TO',
        type: 'text',
        placeholder: 'Search by staff name or email...',
    },
];

const REQUESTS_FILTER_CONFIGS: FilterFieldConfig[] = [
    {
        key: 'search',
        type: 'text',
        searchFields: ['details', 'user.stageName', 'user.email', 'release.name', 'type'],
    },
    { key: 'status', type: 'select' },
    { key: 'type', type: 'select' },
    { key: 'createdAt', type: 'daterange' },
    {
        key: 'assignedToSearch',
        type: 'text',
        searchFields: ['assignedTo.stageName', 'assignedTo.email'],
    },
];

const DEFAULT_REQUEST_FILTERS: Record<string, any> = {
    search: '',
    status: '',
    type: '',
    createdAt: { start: '', end: '' },
    assignedToSearch: '',
};

export default function RequestsView({ requests, onUpdateStatus }: RequestsViewProps) {
    const { showToast, showConfirm } = useToast();
    const { data: session } = useSession();
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [adminNote, setAdminNote] = useState<string>('');
    const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(DEFAULT_REQUEST_FILTERS);

    const activeFilterCount = useMemo(() => countActiveFilters(advancedFilters), [advancedFilters]);

    const filteredRequests = useMemo(() => {
        // First apply the quick search bar
        let result = requests;
        if (debouncedSearch) {
            const needle = debouncedSearch.toLowerCase();
            result = result.filter(req =>
                req.release?.name?.toLowerCase().includes(needle) ||
                req.user?.stageName?.toLowerCase().includes(needle) ||
                req.type?.toLowerCase().includes(needle)
            );
        }
        // Then apply advanced filters
        return applyFilters(result, advancedFilters, REQUESTS_FILTER_CONFIGS);
    }, [requests, debouncedSearch, advancedFilters]);

    useEffect(() => {
        if (selectedRequest) setAdminNote(selectedRequest.adminNote || '');
    }, [selectedRequest]);

    const handleUpdate = async (id: string, status: string, extra: { assignedToId?: string | null } = {}) => {
        const statusVerb = status === 'reviewing' ? 'start reviewing' :
            status === 'processing' ? 'start processing' :
                status === 'completed' ? 'complete' :
                    status === 'needs_action' ? 'mark as needing action' : status;

        showConfirm(
            `${status.toUpperCase().replace('_', ' ')}?`,
            `Are you sure you want to ${statusVerb} this request? This will notify the user.`,
            async () => {
                setProcessing(id);
                try {
                    await onUpdateStatus(id, status, adminNote, extra.assignedToId);
                    showToast(`Request ${status}`, "success");
                    if (selectedRequest && selectedRequest.id === id) {
                        setSelectedRequest(prev => prev ? ({ ...prev, status, adminNote, ...extra }) : prev);
                    }
                } catch (e) {
                    showToast("Failed to update request", "error");
                } finally {
                    setProcessing(null);
                }
            }
        );
    };

    if (selectedRequest) {
        const isDisabled = processing === selectedRequest.id;

        return (
            <div className="flex flex-col gap-4">
                {/* ── Header ────────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onPress={() => setSelectedRequest(null)}>
                            ← Back
                        </Button>
                        <div className="h-4 w-px bg-border/30 hidden sm:block" />
                        <Chip size="sm" variant="soft" color={STATUS_COLOR_MAP[selectedRequest.status] || 'default'}>
                            <Chip.Label>{selectedRequest.status.replace('_', ' ').toUpperCase()}</Chip.Label>
                        </Chip>
                    </div>
                    {!selectedRequest.assignedToId && (
                        <Button
                            size="sm"
                            variant="primary"
                            onPress={() => handleUpdate(selectedRequest.id, selectedRequest.status, { assignedToId: session?.user?.id })}
                        >
                            Assign to me
                        </Button>
                    )}
                </div>

                {/* ── Main grid: conversation (left) + sidebar (right) ─────── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">

                    {/* ── Conversation (primary workspace) ─────────────────── */}
                    <Card className="overflow-hidden flex flex-col min-h-[600px]">
                        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/20">
                            <RequestArtwork request={selectedRequest} className="size-7 rounded-lg" />
                            <p className="text-[12px] font-black truncate">
                                {selectedRequest.user?.stageName || 'Artist'}
                            </p>
                            <span className="text-[10px] text-muted truncate">
                                {selectedRequest.release?.name || selectedRequest.type.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <RequestComments request={selectedRequest} />
                        </div>
                    </Card>

                    {/* ── Right sidebar ─────────────────────────────────────── */}
                    <div className="flex flex-col gap-5 lg:order-last order-first">

                        {/* Request info — compact, no duplicate avatar */}
                        <Card>
                            <Card.Content className="p-4">
                                <p className="text-[9px] font-black tracking-[0.15em] text-muted mb-3">Request Info</p>
                                <div className="flex flex-col gap-3 text-[11px]">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-muted font-bold">Artist</span>
                                        <span className="font-black">{selectedRequest.user?.stageName}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-muted font-bold">Email</span>
                                        <span className="font-semibold text-muted truncate max-w-[160px]">{selectedRequest.user?.email}</span>
                                    </div>
                                    {selectedRequest.release?.name && (
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-muted font-bold">Release</span>
                                            <span className="font-black truncate max-w-[160px]">{selectedRequest.release.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-muted font-bold">Type</span>
                                        <Chip size="sm" variant="secondary">
                                            <Chip.Label>{selectedRequest.type.replace(/_/g, ' ').toUpperCase()}</Chip.Label>
                                        </Chip>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-muted font-bold">Date</span>
                                        <span className="font-bold">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {selectedRequest.assignedTo && (
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-muted font-bold">Staff</span>
                                            <span className="font-black text-accent">{selectedRequest.assignedTo.stageName || selectedRequest.assignedTo.email}</span>
                                        </div>
                                    )}
                                    {selectedRequest.release?.spotifyUrl && (
                                        <a
                                            href={selectedRequest.release.spotifyUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-accent font-bold mt-1"
                                        >
                                            Open in Spotify ↗
                                        </a>
                                    )}
                                </div>
                            </Card.Content>
                        </Card>

                        {/* Admin note */}
                        <Card>
                            <Card.Content className="p-4">
                                <TextField fullWidth aria-label="Admin note" value={adminNote} onChange={setAdminNote}>
                                    <Label className="dash-label">Admin Note</Label>
                                    <TextArea
                                        placeholder="Visible to artist..."
                                        className="dash-input min-h-20"
                                    />
                                </TextField>
                            </Card.Content>
                        </Card>

                        {/* Actions — active status highlighted */}
                        <Card>
                            <Card.Content className="p-4">
                                <p className="text-[9px] font-black tracking-[0.15em] text-muted mb-3">Update Status</p>
                                <div className="flex flex-col gap-2">
                                    {([
                                        { key: 'reviewing', label: 'Reviewing' },
                                        { key: 'processing', label: 'Processing' },
                                        { key: 'needs_action', label: 'Needs Action' },
                                    ] as const).map(({ key, label }) => (
                                        <Button
                                            key={key}
                                            size="sm"
                                            variant={selectedRequest.status === key ? 'primary' : 'secondary'}
                                            className="w-full"
                                            onPress={() => handleUpdate(selectedRequest.id, key)}
                                            isDisabled={isDisabled}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="border-t border-border pt-3 mt-3 flex gap-2">
                                    <Button
                                        {...ACTION_BUTTON.approve}
                                        size="sm"
                                        className={`flex-1 ${(ACTION_BUTTON.approve as any).className ?? ''}`}
                                        onPress={() => handleUpdate(selectedRequest.id, 'completed')}
                                        isDisabled={isDisabled}
                                    >
                                        Complete
                                    </Button>
                                    <Button
                                        {...ACTION_BUTTON.rejectSolid}
                                        size="sm"
                                        className="flex-1"
                                        onPress={() => handleUpdate(selectedRequest.id, 'rejected')}
                                        isDisabled={isDisabled}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </Card.Content>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-5 items-center flex-wrap">
                <TextField fullWidth aria-label="Search requests" className="flex-1" value={searchTerm} onChange={setSearchTerm}>
                    <Input placeholder="Search by release, artist or type..." />
                </TextField>
            </div>
            <AdvancedFilter
                fields={REQUESTS_FILTER_FIELDS}
                values={advancedFilters}
                onChange={setAdvancedFilters}
                onReset={() => setAdvancedFilters(DEFAULT_REQUEST_FILTERS)}
                activeFilterCount={activeFilterCount}
            />

            <Table aria-label="Requests Table">
                <Table.ScrollContainer>
                    <Table.Content className="min-w-175" selectionMode="none">
                        <Table.Header>
                            <Table.Column isRowHeader id="release">RELEASE / ARTIST</Table.Column>
                            <Table.Column id="type">TYPE</Table.Column>
                            <Table.Column id="date">DATE</Table.Column>
                            <Table.Column id="status">STATUS</Table.Column>
                            <Table.Column id="staff">STAFF</Table.Column>
                            <Table.Column className="text-end" id="actions">ACTION</Table.Column>
                        </Table.Header>
                        <Table.Body
                            items={filteredRequests}
                            renderEmptyState={() => (
                                <DashboardEmptyState
                                    title="No requests found"
                                    description="Artist requests will appear here."
                                />
                            )}
                        >
                            {(req: Request) => (
                                <Table.Row key={req.id} id={req.id}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <RequestArtwork request={req} />
                                            <div>
                                                <div className="text-xs font-black">{req.release?.name}</div>
                                                <div className="text-[10px] text-muted">{req.user?.stageName}</div>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs font-black">{req.type.toUpperCase()}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className="text-xs text-muted">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" variant="soft" color={STATUS_COLOR_MAP[req.status] || 'default'}>
                                            <Chip.Label>{req.status.toUpperCase()}</Chip.Label>
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span className={`text-xs font-black ${req.assignedTo ? 'text-accent' : 'text-muted'}`}>
                                            {req.assignedTo?.stageName || req.assignedTo?.email || 'UNASSIGNED'}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex justify-end">
                                            <Button size="sm" variant="secondary" onPress={() => setSelectedRequest(req)}>
                                                MANAGE
                                            </Button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        </div>
    );
}
