import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CheckCircle, Upload } from 'lucide-react';
import { useToast } from '@/app/components/ToastContext';
import { btnStyle, tdStyle, thStyle, glassStyle, inputStyle } from './styles';
import { extractContractMetaAndNotes } from '@/lib/contract-template';

const createEmptySplit = () => ({
    name: '',
    percentage: 0,
    userId: '',
    artistId: '',
    legalName: '',
    phoneNumber: '',
    address: '',
    email: '',
    role: 'featured'
});

const ArtistPicker = ({ artists, value, onChange, placeholder = "Select Artist...", onClear }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef(null);

    // Initial value display logic
    const selectedArtist = artists.find(a => a.id === value);
    const displayValue = searchTerm || (selectedArtist ? selectedArtist.name : '');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredArtists = useMemo(() => {
        return artists.filter(a =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.user?.stageName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [artists, searchTerm]);

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                placeholder={placeholder}
                value={displayValue}
                onFocus={() => {
                    setSearchTerm('');
                    setShowDropdown(true);
                }}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                }}
                style={{ ...inputStyle, padding: '12px 20px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#fff', borderRadius: '2px', width: '100%' }}
            />
            {value && !showDropdown && onClear && (
                <button
                    type="button"
                    onClick={() => { onClear(); setSearchTerm(''); }}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ff4444', fontSize: '16px', cursor: 'pointer' }}
                >×</button>
            )}

            {showDropdown && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2px',
                    maxHeight: '200px', overflowY: 'auto', zIndex: 100,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    marginTop: '5px'
                }}>
                    {filteredArtists.length > 0 ? filteredArtists.map(a => (
                        <div
                            key={a.id}
                            onClick={() => {
                                onChange(a);
                                setSearchTerm('');
                                setShowDropdown(false);
                            }}
                            style={{ padding: '10px', borderBottom: '1px solid #222', cursor: 'pointer', fontSize: '12px', color: '#ccc' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#222'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: 'bold' }}>{a.name}</div>
                            {a.user && <div style={{ fontSize: '10px', color: '#666' }}>{a.user.email} {a.user.stageName ? `(${a.user.stageName})` : ''}</div>}
                        </div>
                    )) : (
                        <div style={{ padding: '10px', color: '#666', fontSize: '12px' }}>No matches found</div>
                    )}
                    <div
                        onClick={() => {
                            if (onClear) onClear();
                            setSearchTerm('');
                            setShowDropdown(false);
                        }}
                        style={{ padding: '10px', borderTop: '1px solid #222', color: 'var(--status-error)', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }}
                    >
                        CLEAR SELECTION
                    </div>
                </div>
            )}
        </div>
    );
};

function SplitRow({ split, index, onUpdate, onRemove, onMakePrimary, artists, effectiveShare, canRemove = true }) {
    const isPrimary = split.role === 'primary';
    return (
        <div style={{
            border: isPrimary ? '1px solid rgba(57,255,20,0.15)' : '1px solid var(--border)',
            borderRadius: '2px',
            background: isPrimary ? 'rgba(57,255,20,0.02)' : 'rgba(255,255,255,0.01)',
            overflow: 'hidden'
        }}>
            {/* Header Bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px',
                background: isPrimary ? 'rgba(57,255,20,0.05)' : 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '8px', fontWeight: 950, padding: '3px 8px', borderRadius: '2px', letterSpacing: '1.5px',
                        background: isPrimary ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isPrimary ? 'var(--accent)' : '#666',
                        border: isPrimary ? '1px solid rgba(57,255,20,0.25)' : '1px solid rgba(255,255,255,0.08)'
                    }}>
                        {(split.role || 'featured').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '10px', color: '#9a9a9a', fontWeight: 800, letterSpacing: '0.04em' }}>
                        #{index + 1} {split.name ? `- ${split.name}` : ''}
                    </span>
                    {effectiveShare && (
                        <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent)', background: 'rgba(57,255,20,0.08)', padding: '2px 8px', borderRadius: '2px' }}>
                            {effectiveShare}% OF TOTAL
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {!isPrimary && (
                        <button type="button" onClick={onMakePrimary}
                            style={{ ...btnStyle, padding: '3px 8px', fontSize: '8px', letterSpacing: '1px' }}>
                            SET PRIMARY
                        </button>
                    )}
                    <button type="button" onClick={onRemove} disabled={!canRemove}
                        style={{ background: 'none', border: 'none', color: canRemove ? 'var(--status-error)' : '#333', cursor: canRemove ? 'pointer' : 'not-allowed', padding: '4px' }}>
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Main Row: Name + Share + Artist Link */}
            <div style={{ padding: '14px 16px', display: 'grid', gap: '12px' }}>
                <div className="split-row-inner">
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>ARTIST NAME</label>
                        <input
                            placeholder="Stage name"
                            value={split.name}
                            onChange={e => {
                                const newName = e.target.value;
                                const match = artists.find(a => a.name.toLowerCase() === newName.toLowerCase());
                                const update = { ...split, name: newName };
                                if (match) {
                                    update.artistId = match.id;
                                    update.userId = match.userId || '';
                                    update.legalName = match.user?.legalName || match.user?.fullName || split.legalName || '';
                                    update.phoneNumber = match.user?.phoneNumber || split.phoneNumber || '';
                                    update.address = match.user?.address || split.address || '';
                                    update.email = match.user?.email || split.email || '';
                                }
                                onUpdate(update);
                            }}
                            style={{ ...inputStyle, padding: '10px 12px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>SHARE %</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number" placeholder="50"
                                value={split.percentage}
                                onChange={e => onUpdate({ ...split, percentage: e.target.value })}
                                style={{ ...inputStyle, padding: '10px 12px', paddingRight: '24px' }}
                            />
                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#444' }}>%</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>ROLE</label>
                        <select
                            value={split.role || 'featured'}
                            onChange={e => onUpdate({ ...split, role: e.target.value })}
                            style={{ ...inputStyle, padding: '10px 12px' }}
                        >
                            <option value="primary">Primary</option>
                            <option value="featured">Featured</option>
                            <option value="producer">Producer</option>
                            <option value="writer">Writer</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>LINK PROFILE</label>
                        <ArtistPicker
                            artists={artists}
                            value={split.artistId}
                            placeholder="Search artist..."
                            onChange={(a) => onUpdate({
                                ...split,
                                artistId: a.id,
                                userId: a.user?.id || '',
                                name: a.name,
                                legalName: a.user?.legalName || a.user?.fullName || split.legalName || '',
                                phoneNumber: a.user?.phoneNumber || split.phoneNumber || '',
                                address: a.user?.address || split.address || '',
                                email: a.user?.email || split.email || ''
                            })}
                            onClear={() => onUpdate({ ...split, artistId: '', userId: '' })}
                        />
                    </div>
                </div>

                {/* Contact Details - Collapsible Look */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>LEGAL NAME</label>
                        <input
                            placeholder="Full legal name"
                            value={split.legalName || ''}
                            onChange={e => onUpdate({ ...split, legalName: e.target.value })}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: '11px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>EMAIL</label>
                        <input
                            placeholder="artist@email.com"
                            value={split.email || ''}
                            onChange={e => onUpdate({ ...split, email: e.target.value })}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: '11px' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>PHONE</label>
                        <input
                            placeholder="+1 234 567 890"
                            value={split.phoneNumber || ''}
                            onChange={e => onUpdate({ ...split, phoneNumber: e.target.value })}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: '11px' }}
                        />
                    </div>
                </div>
                <div>
                    <label style={{ fontSize: '8px', color: '#555', fontWeight: 800, letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>ADDRESS</label>
                    <input
                        placeholder="Full address"
                        value={split.address || ''}
                        onChange={e => onUpdate({ ...split, address: e.target.value })}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '11px' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function ContractsView({ contracts, onRefresh, artists, releases, demos = [] }) {
    const { showToast, showConfirm } = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        userId: '',
        artistId: '',
        primaryArtistName: '', // Fallback for display
        releaseId: '',
        title: '',
        isDemo: false,
        artistShare: 0.70,
        labelShare: 0.30,
        notes: '',
        pdfUrl: '',
        contractDetails: {
            agreementReferenceNo: '',
            effectiveDate: '',
            deliveryDate: '',
            isrc: '',
            songTitles: '',
            artistLegalName: '',
            artistPhone: '',
            artistAddress: ''
        },
        isValid: true,
        splits: [{ ...createEmptySplit(), percentage: 100, role: 'primary' }]
    });
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const pdfInputRef = useRef(null);

    const handleBatchAutoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setBatchProcessing(true);
        showToast(`Processing ${files.length} contracts...`, "info");
        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            try {
                // 1. Upload and Parse PDF
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch('/api/contracts/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (!uploadData.success) throw new Error(uploadData.error || 'Upload failed');


                const meta = uploadData.parsedMetadata || {};
                const pdfText = meta.parsedText || "";
                const normalize = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, '');

                // ============================================================
                // STEP 0: DETECT MULTI-LABEL / PARTNER LABEL
                // ============================================================
                let partnerLabel = null;
                const headerMatch = pdfText.match(/THE LOST LABEL\s*[Xx\u00d7]\s*(.+?)(?:\s*\n|Exclusive)/i);
                if (headerMatch) {
                    const partnerName = headerMatch[1].trim();
                    const partnerBlock = pdfText.match(new RegExp(
                        'Label\\s*-\\s*' + partnerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' +
                        'Representative:\\s*(.+?)\\n[\\s\\S]*?Address:\\s*(.+?)\\n[\\s\\S]*?Email:\\s*(.+?)\\n(?:[\\s\\S]*?Phone:\\s*(.+?)\\n)?',
                        'i'
                    ));
                    partnerLabel = {
                        name: partnerName,
                        representative: partnerBlock?.[1]?.trim() || '',
                        address: partnerBlock?.[2]?.trim() || '',
                        email: partnerBlock?.[3]?.trim() || '',
                        phone: partnerBlock?.[4]?.trim() || ''
                    };
                }

                // ============================================================
                // STEP 1: EXTRACT DOCUMENT ID, PREPARED DATE, REVENUE SHARE
                // ============================================================
                const docIdMatch = pdfText.match(/Document ID:\s*(.+?)(?=\s*Prepared:|\n)/i);
                const agreementRef = docIdMatch ? docIdMatch[1].trim() : '';

                const preparedMatch = pdfText.match(/Prepared:\s*(\d{4}-\d{2}-\d{2})/i);
                const preparedDate = preparedMatch ? preparedMatch[1] : new Date().toISOString().split('T')[0];

                const revenueMatch = pdfText.match(/Revenue Share:\s*(\d+)%\s*Artist\s*\/\s*(\d+)%\s*Label/i);
                let artistShare = meta.artistShare || 0.50;
                let labelShare = meta.labelShare || 0.50;
                if (revenueMatch) {
                    artistShare = parseInt(revenueMatch[1], 10) / 100;
                    labelShare = parseInt(revenueMatch[2], 10) / 100;
                }

                // ============================================================
                // STEP 2: EXTRACT ARTISTS (Multiple Strategies)
                // ============================================================
                const artistInfoBlocks = [];

                // Strategy A: Full "Primary Artist" blocks with contact info
                const blockRegex = /Primary Artist\s*-\s*(.+?)[\n\r]+\s*Name:\s*(.+?)[\n\r]+\s*Address:\s*(.+?)[\n\r]+\s*City\/Town:\s*(.+?)[\n\r]+\s*Country:\s*(.+?)[\n\r]+\s*Email:\s*(.+?)[\n\r]+\s*Phone:\s*(.+?)(?=[\n\r])/gi;
                let m;
                while ((m = blockRegex.exec(pdfText)) !== null) {
                    const phone = m[7].trim();
                    artistInfoBlocks.push({
                        stageName: m[1].trim(),
                        legalName: m[2].trim(),
                        address: [m[3].trim(), m[4].trim(), m[5].trim()].filter(Boolean).join(', '),
                        email: m[6].trim(),
                        phone: (phone === '-' || phone === '') ? '' : phone
                    });
                }

                // Strategy B: p/k/a from "Defined Parties and Scope" section
                if (artistInfoBlocks.length === 0) {
                    const pkaMatches = [...pdfText.matchAll(/(\S.+?)\s+p\/k\/a\s*"?\s*([^"\u201c\u201d\n,]+)"?/gi)];
                    for (const pk of pkaMatches) {
                        artistInfoBlocks.push({
                            stageName: pk[2].trim(),
                            legalName: pk[1].trim()
                        });
                    }
                }

                // Strategy C: Parse Schedule 1 table for artist names
                let schedule1 = null;
                const scheduleSection = pdfText.match(/SCHEDULE\s*1[\s\S]*?Song Title\(s\)\s*(?:Name of Artist\(s\)[^\n]*?(?:Shares\s*)?[\n\r]+)([\s\S]*?)(?=\n\s*\n|\s*$)/i);
                if (scheduleSection) {
                    const dataLine = scheduleSection[1].trim();
                    // Parse rows like: "hxrdstyle_2017 Kanajes, NXGORI! 50% / 50%"
                    const rowMatch = dataLine.match(/^(.+?)\s{2,}(.+?)\s{2,}([\d%\s\/]+)$/m)
                        || dataLine.match(/^(.+?)\s+([\w!@#$%^&*]+(?:\s*,\s*[\w!@#$%^&*\s]+)*)\s+(\d+%\s*\/\s*\d+%)/m);
                    if (rowMatch) {
                        schedule1 = {
                            songTitle: rowMatch[1].trim(),
                            artistNames: rowMatch[2].trim().split(/\s*,\s*/),
                            sharesRaw: rowMatch[3].trim()
                        };
                    }
                }

                // If still no artists from block parsing, use Schedule 1 artist names
                if (artistInfoBlocks.length === 0 && schedule1?.artistNames?.length) {
                    for (const name of schedule1.artistNames) {
                        if (name.trim()) artistInfoBlocks.push({ stageName: name.trim() });
                    }
                }

                // Strategy D: Fallback - search for known artist names in PDF text
                if (artistInfoBlocks.length === 0) {
                    for (const a of artists) {
                        if (a.name && a.name.length > 2 && pdfText.toLowerCase().includes(a.name.toLowerCase())) {
                            artistInfoBlocks.push({
                                stageName: a.name,
                                legalName: a.user?.legalName || '',
                                email: a.user?.email || '',
                                phone: a.user?.phoneNumber || '',
                                address: a.user?.address || ''
                            });
                        }
                    }
                }

                // ============================================================
                // STEP 3: EXTRACT & RESOLVE SONG TITLE
                // ============================================================
                let guessedTitle = "";

                // Priority 1: Schedule 1 song title (most accurate)
                if (schedule1?.songTitle) {
                    guessedTitle = schedule1.songTitle;
                }
                // Priority 2: Document ID (reliable for our contract format)
                if (!guessedTitle && agreementRef) {
                    guessedTitle = agreementRef;
                }
                // Priority 3: Filename fallback
                if (!guessedTitle) {
                    guessedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_\s]+/g, ' ').replace(/\(\d+\)/, '').trim();
                }

                // Clean: If title ends with an artist name (PDF merge artifact), strip it
                artistInfoBlocks.forEach(a => {
                    const sn = a.stageName;
                    if (sn && guessedTitle.toLowerCase().endsWith(sn.toLowerCase())) {
                        guessedTitle = guessedTitle.substring(0, guessedTitle.length - sn.length).trim();
                    }
                });
                guessedTitle = guessedTitle.replace(/[_\s]+$/, '').trim();

                // ============================================================
                // STEP 4: PARSE SPLIT PERCENTAGES FROM SCHEDULE 1
                // ============================================================
                let splitPercentages = [];
                if (schedule1?.sharesRaw) {
                    const pcts = schedule1.sharesRaw.match(/(\d+)%/g);
                    if (pcts) splitPercentages = pcts.map(p => parseInt(p, 10));
                }

                // ============================================================
                // STEP 5: FUZZY MATCH TO EXISTING RELEASE
                // ============================================================
                const targetNorm = normalize(guessedTitle);
                const refNorm = normalize(agreementRef);

                let matchedRelease = (releases || []).find(r => {
                    const rNameNorm = normalize(r.name);
                    return rNameNorm === targetNorm || rNameNorm === refNorm;
                });
                // Partial match: title contains release name or vice versa
                if (!matchedRelease) {
                    matchedRelease = (releases || []).find(r => {
                        const rNameNorm = normalize(r.name);
                        return (rNameNorm.length > 3 && targetNorm.includes(rNameNorm)) ||
                               (targetNorm.length > 3 && rNameNorm.includes(targetNorm));
                    });
                }

                if (matchedRelease) guessedTitle = matchedRelease.name;

                console.log(`[PDF_PARSE] Title: "${guessedTitle}", DocID: "${agreementRef}", Release: ${matchedRelease?.name || 'None'}, Artists: [${artistInfoBlocks.map(a => a.stageName).join(', ')}], Partner: ${partnerLabel?.name || 'None'}, Splits: ${schedule1?.sharesRaw || 'N/A'}`);

                // ============================================================
                // STEP 6: RESOLVE / CREATE ARTISTS
                // ============================================================
                const resolutionResults = [];
                for (let i = 0; i < artistInfoBlocks.length; i++) {
                    const block = artistInfoBlocks[i];
                    if (!block.stageName) continue;

                    // Try matching by stage name, legal name, or email
                    let existing = artists.find(a => {
                        const nameMatch = normalize(a.name) === normalize(block.stageName);
                        const legalMatch = block.legalName && a.user?.legalName &&
                            normalize(a.user.legalName) === normalize(block.legalName);
                        const emailMatch = block.email && a.user?.email &&
                            a.user.email.toLowerCase() === block.email.toLowerCase();
                        return nameMatch || legalMatch || emailMatch;
                    });

                    if (!existing) {
                        try {
                            const createArtistRes = await fetch('/api/admin/artists', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: block.stageName,
                                    email: block.email || null,
                                    status: 'active'
                                })
                            });
                            if (createArtistRes.ok) {
                                existing = await createArtistRes.json();
                                artists.push(existing);
                            }
                        } catch (createErr) {
                            console.warn(`[PDF_PARSE] Failed to create artist: ${block.stageName}`, createErr);
                        }
                    }

                    const splitPct = splitPercentages[i] || Math.floor(100 / artistInfoBlocks.length);

                    resolutionResults.push({
                        id: existing?.id || null,
                        userId: existing?.userId || null,
                        name: block.stageName,
                        legalName: block.legalName || existing?.user?.legalName || '',
                        email: block.email || existing?.user?.email || '',
                        phone: block.phone || existing?.user?.phoneNumber || '',
                        address: block.address || existing?.user?.address || '',
                        percentage: splitPct
                    });
                }

                const primary = resolutionResults[0];

                // ============================================================
                // STEP 7: BUILD CONTRACT BODY
                // ============================================================
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
                        artistAddress: primary?.address || ''
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
                        role: i === 0 ? 'primary' : 'featured'
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
                        role: i === 0 ? 'primary' : 'featured'
                    }))
                };

                const createRes = await fetch('/api/contracts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (createRes.ok) successCount++;
                else failCount++;
            } catch (err) {
                console.error("[BATCH_UPLOAD_ERROR]", err);
                failCount++;
            }
        }

        onRefresh();
        showToast(`Batch complete: ${successCount} added, ${failCount} failed.`, successCount > 0 ? "success" : "error");
        setBatchProcessing(false);
        if (e.target) e.target.value = '';
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPdf(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/contracts/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setForm({ ...form, pdfUrl: data.pdfUrl });
                showToast("PDF uploaded successfully", "success");
            } else {
                showToast(data.error || "Upload failed", "error");
            }
        } catch (e) { showToast("Error uploading PDF", "error"); }
        finally { setUploadingPdf(false); }
    };

    const handleSubmitContract = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = '/api/contracts';
            const method = editingContract ? 'PATCH' : 'POST';
            const validSplits = form.splits.filter(s => s.name.trim() !== '');
            const primaryContributor = validSplits.find((s) => (s.role || '').toLowerCase() === 'primary') || validSplits[0] || null;
            const body = {
                ...form,
                contractDetails: {
                    ...form.contractDetails,
                    artistLegalName: primaryContributor?.legalName || form.contractDetails.artistLegalName || '',
                    artistPhone: primaryContributor?.phoneNumber || form.contractDetails.artistPhone || '',
                    artistAddress: primaryContributor?.address || form.contractDetails.artistAddress || ''
                },
                splits: validSplits.map((s) => ({
                    name: s.name,
                    percentage: Number(s.percentage || 0),
                    userId: s.userId || '',
                    artistId: s.artistId || '',
                    email: s.email || ''
                })),
                featuredArtists: validSplits.map((s, idx) => ({
                    name: s.name,
                    percentage: Number(s.percentage || 0),
                    userId: s.userId || null,
                    artistId: s.artistId || null,
                    email: s.email || null,
                    legalName: s.legalName || null,
                    phoneNumber: s.phoneNumber || null,
                    address: s.address || null,
                    role: s.role || (idx === 0 ? 'primary' : 'featured')
                }))
            };
            if (editingContract) body.id = editingContract.id;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                setShowAdd(false);
                setEditingContract(null);
                showToast(`Contract ${editingContract ? 'updated' : 'created'} successfully`, "success");
                onRefresh();
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to save contract", "error");
            }
        } catch (e) { showToast("Error saving contract", "error"); }
        finally { setSaving(false); }
    };

    const handleDeleteContract = async (id) => {
        showConfirm(
            "DELETE CONTRACT?",
            "Are you sure you want to delete this contract? All linked earnings and data will be lost forever.",
            async () => {
                try {
                    const res = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast("Contract deleted", "success");
                        onRefresh();
                    } else {
                        showToast("Failed to delete contract", "error");
                    }
                } catch (e) {
                    showToast("Error deleting contract", "error");
                }
            }
        );
    };

    const totalSplit = form.splits.reduce((s, a) => s + parseFloat(a.percentage || 0), 0);
    const contributorCount = form.splits.length;
    const hasAtLeastOneNamedContributor = form.splits.some(s => s.name?.trim());
    const isSplitValid = totalSplit > 99.9 && totalSplit < 100.1;
    const canSubmit = hasAtLeastOneNamedContributor && isSplitValid && (form.releaseId || form.demoId || form.title?.trim());
    const summaryChipStyle = {
        padding: '6px 14px',
        borderRadius: '2px',
        fontSize: '9px',
        fontWeight: 950,
        letterSpacing: '1px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.05)',
        color: '#888',
        textTransform: 'uppercase'
    };
    const sectionCardStyle = {
        border: '1px solid var(--border)',
        borderRadius: '2px',
        padding: '24px',
        background: 'rgba(255,255,255,0.01)'
    };

    const setPrimaryContributor = (targetIndex) => {
        setForm(prev => {
            const newSplits = prev.splits.map((s, idx) => ({
                ...s,
                role: idx === targetIndex ? 'primary' : (s.role === 'primary' ? 'featured' : (s.role || 'featured'))
            }));
            const primary = newSplits[targetIndex];
            return {
                ...prev,
                artistId: primary?.artistId || prev.artistId,
                userId: primary?.userId || prev.userId,
                primaryArtistName: primary?.name || prev.primaryArtistName,
                splits: newSplits
            };
        });
    };

    const addContributor = () => {
        setForm(prev => ({
            ...prev,
            splits: [...prev.splits, createEmptySplit()]
        }));
    };

    const removeContributor = (removeIndex) => {
        setForm(prev => {
            if (prev.splits.length <= 1) return prev;
            const wasPrimary = prev.splits[removeIndex]?.role === 'primary';
            let newSplits = prev.splits.filter((_, idx) => idx !== removeIndex);
            if (wasPrimary && newSplits.length > 0) {
                newSplits = newSplits.map((s, idx) => ({
                    ...s,
                    role: idx === 0 ? 'primary' : (s.role === 'primary' ? 'featured' : (s.role || 'featured'))
                }));
            }
            const primary = newSplits.find(s => s.role === 'primary') || newSplits[0];
            return {
                ...prev,
                artistId: primary?.artistId || '',
                userId: primary?.userId || '',
                primaryArtistName: primary?.name || '',
                splits: newSplits
            };
        });
    };

    return (
        <div>
            <style jsx>{`
                .table-row-hover:hover {
                    background-color: rgba(255,255,255,0.02) !important;
                }
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
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    id="batch-upload-pdf"
                    style={{ display: 'none' }}
                    onChange={handleBatchAutoUpload}
                />
                <button
                    onClick={() => document.getElementById('batch-upload-pdf').click()}
                    disabled={batchProcessing}
                    style={{ ...btnStyle, background: 'var(--surface)', color: '#fff', border: '1px solid var(--border)', cursor: batchProcessing ? 'wait' : 'pointer' }}
                >
                    <Upload size={14} /> {batchProcessing ? 'PROCESSING...' : 'BATCH AUTO-UPLOAD'}
                </button>
                <button
                    onClick={() => {
                        if (!showAdd) {
                            setForm({
                                userId: '',
                                artistId: '',
                                primaryArtistName: '',
                                releaseId: '',
                                title: '',
                                isDemo: false,
                                artistShare: 0.70,
                                labelShare: 0.30,
                                notes: '',
                                pdfUrl: '',
                                contractDetails: {
                                    agreementReferenceNo: '',
                                    effectiveDate: '',
                                    deliveryDate: '',
                                    isrc: '',
                                    songTitles: '',
                                    artistLegalName: '',
                                    artistPhone: '',
                                    artistAddress: ''
                                },
                                isValid: true,
                                splits: [{ ...createEmptySplit(), percentage: 100, role: 'primary' }]
                            });
                        }
                        setShowAdd(!showAdd);
                    }}
                    style={{ ...btnStyle, background: 'var(--accent)', color: '#000', border: 'none' }}
                >
                    <Plus size={14} /> NEW CONTRACT
                </button>
            </div>

            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ ...glassStyle, padding: '25px', marginBottom: '30px', border: '1px solid var(--accent)' }}
                >
                    <form onSubmit={handleSubmitContract} className="contract-form-grid">
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
                                <button type="button" onClick={addContributor} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', cursor: 'pointer', fontWeight: 800 }}>
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
                                            artistAddress: artist.user?.address || ''
                                        }
                                    };

                                    let newSplits = [...form.splits];
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
                                            role: 'primary'
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
                                    let update = { ...form };

                                    if (release) {
                                        update.releaseId = release.id;
                                        update.demoId = '';
                                        update.title = '';
                                        update.contractDetails = {
                                            ...form.contractDetails,
                                            songTitles: form.contractDetails.songTitles || release.name || ''
                                        };

                                        if (release.artistsJson) {
                                            try {
                                                const parsedArtists = JSON.parse(release.artistsJson);
                                                if (Array.isArray(parsedArtists) && parsedArtists.length > 0) {
                                                    newSplits = parsedArtists.map(a => {
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
                                                            email: regArtist?.user?.email || ''
                                                        };
                                                    });
                                                    if (newSplits[0]) {
                                                        newSplits[0].role = 'primary';
                                                    }
                                                    if (parsedArtists[0]) update.primaryArtistName = parsedArtists[0].name;
                                                }
                                            } catch (e) { console.error("Parse splits error", e); }
                                        }
                                    } else if (demo) {
                                        update.releaseId = '';
                                        update.demoId = demo.id;
                                        update.title = demo.title;
                                        update.contractDetails = {
                                            ...form.contractDetails,
                                            songTitles: form.contractDetails.songTitles || demo.title || ''
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
                                                    displayArtist = allArtists.map(a => a.name).join(', ');
                                                }
                                            } catch (e) { }
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

                                        const matchedRelease = releases.find((r) => (r.name || '').toLowerCase() === typedTitle.toLowerCase());
                                        const matchedDemo = demos.find((d) => (d.title || '').toLowerCase() === typedTitle.toLowerCase());

                                        if (typedTitle && matchedRelease) {
                                            setForm({
                                                ...form,
                                                title: matchedRelease.name,
                                                releaseId: matchedRelease.id,
                                                demoId: '',
                                                isDemo: false
                                            });
                                            return;
                                        }

                                        if (typedTitle && matchedDemo) {
                                            setForm({
                                                ...form,
                                                title: matchedDemo.title,
                                                releaseId: '',
                                                demoId: matchedDemo.id,
                                                isDemo: true
                                            });
                                            return;
                                        }

                                        setForm({
                                            ...form,
                                            title: rawTitle,
                                            releaseId: '',
                                            demoId: '',
                                            isDemo: true
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
                                    onClick={addContributor}
                                    style={{ ...btnStyle, fontSize: '9px', padding: '6px 12px', letterSpacing: '1px' }}
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
                                        effectiveShare={((parseFloat(split.percentage || 0) / 100) * form.artistShare * 100).toFixed(1)}
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
                                        onRemove={() => removeContributor(index)}
                                        onMakePrimary={() => setPrimaryContributor(index)}
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
                                    onChange={handlePdfUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => pdfInputRef.current?.click()}
                                    style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
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
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '10px', color: canSubmit ? '#888' : 'var(--status-error)' }}>
                                {canSubmit ? 'Form is ready to save.' : 'To save: add at least one artist, provide a selected item or custom title, and make total split exactly 100%.'}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowAdd(false)} style={btnStyle}>CANCEL</button>
                                <button type="submit" disabled={saving || !canSubmit} style={{ ...btnStyle, background: '#fff', color: '#000', opacity: (saving || !canSubmit) ? 0.6 : 1 }}>
                                    {saving ? 'SAVING...' : editingContract ? 'SAVE CHANGES' : 'CREATE CONTRACT'}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 1fr 1.5fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', fontWeight: '900', color: '#666', letterSpacing: '1.5px', background: 'rgba(255,255,255,0.01)' }}>
                    <div>RELEASE</div>
                    <div>ARTIST</div>
                    <div>SPLIT</div>
                    <div>EARNINGS</div>
                    <div>STATUS</div>
                    <div>PDF</div>
                    <div style={{ textAlign: 'right' }}>ACTIONS</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {contracts.map((c, idx) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="table-row-hover"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 1fr 1.5fr',
                                padding: '20px 24px',
                                borderBottom: idx === contracts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                transition: 'background-color 0.15s ease',
                                gap: '15px'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '13px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px' }}>{c.release?.name || c.title || 'Untitled Contract'}</div>
                                <div style={{ fontSize: '9px', color: '#666', fontWeight: '800', letterSpacing: '1px', marginTop: '4px' }}>{c.releaseId ? 'SPOTIFY_RELEASE' : 'MANUAL / DEMO'}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#eaeaea' }}>{c.artist?.name || c.primaryArtistName || c.user?.stageName || 'Unknown Artist'}</div>
                                {c.splits.length > 1 && (
                                    <div style={{ fontSize: '9px', color: '#888', fontWeight: '800', marginTop: '4px' }}>
                                        + {c.splits.length - 1} OTHERS: {c.splits.filter(s => s.name !== (c.primaryArtistName || c.user?.stageName)).map(s => s.name).join(', ')}
                                    </div>
                                )}
                                <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '6px' }}>
                                    {c.user ? (
                                        <span style={{ color: 'var(--accent)', background: 'var(--accent-10)', padding: '2px 6px', borderRadius: '4px' }}>LINKED: {c.user.email}</span>
                                    ) : (
                                        <span style={{ color: '#666' }}>NO ACCOUNT LINKED</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#fff' }}>
                                    ARTIST: <span style={{ color: 'var(--accent)' }}>{Math.round(c.artistShare * 100)}%</span> / LABEL: <span style={{ color: 'var(--accent)' }}>{Math.round(c.labelShare * 100)}%</span>
                                </div>
                                {c.splits?.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {c.splits.map((s, i) => (
                                            <span key={i} style={{ fontSize: '9px', fontWeight: '800', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--border)', color: '#aaa' }}>
                                                {s.name}: <span style={{ color: '#fff' }}>{s.percentage}%</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ fontSize: '12px', fontWeight: '800', color: '#aaa' }}>
                                {c._count?.earnings || 0} Records
                            </div>

                            <div>
                                <span style={{
                                    fontSize: '9px',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: c.status === 'active' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: c.status === 'active' ? 'var(--accent)' : '#888',
                                    border: `1px solid ${c.status === 'active' ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                                    fontWeight: '950',
                                    letterSpacing: '1px',
                                    display: 'inline-block'
                                }}>
                                    {c.status.toUpperCase()}
                                </span>
                            </div>

                            <div>
                                <a href={`/api/files/contract/${c.id}`} target="_blank" rel="noopener noreferrer" style={{
                                    ...btnStyle, padding: '8px 16px', fontSize: '9px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px', display: 'inline-block', textDecoration: 'none'
                                }}>
                                    VIEW PDF
                                </a>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button type="button" onClick={() => {
                                    const { details, userNotes } = extractContractMetaAndNotes(c.notes || '');
                                    let featuredArtists = [];
                                    try {
                                        featuredArtists = c.featuredArtists ? JSON.parse(c.featuredArtists) : [];
                                    } catch {
                                        featuredArtists = [];
                                    }
                                    const featuredByKey = new Map(
                                        featuredArtists.map((f) => [
                                            `${f.artistId || ''}:${f.userId || ''}:${(f.name || '').toLowerCase()}`,
                                            f
                                        ])
                                    );
                                    setEditingContract(c);
                                    const hydratedSplits = (c.splits || []).map((s, idx) => {
                                        const match = featuredByKey.get(`${s.artistId || ''}:${s.userId || ''}:${(s.name || '').toLowerCase()}`);
                                        return {
                                            ...createEmptySplit(),
                                            name: s.name,
                                            percentage: s.percentage,
                                            userId: s.userId || '',
                                            artistId: s.artistId || '',
                                            email: s.email || match?.email || '',
                                            legalName: match?.legalName || s.user?.legalName || s.user?.fullName || s.artist?.user?.legalName || s.artist?.user?.fullName || '',
                                            phoneNumber: match?.phoneNumber || s.user?.phoneNumber || s.artist?.user?.phoneNumber || '',
                                            address: match?.address || s.user?.address || s.artist?.user?.address || '',
                                            role: s.role || (idx === 0 ? 'primary' : 'featured')
                                        };
                                    });

                                    setForm({
                                        userId: c.userId || '',
                                        artistId: c.artistId || '',
                                        primaryArtistName: c.primaryArtistName || '',
                                        releaseId: c.releaseId || '',
                                        isDemo: !c.releaseId,
                                        artistShare: c.artistShare,
                                        labelShare: c.labelShare,
                                        notes: userNotes || '',
                                        pdfUrl: c.pdfUrl || '',
                                        contractDetails: {
                                            agreementReferenceNo: details.agreementReferenceNo || '',
                                            effectiveDate: details.effectiveDate || '',
                                            deliveryDate: details.deliveryDate || '',
                                            isrc: details.isrc || '',
                                            songTitles: details.songTitles || '',
                                            artistLegalName: details.artistLegalName || '',
                                            artistPhone: details.artistPhone || '',
                                            artistAddress: details.artistAddress || ''
                                        },
                                        isValid: true,
                                        splits: hydratedSplits.length > 0 ? hydratedSplits : [{ ...createEmptySplit(), percentage: 100, role: 'primary' }]
                                    });
                                    setShowAdd(true);
                                }} style={{ ...btnStyle, fontSize: '9px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}>EDIT</button>
                                <button type="button" onClick={() => handleDeleteContract(c.id)} style={{ ...btnStyle, fontSize: '9px', padding: '8px 16px', color: '#ff4444', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: '6px', fontWeight: '950', letterSpacing: '1px' }}>DEL</button>
                            </div>
                        </motion.div>
                    ))}
                    {contracts.length === 0 && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>
                            NO CONTRACTS DEFINED
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
