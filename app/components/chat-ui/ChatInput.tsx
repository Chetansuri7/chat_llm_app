import * as React from "react";
import { FiSend, FiPaperclip, FiBox } from "react-icons/fi";

interface ModelMeta {
  displayName: string;
  model: string;
  provider: string;
  // You could potentially add more fields here if needed, e.g., specific color codes from your JSON
  // optionColors?: { background: string; text: string };
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

// Helper function to determine option style based on the provider
// Note: Ensure that CSS variables like --popover and --popover-foreground are defined in your global styles.
// If not, provide fallback literal color values (e.g., 'white', '#000000').
const getOptionStyleByProvider = (provider: string): React.CSSProperties => {
  // Example: Customize colors based on provider.
  // Replace these with actual colors from your theme or specific requirements.
  // These colors are just illustrative.
  switch (provider.toLowerCase()) {
    case "openai": // Example provider name
      return { backgroundColor: "hsl(var(--popover, #f0f9ff))", color: "hsl(var(--popover-foreground, #0284c7))" }; // Light blueish
    case "anthropic": // Example provider name
      return { backgroundColor: "hsl(var(--popover, #f0fdf4))", color: "hsl(var(--popover-foreground, #15803d))" }; // Light greenish
    case "google": // Example provider name
      return { backgroundColor: "hsl(var(--popover, #fffbeb))", color: "hsl(var(--popover-foreground, #b45309))" }; // Light yellowish
    default:
      // Fallback style for providers not explicitly listed or for a general option style
      return {
        backgroundColor: "hsl(var(--popover, white))", // Default popover background
        color: "hsl(var(--popover-foreground, black))",   // Default popover text color
      };
  }
};

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        const form = e.currentTarget.form;
        if (form) {
          form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  }, [input]);

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
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer" // Removed hover:bg-accent
            value={selectedModel}
            onChange={e => onModelChange(e.target.value)}
            disabled={isLoading}
            aria-label="Select AI Model"
          >
            {models.map((m) => (
              <option
                key={m.model}
                value={m.model}
                // Apply dynamic styles to each option based on its provider
                // Styling <option> elements can be inconsistent across browsers.
                // Background and color are generally supported.
                style={getOptionStyleByProvider(m.provider)}
              >
                {m.displayName}
              </option>
            ))}
          </select>
          {/* <button
            type="button"
            className="border rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground flex items-center gap-1"
            disabled
            title="Current context or mode (placeholder)"
          >
            <span>💡</span>Thinking (k1.5)
          </button> */}
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