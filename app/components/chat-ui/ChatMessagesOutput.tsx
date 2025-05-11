import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
// Ensure "highlight.js/styles/atom-one-dark.css" is imported globally in your app  
import { MdCheckBoxOutlineBlank, MdCheckBox } from "react-icons/md";
import type { Components } from "react-markdown";
import 'highlight.js/styles/atom-one-dark.css'  

// --- BEGIN TYPE FIXES ---  
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  node?: any;
}

interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  checked?: boolean;
  ordered?: boolean;
  children?: React.ReactNode;
}
// --- END TYPE FIXES ---  

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// HAST node types (simplified for extractText)  
interface HastNode {
  type: "text" | "element";
  value?: string;
  children?: HastNode[];
  tagName?: string;
  properties?: Record<string, unknown>;
}

// Recursive function to extract text from HAST nodes  
const extractText = (nodes?: HastNode[]): string => {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value || "";
      if (node.children && node.type === "element") return extractText(node.children);
      return "";
    })
    .join("");
};

const markdownComponents: Components = {
  p: (props) => (
    <p className="my-3 leading-relaxed text-base" {...props} />
  ),
  code: ({ node, inline, className, children, ...props }: CodeProps) => {
    // Debug logs to trace inline prop, node, and content
    // console.log("Code Component - Inline:", inline, "ClassName:", className, "Content:", children);
    // console.log("Code Component - Node:", node);

    const match = /language-(\w+)/.exec(className || "");
    let language = match ? match[1] : undefined;
    // Normalize common non-specific language tags to undefined  
    if (language === "null" || language === "text" || language === "plaintext") {
      language = undefined;
    }

    // Improved fallback: Check node type and position to determine if it's inline
    const isInlineNode = node?.type === "inlineCode" || node?.position?.start?.column === node?.position?.end?.column;
    const content = children?.toString() || "";
    const isSingleLine = !content.includes("\n");

    if (inline !== false && (inline || isInlineNode || isSingleLine)) {
      // console.log("Rendering as inline code:", content);
      return (
        <code
          className={`bg-muted/50 text-foreground px-1.5 py-0.5 rounded font-mono text-sm ${className || ""}`}
          {...props}
        >
          {children}
        </code>
      );
    }

    // console.log("Rendering as code block:", content);
    const rawCodeContent = node && "children" in node && node.children ? extractText(node.children as HastNode[]) : "";
    const cleanedCodeForCopy = rawCodeContent.trim();

    return (
      <div className="relative rounded-lg overflow-hidden shadow-sm my-4 border border-border bg-card/50 dark:bg-zinc-900/50">
        {/* Unified Code Block Header */}
        <div className="bg-muted/70 dark:bg-zinc-800/70 text-muted-foreground py-1.5 px-4 font-mono text-xs flex items-center justify-between border-b border-border">
          {/* Language Tag (conditionally rendered) or an empty span as placeholder */}
          {language ? (
            <span className="uppercase tracking-wider">{language}</span>
          ) : (
            <span />
          )}
          {/* Copy Button (only for code blocks) */}
          <button
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded px-2 py-0.5 text-xs transition-colors flex items-center gap-1 border border-transparent hover:border-border"
            onClick={() => {
              navigator.clipboard.writeText(cleanedCodeForCopy).catch((err) => {
                console.error("Failed to copy code:", err);
              });
            }}
            type="button"
            aria-label="Copy code to clipboard"
          >
            Copy
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto" style={{ margin: 0, backgroundColor: 'transparent' }}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  },
  li: ({ children, checked, ordered, ...props }: ListItemProps) => {
    if (typeof checked === "boolean") {
      return (
        <li
          className="flex items-start gap-2 my-1.5 ml-0"
          style={{ listStyle: "none" }}
          {...props}
        >
          <span className="pt-0.5">
            {checked ? (
              <MdCheckBox size="1.2em" className="text-primary" />
            ) : (
              <MdCheckBoxOutlineBlank size="1.2em" className="text-muted-foreground" />
            )}
          </span>
          <span className={checked ? "line-through text-muted-foreground" : ""}>
            {children}
          </span>
        </li>
      );
    }
    return (
      <li
        className={`ml-6 mb-1.5 ${ordered ? "list-decimal" : "list-disc"}`}
        {...props}
      >
        {children}
      </li>
    );
  },
  h1: (props) => (
    <h1 className="text-3xl font-bold my-4 pb-2 border-b border-border" {...props} />
  ),
  h2: (props) => (
    <h2 className="text-2xl font-semibold my-3 pb-1 border-b border-border" {...props} />
  ),
  h3: (props) => (
    <h3 className="text-xl font-semibold my-2" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="my-3 pl-4 border-l-4 border-primary/50 italic text-muted-foreground bg-muted/20 py-2" {...props} />
  ),
  table: (props) => (
    <div className="my-4 overflow-x-auto border border-border rounded-md">
      <table className="min-w-full divide-y divide-border" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-muted/50 dark:bg-zinc-800/50" {...props} />,
  tbody: (props) => <tbody className="divide-y divide-border bg-card" {...props} />,
  tr: (props) => <tr className="hover:bg-muted/30 dark:hover:bg-zinc-700/30 transition-colors" {...props} />,
  th: (props) => <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props} />,
  td: (props) => <td className="px-4 py-2.5 text-sm text-foreground" {...props} />,
  a: (props) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
};

interface ChatMessagesOutputProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessagesOutput({ messages, isLoading }: ChatMessagesOutputProps) {
  return (
    <div className="flex flex-col space-y-5 w-full">
      {messages.map((msg, index) => {
        // Debug log for incoming message content
        // console.log("Message Content:", msg.content);

        const isUser = msg.role === "user";
        const isAssistant = msg.role === "assistant";
        const isStreamingAssistant = isAssistant && isLoading && index === messages.length - 1;

        return (
          <div
            key={msg.id}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                py-3 px-4 md:py-4 md:px-5 rounded-2xl shadow-sm break-words
                ${isUser
                  ? "bg-primary/20 text-primary border border-primary/20 rounded-br-lg py-2 px-3 md:py-2.5 md:px-3.5" 
                  : "bg-card text-foreground border border-border rounded-bl-lg"
                }
                transition-all
              `}
              style={{
                width: "auto",
                minWidth: isAssistant ? "80px" : undefined,
                maxWidth: isAssistant ? "100%" : "calc(100% - 0.5rem)",
                minHeight: isAssistant ? "50px" : undefined,
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
                skipHtml={false}
              >
                {msg.content}
              </ReactMarkdown>
              {isStreamingAssistant && msg.content.length > 0 && (
                <span className="inline-block ml-1 animate-pulse">▍</span>
              )}
            </div>
          </div>
        );
      })}
      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start w-full">
            <div
              className="py-3 px-4 md:py-4 md:px-5 rounded-2xl shadow-sm break-words bg-card text-foreground border border-border rounded-bl-lg flex items-center space-x-2"
              style={{
                width: "auto",
                minWidth: "80px",
                maxWidth: "100%",
                minHeight: "50px",
              }}
            >
              <span className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground"></span>
              <span className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: "100ms" }}></span>
              <span className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: "200ms" }}></span>
            </div>
          </div>
        )}
    </div>
  );
}