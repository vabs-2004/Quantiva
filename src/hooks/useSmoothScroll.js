import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Custom hook for Lenis smooth scrolling.
 * Initializes Lenis on mount, cleans up on unmount.
 * Returns the lenis instance ref for programmatic scroll control.
 */
export default function useSmoothScroll(options = {}) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      ...options,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return lenisRef;
}
