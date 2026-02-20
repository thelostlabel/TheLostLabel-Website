"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

const Particle = ({ style, animate, transition }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={animate}
        transition={transition}
        style={{
            position: "absolute",
            width: "3px",
            height: "3px",
            background: "#ffffff",
            borderRadius: "50%",
            boxShadow: "0 0 8px #ffffff",
            ...style
        }}
    />
);

export default function BackgroundEffects() {
    const [particles, setParticles] = useState([]);
    const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            mouseX.set(x);
            mouseY.set(y);
        };

        window.addEventListener('mousemove', handleMouseMove);

        const timer = setTimeout(() => {
            const generatedParticles = Array.from({ length: 20 }).map((_, i) => ({
                id: i,
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                },
                animate: {
                    opacity: [0, 0.8, 0],
                    scale: [0, Math.random() * 1.5 + 0.5, 0],
                    y: [0, Math.random() * -60 - 20]
                },
                transition: {
                    duration: Math.random() * 4 + 3,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "easeInOut"
                }
            }));
            setParticles(generatedParticles);
        }, 0);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mouseX, mouseY]);

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", background: "#06070a" }}>

            {/* 1. Deep Void Background Gradient (Slightly Lighter for Cosmic Vibe) */}
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at 50% 0%, #1a1b26 0%, #06070a 80%)"
            }} />

            {/* 2. Cold Stark Grid lines (Vertical only for speed/falling effect) */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
                <div style={{ position: "absolute", left: "20%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent, #fff, transparent)" }} />
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, #fff, transparent)" }} />
                <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent, #fff, transparent)" }} />
            </div>

            {/* 3. Subtle Dark Starfield/Dust */}
            <motion.div style={{
                position: "absolute",
                inset: 0,
                x: useSpring(mouseX.get() * -0.5, { stiffness: 40, damping: 30 }),
                y: useSpring(mouseY.get() * -0.5, { stiffness: 40, damping: 30 }),
                backgroundSize: "100px 100px",
                backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)"
            }} />

            {/* 4. Drifting Space Debris (Particles) */}
            <div style={{ position: "absolute", inset: 0 }}>
                {particles.map((p) => (
                    <Particle key={p.id} {...p} />
                ))}
            </div>

        </div>
    );
}
