"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ReleaseCard from './components/ReleaseCard';
import { motion, useScroll, useTransform, useSpring, useInView, useVelocity, useMotionValue } from 'framer-motion';
import { Instagram, Disc, Youtube } from 'lucide-react';

const Marquee = ({ text, speed = 20, reverse = false }) => {
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', width: '100%', padding: '40px 0' }}>
      <motion.div
        animate={{ x: reverse ? [0, -1000] : [-1000, 0] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        style={{ display: 'flex', gap: '50px' }}
      >
        {[...Array(10)].map((_, i) => (
          <span key={i} style={{ fontSize: '120px', fontWeight: '900', color: 'rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '-0.05em' }}>
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const Magnetic = ({ children }) => {
  return (
    <div style={{ display: 'inline-block' }}>
      {children}
    </div>
  );
};

// Optimized HoverCard - GPU accelerated, no heavy 3D transforms
const HoverCard = ({ children }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
      style={{
        willChange: 'transform',
        transformOrigin: 'center center'
      }}
    >
      {children}
    </motion.div>
  );
};

const Scribble = ({ d, delay = 0 }) => {
  return (
    <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ filter: 'blur(1px)', opacity: 0.2 }}>
        <motion.path
          d={d}
          fill="transparent"
          stroke="var(--accent)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay, ease: "easeInOut" }}
          viewport={{ once: true }}
        />
      </svg>
    </div>
  );
};

export default function Home() {
  const [spotlightReleases, setSpotlightReleases] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [artistCount, setArtistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const PLAYLIST_ID = '6QHy5LPKDRHDdKZGBFxRY8';

  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const skew = useSpring(useTransform(scrollVelocity, [-1000, 1000], [-5, 5]), { stiffness: 100, damping: 30 });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const artistsSectionRef = useRef(null);

  // Removed scroll-driven horizontal effect

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Settings
        const resSettings = await fetch('/api/settings/public');
        const config = await resSettings.json();

        // Apply Config
        const plId = config.defaultPlaylistId || '6QHy5LPKDRHDdKZGBFxRY8';
        const resSpotlight = await fetch(`/api/spotify/playlist/${plId}`);
        const dataSpotlight = await resSpotlight.json();
        if (dataSpotlight.releases) {
          setSpotlightReleases(dataSpotlight.releases.slice(0, 12));
        }

        const resStats = await fetch('/api/stats');
        const dataStats = await resStats.json();
        if (dataStats.artistCount) setArtistCount(dataStats.artistCount);

        // Fetch featured artists
        const resArtists = await fetch('/api/artists');
        const dataArtists = await resArtists.json();
        if (dataArtists.artists) setFeaturedArtists(dataArtists.artists.slice(0, 12));

        // Pass config to state if needed for rendering (using a new state variable)
        setSiteConfig(config);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [siteConfig, setSiteConfig] = useState(null);

  const glassStyle = {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    overflow: 'hidden'
  };

  return (
    <div style={{ background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative' }}>
      {/* Noise Texture Filter */}
      <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
      </svg>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.04,
        filter: 'url(#noiseFilter)'
      }} />

      {/* Dynamic Progress Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--accent)',
          transformOrigin: '0%',
          zIndex: 2000,
          scaleX
        }}
      />

      {/* Enhanced Ambient Glows */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }}>
        <motion.div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          filter: 'blur(100px)',
          x: useTransform(springX, [0, 2000], [-50, 50]),
          y: useTransform(springY, [0, 1000], [-30, 30])
        }} />
        <motion.div style={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)',
          filter: 'blur(120px)',
          x: useTransform(springX, [0, 2000], [30, -30]),
          y: useTransform(springY, [0, 1000], [20, -20])
        }} />
      </div>

      {/* Grid Background Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '100px 100px',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.6
      }} />

      {/* Hero Section */}
      <section ref={heroRef} style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 5vw',
        paddingTop: '100px'
      }}>
        <Scribble d="M 0 500 Q 250 100 500 500 T 1000 500" delay={0.5} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '10px',
            fontWeight: '900',
            letterSpacing: '5px',
            marginBottom: '40px',
            color: 'var(--accent)',
            width: 'fit-content'
          }}
        >
          {siteConfig?.siteName ? `${siteConfig.siteName}. COLLECTIVE 2026` : 'LOST. COLLECTIVE 2026'}
        </motion.div>

        <motion.h1
          style={{
            fontSize: 'clamp(60px, 16vw, 220px)',
            lineHeight: '0.8',
            letterSpacing: '-0.05em',
            fontWeight: '900',
            marginBottom: '60px',
            maxWidth: '1600px',
            textTransform: 'uppercase',
            skewX: skew
          }}
        >
          {(siteConfig?.heroText || "The New Order").split(" ").map((word, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 50, rotateX: 40 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.2, ease: "easeOut" }}
              style={{ display: 'block', color: idx === 1 ? 'rgba(255,255,255,0.1)' : '#fff' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          style={{ display: 'flex', gap: '60px', alignItems: 'flex-start', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{
              maxWidth: '400px',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#666',
              fontWeight: '600'
            }}>
              {siteConfig?.heroSubText ? siteConfig.heroSubText.toUpperCase() : 'INDEPENDENT DISTRIBUTION REDEFINED THROUGH MINIMALISM AND PRECISION.'}
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Magnetic>
                <Link href="/auth/register" className="glow-button" style={{ fontSize: '12px' }}>
                  START JOURNEY <span style={{ fontSize: '14px' }}>→</span>
                </Link>
              </Magnetic>
            </div>
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ width: '100px', height: '100px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ fontSize: '8px', letterSpacing: '4px', textAlign: 'center', color: '#444' }}>SCROLL<br />TO<br />EXPLORE</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Section 1 */}
      <Marquee text="Digital Distribution • Royalty Tracking • Artist First • " speed={40} />

      {/* Trending Releases Section - Simple 3-Column Grid */}
      <section style={{ position: 'relative', zIndex: 2, padding: '150px 5vw', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Scroll Background Text */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(100px, 25vw, 400px)',
            fontWeight: '900',
            color: 'rgba(255,255,255,0.02)',
            whiteSpace: 'nowrap',
            zIndex: 0,
            letterSpacing: '-0.05em',
            pointerEvents: 'none'
          }}
        >
          RELEASES
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '80px', position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
            <div style={{ width: '40px', height: '1px', background: 'var(--accent)' }}></div>
            <h2 style={{ fontSize: '11px', letterSpacing: '8px', color: 'var(--accent)', fontWeight: '900' }}>01 / DISCOVER</h2>
          </div>
          <div style={{ fontSize: 'clamp(40px, 8vw, 100px)', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: '0.9' }}>
            TRENDING <br /> RELEASES
          </div>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '40px'
        }}>
          {loading ? (
            [1, 2, 3].map(i => <div key={i} style={{ ...glassStyle, height: '500px', opacity: 0.1 }}></div>)
          ) : (
            spotlightReleases.slice(0, 12).map((release, idx) => (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, scale: 0.95, y: 60 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <HoverCard>
                  <ReleaseCard id={release.id} initialData={release} />
                </HoverCard>
              </motion.div>
            ))
          )}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ textAlign: 'center', marginTop: '80px' }}
        >
          <Magnetic>
            <Link href="/releases" className="glow-button" style={{ fontSize: '12px' }}>
              VIEW ALL RELEASES <span style={{ fontSize: '14px' }}>→</span>
            </Link>
          </Magnetic>
        </motion.div>
      </section>

      {/* Artists Section - Simple Grid */}
      <section style={{
        position: 'relative',
        zIndex: 2,
        padding: '150px 5vw',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Scroll Background Text */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(100px, 25vw, 400px)',
            fontWeight: '900',
            color: 'rgba(255,255,255,0.02)',
            whiteSpace: 'nowrap',
            zIndex: 0,
            letterSpacing: '-0.05em',
            pointerEvents: 'none'
          }}
        >
          ARTISTS
        </motion.div>

        {/* Header */}
        <div style={{ marginBottom: '80px', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '1px', background: 'var(--accent)' }}></div>
              <span style={{ fontSize: '10px', letterSpacing: '6px', color: '#444', fontWeight: '900' }}>02 / ROSTER</span>
            </div>
            <h2 style={{ fontSize: 'clamp(50px, 10vw, 140px)', fontWeight: '300', letterSpacing: '-0.04em', lineHeight: '0.9' }}>
              Our <span style={{ fontWeight: '900' }}>Artists</span>
            </h2>
          </motion.div>
        </div>

        {/* Artists Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '30px',
          position: 'relative',
          zIndex: 1
        }}>
          {featuredArtists.length > 0 ? featuredArtists.map((artist, idx) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              whileHover={{ y: -10, transition: { duration: 0.2, delay: 0 } }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '25px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}
            >
              {/* Index */}
              <span style={{ fontSize: '11px', color: '#444', fontWeight: '400' }}>({idx + 1})</span>

              {/* Artist Name */}
              <Link href={`/artists/${artist.id}`} style={{ textDecoration: 'none' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  color: '#fff'
                }}>
                  {artist.name}
                </h3>
              </Link>

              {/* Genres / Stats */}
              <p style={{
                fontSize: '11px',
                color: '#666',
                lineHeight: '1.6'
              }}>
                {artist.genres?.length > 0 ? artist.genres.slice(0, 2).join(' • ') : `${(artist.monthlyListeners / 1000).toFixed(0)}K monthly listeners`}
              </p>

              {/* Image with grayscale hover */}
              <motion.div
                style={{
                  width: '100%',
                  height: '250px',
                  borderRadius: '12px',
                  background: artist.image ? `url(${artist.image}) center/cover` : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                  backgroundColor: '#1a1a1a',
                  filter: 'grayscale(100%)',
                  willChange: 'filter'
                }}
                whileHover={{ filter: 'grayscale(0%)' }}
                transition={{ duration: 0.3 }}
              />

              {/* Sound wave icon */}
              <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end' }}>
                {[4, 8, 12, 8, 4, 10, 6].map((h, i) => (
                  <div key={i} style={{ width: '2px', height: `${h}px`, background: '#333' }} />
                ))}
              </div>
            </motion.div>
          )) : (
            // Loading skeleton
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '400px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', opacity: 0.3 }} />
            ))
          )}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ textAlign: 'center', marginTop: '80px' }}
        >
          <Magnetic>
            <Link href="/artists" className="glow-button" style={{ fontSize: '12px' }}>
              VIEW ALL ARTISTS <span style={{ fontSize: '14px' }}>→</span>
            </Link>
          </Magnetic>
        </motion.div>
      </section>

      {/* Marquee Section 2 (Reverse) */}
      <Marquee text="Phonk • Electronic • Minimal • Experimental • " speed={30} reverse={true} />

      {/* Stats Section with Scroll Parallax */}
      {(siteConfig?.showStats !== false) && (
        <section ref={statsRef} style={{
          position: 'relative',
          zIndex: 2,
          padding: '200px 5vw',
          background: 'rgba(255,255,255,0.005)',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '80px'
        }}>
          {[
            { label: 'ARTISTS', value: '95' },
            { label: 'GLOBAL STREAMS', value: '10M+' },
            { label: 'ACTIVE CHANNELS', value: '150+' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                style={{ fontSize: '100px', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '10px', color: idx === 1 ? 'var(--accent)' : '#fff' }}
              >
                {stat.value}
              </motion.div>
              <div style={{ fontSize: '10px', letterSpacing: '6px', color: '#444', fontWeight: '900' }}>{stat.label}</div>
            </motion.div>
          ))}
        </section>
      )}

      {/* Global Distribution Section */}
      <section style={{
        padding: '120px 0',
        overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 5vw' }}>
          <div style={{ fontSize: '10px', letterSpacing: '8px', color: 'var(--accent)', fontWeight: '900', marginBottom: '20px' }}>PARTNER NETWORK</div>
          <h2 style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-0.02em' }}>GLOBAL DISTRIBUTION</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* First Row */}
          <div style={{ display: 'flex', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <motion.div
              animate={{ x: [0, -2000] }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              style={{ display: 'flex', gap: '100px', alignItems: 'center' }}
            >
              {[
                { n: "7Digital", d: "7digital.com" }, { n: "AWA", d: "awa.fm" }, { n: "Amazon", d: "amazon.com" },
                { n: "Anghami", d: "anghami.com" }, { n: "Apple Music", d: "apple.com" }, { n: "Audiomack", d: "audiomack.com" },
                { n: "Beatport", d: "beatport.com" }, { n: "Beatsource", d: "beatsource.com" }, { n: "Boomplay", d: "boomplay.com" },
                { n: "7Digital", d: "7digital.com" }, { n: "AWA", d: "awa.fm" }, { n: "Amazon", d: "amazon.com" },
                { n: "Anghami", d: "anghami.com" }, { n: "Apple Music", d: "apple.com" }, { n: "Audiomack", d: "audiomack.com" },
                { n: "Beatport", d: "beatport.com" }, { n: "Beatsource", d: "beatsource.com" }, { n: "Boomplay", d: "boomplay.com" }
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4 }}>
                  <img src={`https://logo.clearbit.com/${p.d}`} alt="" style={{ width: '20px', height: '20px', filter: 'grayscale(1) brightness(2)', borderRadius: '4px' }} onError={(e) => e.target.style.display = 'none'} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase' }}>{p.n}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Second Row (Reverse) */}
          <div style={{ display: 'flex', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <motion.div
              animate={{ x: [-2000, 0] }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              style={{ display: 'flex', gap: '100px', alignItems: 'center' }}
            >
              {[
                { n: "Deezer", d: "deezer.com" }, { n: "Instagram", d: "instagram.com" }, { n: "KKBOX", d: "kkbox.com" },
                { n: "Meta", d: "meta.com" }, { n: "Mixcloud", d: "mixcloud.com" }, { n: "Napster", d: "napster.com" },
                { n: "Netease", d: "163.com" }, { n: "Pandora", d: "pandora.com" }, { n: "Shazam", d: "shazam.com" },
                { n: "Deezer", d: "deezer.com" }, { n: "Instagram", d: "instagram.com" }, { n: "KKBOX", d: "kkbox.com" },
                { n: "Meta", d: "meta.com" }, { n: "Mixcloud", d: "mixcloud.com" }, { n: "Napster", d: "napster.com" },
                { n: "Netease", d: "163.com" }, { n: "Pandora", d: "pandora.com" }, { n: "Shazam", d: "shazam.com" }
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4 }}>
                  <img src={`https://logo.clearbit.com/${p.d}`} alt="" style={{ width: '20px', height: '20px', filter: 'grayscale(1) brightness(2)', borderRadius: '4px' }} onError={(e) => e.target.style.display = 'none'} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase' }}>{p.n}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Third Row */}
          <div style={{ display: 'flex', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <motion.div
              animate={{ x: [0, -2000] }}
              transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
              style={{ display: 'flex', gap: '100px', alignItems: 'center' }}
            >
              {[
                { n: "Spotify", d: "spotify.com" }, { n: "Tidal", d: "tidal.com" }, { n: "TikTok", d: "tiktok.com" },
                { n: "Yandex", d: "yandex.ru" }, { n: "YouTube", d: "youtube.com" }, { n: "iTunes", d: "apple.com" },
                { n: "iHeartRadio", d: "iheart.com" }, { n: "Soundtrack", d: "soundtrackyourbrand.com" },
                { n: "Spotify", d: "spotify.com" }, { n: "Tidal", d: "tidal.com" }, { n: "TikTok", d: "tiktok.com" },
                { n: "Yandex", d: "yandex.ru" }, { n: "YouTube", d: "youtube.com" }, { n: "iTunes", d: "apple.com" },
                { n: "iHeartRadio", d: "iheart.com" }, { n: "Soundtrack", d: "soundtrackyourbrand.com" }
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4 }}>
                  <img src={`https://logo.clearbit.com/${p.d}`} alt="" style={{ width: '20px', height: '20px', filter: 'grayscale(1) brightness(2)', borderRadius: '4px' }} onError={(e) => e.target.style.display = 'none'} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase' }}>{p.n}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{ position: 'relative', zIndex: 2, padding: '250px 5vw', textAlign: 'center' }}>


        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ fontSize: 'clamp(50px, 10vw, 150px)', fontWeight: '900', marginBottom: '80px', letterSpacing: '-0.04em', textTransform: 'uppercase' }}
        >
          Define Your <br /> <span style={{ color: 'var(--accent)' }}>Own Sound.</span>
        </motion.h2>

        <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <Magnetic>
            <Link href="/join" className="glow-button" style={{
              fontSize: '11px'
            }}>
              JOIN NOW <span style={{ fontSize: '14px' }}>→</span>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/faq" className="glass-button" style={{
              fontSize: '11px'
            }}>
              EXPLORE FAQ
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 2,
        padding: '120px 5vw',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#000'
      }}>
        <motion.div
          whileHover={{ scale: 1.1, letterSpacing: '20px' }}
          style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '12px', marginBottom: '60px', transition: 'all 0.5s ease' }}
        >
          LOST.
        </motion.div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '80px' }}>
          {['JOIN', 'FAQ', 'PRIVACY', 'TERMS', 'CONTACT'].map(item => (
            <Link key={item} href={`/${item.toLowerCase()}`} style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: '#444', transition: 'color 0.3s' }}>
              <motion.span whileHover={{ color: '#fff' }}>{item}</motion.span>
            </Link>
          ))}
        </div>

        {siteConfig && (
          <div style={{ display: 'flex', gap: '25px', marginBottom: '40px', justifyContent: 'center' }}>
            {siteConfig.discord && (
              <a href={siteConfig.discord} target="_blank" title="Discord" style={{ color: '#444', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#444'}>
                <Disc size={20} />
              </a>
            )}
            {siteConfig.instagram && (
              <a href={siteConfig.instagram} target="_blank" title="Instagram" style={{ color: '#444', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#444'}>
                <Instagram size={20} />
              </a>
            )}
            {siteConfig.youtube && (
              <a href={siteConfig.youtube} target="_blank" title="YouTube" style={{ color: '#444', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#444'}>
                <Youtube size={20} />
              </a>
            )}
          </div>
        )}

        <p style={{ color: '#222', fontSize: '11px', fontWeight: '900', letterSpacing: '3px', textAlign: 'center', lineHeight: '2.5' }}>
          © 2026 LOST. MUSIC GROUP <br />
          DISTRIBUTED GLOBALLY BY THE NEW ORDER.
        </p>
      </footer>
    </div>
  );
}
