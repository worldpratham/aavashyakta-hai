import { useCallback, useEffect, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * High-performance callback-ref hook for scroll reveal transitions.
 * Guaranteed to trigger as soon as the DOM node renders (even with async data).
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: ScrollRevealOptions = {}
) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Safety fallback: reveal after timeout so cards are never stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const ref = useCallback(
    (node: T | null) => {
      if (!node) return;

      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        setIsRevealed(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.unobserve(node);
          }
        },
        {
          threshold: options.threshold ?? 0.05,
          rootMargin: options.rootMargin ?? '0px 0px -30px 0px',
        }
      );

      observer.observe(node);
    },
    [options.threshold, options.rootMargin]
  );

  return [ref, isRevealed] as const;
}
