"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Rocket,
  Waves,
  ShieldCheck,
  Headphones,
  GaugeCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";
import ReleaseCard from "./components/ReleaseCard";
import Footer from "./components/Footer";
import { useMemo } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const SectionHead = ({ eyebrow, title, subtitle, align = "left" }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.3 }}
    variants={fadeUp}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      textAlign: align,
      maxWidth: align === "center" ? "720px" : "640px",
      margin: align === "center" ? "0 auto" : "0",
    }}
  >
    <span
      style={{
        fontSize: "11px",
        letterSpacing: "6px",
        color: "var(--text-secondary)",
        fontWeight: 800,
      }}
    >
      {eyebrow}
    </span>
    <h2
      style={{
        fontSize: "clamp(32px, 6vw, 72px)",
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        color: "#fff",
      }}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "15px",
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    )}
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, body, badge }) => (
  <motion.div
    className="glass"
    initial="hidden"
    whileInView="show"
    whileHover={{ y: -6 }}
    viewport={{ once: true, amount: 0.2 }}
    variants={fadeUp}
    style={{
      padding: "28px",
      borderRadius: "16px",
      border: "1px solid var(--border)",
      background: "linear-gradient(140deg, rgba(158,240,26,0.08), rgba(14,14,18,0.9))",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      minHeight: "200px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: "rgba(255,255,255,0.06)",
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--border)",
        }}
      >
        <Icon size={20} color="var(--accent)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, letterSpacing: 2, color: "var(--accent)", fontWeight: 800 }}>
          {badge}
        </span>
        <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h3>
      </div>
    </div>
    <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>{body}</p>
  </motion.div>
);

const StepCard = ({ step, title, desc }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "22px",
      display: "flex",
      gap: "16px",
      alignItems: "flex-start",
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "#0d111a",
        border: "1px solid var(--border)",
        color: "var(--accent)",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {step}
    </div>
    <div>
      <h4 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6 }}>{title}</h4>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
    </div>
  </div>
);

export default function Home() {
  const [releases, setReleases] = useState([]);
  const [artists, setArtists] = useState([]);
  const [artistCount, setArtistCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroRelease, setHeroRelease] = useState(null);
  const [siteConfig, setSiteConfig] = useState(null);

  const shimmerBg = useMemo(
    () => ({
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 20% 20%, rgba(158,240,26,0.14), transparent 35%), radial-gradient(circle at 80% 10%, rgba(0,238,255,0.18), transparent 40%)",
      filter: "blur(40px)",
      opacity: 0.7,
    }),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get public site settings for hero text + featured release
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
        if (jsonArtists?.artists) setArtists(jsonArtists.artists.slice(0, 4));

        // Pick featured release: admin-configured id, else newest
        let featured = null;
        if (settings?.featuredReleaseId && jsonReleases?.releases) {
          featured = jsonReleases.releases.find((r) => r.id === settings.featuredReleaseId) || null;
        }
        if (!featured && jsonReleases?.releases?.length) {
          featured = jsonReleases.releases[0];
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

  const metrics = [
    { label: "Artists", value: artistCount ? `${artistCount}+` : "90+" },
    { label: "Streams", value: "10M+" },
    { label: "Territories", value: "190" },
    { label: "Avg. release time", value: "72h" },
  ];

  const services = [
    {
      icon: Rocket,
      title: "Distribution that moves fast",
      body: "Same-week delivery to 120+ DSPs with proactive QA so you don’t get kicked back for metadata or loudness issues.",
      badge: "DELIVERY",
    },
    {
      icon: ShieldCheck,
      title: "Rights & splits handled",
      body: "Split rules per track, automated statements, and contract PDF storage. Everyone is paid without spreadsheets.",
      badge: "ROYALTIES",
    },
    {
      icon: BarChart3,
      title: "Growth crew on call",
      body: "Playlist pitching, UGC seeding, short-form edits, and localized campaigns built with you, not for you.",
      badge: "MARKETING",
    },
  ];

  const steps = [
    {
      title: "Submit & A&R feedback",
      desc: "Upload WAV or share a link. Human A&R replies within 72 hours with notes or a deal offer.",
    },
    {
      title: "Deal & splits",
      desc: "Sign digitally, set splits for collaborators, and lock payment rails before release week.",
    },
    {
      title: "Launch everywhere",
      desc: "We master-check, generate assets, and deliver to DSPs + UGC platforms with pre-save pages baked in.",
    },
    {
      title: "Report & grow",
      desc: "Live dashboards, monthly statements, and marketing sprints tuned to what’s actually working.",
    },
  ];

  return (
    <div style={{ background: "#050607", minHeight: "100vh", color: "#fff" }}>
      {/* HERO */}
      <section
        style={{
          padding: "120px clamp(16px,4vw,32px) 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={shimmerBg} />

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", border: "1px solid var(--border)", borderRadius: 999, background: "rgba(255,255,255,0.04)", width: "fit-content" }}>
              <Sparkles size={16} color="var(--accent)" />
              <span style={{ fontSize: 11, letterSpacing: 3, fontWeight: 800 }}>
                {(siteConfig?.siteName || "LOST").toUpperCase()} • 2026
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(48px, 10vw, 110px)",
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
                fontWeight: 800,
              }}
            >
              {siteConfig?.heroText || "Lose the label,"}{" "}
              <span style={{ color: "var(--accent)" }}>keep control.</span>
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.7, maxWidth: 640 }}>
              <span className="typewriter" style={{ "--chars": (siteConfig?.heroSubText || "").length || 64 }}>
                {siteConfig?.heroSubText || "LOST is a modern music company for artists who want major-level distribution, transparent splits, and marketing that actually ships."}
              </span>
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/auth/register" className="glow-button" style={{ letterSpacing: 2, padding: "14px 26px", fontSize: 12 }}>
                GET STARTED
                <ArrowUpRight size={14} />
              </Link>
              <Link
                href="/artists"
                className="glass-button"
                style={{ letterSpacing: 2, padding: "14px 24px", fontSize: 12 }}
              >
                SEE ROSTER
              </Link>
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              {["DSP delivery < 72h", "Real-time splits", "Human A&R", "Marketing pods"].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="glass"
            style={{
              borderRadius: 20,
              padding: 24,
              border: "1px solid var(--border)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(8,10,15,0.9))",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 2, color: "var(--accent)", fontWeight: 800 }}>
                  {siteConfig?.featuredReleaseLabel || "FEATURED RELEASE"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {heroRelease?.name || "Your Release"}
                </div>
              </div>
              <GaugeCircle size={32} color="var(--accent)" />
            </div>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 14,
                border: "1px solid var(--border)",
                minHeight: 260,
                background: "#0b0d12",
              }}
            >
              {heroRelease?.image ? (
                <img
                  src={
                    heroRelease.image.startsWith("private/")
                      ? `/api/files/release/${heroRelease.id}`
                      : heroRelease.image
                  }
                  alt={heroRelease.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                />
              ) : (
                <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-secondary)" }}>
                  Artwork preview
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6))",
                }}
              />
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{heroRelease?.artistName || "Independent Artist"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {siteConfig?.featuredReleaseSubLabel || "NOW STREAMING"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--accent)" }} />
                  <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 800 }}>
                    {siteConfig?.featuredReleaseStatus || "Featured"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Metrics */}
        <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {metrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.4, delay: idx * 0.05 } } }}
              style={{
                padding: "18px 14px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800 }}>{m.value}</div>
              <div style={{ fontSize: 12, letterSpacing: 2, color: "var(--text-secondary)", fontWeight: 700 }}>{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding: "80px clamp(16px,4vw,32px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40, flexWrap: "wrap", alignItems: "flex-end" }}>
          <SectionHead
            eyebrow="WHAT WE DO"
            title="Everything you need between demo and domination."
            subtitle="We operate like your embedded label team: distribution, splits, marketing pods, and reporting in one motion stack."
          />
          <Link href="/join" className="glow-button" style={{ letterSpacing: 2, padding: "12px 20px", fontSize: 11 }}>
            TALK TO A&R
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 30 }}>
          {services.map((s) => (
            <FeatureCard key={s.title} {...s} />
          ))}
        </div>
      </section>

      {/* RELEASES */}
      <section style={{ padding: "80px clamp(16px,4vw,32px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <SectionHead
          eyebrow="LATEST"
          title="Releases that feel intentional."
          subtitle="A small snapshot from the roster. Every drop gets design, delivery, and marketing treatment." 
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 32 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 360,
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                />
              ))
            : releases.slice(0, 3).map((release, idx) => (
                <motion.div
                  key={release.id}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.45, delay: idx * 0.08 } } }}
                >
                  <ReleaseCard id={release.id} initialData={release} />
                </motion.div>
              ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Link href="/releases" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 800, letterSpacing: 2 }}>
            VIEW FULL CATALOG ↗
          </Link>
        </div>
      </section>

      {/* ARTISTS */}
      <section style={{ padding: "80px clamp(16px,4vw,32px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <SectionHead
          eyebrow="ROSTER"
          title="Artists who build with us."
          subtitle="Global talent across phonk, funk carioca, experimental electronica, and alt-pop."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginTop: 30 }}>
          {(artists.length ? artists : Array.from({ length: 4 })).map((artist, idx) => (
            <motion.div
              key={artist?.id || idx}
              className="glass"
              initial="hidden"
              whileInView="show"
              whileHover={{ y: -6 }}
              viewport={{ once: true, amount: 0.2 }}
              variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.45, delay: idx * 0.05 } } }}
              style={{
                borderRadius: 14,
                padding: 18,
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1/1",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: artist?.image
                    ? `url(${artist.image.startsWith("private/") ? `/api/files/release/${artist.id}` : artist.image}) center/cover`
                    : "linear-gradient(135deg, #0d111a, #0a0c12)",
                  border: "1px solid var(--border)",
                }}
              />
              <div>
                <div style={{ fontSize: 14, letterSpacing: 2, color: "var(--text-secondary)", marginBottom: 4 }}>ARTIST</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{artist?.name || "Loading"}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {artist?.monthlyListeners ? `${artist.monthlyListeners.toLocaleString()} monthly listeners` : "New drop coming"}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section style={{ padding: "80px clamp(16px,4vw,32px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
          <SectionHead
            eyebrow="PIPELINE"
            title="A predictable release engine."
            subtitle="Clear gates, quick feedback loops, and one place to see where your track lives."
          />
          <div style={{ display: "grid", gap: 14 }}>
            {steps.map((s, i) => (
              <StepCard key={s.title} step={i + 1} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "120px clamp(16px,4vw,32px)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ fontSize: "clamp(36px, 7vw, 88px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 16 }}>
          Ready to drop with LOST?
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, maxWidth: 640, margin: "0 auto 30px" }}>
          Apply once. Get feedback fast. If it fits, we ship it everywhere and show you the math.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link href="/auth/register" className="glow-button" style={{ padding: "14px 24px", letterSpacing: 2, fontSize: 12 }}>
            SUBMIT A DEMO
          </Link>
          <Link href="/faq" className="glass-button" style={{ padding: "14px 22px", letterSpacing: 2, fontSize: 12 }}>
            READ FAQ
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
