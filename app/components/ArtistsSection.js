"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";

const ArtistBadge = ({ artist }) => (
    <Link href={`/artists/${artist.id}`} style={{ textDecoration: 'none' }}>
        <motion.div
            whileHover={{ scale: 1.05, rotate: -2, y: -10, filter: "brightness(1.1) contrast(1.1)", zIndex: 10 }}
            className="glass-premium"
            style={{
                width: "220px",
                height: "300px",
                borderRadius: "24px",
                overflow: "hidden",
                position: "relative",
                margin: "0 15px",
                flexShrink: 0,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
        >
            {artist.image ? (
                <NextImage
                    src={artist.image}
                    alt={artist.name}
                    width={220}
                    height={300}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #111, #222)" }} />
            )}
            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "40px 20px 20px",
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end"
            }}>
                <h3 style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{artist.name}</h3>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
                    pointerEvents: "none"
                }}
            />
        </motion.div>
    </Link>
);

export default function ArtistsSection({ artists: propArtists }) {
    const artists = propArtists || [];

    if (!artists.length) return null;

    // Create a block of at least enough elements to properly fill a wide screen multiple times.
    // To have a seamless `-50%` repeat animation, we need exactly two identical halves.
    let baseBlock = [...artists];
    while (baseBlock.length < 8) {
        baseBlock = [...baseBlock, ...artists];
    }

    // We compose the list with TWO identical blocks
    const marqueeList = [...baseBlock, ...baseBlock];

    return (
        <section style={{ padding: "120px 0", overflow: "hidden", position: "relative", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ textAlign: "center", marginBottom: "60px", padding: "0 24px" }}>
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: "900", letterSpacing: "-0.02em" }}
                >
                    THE <span style={{ color: "#fff", fontStyle: "italic" }}>ROSTER</span>
                </motion.h2>
            </div>

            <div style={{ display: "flex", width: "100vw", overflow: "hidden", position: "relative", left: "50%", right: "50%", marginLeft: "-50vw", marginRight: "-50vw" }}>
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 30 * (baseBlock.length / 5), repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex", width: "max-content", padding: "20px 0" }}
                >
                    {marqueeList.map((artist, idx) => (
                        <ArtistBadge key={`${artist.id}-${idx}`} artist={artist} />
                    ))}
                </motion.div>
            </div>

            <div style={{
                position: "absolute", top: 0, bottom: 0, left: 0, width: "15vw",
                background: "linear-gradient(to right, #0a0a0c, transparent)", zIndex: 2, pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", top: 0, bottom: 0, right: 0, width: "15vw",
                background: "linear-gradient(to left, #0a0a0c, transparent)", zIndex: 2, pointerEvents: "none"
            }} />
        </section>
    );
}
