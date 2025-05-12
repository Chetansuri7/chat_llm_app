import * as React from "react";  
import { FiSend, FiPaperclip, FiBox } from "react-icons/fi";  
  
interface ModelMeta {  
  displayName: string;  
  model: string;  
  provider: string;  
}  
  
interface ChatInputProps {  
  input: string;  
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;  
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;  
  isLoading: boolean;  
  models: ModelMeta[];  
  selectedModel: string;  
  onModelChange: (model: string) => void;  
}  
  
// Helper to detect mobile (pointer: coarse or userAgent fallback for SSR)  
function isProbablyMobile() {  
  if (typeof window !== "undefined") {  
    if (window.matchMedia("(pointer: coarse)").matches) return true;  
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);  
  }  
  // Fallback: treat as desktop (safe)  
  return false;  
}  
  
export function ChatInput({  
  input,  
  onChange,  
  onSubmit,  
  isLoading,  
  models,  
  selectedModel,  
  onModelChange,  
}: ChatInputProps) {  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);  
  
  // Resize textarea height automatically  
  React.useEffect(() => {  
    if (textareaRef.current) {  
      textareaRef.current.style.height = "auto";  
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;  
    }  
  }, [input]);  
  
  // Main KeyDown handler  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {  
    const isMobile = isProbablyMobile();  
  
    // Always allow Shift+Enter or Ctrl+Enter: insert newline  
    if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {  
      // Allow browser default (newline)  
      return;  
    }  
  
    // On mobile: never submit on Enter, always newline  
    if (isMobile) return;  
  
    // On desktop/laptop: Enter (no modifier) submits, preventDefault so it doesn't create a newline  
    if (e.key === "Enter") {  
      e.preventDefault();  
      if (!isLoading && input.trim()) {  
        // This ensures onSubmit is called and form validated  
        const form = e.currentTarget.form;  
        if (form) {  
          form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));  
        }  
      }  
    }  
  };  
  
  // Option style (unchanged)  
  const getOptionStyleByProvider = (provider: string): React.CSSProperties => {  
    switch (provider.toLowerCase()) {  
      case "openai":  
        return { backgroundColor: "hsl(var(--popover, #f0f9ff))", color: "hsl(var(--popover-foreground, #0284c7))" };  
      case "anthropic":  
        return { backgroundColor: "hsl(var(--popover, #f0fdf4))", color: "hsl(var(--popover-foreground, #15803d))" };  
      case "google":  
        return { backgroundColor: "hsl(var(--popover, #fffbeb))", color: "hsl(var(--popover-foreground, #b45309))" };  
      default:  
        return {  
          backgroundColor: "hsl(var(--popover, white))",  
          color: "hsl(var(--popover-foreground, black))",  
        };  
    }  
  };  
  
  return (  
    <form  
      onSubmit={onSubmit}  
      className="relative flex flex-col bg-card rounded-xl border border-border shadow-lg p-2 sm:p-3 w-full"  
    >  
      <textarea  
        ref={textareaRef}  
        value={input}  
        onChange={onChange}  
        onKeyDown={handleKeyDown}  
        placeholder="Ask Anything..."  
        rows={1}  
        className="w-full px-3 py-2.5 rounded-lg border-none outline-none focus:ring-0 bg-transparent text-base text-foreground placeholder-muted-foreground resize-none max-h-36 leading-relaxed overflow-y-auto"  
        style={{ minHeight: "calc(1.625rem + 20px)" }}  
        disabled={isLoading}  
      />  
      <div className="flex items-center justify-between mt-2">  
        {/* Left controls */}  
        <div className="flex items-center gap-2">  
          <select  
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer"  
            value={selectedModel}  
            onChange={e => onModelChange(e.target.value)}  
            disabled={isLoading}  
            aria-label="Select AI Model"  
          >  
            {models.map((m) => (  
              <option  
                key={m.model}  
                value={m.model}  
                style={getOptionStyleByProvider(m.provider)}  
              >  
                {m.displayName}  
              </option>  
            ))}  
          </select>  
        </div>  
        {/* Right controls */}  
        <div className="flex items-center gap-1 sm:gap-2">  
          <button  
            type="button"  
            disabled  
            className="text-muted-foreground hover:text-foreground p-1.5 sm:p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"  
            title="Attach file (coming soon)"  
          >  
            <FiPaperclip size={18} />  
          </button>  
          <button  
            type="button"  
            disabled  
            className="text-muted-foreground hover:text-foreground p-1.5 sm:p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"  
            title="Box feature (coming soon)"  
          >  
            <FiBox size={18} />  
          </button>  
          <div className="border-l h-5 mx-1 border-border"></div>  
          <button  
            type="submit"  
            className="rounded-lg p-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"  
            disabled={isLoading || !input.trim()}  
            title="Send message"  
          >  
            <FiSend size={20} />  
          </button>  
        </div>  
      </div>  
    </form>  
  );  
}  