"use client";
import { motion } from "framer-motion";

const partners = [
    "SPOTIFY", "APPLE MUSIC", "TIKTOK", "YOUTUBE", "INSTAGRAM",
    "AMAZON MUSIC", "DEEZER", "TIDAL", "SOUNDCLOUD", "AUDIOMACK"
];

const PartnerItem = ({ name }) => (
    <div style={{
        margin: "0 40px",
        opacity: 0.4,
        fontSize: "24px",
        fontWeight: "900",
        letterSpacing: "-1px",
        color: "#fff",
        whiteSpace: "nowrap",
        cursor: "default",
        transition: "opacity 0.3s"
    }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.4}
    >
        {name}
    </div>
);

export default function PartnersSection() {
    // Duplicate for infinite scroll
    const marqueeList = [...partners, ...partners, ...partners];

    return (
        <section style={{
            padding: "60px 0",
            background: "#050607",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center"
        }}>

            <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "150px",
                background: "linear-gradient(to right, #050607, transparent)", zIndex: 2
            }} />
            <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "150px",
                background: "linear-gradient(to left, #050607, transparent)", zIndex: 2
            }} />

            <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ display: "flex", alignItems: "center", width: "max-content" }}
            >
                {marqueeList.map((p, i) => (
                    <PartnerItem key={i} name={p} />
                ))}
            </motion.div>
        </section>
    );
}
