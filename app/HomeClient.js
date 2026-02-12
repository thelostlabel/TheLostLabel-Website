"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
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
import { usePlayer } from "./components/PlayerContext";

// --- ANIMATION VARIANTS ---
const containerVar = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVar = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
};

const wordVar = {
  hidden: { opacity: 0, y: 50, rotate: 5 },
  show: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 70, damping: 15 } },
};

// --- COMPONENTS ---

const KineticText = ({ text, className = "" }) => {
  const words = text.split(" ");
  return (
    <motion.h1
      className={className}
      variants={containerVar}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.25em", perspective: "1000px" }}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVar} style={{ display: "inline-block", transformOrigin: "bottom left" }}>
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};

const FeatureCard = ({ icon: Icon, title, body, badge, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, rotateX: 15, y: 40 }}
      animate={isInView ? { opacity: 1, rotateX: 0, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.8, type: "spring" }}
      whileHover={{ y: -10, rotateX: 5, scale: 1.02 }}
      className="glass-premium"
      style={{
        padding: "32px",
        borderRadius: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minHeight: "280px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.0))",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, width: "150px", height: "150px",
        background: "radial-gradient(circle at 100% 0%, rgba(158, 240, 26, 0.1), transparent 70%)",
        filter: "blur(20px)"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          padding: "12px", borderRadius: "14px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <Icon size={24} color="var(--accent)" />
        </div>
        <span style={{
          fontSize: "10px", letterSpacing: "2px", fontWeight: "900",
          color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)",
          padding: "4px 8px", borderRadius: "20px"
        }}>
          {badge}
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "10px", lineHeight: "1.2" }}>{title}</h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6" }}>{body}</p>
      </div>
    </motion.div>
  );
};

const StatItem = ({ label, value, icon: Icon, delay }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    whileInView={{ scale: 1, opacity: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, type: "spring", stiffness: 100 }}
    className="glass-premium"
    whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
    style={{
      textAlign: "center",
      padding: "32px 40px",
      borderRadius: "24px",
      minWidth: "240px",
      border: "1px solid rgba(255,255,255,0.1)",
      background: "linear-gradient(180deg, rgba(20, 30, 50, 0.8) 0%, rgba(10, 20, 40, 0.6) 100%)",
      backdropFilter: "blur(20px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
    }}
  >
    <div style={{
      width: "60px", height: "60px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "8px",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 0 20px rgba(0,0,0,0.2)"
    }}>
      <Icon size={28} color="var(--accent)" />
    </div>

    <div style={{
      fontSize: "clamp(32px, 4vw, 42px)", fontWeight: "900",
      lineHeight: 1,
      background: "linear-gradient(to bottom, #fff, #aaa)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      filter: "drop-shadow(0 0 10px rgba(255,255,255,0.2))"
    }}>
      {value}
    </div>
    <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "2px", color: "var(--text-secondary)", textTransform: "uppercase" }}>{label}</div>
  </motion.div >
);

export default function Home() {
  const [releases, setReleases] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistCount, setArtistCount] = useState(null);
  const [loading, setLoading] = useState(true);
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
    <div style={{ background: "#0a0a0c", minHeight: "100vh", color: "#fff", overflowX: "hidden" }}>
      <BackgroundEffects />

      {/* --- HERO SECTION --- */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px", overflow: "hidden" }}>

        {/* Animated Background Mesh */}
        <div className="bg-gradient-mesh" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #0a0a0c 90%)" }} />

        <div className="hero-grid" style={{ position: "relative", zIndex: 10, maxWidth: "1400px", width: "100%", padding: "0 24px", display: "grid", gap: "60px", alignItems: "center" }}>

          {/* Hero Text */}
          <motion.div style={{ y: y1 }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", borderRadius: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "30px" }}
            >
              <span style={{ width: "8px", height: "8px", background: "var(--accent)", borderRadius: "50%", boxShadow: "0 0 10px var(--accent)" }} />
              <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "2px" }}>ACCEPTING NEW ARTISTS</span>
            </motion.div>

            <KineticText
              text={siteConfig?.heroText || "LOSE THE LABEL KEEP CONTROL"}
              className="hero-title"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
            >
              <Link href="/auth/register" className="glow-button animate-pulse-glow" style={{ padding: "18px 36px", fontSize: "13px", borderRadius: "50px" }}>
                START YOUR RELEASE
              </Link>
              <Link href="/artists" className="glass-premium" style={{ display: "flex", alignItems: "center", padding: "18px 32px", borderRadius: "50px", fontSize: "13px", fontWeight: "800", letterSpacing: "1px", textDecoration: "none" }}>
                VIEW ROSTER
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Visual / Featured Release */}
          <motion.div style={{ y: y2, rotate: rotate, perspective: "1000px" }}>
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="glass-premium"
              style={{
                position: "relative",
                borderRadius: "32px",
                padding: "24px",
                maxWidth: "500px",
                marginLeft: "auto",
                background: "rgba(10,10,12,0.6)",
                boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)"
              }}
            >
              <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", aspectRatio: "1/1", marginBottom: "24px" }}>
                {heroRelease?.image ? (
                  <NextImage
                    src={heroRelease.image.startsWith("private/") ? `/api/files/release/${heroRelease.id}` : heroRelease.image}
                    alt={heroRelease.name}
                    width={500}
                    height={500}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    priority
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#111", display: "grid", placeItems: "center" }}><Globe2 size={40} color="#333" /></div>
                )}

                <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "900" }}>{heroRelease?.name || "Unreleased ID"}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{heroRelease?.artist || "Unknown Artist"}</div>
                  </div>
                  <div
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}
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
                    <Play size={14} fill="#000" />
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", top: "-20px", right: "-20px", padding: "12px 20px", background: "#000", borderRadius: "12px", border: "1px solid #333", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
              >
                <BarChart3 size={16} color="var(--accent)" />
                <span style={{ fontSize: "12px", fontWeight: "800" }}>+24% Growth</span>
              </motion.div>

              <motion.div
                animate={{ x: [0, -10, 0], y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ position: "absolute", bottom: "40px", left: "-30px", padding: "12px 20px", background: "#fff", color: "#000", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
              >
                <CheckCircle2 size={16} color="#000" />
                <span style={{ fontSize: "12px", fontWeight: "800" }}>Distributed</span>
              </motion.div>

            </motion.div>
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
      <section style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "40px" }}>
          <StatItem label="Active Artists" value={artistCount ? `${artistCount}+` : "100+"} icon={Users} delay={0.2} />
          <StatItem label="Total Streams" value="15M+" icon={Music} delay={0.4} />
          <StatItem label="Payouts Processed" value="$250K+" icon={DollarSign} delay={0.6} />
        </div>
      </section>

      {/* --- PARTNERS MARQUEE --- */}
      <PartnersSection />

      {/* --- FEATURES GRID --- */}
      <section style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "900", marginBottom: "20px" }}>BUILT FOR SPE<span style={{ color: "var(--accent)" }}>E</span>D</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
              Everything you need to go from bedroom to billboard. We handle the boring stuff so you can focus on the music.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
            {services.map((s, i) => (
              <FeatureCard key={i} index={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* --- ARTISTS MARQUEE --- */}
      <ArtistsSection artists={artists} />

      {/* --- SELECTED RELEASES --- */}
      <section style={{ padding: "100px 24px", background: "#0d0e12" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "50px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "2px", color: "var(--accent)", marginBottom: "8px" }}>CURATED PICKS</div>
              <h2 style={{ fontSize: "42px", fontWeight: "900" }}>LATEST DROPS</h2>
            </div>
            <Link href="/releases" style={{ fontSize: "13px", fontWeight: "800", letterSpacing: "1px", borderBottom: "1px solid var(--accent)", paddingBottom: "4px" }}>VIEW ALL RELEASES</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", justifyContent: "center" }}>
            {loading
              ? [1, 2, 3].map(i => <div key={i} style={{ height: "300px", background: "rgba(255,255,255,0.05)", borderRadius: "16px" }} />)
              : releases.slice(0, 3).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ReleaseCard id={r.id} initialData={r} />
                </motion.div>
              ))
            }
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section style={{ padding: "140px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="bg-gradient-mesh" style={{ position: "absolute", inset: 0, opacity: 0.3, transform: "scaleY(-1)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "800px", margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: "900", lineHeight: "0.9", letterSpacing: "-0.04em", marginBottom: "32px" }}
          >
            READY TO <br /><span style={{ color: "var(--accent)" }}>TAKE OVER?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "50px", lineHeight: "1.6" }}
          >
            Join 100+ artists scaling their career with LOST.<br />
            Transparent splits. Fast delivery. Zero headaches.
          </motion.p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth/register" className="glow-button animate-pulse-glow" style={{ padding: "24px 64px", fontSize: "16px", borderRadius: "12px", border: "1px solid #fff" }}>
              SUBMIT YOUR DEMO
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
