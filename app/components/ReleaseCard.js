"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReleaseCard({ id, fallbackTitle, fallbackArtist, initialData }) {
    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (initialData) return;

        async function fetchData() {
            try {
                const res = await fetch(`/api/spotify/album/${id}`);
                const json = await res.json();
                if (res.ok && !json.error) {
                    setData(json);
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error("Fetch error:", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        if (id && !id.startsWith('archive')) fetchData();
        else setLoading(false);
    }, [id, initialData]);

    const artist = data?.artist || fallbackArtist;
    const title = data?.name || fallbackTitle;
    const image = data?.image;

    const normalizedImage = image
        ? (image.startsWith('private/') && (initialData?.id || id)
            ? `/api/files/release/${initialData?.id || id}`
            : image)
        : null;

    return (
        <div className="glass" style={{
            padding: '0',
            borderRadius: '0',
            border: '1px solid var(--border)',
            transition: 'var(--transition)',
            overflow: 'hidden'
        }}>
            <div style={{
                background: '#0a0a0a',
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {normalizedImage ? (
                    <>
                        <img
                            src={normalizedImage}
                            alt={title}
                            className="release-image"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.5s ease'
                            }}
                        />
                        {data?.stream_count_text && (
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'var(--accent)',
                                color: '#000',
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: '900',
                                letterSpacing: '1px',
                                borderRadius: '4px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                            }}>
                                {data.stream_count_text} STREAMS
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <span style={{ fontSize: '10px', color: '#1a1a1a', fontWeight: '800', letterSpacing: '5px' }}>
                            {loading ? 'SYNCING...' : error ? 'CONFIG_ERROR' : 'ARCHIVE'}
                        </span>
                    </div>
                )}
            </div>
            <div style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '5px', textTransform: 'uppercase' }}>{artist}</h3>
                <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '800', letterSpacing: '1px', marginBottom: '15px' }}>{title}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>DISTRIBUTED BY LOST</span>
                    {data?.spotify_url ? (
                        <Link href={data.spotify_url} target="_blank" style={{ fontSize: '10px', color: '#fff', fontWeight: '800' }}>SPOTIFY ↗</Link>
                    ) : (
                        <span style={{ fontSize: '10px', color: '#222' }}>LEGACY</span>
                    )}
                </div>
            </div>
            <style jsx>{`
                .glass:hover .release-image {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
