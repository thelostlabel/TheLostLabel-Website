"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

import { toReleaseSlug } from "@/lib/release-slug";
import { SiteNavbar } from "@/components/ui/site-navbar";
import { PageReveal } from "@/components/ui/page-reveal";

function useMouseTilt(ref) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const reset = () => setTilt({ x: 0, y: 0 });

  return { tilt, handleMove, reset };
}

function getCatalogHref(page) {
  return page > 1 ? `/releases?page=${page}` : "/releases";
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) return [1];

  const pages = Array.from(
    new Set([1, 2, currentPage - 1, currentPage, currentPage + 1, totalPages - 1, totalPages]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items = [];
  let previousPage = null;

  for (const page of pages) {
    if (previousPage !== null && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }
    items.push(page);
    previousPage = page;
  }

  return items;
}

function PaginationNav({ currentPage, totalPages }) {
  if (totalPages <= 1) return null;

  const items = buildPaginationItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Release catalog pagination"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        marginTop: "56px",
      }}
    >
      {currentPage > 1 ? (
        <Link href={getCatalogHref(currentPage - 1)} style={paginationButtonStyle}>
          PREV
        </Link>
      ) : (
        <span style={{ ...paginationButtonStyle, opacity: 0.28, cursor: "default" }}>PREV</span>
      )}

      {items.map((item) => {
        if (typeof item === "string") {
          return (
            <span key={item} style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}>
              ...
            </span>
          );
        }

        const isActive = item === currentPage;

        return (
          <Link
            key={item}
            href={getCatalogHref(item)}
            aria-current={isActive ? "page" : undefined}
            style={{
              ...paginationButtonStyle,
              borderColor: isActive ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
            }}
          >
            {item}
          </Link>
        );
      })}

      {currentPage < totalPages ? (
        <Link href={getCatalogHref(currentPage + 1)} style={paginationButtonStyle}>
          NEXT
        </Link>
      ) : (
        <span style={{ ...paginationButtonStyle, opacity: 0.28, cursor: "default" }}>NEXT</span>
      )}
    </nav>
  );
}

function ReleaseItem({ release, index, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const { tilt, handleMove, reset } = useMouseTilt(cardRef);
  const artistName =
    release.artists?.map((artist) => artist.name).join(", ") ||
    release.artist ||
    release.artistName ||
    "";
  const slug = toReleaseSlug(release.name, artistName, release.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 20 : 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: isMobile ? 0.3 : 0.6,
        delay: isMobile ? 0 : Math.min((index % 6) * 0.07, 0.35),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ perspective: isMobile ? "none" : "800px" }}
    >
      <Link href={`/releases/${slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
        <div
          ref={isMobile ? undefined : cardRef}
          onMouseEnter={isMobile ? undefined : () => setHovered(true)}
          onMouseLeave={
            isMobile
              ? undefined
              : () => {
                  setHovered(false);
                  reset();
                }
          }
          onMouseMove={isMobile ? undefined : handleMove}
          style={{
            position: "relative",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#0a0a0a",
            border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"}`,
            transition: isMobile ? "none" : "border-color 0.3s, box-shadow 0.4s",
            boxShadow: isMobile ? "none" : hovered ? "0 30px 80px rgba(0,0,0,0.7)" : "0 4px 24px rgba(0,0,0,0.4)",
            cursor: "pointer",
            transform: !isMobile && hovered ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(-6px)` : "none",
            transformStyle: isMobile ? "flat" : "preserve-3d",
            transitionProperty: "transform, border-color, box-shadow",
            transitionDuration: hovered ? "0.1s, 0.3s, 0.4s" : "0.6s, 0.3s, 0.4s",
            transitionTimingFunction: "ease-out",
          }}
        >
          <div style={{ position: "relative", width: "100%", paddingBottom: "133%", background: "#111" }}>
            {release.image ? (
              <NextImage
                src={release.image}
                alt={release.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 18vw"
                style={{
                  objectFit: "cover",
                  transition: "transform 0.7s cubic-bezier(0.16,1,0.3,1)",
                  transform: hovered ? "scale(1.08)" : "scale(1)",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "40px", opacity: 0.15 }}>♪</span>
              </div>
            )}

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
                opacity: hovered ? 1 : 0.5,
                transition: "opacity 0.35s",
              }}
            />

            <motion.div
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "11px", marginLeft: "2px", color: "#000" }}>▶</span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "2px", color: "#fff" }}>
                OPEN
              </span>
            </motion.div>

            {release.popularity > 65 && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: isMobile ? "none" : "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  fontSize: "9px",
                  fontWeight: "900",
                  letterSpacing: "1.5px",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                HOT
              </div>
            )}
          </div>

          <div style={{ padding: "12px 14px 14px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: "700",
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {release.name}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "10px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.35)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {artistName}
              {release.release_date && (
                <span style={{ color: "rgba(255,255,255,0.15)", marginLeft: 8 }}>
                  {new Date(release.release_date).getFullYear()}
                </span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const paginationButtonStyle = {
  minWidth: "42px",
  padding: "10px 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.55)",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.16em",
  textAlign: "center",
};

export default function ReleasesClient({
  currentPage,
  initialPagination,
  initialReleases,
  labelName,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 280], [1, 0]);
  const heroY = useTransform(scrollY, [0, 280], [0, -80]);
  const heroScale = useTransform(scrollY, [0, 280], [1, 0.94]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(searchQuery), 280);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredReleases = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    const next = [...initialReleases];

    const scopedResults = query
      ? next.filter((release) => {
          if (release.name?.toLowerCase().includes(query)) return true;
          if (release.artist?.toLowerCase().includes(query)) return true;
          return release.artists?.some((artist) => artist.name?.toLowerCase().includes(query));
        })
      : next;

    if (sortBy === "popularity") {
      scopedResults.sort((left, right) => (right.popularity || 0) - (left.popularity || 0));
    } else if (sortBy === "date") {
      scopedResults.sort((left, right) => new Date(right.release_date) - new Date(left.release_date));
    } else if (sortBy === "name") {
      scopedResults.sort((left, right) => (left.name || "").localeCompare(right.name || ""));
    }

    return scopedResults;
  }, [debouncedQuery, initialReleases, sortBy]);

  return (
    <div
      style={{
        background: "#050505",
        color: "#fff",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <PageReveal />
      <SiteNavbar />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: "url('/lostbanner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: isMobile ? 0 : 0.055,
          filter: isMobile ? "none" : "grayscale(30%)",
        }}
      />

      {!isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.03,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            mixBlendMode: "overlay",
          }}
        />
      )}

      <motion.div
        ref={heroRef}
        style={
          isMobile
            ? { position: "relative", zIndex: 2 }
            : { opacity: heroOpacity, y: heroY, scale: heroScale, position: "relative", zIndex: 2, transformOrigin: "top center" }
        }
      >
        <div style={{ padding: "clamp(130px, 20vh, 220px) clamp(24px, 5vw, 80px) 60px" }}>
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 20 : 70, filter: isMobile ? "none" : "blur(24px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: isMobile ? 0.5 : 1.3, delay: isMobile ? 0.1 : 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <Link
                href="/"
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "2.5px",
                  color: "rgba(255,255,255,0.2)",
                  textDecoration: "none",
                }}
              >
                ← HOME
              </Link>
              <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "3px",
                  color: "rgba(255,255,255,0.18)",
                  textTransform: "uppercase",
                }}
              >
                {initialPagination.total || filteredReleases.length} RELEASES
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(64px, 13vw, 160px)",
                fontWeight: "900",
                letterSpacing: "-0.055em",
                lineHeight: 0.85,
                margin: 0,
                background: "linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.15) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              CATALOG
            </h1>

            <p
              style={{
                marginTop: "20px",
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase",
              }}
            >
              {labelName} — Full Discography
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: isMobile ? "rgba(5,5,5,0.97)" : "rgba(5,5,5,0.88)",
          backdropFilter: isMobile ? "none" : "blur(28px)",
          WebkitBackdropFilter: isMobile ? "none" : "blur(28px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "12px clamp(24px, 5vw, 80px)",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search this page..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "9px 15px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "9px",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "500",
            outline: "none",
            letterSpacing: "0.02em",
          }}
        />

        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {[["popularity", "Popular"], ["date", "Newest"], ["name", "A-Z"]].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSortBy(value)}
              style={{
                padding: "7px 13px",
                borderRadius: "7px",
                border: `1px solid ${
                  sortBy === value ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)"
                }`,
                background: sortBy === value ? "rgba(255,255,255,0.08)" : "transparent",
                color: sortBy === value ? "#fff" : "rgba(255,255,255,0.28)",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div
          style={{
            marginLeft: "auto",
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
          }}
        >
          Page {initialPagination.page} / {initialPagination.pages}
        </div>
      </motion.div>

      <div style={{ padding: "48px clamp(24px, 5vw, 80px) 0", position: "relative", zIndex: 2 }}>
        {filteredReleases.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "120px 0",
              color: "rgba(255,255,255,0.15)",
              fontSize: "11px",
              letterSpacing: "3px",
              fontWeight: "700",
            }}
          >
            NO RELEASES FOUND
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredReleases.map((release, index) => (
              <ReleaseItem key={release.id} release={release} index={index} isMobile={isMobile} />
            ))}
          </div>
        )}

        <PaginationNav currentPage={currentPage} totalPages={initialPagination.pages} />

        <div
          style={{
            position: "relative",
            height: "120px",
            marginTop: "40px",
            background: "linear-gradient(to bottom, transparent, #050505)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
