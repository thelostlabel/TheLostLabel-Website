"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ReactLenis, useLenis } from 'lenis/react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Rocket,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Play,
  CheckCircle2,
  Globe2,
  Zap,
  Users,
  Music,
  DollarSign
} from "lucide-react";
import NextImage from "next/image";
import ReleaseCard from "./components/ReleaseCard";
import Footer from "./components/Footer";
import BackgroundEffects from "./components/BackgroundEffects";
import ArtistsSection from "./components/ArtistsSection";
import PartnersSection from "./components/PartnersSection";
import Particles from "./components/ui/particles";
import { usePlayer } from "./components/PlayerContext";

// --- ANIMATION VARIANTS & HOOKS ---
const containerVar = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

const charVar = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" }, // removed rotateX to keep it clean
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 1 }
  },
};

// --- COMPONENTS ---

const KineticText = ({ text, className = "", style = {}, as = "h1", once = true }) => {
  const Tag = motion[as] || motion.h1;
  return (
    <Tag
      className={className}
      variants={containerVar}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-50px" }}
      style={{ display: "flex", flexWrap: "wrap", ...style, perspective: "1000px" }}
    >
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ display: "inline-flex", whiteSpace: "pre" }}>
          {word.split("").map((char, j) => (
            <motion.span key={j} variants={charVar} style={{ display: "inline-block", transformOrigin: "bottom center" }}>
              {char}
            </motion.span>
          ))}
          <span style={{ display: "inline-block", width: "0.25em" }} />
        </span>
      ))}
    </Tag>
  );
};

const TextReveal = ({ children, style = {} }) => {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.p>
  );
};

const FeatureCard = ({ icon: Icon, title, body, badge, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "40px",
        borderRadius: "0px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minHeight: "320px",
        position: "relative",
        background: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <motion.div
          animate={isHovered ? { backgroundColor: "rgba(229,231,235,0.95)" } : { backgroundColor: "transparent" }}
          transition={{ duration: 0.2 }}
          style={{
            padding: "16px",
            borderRadius: "0",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "grid",
            placeItems: "center"
          }}
        >
          <Icon size={28} color={isHovered ? "#000" : "#fff"} />
        </motion.div>
        <span style={{
          fontSize: "10px", letterSpacing: "4px", fontWeight: "900",
          color: "rgba(229,231,235,0.95)", border: "1px solid rgba(229,231,235,0.9)",
          padding: "6px 12px", borderRadius: "0", textTransform: "uppercase"
        }}>
          {badge}
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1, marginTop: "auto" }}>
        <h3 style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "-1px", marginBottom: "16px", lineHeight: "1.1", textTransform: "uppercase" }}>{title}</h3>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6" }}>{body}</p>
      </div>
    </motion.div>
  );
};

const AnimatedNumber = ({ value }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const formattedString = value?.toString() || "0";

  const numericPart = formattedString.replace(/[^0-9.]/g, '');
  const numValue = parseFloat(numericPart);
  const suffix = formattedString.replace(/[0-9.,]/g, '');

  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView && !isNaN(numValue) && numericPart !== '') {
      let start = 0;
      const end = numValue;

      // Skip animation for very small numbers to avoid UI feeling broken
      if (start === end || end <= 10) {
        setDisplay(end);
        return;
      }
      const duration = 2000;
      const incrementTime = 30;
      const steps = duration / incrementTime;
      const stepValue = end / steps;

      const timer = setInterval(() => {
        start += stepValue;
        if (start >= end) {
          setDisplay(end);
          clearInterval(timer);
        } else {
          setDisplay(start);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, numValue, numericPart]);

  if (isNaN(numValue) || numericPart === '') return <span>{value}</span>;

  // Use Math.floor for display if it's counting up, or just the number if done
  const displayVal = display === numValue && numValue % 1 !== 0
    ? numValue
    : Math.floor(display);

  return <span ref={ref}>{displayVal.toLocaleString()}{suffix}</span>;
};

const StatItem = ({ label, value, delay }) => (
  <div
    style={{
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      minWidth: "160px",
      flex: "1 1 200px"
    }}
  >
    <div style={{
      fontSize: "clamp(36px, 5vw, 64px)",
      fontWeight: "900",
      lineHeight: 0.9,
      color: "#fff",
      letterSpacing: "-0.04em",
      textShadow: "0 10px 40px rgba(0,0,0,0.8)",
      whiteSpace: "nowrap"
    }}>
      <AnimatedNumber value={value} />
    </div>
    <div style={{
      fontSize: "12px",
      fontWeight: "900",
      letterSpacing: "4px",
      color: "rgba(229,231,235,0.9)",
      textTransform: "uppercase"
    }}>
      {label}
    </div>
  </div>
);

const MagneticEffect = ({ children }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ display: "inline-block" }}
    >
      {children}
    </motion.div>
  );
};

const BrutalistHeroCover = ({ heroRelease, playTrack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "500px",
        aspectRatio: "1/1",
        marginLeft: "auto",
        boxShadow: "0 40px 100px -20px rgba(0,0,0,1)",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
        {heroRelease?.image ? (
          <NextImage
            src={heroRelease.image.startsWith("private/") ? `/api/files/release/${heroRelease.id}` : heroRelease.image}
            alt={heroRelease.name}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#0a0a0c", display: "grid", placeItems: "center", border: "1px solid rgba(255,255,255,0.05)" }}><Globe2 size={40} color="#333" /></div>
        )}

        <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", padding: "24px", background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{heroRelease?.name || "LATEST TRANSMISSION"}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "800", marginTop: "4px" }}>{heroRelease?.artist || "LOST HQ"}</div>
          </div>
          <motion.div
            whileHover={{ scale: 1.1, backgroundColor: "#E5E7EB" }}
            whileTap={{ scale: 0.95 }}
            style={{ width: "48px", height: "48px", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer", transition: "background 0.2s" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (heroRelease) {
                if (heroRelease.preview_url) {
                  playTrack({
                    id: heroRelease.id,
                    name: heroRelease.name,
                    artist: heroRelease.artist || "Unknown Artist",
                    image: heroRelease.image?.startsWith("private/") ? `/api/files/release/${heroRelease.id}` : heroRelease.image,
                    previewUrl: heroRelease.preview_url
                  });
                } else if (heroRelease.spotify_url) {
                  window.open(heroRelease.spotify_url, '_blank');
                }
              }
            }}
          >
            <Play size={18} fill="#000" color="#000" />
          </motion.div>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none" }} />
    </motion.div>
  );
};

export default function Home() {
  const [releases, setReleases] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistCount, setArtistCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [heroRelease, setHeroRelease] = useState(null);
  const [siteConfig, setSiteConfig] = useState(null);

  const { playTrack } = usePlayer();

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const rotate = useTransform(scrollY, [0, 500], [0, 5]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSettings = await fetch("/api/settings/public");
        const settings = await resSettings.json();

        const [resReleases, resStats, resArtists] = await Promise.all([
          fetch("/api/releases"),
          fetch("/api/stats"),
          fetch("/api/artists"),
        ]);

        const jsonReleases = await resReleases.json();
        const jsonStats = await resStats.json();
        const jsonArtists = await resArtists.json();

        if (jsonReleases?.releases) setReleases(jsonReleases.releases.slice(0, 6));
        if (jsonStats?.artistCount) setArtistCount(jsonStats.artistCount);
        if (jsonArtists?.artists) {
          // Send all artists, randomized
          setArtists(jsonArtists.artists.sort(() => 0.5 - Math.random()));
        }

        let featured = null;
        if (settings?.featuredReleaseId && jsonReleases?.releases) {
          featured = jsonReleases.releases.find((r) => r.id === settings.featuredReleaseId) || null;
        }

        // If no configured feature or it wasn't found, try to find one with a preview
        if (!featured && jsonReleases?.releases?.length) {
          featured = jsonReleases.releases.find(r => r.preview_url) || jsonReleases.releases[0];
        }

        setHeroRelease(featured);
        setSiteConfig(settings);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Ensure preloader shows for at least 1.5 seconds for dramatic effect
    setTimeout(() => {
      setIntroDone(true);
    }, 1500);

  }, []);

  const services = [
    {
      icon: Rocket,
      title: "Velocity Distribution",
      body: "Direct pipes to Spotify, Apple, and TikTok. Assets delivered in under 72h with automated quality checks.",
      badge: "SPEED"
    },
    {
      icon: ShieldCheck,
      title: "Ledger-Grade Splits",
      body: "Smart contracts for your royalties. Collaborators get paid automatically, no Excel sheets required.",
      badge: "FINANCE"
    },
    {
      icon: Zap,
      title: "Kinetic Marketing",
      body: "Algorithmic pitching and localized ad clusters that actually convert listeners to fans.",
      badge: "GROWTH"
    },
  ];

  return (
    <ReactLenis root options={{ lerp: 0.04, wheelMultiplier: 0.85, smoothWheel: true }}>
      <AnimatePresence>
        {(loading || !introDone) && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "#050505", zIndex: 9999,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              overflow: "hidden"
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ fontSize: "64px", fontWeight: "900", letterSpacing: "-2px", color: "#FFFFFF" }}
            >
              LOST.
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ height: "2px", background: "rgba(255,255,255,0.45)", marginTop: "24px", borderRadius: "2px" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
        <BackgroundEffects />

        {/* --- HERO SECTION --- */}
        <section className="snap-section" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "120px", overflow: "hidden" }}>

          {/* Animated Background Mesh */}
          <div className="bg-gradient-mesh" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #0a0a0c 90%)" }} />
          <Particles
            className="absolute inset-0 z-[2] opacity-50"
            quantity={58}
            staticity={65}
            ease={70}
            size={0.45}
            color="#d7dbe3"
            vx={0.02}
            vy={-0.01}
          />

          <div className="hero-grid" style={{ position: "relative", zIndex: 10, maxWidth: "1400px", width: "100%", padding: "0 24px", display: "grid", gap: "60px", alignItems: "center" }}>

            {/* Hero Text */}
            <motion.div style={{ y: y1 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", borderRadius: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "30px" }}
              >
                <span style={{ width: "8px", height: "8px", background: "#E5E7EB", borderRadius: "50%", boxShadow: "0 0 10px rgba(229,231,235,0.5)" }} />
                <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "2px" }}>ACCEPTING NEW ARTISTS</span>
              </motion.div>

              <KineticText
                text={siteConfig?.heroText || "LOSE THE LABEL KEEP CONTROL"}
                className="hero-title"
                as="h1"
                once={false}
                style={{ fontSize: "clamp(48px, 6vw, 90px)", fontWeight: "900", lineHeight: "0.9", letterSpacing: "-0.04em", marginBottom: "24px" }}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                style={{ fontSize: "18px", color: "var(--text-secondary)", lineHeight: "1.6", maxWidth: "540px", marginBottom: "40px" }}
              >
                {siteConfig?.heroSubText || "The operating system for independent artists. Major label infrastructure without the 360 deal handcuffs."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                style={{ display: "flex", gap: "16px", flexWrap: "wrap", zIndex: 20, position: "relative" }}
              >
                <MagneticEffect>
                  <Link href="/auth/register" style={{ display: "inline-block", padding: "18px 36px", fontSize: "14px", fontWeight: "900", letterSpacing: "2px", backgroundColor: "#fff", color: "#000", border: "1px solid #fff", transition: "background 0.3s, color 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.color = "#000"; }}>
                    START YOUR RELEASE
                  </Link>
                </MagneticEffect>
                <MagneticEffect>
                  <Link href="/artists" style={{ display: "inline-block", padding: "18px 36px", fontSize: "14px", fontWeight: "900", letterSpacing: "2px", backgroundColor: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", transition: "border 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid #fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)"; }}>
                    VIEW ROSTER
                  </Link>
                </MagneticEffect>
              </motion.div>
            </motion.div>

            <motion.div style={{ y: y2 }}>
              <BrutalistHeroCover heroRelease={heroRelease} playTrack={playTrack} />
            </motion.div>

          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: "absolute", bottom: "40px", left: "50%", translateX: "-50%", opacity: 0.5 }}
          >
            <div style={{ width: "20px", height: "32px", border: "2px solid #fff", borderRadius: "10px", display: "flex", justifyContent: "center", paddingTop: "6px" }}>
              <div style={{ width: "4px", height: "4px", background: "#fff", borderRadius: "50%" }} />
            </div>
          </motion.div>

        </section>

        {/* --- STATS TICKER --- */}
        <section className="snap-section" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", minHeight: "60vh", padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px", width: "100%" }}>
            <StatItem label="Active Artists" value={artistCount ? `${artistCount}+` : "100+"} icon={Users} delay={0.2} />
            <StatItem label="Total Streams" value="1 Billion" icon={Music} delay={0.4} />
            <StatItem label="Payouts Processed" value="2 Million" icon={DollarSign} delay={0.6} />
          </div>
        </section>

        {/* --- PARTNERS MARQUEE --- */}
        <PartnersSection />

        {/* --- FEATURES GRID --- */}
        <section className="snap-section" style={{ position: "relative", zIndex: 10, padding: "120px 24px", minHeight: "100vh", display: "flex", alignItems: "center" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: "center", marginBottom: "80px", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <KineticText
                as="h2"
                text="BUILT FOR SPEED"
                style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "900", marginBottom: "20px", justifyContent: "center" }}
              />
              <TextReveal style={{ color: "var(--text-secondary)", fontSize: "18px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                Everything you need to go from bedroom to billboard. We handle the boring stuff so you can focus on the music.
              </TextReveal>
            </motion.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
              {services.map((s, i) => (
                <FeatureCard key={i} index={i} {...s} />
              ))}
            </div>
          </div>
        </section>

        {/* --- ARTISTS MARQUEE --- */}
        <ArtistsSection artists={artists} />

        {/* --- SELECTED RELEASES --- */}
        <section className="snap-section" style={{ position: "relative", zIndex: 10, padding: "100px 24px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "50px" }}>
              <div>
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "2px", color: "rgba(229,231,235,0.9)", marginBottom: "8px" }}>CURATED PICKS</motion.div>
                <KineticText as="h2" text="LATEST DROPS" style={{ fontSize: "42px", fontWeight: "900" }} />
              </div>
              <motion.div initial={{ opacity: 0, filter: "blur(10px)" }} whileInView={{ opacity: 1, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
                <Link href="/releases" style={{ fontSize: "13px", fontWeight: "800", letterSpacing: "1px", borderBottom: "1px solid rgba(229,231,235,0.75)", paddingBottom: "4px" }}>VIEW ALL RELEASES</Link>
              </motion.div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", width: "100%" }}>
              {loading
                ? [1, 2, 3].map(i => <div key={i} style={{ height: "300px", background: "rgba(255,255,255,0.05)" }} />)
                : releases.slice(0, 3).map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true, margin: "-100px" }}
                    style={{ width: "100%" }}
                  >
                    <ReleaseCard id={r.id} initialData={r} />
                  </motion.div>
                ))
              }
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="snap-section" style={{ padding: "140px 24px", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ position: "relative", zIndex: 10, maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <KineticText
              as="h2"
              text="READY TO TAKE OVER?"
              style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: "900", lineHeight: "1", letterSpacing: "-0.04em", marginBottom: "32px", justifyContent: "center" }}
            />

            <TextReveal style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "50px", lineHeight: "1.6" }}>
              Join 100+ artists scaling their career with LOST.<br />
              Transparent splits. Fast delivery. Zero headaches.
            </TextReveal>

            <MagneticEffect>
              <motion.div
                whileHover={{ backgroundColor: "#fff", color: "#000", scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{ border: "1px solid #fff", display: "inline-block" }}
              >
                <Link href="/auth/register" style={{ display: "inline-block", padding: "24px 64px", fontSize: "16px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase" }}>
                  SUBMIT DEMO
                </Link>
              </motion.div>
            </MagneticEffect>
          </div>
        </section>

        <Footer />
      </div>
    </ReactLenis>
  );
}
