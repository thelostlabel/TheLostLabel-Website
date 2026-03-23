"use client";

import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight, Menu, Play } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Archivo_Black, Barlow_Condensed, Saira_Condensed } from "next/font/google";
import styles from "./page.module.css";

const headline = Archivo_Black({ subsets: ["latin"], weight: "400" });
const display = Saira_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const body = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const links = ["SPOTIFY", "APPLE MUSIC", "YOUTUBE MUSIC", "TIDAL"];

const tracks = [
  "Toxic Luv (feat. White 2115)",
  "Bez serca",
  "Beksa",
  "Oscar (feat. White Widow)",
  "Sol",
  ".....",
];

const stackCards = [{ tone: "paper" }, { tone: "blue" }, { tone: "sand" }];

function TopBar({ dark = true }) {
  return (
    <div className={styles.topBar}>
      <div className={`${styles.brand} ${headline.className}`}>WFJ</div>
      <button className={styles.menuButton} aria-label="Menu">
        <Menu size={31} strokeWidth={2.1} color={dark ? "#f4f6fb" : "#0d1117"} />
      </button>
    </div>
  );
}

export default function DenemePage() {
  const rootRef = useRef(null);

  const heroPinRef = useRef(null);
  const heroShellRef = useRef(null);
  const heroLinksRef = useRef(null);
  const heroGlowRef = useRef(null);

  const discPinRef = useRef(null);
  const discGridRef = useRef(null);
  const discHeadingRef = useRef(null);
  const cardDeckRef = useRef(null);
  const stackBackRef = useRef(null);
  const stackMidRef = useRef(null);
  const stackNearRef = useRef(null);
  const stackTopRef = useRef(null);
  const portalRef = useRef(null);

  const outroInnerRef = useRef(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(heroShellRef.current, {
        transformPerspective: 1200,
      });

      gsap.set(cardDeckRef.current, {
        transformPerspective: 1400,
        transformStyle: "preserve-3d",
      });

      gsap.set([stackBackRef.current, stackMidRef.current, stackNearRef.current], {
        opacity: 0.98,
      });

      gsap.set(portalRef.current, {
        scale: 0.06,
        opacity: 0,
      });

      const heroTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: heroPinRef.current,
          start: "top top",
          end: "+=150%",
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        },
      });

      heroTimeline
        .to(
          heroShellRef.current,
          {
            xPercent: -34,
            rotateY: -28,
            rotateX: 9,
            z: -340,
            transformOrigin: "left center",
            ease: "none",
          },
          0,
        )
        .to(
          heroLinksRef.current,
          {
            x: 72,
            opacity: 0.2,
            ease: "none",
          },
          0,
        )
        .to(
          heroGlowRef.current,
          {
            opacity: 0.2,
            ease: "none",
          },
          0,
        );

      const discTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: discPinRef.current,
          start: "top top",
          end: "+=230%",
          scrub: 1.1,
          pin: true,
          anticipatePin: 1,
        },
      });

      discTimeline
        .fromTo(cardDeckRef.current, { yPercent: 24, scale: 0.84 }, { yPercent: 0, scale: 1, ease: "none" }, 0)
        .fromTo(
          stackBackRef.current,
          { yPercent: 36, xPercent: -14, rotateZ: -11, scale: 0.9 },
          { yPercent: 2, xPercent: -18, rotateZ: -14, scale: 0.94, ease: "none" },
          0.08,
        )
        .fromTo(
          stackMidRef.current,
          { yPercent: 24, xPercent: -8, rotateZ: -7, scale: 0.92 },
          { yPercent: -2, xPercent: -9, rotateZ: -10, scale: 0.98, ease: "none" },
          0.14,
        )
        .fromTo(
          stackNearRef.current,
          { yPercent: 14, xPercent: -3, rotateZ: -4, scale: 0.95 },
          { yPercent: -8, xPercent: -2, rotateZ: -6, scale: 1.03, ease: "none" },
          0.18,
        )
        .fromTo(
          stackTopRef.current,
          { yPercent: 5, xPercent: -1, rotateZ: -2, scale: 0.98 },
          { yPercent: -20, xPercent: 7, rotateZ: 1.5, scale: 1.14, ease: "none" },
          0.24,
        )
        .to(
          cardDeckRef.current,
          {
            rotateY: -31,
            rotateX: 11,
            rotateZ: -3,
            xPercent: -11,
            yPercent: -6,
            ease: "none",
          },
          0.28,
        )
        .to(
          cardDeckRef.current,
          {
            rotateY: -12,
            rotateX: 3,
            rotateZ: -1,
            scale: 1.26,
            xPercent: 0,
            yPercent: -10,
            ease: "none",
          },
          0.62,
        )
        .to(
          [stackBackRef.current, stackMidRef.current, stackNearRef.current],
          {
            yPercent: (index) => -16 - index * 6,
            xPercent: (index) => -22 + index * 8,
            rotateZ: (index) => -15 + index * 3,
            ease: "none",
          },
          0.66,
        )
        .to(
          discHeadingRef.current,
          {
            yPercent: -60,
            opacity: 0.34,
            ease: "none",
          },
          0.58,
        )
        .to(
          discGridRef.current,
          {
            filter: "blur(1.6px)",
            scale: 1.03,
            ease: "none",
          },
          0.82,
        )
        .to(
          portalRef.current,
          {
            opacity: 1,
            scale: 0.9,
            ease: "none",
          },
          0.86,
        )
        .to(
          portalRef.current,
          {
            scale: 23,
            opacity: 0.96,
            ease: "power2.in",
          },
          0.95,
        );

      gsap.fromTo(
        outroInnerRef.current,
        {
          opacity: 0,
          y: 90,
          rotateX: -8,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: outroInnerRef.current,
            start: "top 76%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className={`${styles.page} ${display.className}`} ref={rootRef}>
      <section className={styles.heroPin} ref={heroPinRef}>
        <div className={styles.darkGrid}>
          <TopBar dark />

          <div className={styles.heroShell} ref={heroShellRef}>
            <div className={styles.heroTextWrap}>
              <h1 className={`${styles.heroTitle} ${headline.className}`}>GDZIE MOJ DOM</h1>
              <p className={styles.heroSub}>OUT NOW • STREAMING EVERYWHERE</p>
            </div>

            <div className={styles.heroMedia}>
              <div className={styles.recordLight}>REC</div>
              <button className={styles.playButton} aria-label="Play">
                <Play size={44} fill="currentColor" />
              </button>
              <div className={`${styles.heroMediaTitle} ${headline.className}`}>GDZIE MOJ DOM</div>
            </div>
          </div>

          <div className={styles.heroLinks} ref={heroLinksRef}>
            {links.map((link) => (
              <a key={link} href="#" className={styles.streamLink}>
                <span>{link}</span>
                <ArrowUpRight size={22} strokeWidth={2.2} />
              </a>
            ))}
          </div>

          <div className={styles.heroCursor} />
          <div className={styles.heroGlow} ref={heroGlowRef} />
        </div>
      </section>

      <section className={styles.discPin} ref={discPinRef}>
        <div className={styles.lightGrid} ref={discGridRef}>
          <TopBar dark={false} />
          <h2 className={`${styles.discHeading} ${headline.className}`} ref={discHeadingRef}>
            DYSKOGRAFIA
          </h2>

          <div className={styles.cardScene}>
            <div className={styles.cardDeck} ref={cardDeckRef}>
              <article
                className={`${styles.layerCard} ${styles.backCard} ${styles[stackCards[0].tone]}`}
                ref={stackBackRef}
              />

              <article
                className={`${styles.layerCard} ${styles.midCard} ${styles[stackCards[1].tone]}`}
                ref={stackMidRef}
              />

              <article
                className={`${styles.layerCard} ${styles.nearCard} ${styles[stackCards[2].tone]}`}
                ref={stackNearRef}
              />

              <article className={`${styles.layerCard} ${styles.recordCardMain}`} ref={stackTopRef}>
                <div className={styles.cardHeadLine}>
                  <h3 className={`${styles.cardTitle} ${headline.className}`}>TOXIC</h3>
                  <p className={`${styles.cardYear} ${headline.className}`}>2021</p>
                </div>
                <div className={styles.cardBody}>
                  <div>
                    <p className={styles.cardLabel}>OPIS</p>
                    <p className={`${styles.cardDescription} ${body.className}`}>
                      Wielki powrot w stylu rage/hyperpop po przerwie wydawniczej. Album uzyskal
                      status Platynowej Plyty. Goscinnie pojawili sie m.in. White 2115, White Widow
                      i Miszel.
                    </p>
                  </div>
                  <div className={styles.cardCover} />
                  <div>
                    <p className={styles.cardLabel}>TRACKLISTA</p>
                    <ol className={`${styles.trackList} ${body.className}`}>
                      {tracks.map((track) => (
                        <li key={track}>{track}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </article>
            </div>

            <div className={styles.portalPulse} ref={portalRef} />
          </div>
        </div>
      </section>

      <section className={styles.outro}>
        <div className={styles.outroInner} ref={outroInnerRef}>
          <p className={styles.outroKicker}>PHASE 03</p>
          <h3 className={`${styles.outroTitle} ${headline.className}`}>NEW ERA INTERFACE</h3>
          <p className={`${styles.outroText} ${body.className}`}>
            Burada tasarimi birebir kopyalamak yerine daha ozgun bir dil kurduk: daha sert
            tipografi, daha temiz spacing, daha net CTA hiyerarsisi ve scroll ile sahne gecisleri.
          </p>
          <div className={styles.outroActions}>
            <button className={styles.primaryBtn}>OPEN FULL EXPERIENCE</button>
            <button className={styles.secondaryBtn}>VIEW STORYBOARD</button>
          </div>
        </div>
      </section>
    </div>
  );
}
