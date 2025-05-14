// app/components/chat-ui/PageLayout.tsx
import * as React from "react";
import { useNavigate } from "@remix-run/react";
import { Sidebar } from "./Sidebar";
import { cn } from "~/lib/utils"; // Ensure cn is imported

export function PageLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = React.useState(false);

  function handleNewChat() {
    navigate("/");
  }

  function toggleDesktopSidebar() {
    setIsDesktopSidebarCollapsed(prev => !prev);
  }

  return (
    <div className="min-h-screen bg-background flex flex-row">
      <Sidebar
        onNewChat={handleNewChat}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onToggleDesktopCollapse={toggleDesktopSidebar}
      />
      <main className={cn(
        "flex-1 flex flex-col relative max-w-full overflow-x-hidden", // Added overflow-x-hidden
        "transition-all duration-300 ease-in-out", // For smooth margin transition
        "ml-0", // Base margin for mobile (content starts at edge)
        isDesktopSidebarCollapsed ? "md:ml-20" : "md:ml-72" // Dynamic margin for desktop
      )}>
        {children}
      </main>
    </div>
  );
}