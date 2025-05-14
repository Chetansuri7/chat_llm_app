// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigation } from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import "./tailwind.css";
import { Progress } from "~/components/ui/progress"; // Import Progress
import * as React from "react";
import { Toaster } from 'sonner'; // Import Toaster

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Script for theme-color meta tag, similar to Vercel's example
const THEME_COLOR_LIGHT = 'hsl(0 0% 100%)'; // Example light theme color
const THEME_COLOR_DARK = 'hsl(240 10% 3.9%)'; // Example dark theme color (adjust to your dark theme's bg)
const THEME_COLOR_SCRIPT = `
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    // Assuming you use a 'dark' class on <html> for dark mode
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${THEME_COLOR_DARK}' : '${THEME_COLOR_LIGHT}');
  }
  // Initial call
  updateThemeColor();
  // Observe class changes on <html> for dark mode toggle
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateThemeColor();
      }
    });
  });
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
})();
`;


export function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [progressValue, setProgressValue] = React.useState(0);
  const [showProgress, setShowProgress] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (navigation.state === "loading" || navigation.state === "submitting") {
      setShowProgress(true);
      setProgressValue(0); // Reset
      let currentProgress = 10;
      setProgressValue(currentProgress);
      timer = setInterval(() => {
        currentProgress += 15;
        if (currentProgress < 90) {
          setProgressValue(currentProgress);
        } else {
          // Stall progress
        }
      }, 200);
    } else if (navigation.state === "idle") {
      setProgressValue(100);
      timer = setTimeout(() => setShowProgress(false), 300);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [navigation.state]);

  return (
    <html lang="en" className="h-dvh min-h-dvh" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /> {/* Added maximum-scale=1 */}
        <Meta />
        <title>Krivi AI - Ignite & Flow</title>
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }} />
      </head>
      <body className="h-dvh min-h-dvh bg-background text-foreground antialiased">
        {showProgress && (
          <div className="fixed top-0 left-0 right-0 z-[9999] h-1"> {/* Increased z-index */}
            <Progress value={progressValue} className="w-full h-full rounded-none bg-primary/30" />
          </div>
        )}
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster richColors closeButton theme="system" position="top-center" /> {/* Added Toaster */}
      </body>
    </html>
  );
}
export default function App() {
  return <Outlet />;
}