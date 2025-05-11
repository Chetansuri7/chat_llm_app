import { cn } from "~/lib/utils";  
import { Home, MessageCircle, Settings } from "lucide-react";  
import React from "react";  
  
const navItems = [  
  { label: "Home", icon: <Home size={20} />, href: "#" },  
  { label: "Chats", icon: <MessageCircle size={20} />, href: "#" },  
  { label: "Settings", icon: <Settings size={20} />, href: "#" },  
];  
  
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {  
  return (  
    <aside  
      className={cn(  
        "fixed inset-y-0 left-0 z-40 w-64 bg-card shadow transition-transform duration-200",  
        open ? "translate-x-0" : "-translate-x-full",  
        "md:translate-x-0"  
      )}  
    >  
      <div className="flex items-center h-16 px-4 border-b border-border text-xl font-bold text-foreground">Logo</div>  
      <nav className="p-4">  
        <ul>  
          {navItems.map((item) => (  
            <li key={item.label} className="mb-2">  
              <a  
                href={item.href}  
                className="flex items-center p-2 rounded-md hover:bg-muted gap-2 font-medium text-foreground"  
              >  
                {item.icon}  
                {item.label}  
              </a>  
            </li>  
          ))}  
        </ul>  
      </nav>  
      <button onClick={onClose} className="md:hidden absolute top-2 right-2 p-2 text-2xl text-muted-foreground">  
        ×  
      </button>  
    </aside>  
  );  
}  