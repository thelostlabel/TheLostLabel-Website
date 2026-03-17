import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronRight, X, Star, Zap, Info, PartyPopper, ExternalLink, AlertTriangle } from 'lucide-react';
import { DASHBOARD_THEME } from '@/app/components/dashboard/artist/lib/shared';
import { DashboardAnnouncement } from '../../types';

export default function FeaturedAnnouncements() {
    const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<string[]>([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements');
                const data = await res.json();
                
                // Filter out dismissed ones (stored in localStorage)
                const savedDismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
                setDismissed(savedDismissed);
                
                const activeOnes = (data || []).filter((a: any) => !savedDismissed.includes(a.id));
                setAnnouncements(activeOnes);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const handleDismiss = (id: string) => {
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
        
        // Remove from current list
        setAnnouncements(announcements.filter((a: DashboardAnnouncement) => a.id !== id));
        if (currentIndex >= announcements.length - 1) {
            setCurrentIndex(Math.max(0, announcements.length - 2));
        }
    };

    if (loading || announcements.length === 0) return null;

    const current: DashboardAnnouncement = announcements[currentIndex];
    
    const getTypeStyles = (type: string | undefined) => {
        switch(type) {
            case 'feature': return { icon: <PartyPopper size={20} />, color: '#fbbf24', label: 'NEW FEATURE' };
            case 'important': return { icon: <AlertTriangle size={20} />, color: '#f87171', label: 'IMPORTANT' };
            case 'update': return { icon: <Zap size={20} />, color: '#60a5fa', label: 'UPDATE' };
            default: return { icon: <Info size={20} />, color: '#9ca3af', label: 'NOTICE' };
        }
    };

    const styles = getTypeStyles(current.type);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={current.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{
                    marginBottom: '24px',
                    background: 'rgba(255, 255, 255, 0.95)', // Light background like in the image
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    borderRadius: '20px',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '24px',
                    position: 'relative',
                    color: '#1a1a1a' // Dark text for readability
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '14px', 
                        background: `${styles.color}15`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: styles.color,
                        flexShrink: 0
                    }}>
                        {styles.icon}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ 
                                fontSize: '10px', fontWeight: 800, color: styles.color, 
                                letterSpacing: '0.5px', background: `${styles.color}10`, 
                                padding: '2px 8px', borderRadius: '6px' 
                            }}>
                                {styles.label}
                            </span>
                            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>{current.title}</h4>
                        </div>
                        <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                            {current.content}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {current.linkUrl && (
                        <a 
                            href={current.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                                background: '#fff', 
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                color: '#111',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                        >
                            {current.linkText || 'Learn more'}
                            <ExternalLink size={14} />
                        </a>
                    )}

                    {announcements.length > 1 && (
                        <button 
                            onClick={() => setCurrentIndex((currentIndex + 1) % announcements.length)}
                            style={{ 
                                background: 'transparent', border: '1px solid rgba(0, 0, 0, 0.05)', color: '#6b7280',
                                padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {currentIndex + 1} / {announcements.length}
                        </button>
                    )}

                    <button 
                        onClick={() => handleDismiss(current.id)}
                        style={{ 
                            background: 'transparent', border: 'none', color: '#9ca3af', 
                            padding: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#111'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                        <X size={18} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
