import React, { useState, useEffect, useRef } from "react";  
import { useNavigate } from "@remix-run/react";  
import { cn } from "~/lib/utils";  
import {  
  FaCommentDots,  
  FaPlus,  
  FaBars,  
  FaUserCircle,  
  FaChevronLeft,  
  FaChevronRight,  
  FaTimes,  
} from "react-icons/fa";  
import FocusTrap from "focus-trap-react";  
  
// --- BUTTON COMPONENT ---  
type ButtonSize = "sm" | "default" | "lg" | "xs";  
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {  
  variant?: "primary" | "secondary" | "ghost" | "outline";  
  size?: ButtonSize;  
  leftIcon?: React.ReactNode;  
  rightIcon?: React.ReactNode;  
  isCollapsed?: boolean;  
}  
  
/**  
 * Consistent, scalable Button, with smart icon-only detection and sizing.  
 */  
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(  
  (  
    {  
      className,  
      variant = "primary",  
      size = "sm",  
      leftIcon,  
      rightIcon,  
      children,  
      isCollapsed,  
      ...props  
    },  
    ref  
  ) => {  
    // Standardized size config with all keys for all sizes!  
    const sizeConfig: Record<  
      ButtonSize,  
      { h: string; w: string; px: string; py: string; text: string }  
    > = {  
      xs: { h: "h-8", w: "w-8", px: "px-0", py: "py-0", text: "text-xs" }, // 32  
      sm: { h: "h-10", w: "w-10", px: "px-2", py: "py-0", text: "text-sm" }, // 40  
      default: { h: "h-11", w: "w-11", px: "px-4", py: "py-2", text: "text-base" }, // 44  
      lg: { h: "h-12", w: "w-12", px: "px-6", py: "py-2", text: "text-lg" }, // 48  
    };  
  
    const baseStyles =  
      "inline-flex items-center justify-center rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors whitespace-nowrap select-none";  
  
    const variantStyles = {  
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",  
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",  
      ghost: "hover:bg-accent hover:text-accent-foreground",  
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",  
    };  
  
    // Text render logic  
    const hasVisibleTextChildren = React.Children.toArray(children).some(  
      (child) => typeof child === "string" && child.trim() !== ""  
    );  
    const shouldShowText = !isCollapsed && hasVisibleTextChildren;  
    const isEffectivelyIconOnly =  
      (leftIcon || rightIcon) && !shouldShowText;  
  
    // Handling sizing: If icon-only, make square and centered  
    const s = sizeConfig[size];  
    let currentSizeStyles: string;  
    if (isEffectivelyIconOnly) {  
      currentSizeStyles = cn(s.h, s.w /* square */, s.text);  
    } else {  
      currentSizeStyles = cn(s.h, s.px, s.py, s.text);  
    }  
    // For most desktop sidebars, size="sm" (40x40) is ideal  
  
    return (  
      <button  
        className={cn(  
          baseStyles,  
          variantStyles[variant],  
          currentSizeStyles,  
          className  
        )}  
        ref={ref}  
        {...props}  
      >  
        {leftIcon && (  
          <span className={shouldShowText ? "mr-1.5" : ""}>{leftIcon}</span>  
        )}  
        {shouldShowText && children}  
        {rightIcon && (  
          <span className={shouldShowText ? "ml-1.5" : ""}>{rightIcon}</span>  
        )}  
        {/* Unlikely, but in case: Icon-only passed as children */}  
        {!leftIcon && !rightIcon && !hasVisibleTextChildren && children}  
      </button>  
    );  
  }  
);  
Button.displayName = "Button";  
  
// --- DRAWER (Mobile-only) ---  
interface DrawerProps {  
  isOpen: boolean;  
  onClose: () => void;  
  children: React.ReactNode;  
  side?: "left" | "right";  
}  
function Drawer({ isOpen, onClose, children, side = "left" }: DrawerProps) {  
  const drawerRef = useRef<HTMLDivElement>(null);  
  
  useEffect(() => {  
    if (!isOpen) return;  
    const esc = (event: KeyboardEvent) => event.key === "Escape" && onClose();  
    document.addEventListener("keydown", esc);  
    const out = (event: MouseEvent) => {  
      if (  
        drawerRef.current &&  
        !drawerRef.current.contains(event.target as Node)  
      ) {  
        onClose();  
      }  
    };  
    document.addEventListener("mousedown", out);  
  
    return () => {  
      document.removeEventListener("keydown", esc);  
      document.removeEventListener("mousedown", out);  
    };  
  }, [isOpen, onClose]);  
  
  return (  
    <FocusTrap active={isOpen}>  
      <div  
        className={cn(  
          "fixed inset-0 z-50",  
          isOpen ? "pointer-events-auto" : "pointer-events-none"  
        )}  
        aria-modal="true"  
        role="dialog"  
      >  
        <div  
          className={cn(  
            "fixed inset-0 bg-black/60 transition-opacity duration-300 ease-in-out",  
            isOpen ? "opacity-100" : "opacity-0"  
          )}  
          onClick={onClose}  
          aria-hidden="true"  
        />  
        <aside  
          ref={drawerRef}  
          className={cn(  
            "absolute top-0 bottom-0 z-[51] bg-card shadow-xl flex flex-col transition-transform duration-300 ease-in-out",  
            "w-[min(80vw,320px)] sm:w-[min(60vw,350px)]",  
            side === "left" ? "left-0 border-r border-border" : "right-0 border-l border-border",  
            side === "left" && (isOpen ? "translate-x-0" : "-translate-x-full"),  
            side === "right" && (isOpen ? "translate-x-0" : "translate-x-full")  
          )}  
        >  
          {children}  
        </aside>  
      </div>  
    </FocusTrap>  
  );  
}  
  
// --- SIDEBAR HEADER ---  
interface SidebarHeaderProps { onToggle?: () => void; isDesktop?: boolean; }  
function SidebarHeader({ onToggle, isDesktop }: SidebarHeaderProps) {  
  return (  
    <div className="relative h-14 flex-shrink-0 w-full border-b border-border px-3 flex items-center justify-between">  
      <div className="flex items-center gap-2.5 min-w-0">  
        <span>  
          <FaCommentDots size={20} className="text-primary flex-shrink-0" />  
        </span>  
        <span  
          id={isDesktop ? "sidebar-title" : "drawer-title"}  
          className="font-semibold text-base tracking-tight text-foreground select-none truncate"  
        >  
          Krivi AI  
        </span>  
      </div>  
      {onToggle && (  
        <Button  
          variant="ghost"  
          size="sm"  
          onClick={onToggle}  
          aria-label={isDesktop ? "Collapse sidebar" : "Close sidebar"}  
          title={isDesktop ? "Collapse sidebar" : "Close sidebar"}  
        >  
          {isDesktop ? <FaChevronLeft size={18} /> : <FaTimes size={20} />}  
        </Button>  
      )}  
    </div>  
  );  
}  
  
// --- CONSISTENT MINIMAL SIDEBAR (Sidebar Collapsed) ---  
interface MinimalSidebarProps { onExpand: () => void; onNewChat: () => void; }  
/**  
 * Minimal Sidebar (icon-only) with consistent button sizes; feels the same open/collapsed.  
 */  
function MinimalSidebar({ onExpand, onNewChat }: MinimalSidebarProps) {  
  return (  
    <div className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col w-16 bg-card border-r border-border items-center py-3 space-y-2">  
      {/* Top expand/collapse button */}  
      <div className="w-full border-b border-border pb-3 flex justify-center">  
        <Button  
          variant="ghost"  
          // Consistent medium size!  
          size="sm"  
          onClick={onExpand}  
          aria-label="Expand sidebar"  
          title="Expand sidebar"  
        >  
          <FaBars size={18} />  
        </Button>  
      </div>  
      {/* Main (new chat) button */}  
      <Button  
        variant="primary"  
        size="sm"  
        onClick={onNewChat}  
        aria-label="New chat"  
        title="New chat"  
      >  
        <FaPlus size={16} />  
      </Button>  
    </div>  
  );  
}  
  
// --- EXPANDED SIDEBAR CONTENT ---  
interface SidebarContentProps {  
  onNewChat: () => void;  
  onCloseDrawer?: () => void;  
  onCollapseToggle?: () => void;  
  isDesktop?: boolean;  
}  
function SidebarContent({  
  onNewChat,  
  onCloseDrawer,  
  onCollapseToggle,  
  isDesktop,  
}: SidebarContentProps) {  
  const navigate = useNavigate();  
  
  const handleNewChatClick = () => {  
    onNewChat();  
    if (onCloseDrawer) onCloseDrawer();  
  };  
  
  const chatSessions = [  
    { id: "1", name: "Discussing Q3 Goals & Key Results" },  
    { id: "2", name: "Project Phoenix Brainstorming Session" },  
    { id: "3", name: "Feedback on new UI draft v2.1" },  
    { id: "4", name: "API Rate Limits Question" },  
  ];  
  const [activeSessionId, setActiveSessionId] = useState<string | null>("2");  
  
  const handleSessionClick = (sessionId: string) => {  
    setActiveSessionId(sessionId);  
    navigate(`/chat/${sessionId}`);  
    if (onCloseDrawer) onCloseDrawer();  
  };  
  
  return (  
    <>  
      <SidebarHeader  
        onToggle={isDesktop ? onCollapseToggle : onCloseDrawer}  
        isDesktop={isDesktop}  
      />  
      <div className="p-3 flex-shrink-0">  
        <Button  
          variant="primary"  
          size="sm"  
          className="w-full"  
          onClick={handleNewChatClick}  
          leftIcon={<FaPlus size={16} />}  
          title="New Chat"  
          aria-label="Start a new chat"  
        >  
          New Chat  
        </Button>  
      </div>  
      <nav  
        className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5 min-h-0"  
        aria-label="Chat history"  
      >  
        {chatSessions.length > 0 ? (  
          chatSessions.map((session) => (  
            <a  
              key={session.id}  
              href={`/chat/${session.id}`}  
              onClick={(e) => {  
                e.preventDefault();  
                handleSessionClick(session.id);  
              }}  
              className={cn(  
                "flex items-center gap-2.5 py-2 px-2.5 rounded-md text-sm font-medium group",  
                "transition-colors duration-150 h-10",  
                activeSessionId === session.id  
                  ? "bg-primary/10 text-primary"  
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"  
              )}  
              title={session.name}  
            >  
              <FaCommentDots  
                size={16}  
                className={cn(  
                  "flex-shrink-0",  
                  activeSessionId === session.id  
                    ? "text-primary"  
                    : "text-muted-foreground group-hover:text-accent-foreground"  
                )}  
              />  
              <span className="truncate flex-1">{session.name}</span>  
            </a>  
          ))  
        ) : (  
          <div className="text-muted-foreground text-center mt-8 text-xs select-none px-2">  
            No conversations yet.<br />  
            Your chats will appear here.  
          </div>  
        )}  
      </nav>  
      <div className="mt-auto pt-2 pb-3 px-3 flex-shrink-0 border-t border-border">  
        <Button  
          variant="ghost"  
          size="sm"  
          className="w-full justify-start text-left"  
          onClick={() => {  
            navigate("/profile");  
            if (onCloseDrawer) onCloseDrawer();  
          }}  
          leftIcon={<FaUserCircle size={18} />}  
          title="My Profile"  
          aria-label="View your profile"  
        >  
          My Profile  
        </Button>  
      </div>  
    </>  
  );  
}  
  
// --- SIDEBAR MAIN ---  
export interface SidebarProps {  
  onNewChat: () => void;  
  className?: string;  
  isDesktopCollapsed: boolean;  
  onToggleDesktopCollapse: () => void;  
}  
/**  
 * Responsive Sidebar (mobile, expanded, collapsed). Consistent medium sizing.  
 */  
export function Sidebar({  
  onNewChat,  
  className,  
  isDesktopCollapsed,  
  onToggleDesktopCollapse,  
}: SidebarProps) {  
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);  
  
  return (  
    <>  
      {/* MOBILE: Hamburger open sidebar */}  
      {!isMobileDrawerOpen && (  
        <div className="md:hidden fixed top-3 left-3 z-[60]">  
          <Button  
            variant="outline"  
            size="sm"  
            onClick={() => setIsMobileDrawerOpen(true)}  
            aria-label="Open sidebar"  
            className="p-2 shadow-md !rounded-lg"  
            title="Open sidebar"  
          >  
            <FaBars size={18} />  
          </Button>  
        </div>  
      )}  
  
      {/* DESKTOP: Minimal Collapsed Sidebar */}  
      {isDesktopCollapsed && (  
        <MinimalSidebar  
          onExpand={onToggleDesktopCollapse}  
          onNewChat={onNewChat}  
        />  
      )}  
  
      {/* DESKTOP: Expanded Sidebar */}  
      {!isDesktopCollapsed && (  
        <aside  
          className={cn(  
            "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col max-h-screen bg-card border-r border-border",  
            "transition-all duration-300 ease-in-out",  
            "w-56", // 224px Amazon/Google style  
            className  
          )}  
        >  
          <SidebarContent  
            onNewChat={onNewChat}  
            isDesktop={true}  
            onCollapseToggle={onToggleDesktopCollapse}  
          />  
        </aside>  
      )}  
  
      {/* MOBILE: Drawer sidebar */}  
      <Drawer  
        isOpen={isMobileDrawerOpen}  
        onClose={() => setIsMobileDrawerOpen(false)}  
        side="left"  
      >  
        <SidebarContent  
          onNewChat={onNewChat}  
          onCloseDrawer={() => setIsMobileDrawerOpen(false)}  
          isDesktop={false}  
        />  
      </Drawer>  
    </>  
  );  
}  