import * as React from "react";
import { ChatMessagesOutput, Message } from "./ChatMessagesOutput";
import { ChatInput } from "./ChatInput";
import modelList from "./ChatModelList.json";

const EXTERNAL_API_URL = "https://api-chat.kwikon.club/api/chat/stream";

interface ModelMeta {
  displayName: string;
  model: string;
  provider: string;
}

export function ChatBox() {
  const [models] = React.useState<ModelMeta[]>(modelList);
  const [selectedModel, setSelectedModel] = React.useState<ModelMeta>(models[0]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatInputContainerRef = React.useRef<HTMLDivElement>(null);
  const [inputAreaHeight, setInputAreaHeight] = React.useState(0); // Initial height, will be updated by observer

  // Constants
  const PADDING_BUFFER = 16; // 1rem, extra space between last message and input area
  // Increased fallback: e.g. 20rem = 320px. This should be large enough to
  // cover almost any initial state of the input box before ResizeObserver kicks in.
  const MIN_FALLBACK_PADDING_BOTTOM = "20rem";

  // Effect for measuring input container height using ResizeObserver
  React.useEffect(() => {
    const inputContainerEl = chatInputContainerRef.current;

    if (inputContainerEl) {
      const observer = new ResizeObserver(() => {
        // Update state with the new height
        setInputAreaHeight(inputContainerEl.offsetHeight);
      });

      // Start observing the element
      observer.observe(inputContainerEl);

      // Manually trigger an initial height update in case the element's size
      // is already stable when the observer is attached.
      setInputAreaHeight(inputContainerEl.offsetHeight);

      // Cleanup function to stop observing when the component unmounts
      return () => {
        observer.unobserve(inputContainerEl);
        observer.disconnect();
      };
    }
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount

  // Effect for scrolling messages into view
  React.useEffect(() => {
    if (messagesEndRef.current) {
      const isAssistantStreaming =
        isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant";
      const scrollBehavior = isAssistantStreaming ? "auto" : "smooth";
      
      requestAnimationFrame(() => { // Defer scroll until after potential layout changes
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: scrollBehavior, block: "end" });
        }
      });
    }
  }, [messages, isLoading, inputAreaHeight]); // Re-scroll if these change

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInput(e.target.value);

  const handleModelChange = (modelValue: string) => {
    const found = models.find((m) => m.model === modelValue);
    if (found) setSelectedModel(found);
  };

  const addMessage = (message: Message) =>
    setMessages((msgs) => [...msgs, message]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setError(null);

    const newUserMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    addMessage(newUserMsg);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(EXTERNAL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: newUserMsg.content,
          model: selectedModel.model,
          provider: selectedModel.provider,
        }),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.text().catch(() => "Failed to read error body");
        setError(
          new Error(
            `API error: ${response.status} - ${response.statusText}${
              errorBody ? `\nDetails: ${errorBody.substring(0, 200)}...` : ""
            }`
          )
        );
        setIsLoading(false);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const initialAssistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
      };
      setMessages((msgs) => [...msgs, initialAssistantMsg]);
      let currentAssistantMsgId = initialAssistantMsg.id;
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        if (value) {
          let chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop()!; // Keep the potentially incomplete last line in buffer
          for (const line of lines) {
            const clean = line.trim();
            if (clean === "" || clean === "[DONE]" || clean === "data: [DONE]") continue;
            if (clean.startsWith("data:")) {
              let jsonStr = clean.slice(5).trim();
              try {
                const data = JSON.parse(jsonStr);
                if (typeof data.content === "string" && data.content.length > 0) {
                  assistantText += data.content;
                  setMessages((msgs) =>
                    msgs.map((m) =>
                      m.id === currentAssistantMsgId ? { ...m, content: assistantText } : m
                    )
                  );
                }
              } catch (err) {
                // console.error("Failed to parse stream chunk:", err, jsonStr);
              }
            }
          }
        }
        done = doneReading;
      }

      // Process any remaining data in the buffer
      if (buffer.trim()) {
        const lines = buffer.split("\n");
        for (const line of lines) {
          const clean = line.trim();
          if (clean === "" || clean === "[DONE]" || clean === "data: [DONE]") continue;
          if (clean.startsWith("data:")) {
            let jsonStr = clean.slice(5).trim();
            try {
              const data = JSON.parse(jsonStr);
              if (typeof data.content === "string" && data.content.length > 0) {
                assistantText += data.content;
                setMessages((msgs) =>
                  msgs.map((m) =>
                    m.id === currentAssistantMsgId ? { ...m, content: assistantText } : m
                  )
                );
              }
            } catch (err) {
              // console.error("Failed to parse final buffer chunk:", err, jsonStr);
            }
          }
        }
      }
    } catch (err: any) { // Corrected catch block
      setError(err instanceof Error ? err : new Error("Unknown error occurred."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Main content area: messages or initial prompt */}
      <div
        className="flex-1 overflow-y-auto pt-6 px-4"
        style={{
          paddingBottom: inputAreaHeight > 0
            ? `${inputAreaHeight + PADDING_BUFFER}px`
            : MIN_FALLBACK_PADDING_BOTTOM,
        }}
      >
        <div className={`max-w-3xl mx-auto w-full ${messages.length === 0 && !isLoading && !error ? 'flex flex-col justify-center min-h-full' : ''}`}>
          {error && (
            <div className="mb-4 p-4 rounded-lg border text-destructive border-destructive bg-destructive/10">
              <strong>Error:</strong> {error.message || "An error occurred."}
            </div>
          )}
          {messages.length === 0 && !isLoading && !error && (
            <div className="text-center py-8">
              <h1 className="text-4xl font-semibold text-foreground">Hello</h1>
              <p className="text-muted-foreground mt-2 text-lg">How can I help you today?</p>
            </div>
          )}
          {(messages.length > 0 || (isLoading && !error)) && (
             <ChatMessagesOutput messages={messages} isLoading={isLoading} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed ChatInput at the bottom - FLOATING STYLE */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pointer-events-none">
        <div
          ref={chatInputContainerRef}
          className="max-w-[832px] mx-auto w-full py-3 md:py-4 pointer-events-auto"
        >
          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            models={models}
            selectedModel={selectedModel.model}
            onModelChange={handleModelChange}
          />
        </div>
      </div>
    </div>
  );
}