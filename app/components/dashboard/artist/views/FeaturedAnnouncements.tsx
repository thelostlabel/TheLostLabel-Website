"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Info, PartyPopper, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button, Card } from '@heroui/react';
import { DashboardAnnouncement } from '../../types';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; colorClass: string; label: string }> = {
    feature:   { icon: <PartyPopper size={20} />, colorClass: 'text-warning',  label: 'NEW FEATURE' },
    important: { icon: <AlertTriangle size={20} />, colorClass: 'text-danger',  label: 'IMPORTANT' },
    update:    { icon: <Zap size={20} />,          colorClass: 'text-primary', label: 'UPDATE' },
    default:   { icon: <Info size={20} />,         colorClass: 'ds-text-muted', label: 'NOTICE' },
};

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
                const savedDismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
                setDismissed(savedDismissed);
                const activeOnes = (data || []).filter((a: DashboardAnnouncement) => !savedDismissed.includes(a.id));
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
        setAnnouncements(announcements.filter((a) => a.id !== id));
        if (currentIndex >= announcements.length - 1) {
            setCurrentIndex(Math.max(0, announcements.length - 2));
        }
    };

    if (loading || announcements.length === 0) return null;

    const current = announcements[currentIndex];
    const config = TYPE_CONFIG[current.type || 'default'] || TYPE_CONFIG.default;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={current.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
            >
                <Card className="mb-6">
                    <Card.Content className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                        {/* Main content */}
                        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-[14px] bg-default/8 flex items-center justify-center shrink-0 ${config.colorClass}`}>
                                {config.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-extrabold tracking-wider bg-default/8 px-2 py-0.5 rounded-md ${config.colorClass}`}>
                                        {config.label}
                                    </span>
                                    <h4 className="text-[15px] font-bold m-0">{current.title}</h4>
                                </div>
                                <p className="text-[13px] ds-text-muted m-0 leading-relaxed">
                                    {current.content}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                            {current.linkUrl && (
                                <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" className="no-underline">
                                    <Button size="sm" variant="secondary">
                                        {current.linkText || 'Learn more'}
                                        <ExternalLink size={14} />
                                    </Button>
                                </a>
                            )}
                            {announcements.length > 1 && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onPress={() => setCurrentIndex((currentIndex + 1) % announcements.length)}
                                >
                                    {currentIndex + 1} / {announcements.length}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                isIconOnly
                                onPress={() => handleDismiss(current.id)}
                                aria-label="Dismiss announcement"
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    </Card.Content>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
