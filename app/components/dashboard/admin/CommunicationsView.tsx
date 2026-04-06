import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Loader2, Send, Users, Mail, Eye } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { Button, Card, Chip, Input, SearchField, TextArea, TextField } from '@heroui/react';

const FIELD_CLASS = 'dash-input';

interface ArtistUser {
    email?: string;
}

interface Artist {
    id: string;
    name?: string;
    email?: string;
    user?: ArtistUser;
}

interface SendResults {
    success: boolean;
    successCount: number;
    failureCount: number;
    error?: string;
}

interface CommunicationsViewProps {
    artists?: Artist[];
}

export default function CommunicationsView({ artists: initialArtists }: CommunicationsViewProps) {
    const { showToast } = useToast();
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [sending, setSending] = useState<boolean>(false);
    const [sendToAll, setSendToAll] = useState<boolean>(true);
    const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [results, setResults] = useState<SendResults | null>(null);
    const [artists, setArtists] = useState<Artist[]>(initialArtists || []);
    const [loadingAll, setLoadingAll] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchAllArtists() {
            setLoadingAll(true);
            try {
                const res = await fetch('/api/admin/artists?limit=500');
                const data: { artists?: Artist[] } = await res.json();
                if (!cancelled && data.artists) {
                    setArtists(data.artists);
                }
            } catch (e) {
                console.error('Failed to fetch all artists:', e);
            } finally {
                if (!cancelled) setLoadingAll(false);
            }
        }

        fetchAllArtists();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            showToast('Subject and message are required', 'error');
            return;
        }

        if (!sendToAll && selectedArtistIds.length === 0) {
            showToast('Select at least one artist', 'error');
            return;
        }

        setSending(true);
        setResults(null);
        try {
            const res = await fetch('/api/admin/communications/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    html: message.replace(/\n/g, '<br>'),
                    recipientIds: sendToAll ? null : selectedArtistIds,
                    sendToAll,
                }),
            });

            const data: SendResults = await res.json();
            if (data.success) {
                showToast(`Successfully sent ${data.successCount} emails`, 'success');
                setResults(data);
                if (data.failureCount === 0) {
                    setSubject('');
                    setMessage('');
                    setSelectedArtistIds([]);
                }
            } else {
                showToast(data.error || 'Failed to send emails', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('An error occurred while sending emails', 'error');
        } finally {
            setSending(false);
        }
    };

    const toggleArtist = (id: string) => {
        setSelectedArtistIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const artistsWithEmail = useMemo(() => {
        return artists.filter((artist) => artist.email || artist.user?.email);
    }, [artists]);

    const filteredArtists = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        return artistsWithEmail.filter((artist) =>
            artist.name?.toLowerCase().includes(query) ||
            (artist.email || artist.user?.email)?.toLowerCase().includes(query)
        );
    }, [artistsWithEmail, searchTerm]);

    const selectedRecipientsCount = sendToAll ? artistsWithEmail.length : selectedArtistIds.length;

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
            >
                <Card>
                    <Card.Header className="flex flex-col items-start gap-4 border-b border-border px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-foreground">
                                <Mail size={17} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                                    Communications
                                </p>
                                <Card.Title className="mt-1 text-[18px] font-black tracking-tight text-foreground">
                                    Broadcast Composer
                                </Card.Title>
                            </div>
                        </div>
                        <Card.Description className="max-w-2xl text-[12px] font-semibold leading-relaxed text-muted">
                            Build a branded announcement mail, preview it live, and target all artists or a filtered subset.
                        </Card.Description>
                    </Card.Header>

                    <Card.Content className="px-6 py-6">
                        <form onSubmit={handleSend} className="flex flex-col gap-5">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                        Delivery Mode
                                    </p>
                                    <p className="mt-2 text-[16px] font-black text-foreground">
                                        {sendToAll ? 'All Artists' : 'Selective'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                        Recipients
                                    </p>
                                    <p className="mt-2 text-[16px] font-black text-foreground">
                                        {selectedRecipientsCount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                        Placeholder
                                    </p>
                                    <p className="mt-2 text-[16px] font-black text-foreground">{'{{name}}'}</p>
                                </div>
                            </div>

                            <TextField fullWidth value={subject} onChange={setSubject}>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Subject Line
                                </label>
                                <Input
                                    aria-label="Subject line"
                                    placeholder="New release rollout, payout update, campaign brief..."
                                    className={FIELD_CLASS}
                                    variant="secondary"
                                />
                            </TextField>

                            <TextField fullWidth value={message} onChange={setMessage}>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Message Body
                                </label>
                                <TextArea
                                    aria-label="Message body"
                                    placeholder={'Hello {{name}},\n\nShare the update here...'}
                                    className={`${FIELD_CLASS} min-h-[320px] resize-y leading-7`}
                                    variant="secondary"
                                />
                            </TextField>

                            {results ? (
                                <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-[12px] font-semibold text-foreground">
                                    Last delivery: {results.successCount} sent, {results.failureCount} failed.
                                </div>
                            ) : null}

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                <p className="text-[11px] font-semibold text-muted">
                                    Mail content is converted to HTML line breaks automatically before send.
                                </p>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isDisabled={sending || !subject.trim() || !message.trim()}
                                    className="min-w-[220px]"
                                >
                                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                    {sending ? 'SENDING...' : 'SEND COMMUNICATION'}
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut', delay: 0.04 }}
                className="flex flex-col gap-5 xl:sticky xl:top-6 xl:self-start"
            >
                <Card>
                    <Card.Header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-foreground">
                                <Eye size={15} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Live Preview
                                </p>
                                <p className="text-[13px] font-semibold text-foreground">Right-side mail mock</p>
                            </div>
                        </div>
                        <Chip size="sm" variant="soft" color="default">
                            <Chip.Label>{selectedRecipientsCount} targets</Chip.Label>
                        </Chip>
                    </Card.Header>

                    <Card.Content className="px-5 py-5">
                        <div className="overflow-hidden rounded-[24px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.015)_100%)] p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)]">
                            <div className="rounded-[20px] border border-white/8 bg-[#0f1014] p-5">
                                <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                            {process.env.NEXT_PUBLIC_SITE_FULL_NAME || "ELYSIAN LABEL"} Mailer
                                        </p>
                                        <p className="mt-1 text-[22px] font-black tracking-[0.16em] text-white">
                                            {process.env.NEXT_PUBLIC_SITE_NAME || "ELYSIAN"}.
                                        </p>
                                    </div>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                                        Preview
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                            Subject
                                        </p>
                                        <h3 className="mt-2 text-[18px] font-black leading-tight text-white">
                                            {subject.trim() || 'Your subject will appear here'}
                                        </h3>
                                    </div>

                                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                            Greeting
                                        </p>
                                        <p className="mt-2 text-[13px] font-semibold text-white/85">
                                            Hello {'{{name}}'},
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4">
                                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                            Body
                                        </p>
                                        <div className="whitespace-pre-wrap text-[13px] font-medium leading-7 text-white/82">
                                            {message.trim() || 'Your message preview will render here as you type.'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                                Delivery
                                            </p>
                                            <p className="mt-1 text-[12px] font-semibold text-white/75">
                                                {sendToAll ? 'Sending to all artists with email' : 'Selective artist list'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[18px] font-black text-white">
                                                {selectedRecipientsCount}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                                Recipients
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-5 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-white/28">
                                    Copyright {new Date().getFullYear()} The Lost Label
                                </p>
                            </div>
                        </div>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-foreground">
                                <Users size={15} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Recipients
                                </p>
                                <p className="text-[13px] font-semibold text-foreground">
                                    Filter and target delivery
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={sendToAll ? 'primary' : 'secondary'}
                                onPress={() => setSendToAll(true)}
                            >
                                ALL
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={!sendToAll ? 'primary' : 'secondary'}
                                onPress={() => setSendToAll(false)}
                            >
                                SELECTIVE
                            </Button>
                        </div>
                    </Card.Header>

                    <Card.Content className="flex flex-col gap-4 px-5 py-5">
                        {sendToAll ? (
                            <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                                    Broadcast Scope
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-foreground">
                                    {loadingAll ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                                    {loadingAll
                                        ? 'Loading artist directory...'
                                        : `Targeting all ${artistsWithEmail.length} artists with email`}
                                </div>
                            </div>
                        ) : (
                            <>
                                <SearchField
                                    aria-label="Search artists"
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                >
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder="Search artists by name or email..." />
                                        <SearchField.ClearButton />
                                    </SearchField.Group>
                                </SearchField>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1"
                                        onPress={() => setSelectedArtistIds(artistsWithEmail.map((artist) => artist.id))}
                                    >
                                        SELECT ALL
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1"
                                        onPress={() => setSelectedArtistIds([])}
                                    >
                                        CLEAR
                                    </Button>
                                </div>

                                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                                    {filteredArtists.map((artist) => {
                                        const email = artist.email || artist.user?.email;
                                        const isSelected = selectedArtistIds.includes(artist.id);

                                        return (
                                            <button
                                                key={artist.id}
                                                type="button"
                                                onClick={() => toggleArtist(artist.id)}
                                                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                                                    isSelected
                                                        ? 'border-accent/40 bg-accent/10'
                                                        : 'border-border bg-surface hover:bg-default/5'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className={`truncate text-[13px] font-black ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                                                        {artist.name || 'Unnamed artist'}
                                                    </p>
                                                    <p className="truncate text-[11px] font-semibold text-muted">{email}</p>
                                                </div>
                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                                    isSelected
                                                        ? 'border-accent/40 bg-accent/15 text-foreground'
                                                        : 'border-border bg-default/5 text-muted'
                                                }`}>
                                                    {isSelected ? <Check size={14} strokeWidth={3} /> : <Mail size={13} />}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {filteredArtists.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-[11px] font-black uppercase tracking-[0.16em] text-muted">
                                            No artists found
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        )}
                    </Card.Content>
                </Card>
            </motion.div>
        </div>
    );
}
