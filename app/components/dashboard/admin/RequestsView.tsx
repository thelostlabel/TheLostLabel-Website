"use client";
import { useState, useEffect, useMemo, useRef, useCallback, FormEvent } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import { useSession } from 'next-auth/react';
import { useToast } from '@/app/components/ToastContext';
import { Avatar, Button, Dropdown, Input, Label, Table, Chip, TextArea, TextField } from '@heroui/react';
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
import { resolveImageSrc } from '@/app/components/dashboard/artist/lib/shared';

const STATUS_COLOR_MAP: Record<string, string> = {
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
                src={imageSrc}
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

    if (loading) return <div className="text-xs text-muted">LOADING COMMENTS...</div>;

    return (
        <div className="flex flex-col gap-5">
            <div ref={scrollRef} className="max-h-96 overflow-y-auto flex flex-col gap-4 pr-2">
                <div className="self-start max-w-[85%] bg-surface p-4 rounded border border-border">
                    <div className="flex justify-between items-center mb-2 gap-5">
                        <span className="text-[9px] font-black text-accent tracking-widest">INITIAL_REQUEST_DESCRIPTION</span>
                        <span className="text-[8px] text-muted font-black">{new Date(request.createdAt).toLocaleString().toUpperCase()}</span>
                    </div>
                    <div className="text-xs leading-relaxed text-muted italic">{request.details}</div>
                </div>

                {comments.map(c => {
                    const isMe = c.userId === session?.user?.id;
                    const isStaff = c.user?.role === 'admin' || c.user?.role === 'a&r';
                    return (
                        <div key={c.id} className={`max-w-[80%] p-4 rounded border ${isMe ? 'self-end border-border/30 bg-surface/10' : 'self-start border-border/10 bg-black/40'}`}>
                            <div className="flex justify-between items-center mb-2 gap-5">
                                <span className={`text-[9px] font-black tracking-widest ${isStaff ? 'text-accent' : 'text-foreground'}`}>
                                    {c.user?.stageName?.toUpperCase() || c.user?.email?.toUpperCase()} {isStaff ? '// STAFF' : '// ARTIST'}
                                </span>
                                <span className="text-[8px] text-muted font-black">{new Date(c.createdAt).toLocaleString().toUpperCase()}</span>
                            </div>
                            <div className="text-xs leading-relaxed text-foreground/80">{c.content}</div>
                        </div>
                    );
                })}
                {comments.length === 0 && (
                    <div className="text-center py-5 text-muted text-[10px] font-black tracking-widest">NO REPLIES YET</div>
                )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2.5 mt-2.5">
                <TextField fullWidth aria-label="New comment" className="flex-1" value={newComment} onChange={setNewComment}>
                    <Input placeholder="Type your message to the artist..." />
                </TextField>
                <Button
                    type="submit"
                    variant="primary"
                    isDisabled={sending || !newComment.trim()}
                >
                    {sending ? '...' : 'SEND'}
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
        return (
            <div className="flex flex-col">
                <div className="p-6 border-b border-border/10 bg-surface/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onPress={() => setSelectedRequest(null)}>← BACK</Button>
                        <h3 className="text-sm font-black tracking-widest m-0">REQUEST DETAILS</h3>
                    </div>
                    <div className="flex gap-2.5">
                        {!selectedRequest.assignedToId && (
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => handleUpdate(selectedRequest.id, selectedRequest.status, { assignedToId: session?.user?.id })}
                            >
                                ASSIGN TO ME
                            </Button>
                        )}
                        <Chip size="sm" variant="soft" color={STATUS_COLOR_MAP[selectedRequest.status] || 'default'}>
                            <Chip.Label>{selectedRequest.status.toUpperCase()}</Chip.Label>
                        </Chip>
                    </div>
                </div>

                <div className="p-8 flex gap-10">
                    <div className="w-72 flex flex-col gap-5">
                        <div className="w-full aspect-square">
                            <RequestArtwork
                                request={selectedRequest}
                                className="size-full rounded-2xl"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted block mb-1 font-black">RELEASE NAME</label>
                            <div className="text-base font-black mb-1">{selectedRequest.release?.name}</div>
                            <a href={selectedRequest.release?.spotifyUrl} target="_blank" rel="noreferrer" className="text-xs text-accent">OPEN IN SPOTIFY ↗</a>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted block mb-1 font-black">ARTIST / REQUESTER</label>
                            <div className="text-sm font-bold">{selectedRequest.user?.stageName}</div>
                            <div className="text-xs text-muted">{selectedRequest.user?.email}</div>
                        </div>
                        {selectedRequest.assignedTo && (
                            <div>
                                <label className="text-[10px] text-muted block mb-1 font-black">ASSIGNED STAFF</label>
                                <div className="text-xs text-accent font-black">{selectedRequest.assignedTo.stageName || selectedRequest.assignedTo.email}</div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-6">
                        <div>
                            <label className="text-[10px] text-muted block mb-3 font-black tracking-widest">REQUEST_TYPE</label>
                            <Chip size="sm" variant="secondary">
                                <Chip.Label>{selectedRequest.type.toUpperCase().replace('_', ' ')}_CHANGE</Chip.Label>
                            </Chip>
                        </div>

                        <div>
                            <label className="text-[10px] text-muted block mb-3 font-black tracking-widest">DESCRIPTION_&_FILES</label>
                            <div className="bg-surface/5 p-6 border border-border rounded text-sm leading-relaxed whitespace-pre-wrap text-muted min-h-28">
                                {selectedRequest.details}
                            </div>
                        </div>

                        <div>
                            <TextField fullWidth aria-label="Admin note" value={adminNote} onChange={setAdminNote}>
                                <Label className="text-[10px] text-muted font-black">ADMIN NOTE (VISIBLE TO ARTIST)</Label>
                                <TextArea placeholder="Status updates or rejection reason..." />
                            </TextField>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onPress={() => handleUpdate(selectedRequest.id, 'reviewing')}
                                isDisabled={processing === selectedRequest.id}
                            >
                                REVIEWING
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onPress={() => handleUpdate(selectedRequest.id, 'processing')}
                                isDisabled={processing === selectedRequest.id}
                            >
                                PROCESSING
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onPress={() => handleUpdate(selectedRequest.id, 'needs_action')}
                                isDisabled={processing === selectedRequest.id}
                            >
                                NEEDS_ACTION
                            </Button>
                            <Button
                                {...ACTION_BUTTON.approve}
                                className={`flex-1 ${ACTION_BUTTON.approve.className}`}
                                onPress={() => handleUpdate(selectedRequest.id, 'completed')}
                                isDisabled={processing === selectedRequest.id}
                            >
                                COMPLETED
                            </Button>
                            <Button
                                {...ACTION_BUTTON.rejectSolid}
                                className="flex-1"
                                onPress={() => handleUpdate(selectedRequest.id, 'rejected')}
                                isDisabled={processing === selectedRequest.id}
                            >
                                REJECT
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border/10">
                    <h4 className="text-[10px] text-muted font-black mb-5 tracking-widest">CONVERSATION HISTORY</h4>
                    <RequestComments request={selectedRequest} />
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
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <p className="text-muted text-xs font-bold tracking-widest uppercase">NO REQUESTS FOUND</p>
                                </div>
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
