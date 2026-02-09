"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";

const ArtistBadge = ({ artist }) => (
    <Link href={`/artists/${artist.id}`} style={{ textDecoration: 'none' }}>
        <motion.div
            whileHover={{ scale: 1.1, rotate: -2, filter: "brightness(1.2)" }}
            className="glass-premium"
            style={{
                width: "200px",
                height: "280px",
                borderRadius: "100px", // Pill shape
                overflow: "hidden",
                position: "relative",
                margin: "0 20px",
                flexShrink: 0,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)"
            }}
        >
            {artist.image ? (
                <NextImage
                    src={artist.image}
                    alt={artist.name}
                    width={200}
                    height={280}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            ) : (
                <div style={{ width: "100%", height: "100%", background: "#111" }} />
            )}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "20px",
                background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                textAlign: "center"
            }}>
                <h3 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", color: "#fff" }}>{artist.name}</h3>
            </div>
        </motion.div>
    </Link>
);

export default function ArtistsSection() {
    const [artists, setArtists] = useState([]);

    useEffect(() => {
        fetch("/api/artists")
            .then((res) => res.json())
            .then((data) => {
                if (data && Array.isArray(data.artists)) {
                    setArtists(data.artists);
                }
            })
            .catch((err) => {
                console.error("Failed to load artists:", err);
            });
    }, []);

    if (!artists.length) return null;

    // Duplicate list for infinite scroll feel
    // Ensure enough items to scroll
    const marqueeList = [...artists, ...artists, ...artists, ...artists].slice(0, 20);

    return (
        <section style={{ padding: "100px 0", overflow: "hidden", position: "relative" }}>
            <div style={{ textAlign: "center", marginBottom: "60px", padding: "0 24px" }}>
                <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "900", letterSpacing: "-0.02em" }}>
                    THE <span style={{ color: "var(--accent)" }}>ROSTER</span>
                </h2>
            </div>

            <div style={{ display: "flex", width: "100%", overflow: "hidden" }}>
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex", width: "max-content" }}
                >
                    {marqueeList.map((artist, idx) => (
                        <ArtistBadge key={`${artist.id}-${idx}`} artist={artist} />
                    ))}
                </motion.div>
            </div>

            <div style={{
                position: "absolute", top: 0, bottom: 0, left: 0, width: "100px",
                background: "linear-gradient(to right, #050607, transparent)", zIndex: 2, pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", top: 0, bottom: 0, right: 0, width: "100px",
                background: "linear-gradient(to left, #050607, transparent)", zIndex: 2, pointerEvents: "none"
            }} />
        </section>
    );
}
