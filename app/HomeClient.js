"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ShieldCheck,
  Play,
  Pause,
  Globe2,
  Zap,
} from "lucide-react";
import NextImage from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import ReleaseCard from "./components/ReleaseCard";
import Footer from "./components/Footer";
import BackgroundEffects from "./components/BackgroundEffects";
import ArtistsSection from "./components/ArtistsSection";
import PartnersSection from "./components/PartnersSection";
import Particles from "./components/ui/particles";
import ShimmerButton from "./components/ui/shimmer-button";
import BorderBeam from "./components/ui/border-beam";
import AnimatedShinyText from "./components/ui/animated-shiny-text";
import Ripple from "./components/ui/ripple";
import NumberTicker from "./components/ui/number-ticker";
import { usePlayer } from "./components/PlayerContext";
import { usePublicSettings } from "./components/PublicSettingsContext";
import { BRANDING } from "@/lib/branding";
import {
  DEFAULT_FOOTER_LINKS,
  DEFAULT_HOME_PARTNERS,
  DEFAULT_HOME_SERVICE_ITEMS,
  DEFAULT_HOME_STATS,
} from "@/lib/site-content-data";


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
        background: isHovered ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0)",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <motion.div
          animate={isHovered ? { backgroundColor: "rgba(229,231,235,0.95)" } : { backgroundColor: "rgba(0,0,0,0)" }}
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

      {/* Magic UI border beam — visible on hover */}
      {isHovered && (
        <BorderBeam
          size={180}
          duration={4}
          colorFrom="rgba(255,255,255,0.9)"
          colorTo="rgba(255,255,255,0)"
          borderWidth={1}
        />
      )}
    </motion.div>
  );
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
      <NumberTicker value={value} />
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
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "800", marginTop: "4px" }}>{heroRelease?.artist || `${BRANDING.shortName} HQ`}</div>
          </div>

          <motion.div
            role="button"
            aria-label="Play preview"
            tabIndex={0}
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
                  window.open(heroRelease.spotify_url, '_blank', 'noopener,noreferrer');
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

// ---- STACKED RELEASES (scroll-lock via IntersectionObserver) ----

const StackedCard = ({ release, index, activeIndex, total, playTrack, currentTrack, isPlaying }) => {
  const [hovered, setHovered] = useState(false);
  const position = index - activeIndex;
  const isCurrent = position === 0;
  const isPast = position < 0;

  const imageSrc = release.image?.startsWith("private/")
    ? `/api/files/release/${release.id}`
    : release.image;
  const artist = release.artists?.map((a) => a.name).join(", ") || release.artist;
  const title = (release.name || "").split(" (")[0].split(" - ")[0];
  const isCurrentTrack = currentTrack?.id === release.id;
  const isActive = isCurrentTrack && isPlaying;

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (release.preview_url) {
      playTrack({ id: release.id, name: release.name, artist, image: imageSrc, previewUrl: release.preview_url });
    } else if (release.spotify_url) {
      window.open(release.spotify_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        y: position > 0 ? "110vh" : "0vh",
        scale: isCurrent ? 1 : isPast ? Math.max(0.75, 1 + position * 0.05) : 1,
        translateY: isPast ? `${position * 32}px` : "0px",
        rotateZ: isCurrent ? 0 : isPast ? position * -1.5 : position * 2,
        zIndex: total + position,
        opacity: position < -4 ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 1.2 }}
      style={{
        position: "absolute",
        width: "min(520px, 88vw)",
        aspectRatio: "1/1",
        transformOrigin: "top center",
        overflow: "hidden",
        boxShadow: isCurrent
          ? "0 60px 120px rgba(0,0,0,0.95), 0 20px 60px rgba(0,0,0,0.6)"
          : "0 30px 60px rgba(0,0,0,0.7)",
      }}
    >
      <Link href={`/releases/${release.id}`} style={{ display: "block", width: "100%", height: "100%", position: "relative" }}>
        {imageSrc ? (
          <motion.div
            animate={hovered && isCurrent ? { scale: 1.06 } : { scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            <NextImage src={imageSrc} alt={release.name} fill style={{ objectFit: "cover" }} />
          </motion.div>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#111", display: "grid", placeItems: "center" }}>
            <Globe2 size={48} color="#333" />
          </div>
        )}

        <div style={{ position: "absolute", top: "20px", left: "20px", fontSize: "11px", fontWeight: "900", letterSpacing: "3px", color: "rgba(255,255,255,0.45)", zIndex: 10 }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>

        {release.stream_count_text && (
          <div style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(245,197,66,0.95)", color: "#000", padding: "7px 14px", fontSize: "10px", fontWeight: "900", letterSpacing: "1.5px", zIndex: 10 }}>
            {release.stream_count_text} STREAMS
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)", padding: "52px 28px 28px", zIndex: 10 }}>
          {release.release_type && (
            <div style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "4px", color: "rgba(229,231,235,0.6)", marginBottom: "8px", textTransform: "uppercase" }}>
              {release.release_type}
            </div>
          )}
          <h3 style={{ fontSize: "clamp(22px, 5vw, 34px)", fontWeight: "900", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: "8px", textTransform: "uppercase" }}>
            {title}
          </h3>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", fontWeight: "600", margin: 0 }}>{artist}</p>
        </div>

        <motion.div
          role="button"
          aria-label={isActive ? `Pause ${release.name}` : `Play ${release.name}`}
          tabIndex={0}
          onClick={handlePlay}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handlePlay(e); } }}
          animate={{ opacity: (hovered && isCurrent) || isActive ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", zIndex: 11, cursor: "pointer" }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            style={{ width: "72px", height: "72px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }}
          >
            {isActive ? <Pause size={30} fill="#000" color="#000" /> : <Play size={30} fill="#000" color="#000" style={{ marginLeft: "4px" }} />}
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

const HitTrackCard = ({ release, i, total, scrollYProgress, playTrack, currentTrack, isPlaying }) => {
  const isLast = i === total - 1;
  const progressRange = [i / total, (i + 1) / total];

  const scale = useTransform(scrollYProgress, progressRange, [0.8, 1]);
  const y = useTransform(scrollYProgress, progressRange, [100, 0]);
  const opacity = useTransform(scrollYProgress, [i / total - 0.1, i / total, (i + 1) / total], [0, 1, 1]);
  const nextOpacity = useTransform(scrollYProgress, [(i + 0.8) / total, (i + 1) / total], [1, 0]);
  const finalOpacity = isLast ? opacity : nextOpacity;

  return (
    <motion.div
      style={{ scale, y, opacity: finalOpacity, zIndex: i }}
      className="absolute w-[80%] aspect-square max-w-[400px] shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] rounded-md overflow-hidden bg-zinc-900 border border-white/5"
    >
      <NextImage
        src={release.image?.startsWith("private/") ? `/api/files/release/${release.id}` : (release.image || "/images/placeholder.jpg")}
        alt={release.name || "Release"}
        fill
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-8">
        <div className="text-[10px] font-black tracking-[4px] text-gray-200/60 mb-2 uppercase">LATEST RELEASE</div>
        <h3 className="text-[clamp(22px,5vw,34px)] font-black tracking-tighter leading-[1.05] mb-2 uppercase text-white drop-shadow-md">
          {release.name}
        </h3>
        <p className="text-[15px] font-semibold text-white/55 m-0 uppercase">{release.artistName || "Artist"}</p>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-300"
        onClick={() => playTrack({
          id: release.id,
          name: release.name,
          artist: release.artistName || "Unknown Artist",
          image: release.image?.startsWith("private/") ? `/api/files/release/${release.id}` : release.image,
          previewUrl: release.previewUrl || ""
        })}
      >
        <div className="w-[72px] h-[72px] bg-white flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.6)] rounded-full hover:scale-105 transition-transform duration-200">
          {currentTrack?.id === release.id && isPlaying ?
            <Pause size={30} fill="#000" color="#000" /> :
            <Play size={30} fill="#000" color="#000" className="ml-1" />
          }
        </div>
      </div>
    </motion.div>
  );
};

const HitTracksSection = ({ releases, playTrack, currentTrack, isPlaying }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[200vh] w-full bg-black/95">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[1200px] px-8 flex justify-between items-end z-20">
          <div>
            <div className="text-[11px] font-black tracking-[4px] text-gray-200/45 mb-1.5 uppercase">SELECTED WORKS</div>
            <KineticText as="h2" text="LATEST DROPS" className="text-[clamp(28px,4vw,48px)] font-black uppercase text-white" />
          </div>
          <Link href="/releases" className="text-[12px] font-extrabold tracking-[1px] border-b border-gray-200/40 pb-[3px] text-white/60 hover:text-white transition-colors">
            VIEW ALL →
          </Link>
        </div>

        <div className="relative w-full h-[60vh] max-h-[600px] max-w-[800px] mx-auto mt-20 flex items-center justify-center">
          {releases.map((release, i) => (
            <HitTrackCard
              key={release.id}
              release={release}
              i={i}
              total={releases.length}
              scrollYProgress={scrollYProgress}
              playTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroArtistMosaic = ({ artists }) => {
  const containerRef = useRef(null);
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  const overlayBg = useMotionTemplate`radial-gradient(circle 180px at ${spotX}% ${spotY}%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.92) 70%)`;

  useEffect(() => {
    const handleMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      spotX.set(((e.clientX - rect.left) / rect.width) * 100);
      spotY.set(((e.clientY - rect.top) / rect.height) * 100);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [spotX, spotY]);

  // Memoize grid computation
  const columns = useMemo(() => {
    if (!artists || artists.length === 0) return [];
    const cols = 6;
    const rows = 5;
    const total = cols * rows;
    const grid = Array.from({ length: total }, (_, i) => artists[i % artists.length]);
    return Array.from({ length: cols }, (_, c) =>
      grid.filter((_, i) => i % cols === c)
    );
  }, [artists]);

  if (!artists || artists.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* Artist grid columns */}
      <div style={{ display: "flex", height: "140%", marginTop: "-20%", gap: "4px", padding: "0 4px" }}>
        {columns.map((col, colIdx) => {
          const list = [...col, ...col];
          const dir = colIdx % 2 === 0 ? "up" : "down";
          const speed = 40 + colIdx * 5;
          return (
            <div key={colIdx} style={{ flex: 1, overflow: "hidden", height: "100%" }}>
              <motion.div
                animate={{ y: dir === "up" ? ["0%", "-50%"] : ["-50%", "0%"] }}
                transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                {list.map((artist, idx) => (
                  <div
                    key={`${artist.id}-${idx}`}
                    style={{
                      aspectRatio: "1/1",
                      borderRadius: "6px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {artist.image ? (
                      <NextImage
                        src={artist.image}
                        alt={artist.name}
                        fill
                        sizes="18vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#111" }} />
                    )}
                  </div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Dark overlay with mouse spotlight cutout */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: overlayBg,
          zIndex: 2,
        }}
      />

      {/* Extra center darkening for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

const SERVICE_ICON_MAP = {
  rocket: Rocket,
  "shield-check": ShieldCheck,
  zap: Zap,
};

export default function Home({ initialContent }) {
  const publicSettings = usePublicSettings();
  const [releases, setReleases] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistCount, setArtistCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [heroRelease, setHeroRelease] = useState(null);
  const [phonkPlaylistInfo, setPhonkPlaylistInfo] = useState(null);

  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const registrationsOpen = publicSettings?.registrationsOpen !== false && publicSettings?.maintenanceMode !== true;
  const services = initialContent?.services?.length ? initialContent.services : DEFAULT_HOME_SERVICE_ITEMS;
  const statsItems = initialContent?.stats?.length ? initialContent.stats : DEFAULT_HOME_STATS;
  const partnerPlatforms = initialContent?.partners?.length ? initialContent.partners : DEFAULT_HOME_PARTNERS;
  const footerLinks = initialContent?.footerLinks || DEFAULT_FOOTER_LINKS;

  const featuredReleaseId = publicSettings?.featuredReleaseId;

  useEffect(() => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // Fisher-Yates shuffle (unbiased)
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const fetchData = async () => {
      try {
        const [resReleases, resStats, resArtists] = await Promise.all([
          fetch("/api/releases?limit=24"),
          fetch("/api/stats"),
          fetch("/api/artists?limit=24"),
        ]);

        const jsonReleases = await resReleases.json();
        const jsonStats = await resStats.json();
        const jsonArtists = await resArtists.json();

        if (jsonReleases?.releases) setReleases(jsonReleases.releases.slice(0, 5));
        if (jsonStats?.artistCount) setArtistCount(jsonStats.artistCount);
        if (jsonArtists?.artists) {
          setArtists(shuffle(jsonArtists.artists));
        }

        let featured = null;
        if (featuredReleaseId && jsonReleases?.releases) {
          featured = jsonReleases.releases.find((r) => r.id === featuredReleaseId) || null;
        }

        // If no configured feature or it wasn't found, try to find one with a preview
        if (!featured && jsonReleases?.releases?.length) {
          featured = jsonReleases.releases.find(r => r.preview_url) || jsonReleases.releases[0];
        }
        setHeroRelease(featured);

        // Fetch Phonk Playlist Info (Official API)
        try {
          const phonkId = "37i9dQZF1DWWY64wDtewQt";
          const resPhonk = await fetch(`/api/spotify/playlist/${phonkId}/details`);
          if (resPhonk.ok) {
            const data = await resPhonk.json();
            setPhonkPlaylistInfo(data);
          }
        } catch (err) {
          console.error("Failed to fetch Phonk playlist info:", err);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    // Run fetch and minimum preloader duration in parallel
    Promise.all([fetchData(), delay(1500)]).then(() => setIntroDone(true));

  }, [featuredReleaseId]);

  return (
    <>
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
              {BRANDING.dotName}
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

      <div style={{ minHeight: "100vh", color: "#fff", overflowX: "hidden", position: "relative" }}>
        <BackgroundEffects />

        {/* --- HERO SECTION --- */}
        <section className="snap-section" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "120px", overflow: "hidden" }}>

          {/* Artist Mosaic Background */}
          <HeroArtistMosaic artists={artists} />

          {/* Fallback gradient when no artists loaded yet */}
          <div className="bg-gradient-mesh" style={{ position: "absolute", inset: 0, opacity: artists.length > 0 ? 0 : 0.6, transition: "opacity 1s ease" }} />
          <Particles
            className="absolute inset-0 z-[4] opacity-30"
            quantity={16}
            staticity={65}
            ease={70}
            size={0.4}
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
                <AnimatedShinyText style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "2px" }}>
                  {registrationsOpen ? "ACCEPTING NEW ARTISTS" : "ROSTER OPEN"}
                </AnimatedShinyText>
              </motion.div>

              <KineticText
                text={publicSettings?.heroText || "LOSE THE LABEL KEEP CONTROL"}
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
                {publicSettings?.heroSubText || "The operating system for independent artists. Major label infrastructure without the 360 deal handcuffs."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                style={{ display: "flex", gap: "16px", flexWrap: "wrap", zIndex: 20, position: "relative" }}
              >
                <MagneticEffect>
                  <Link href={registrationsOpen ? "/auth/register" : "/artists"}>
                    <ShimmerButton
                      background="#ffffff"
                      color="#000000"
                      shimmerColor="rgba(0,0,0,0.12)"
                      shimmerDuration="2s"
                      style={{ padding: "18px 36px", fontSize: "14px" }}
                    >
                      {registrationsOpen ? "START YOUR RELEASE" : "VIEW ROSTER"}
                    </ShimmerButton>
                  </Link>
                </MagneticEffect>
                <MagneticEffect>
                  <Link href={registrationsOpen ? "/artists" : "/releases"}>
                    <ShimmerButton
                      background="transparent"
                      color="#ffffff"
                      shimmerColor="rgba(255,255,255,0.08)"
                      shimmerDuration="3s"
                      style={{
                        padding: "18px 36px",
                        fontSize: "14px",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      {registrationsOpen ? "VIEW ROSTER" : "LATEST DROPS"}
                    </ShimmerButton>
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
            style={{ position: "absolute", bottom: "40px", left: "50%", translateX: "-50%", opacity: 0.5, zIndex: 10 }}
          >
            <div style={{ width: "20px", height: "32px", border: "2px solid #fff", borderRadius: "10px", display: "flex", justifyContent: "center", paddingTop: "6px" }}>
              <div style={{ width: "4px", height: "4px", background: "#fff", borderRadius: "50%" }} />
            </div>
          </motion.div>

        </section>

        {/* --- STACKED RELEASES --- */}
        {!loading && releases.length > 0 && (
          <HitTracksSection
            releases={releases}
            playTrack={playTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
          />
        )}

        {/* ═══ Transition: Releases → Roster ═══ */}
        <div style={{ position: "relative", height: "120px", marginTop: "-60px", zIndex: 11, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "1px", height: "60px", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* --- THE ROSTER --- */}
        <ArtistsSection artists={artists} />

        {/* --- STATS TICKER --- */}
        {publicSettings?.showStats !== false && statsItems.length > 0 && (
          <section className="snap-section" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", minHeight: "50vh", padding: "80px 24px" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)" }} />
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px", width: "100%", position: "relative", zIndex: 2 }}>
              {statsItems.map((item, index) => {
                const dynamicValue = item.dynamicKey === "artistCount" && artistCount ? `${artistCount}+` : item.value;
                return <StatItem key={`${item.label}-${index}`} label={item.label} value={dynamicValue} delay={0.2 + (index * 0.2)} />;
              })}
            </div>
          </section>
        )}

        {/* --- FEATURES GRID --- */}
        <section className="snap-section" style={{ position: "relative", zIndex: 10, padding: "80px 24px 120px", minHeight: "100vh", display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,255,255,0.02) 0%, transparent 60%)" }} />
          <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 2 }}>
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
              {services.map((service, index) => (
                <FeatureCard
                  key={`${service.title}-${index}`}
                  index={index}
                  icon={SERVICE_ICON_MAP[service.iconKey] || Rocket}
                  title={service.title}
                  body={service.body}
                  badge={service.badge}
                />
              ))}
            </div>
          </div>
        </section>

        {/* --- PARTNERS MARQUEE --- */}
        <PartnersSection platforms={partnerPlatforms} />

        {/* --- CTA SECTION --- */}
        <section className="snap-section" style={{ padding: "100px 24px 140px", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 50% 55%, rgba(255,255,255,0.025) 0%, transparent 70%)" }} />
          <Ripple numRipples={6} mainCircleSize={180} mainCircleOpacity={0.18} duration={4} />
          <div style={{ position: "relative", zIndex: 10, maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <KineticText
              as="h2"
              text="READY TO TAKE OVER?"
              style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: "900", lineHeight: "1", letterSpacing: "-0.04em", marginBottom: "32px", justifyContent: "center" }}
            />

            <TextReveal style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "50px", lineHeight: "1.6" }}>
              Join 100+ artists scaling their career with {BRANDING.shortName}.<br />
              Transparent splits. Fast delivery. Zero headaches.
            </TextReveal>

            <MagneticEffect>
              <Link href={registrationsOpen ? "/auth/register" : "/releases"}>
                <ShimmerButton
                  background="#ffffff"
                  color="#000000"
                  shimmerColor="rgba(0,0,0,0.12)"
                  shimmerDuration="1.8s"
                  style={{ padding: "24px 64px", fontSize: "16px" }}
                >
                  {registrationsOpen ? "SUBMIT DEMO" : "VIEW RELEASES"}
                </ShimmerButton>
              </Link>
            </MagneticEffect>
          </div>
        </section>

        <Footer footerLinks={footerLinks} />
      </div>
    </>
  );
}
