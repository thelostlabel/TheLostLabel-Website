"use client";
import { motion, useScroll, useTransform } from "framer-motion";

const partners = [
    "SPOTIFY", "APPLE MUSIC", "TIKTOK", "YOUTUBE", "INSTAGRAM",
    "AMAZON MUSIC", "DEEZER", "TIDAL", "SOUNDCLOUD", "AUDIOMACK"
];

const PartnerItem = ({ name, outlined = false }) => (
    <motion.div
        whileHover={{ scale: 1.05, color: "#fff", textShadow: "none", WebkitTextStroke: outlined ? "1px #fff" : "none" }}
        style={{
            margin: "0 30px",
            fontSize: "clamp(32px, 5vw, 64px)",
            fontWeight: "900",
            letterSpacing: "-2px",
            color: outlined ? "transparent" : "rgba(255,255,255,0.4)",
            WebkitTextStroke: outlined ? "1px rgba(255,255,255,0.2)" : "none",
            whiteSpace: "nowrap",
            cursor: "default",
            transition: "all 0.3s ease",
            textTransform: "uppercase"
        }}
    >
        {name}
    </motion.div>
);

export default function PartnersSection() {
    const { scrollYProgress } = useScroll();

    // Create base block and double it for seamless looping
    let baseBlock = [...partners];
    const marqueeList = [...baseBlock, ...baseBlock, ...baseBlock];

    return (
        <section style={{
            padding: "80px 0",
            background: "transparent",
            borderTop: "1px solid rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.02)",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        }}>

            <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "20vw",
                background: "linear-gradient(to right, #06070a, transparent)", zIndex: 2, pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "20vw",
                background: "linear-gradient(to left, #06070a, transparent)", zIndex: 2, pointerEvents: "none"
            }} />

            {/* Row 1: Left to Right */}
            <div style={{ display: "flex", width: "100vw", position: "relative", left: "50%", right: "50%", marginLeft: "-50vw", marginRight: "-50vw" }}>
                <motion.div
                    animate={{ x: ["-50%", "0%"] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex", alignItems: "center", width: "max-content" }}
                >
                    {marqueeList.map((p, i) => (
                        <PartnerItem key={`r1-${i}`} name={p} outlined={i % 2 === 0} />
                    ))}
                </motion.div>
            </div>

            {/* Row 2: Right to Left */}
            <div style={{ display: "flex", width: "100vw", position: "relative", left: "50%", right: "50%", marginLeft: "-50vw", marginRight: "-50vw" }}>
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex", alignItems: "center", width: "max-content" }}
                >
                    {marqueeList.map((p, i) => (
                        <PartnerItem key={`r2-${i}`} name={p} outlined={i % 2 !== 0} />
                    ))}
                </motion.div>
            </div>

        </section>
    );
}
