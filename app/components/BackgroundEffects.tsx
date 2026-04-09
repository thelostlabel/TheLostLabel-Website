"use client";
import { useEffect } from "react";
import { motion, useSpring } from "framer-motion";

interface FloatingOrbProps {
  color: string;
  size: string;
  top: string;
  left: string;
  duration: number;
  delay: number;
}

// Floating orbs that drift slowly
const FloatingOrb = ({ color, size, top, left, duration, delay }: FloatingOrbProps) => (
  <motion.div
    animate={{
      y: [0, -40, 10, -20, 0],
      x: [0, 20, -15, 25, 0],
      scale: [1, 1.15, 0.95, 1.1, 1],
      opacity: [0.4, 0.7, 0.5, 0.8, 0.4],
    }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    style={{
      position: "absolute",
      top, left,
      width: size, height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: "blur(80px)",
      pointerEvents: "none",
    }}
  />
);

export default function BackgroundEffects() {
  const mouseX = useSpring(0, { stiffness: 20, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 20, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", background: "#050507" }}>

      {/* Base gradient — deep space */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(170deg, #0a0b12 0%, #050507 35%, #08070c 65%, #050507 100%)",
      }} />

      {/* Floating color orbs — slow drifting ambient lights */}
      <FloatingOrb color="rgba(100,120,220,0.07)" size="500px" top="-5%" left="-5%" duration={20} delay={0} />
      <FloatingOrb color="rgba(180,100,255,0.05)" size="400px" top="30%" left="70%" duration={25} delay={4} />
      <FloatingOrb color="rgba(80,200,180,0.04)" size="450px" top="60%" left="20%" duration={22} delay={8} />
      <FloatingOrb color="rgba(220,140,80,0.035)" size="350px" top="80%" left="60%" duration={28} delay={2} />
      <FloatingOrb color="rgba(140,100,220,0.04)" size="300px" top="10%" left="50%" duration={18} delay={6} />

      {/* Mouse-following spotlight */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)",
          filter: "blur(40px)",
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* Grid lines — very subtle */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.035 }}>
        {/* Vertical */}
        <div style={{ position: "absolute", left: "20%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent 5%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.1) 70%, transparent 95%)" }} />
        <div style={{ position: "absolute", left: "40%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent 15%, rgba(255,255,255,0.2) 50%, transparent 85%)" }} />
        <div style={{ position: "absolute", left: "60%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent 10%, rgba(255,255,255,0.2) 40%, transparent 90%)" }} />
        <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent 20%, rgba(255,255,255,0.3) 60%, transparent 95%)" }} />
        {/* Horizontal */}
        <div style={{ position: "absolute", top: "33%", left: 0, right: 0, height: "1px", background: "linear-gradient(to right, transparent 10%, rgba(255,255,255,0.15) 50%, transparent 90%)" }} />
        <div style={{ position: "absolute", top: "66%", left: 0, right: 0, height: "1px", background: "linear-gradient(to right, transparent 15%, rgba(255,255,255,0.15) 50%, transparent 85%)" }} />
      </div>

      {/* Noise texture overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundSize: "5px 5px",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 0.5px, transparent 0.5px)",
      }} />

      {/* Shooting star / streak accents */}
      <motion.div
        animate={{ x: ["-100%", "200%"], opacity: [0, 0.6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 5, repeatDelay: 12 }}
        style={{
          position: "absolute", top: "15%", left: 0,
          width: "200px", height: "1px",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          transform: "rotate(-15deg)",
        }}
      />
      <motion.div
        animate={{ x: ["200%", "-100%"], opacity: [0, 0.4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 15, repeatDelay: 18 }}
        style={{
          position: "absolute", top: "55%", right: 0,
          width: "180px", height: "1px",
          background: "linear-gradient(to left, transparent, rgba(200,180,255,0.3), transparent)",
          transform: "rotate(10deg)",
        }}
      />
    </div>
  );
}
