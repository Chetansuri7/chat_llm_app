// app/hooks/use-mobile.tsx
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize with a value based on the current window size if available,
  // otherwise undefined (for SSR).
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    // Ensure this effect only runs on the client
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Set initial state correctly based on mql.matches after mount
    // This handles cases where the initial useState value might be stale
    // if the window was resized before React hydrated.
    setIsMobile(mql.matches);

    // Safari < 14 compatibility for addEventListener/removeEventListener
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else {
      // Fallback for older browsers (deprecated)
      mql.addListener(onChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Return false if undefined (e.g., during SSR or before first client-side effect)
  // This provides a consistent boolean return type.
  return isMobile === undefined ? false : isMobile;
}