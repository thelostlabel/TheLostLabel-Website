"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * Magic UI – Number Ticker
 * Smooth counting animation using requestAnimationFrame with easing.
 */
export default function NumberTicker({ value, decimalPlaces = 0, delay = 0, style = {}, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  const strVal = value?.toString() || "0";
  const numericStr = strVal.replace(/[^0-9.]/g, "");
  const suffix = strVal.replace(/[0-9.,]/g, "");
  const target = parseFloat(numericStr);

  useEffect(() => {
    if (!isInView || isNaN(target)) return;

    let startTime = null;
    let raf;
    const duration = 2000;

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp + delay * 1000;
      const elapsed = Math.max(0, timestamp - startTime);
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);

      setDisplay(eased * target);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, delay]);

  if (isNaN(target) || numericStr === "") return <span>{value}</span>;

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return (
    <span ref={ref} className={className} style={style}>
      {formatted}{suffix}
    </span>
  );
}
