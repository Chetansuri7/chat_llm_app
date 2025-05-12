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
  
  // Scroll to bottom on message send/receive  
  React.useEffect(() => {  
    if (messagesEndRef.current) {  
      const isAssistantStreaming =  
        isLoading &&  
        messages.length > 0 &&  
        messages[messages.length - 1].role === "assistant";  
      const scrollBehavior = isAssistantStreaming ? "auto" : "smooth";  
  
      requestAnimationFrame(() => {  
        if (messagesEndRef.current) {  
          messagesEndRef.current.scrollIntoView({ behavior: scrollBehavior, block: "end" });  
        }  
      });  
    }  
  }, [messages, isLoading]); // No input area height!  
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value);  
  
  const handleModelChange = (modelValue: string) => {  
    const found = models.find((m) => m.model === modelValue);  
    if (found) setSelectedModel(found);  
  };  
  
  const addMessage = (message: Message) => setMessages((msgs) => [...msgs, message]);  
  
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
                // Ignore parse errors  
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
              // Ignore parse errors  
            }  
          }  
        }  
      }  
    } catch (err: any) {  
      setError(err instanceof Error ? err : new Error("Unknown error occurred."));  
    } finally {  
      setIsLoading(false);  
    }  
  };  
  
  // KEY UI CHANGE: Static bottom padding (tweak px as needed)  
  const MESSAGE_AREA_PADDING = "5.5rem";  
  
  return (  
    <div className="flex flex-col h-screen w-full bg-background">  
      {/* Main content area: messages or initial prompt */}  
      <div  
        className="flex-1 overflow-y-auto pt-6 px-4"  
        style={{  
          paddingBottom: MESSAGE_AREA_PADDING,  
        }}  
      >  
        <div  
          className={`max-w-3xl mx-auto w-full ${  
            messages.length === 0 && !isLoading && !error  
              ? "flex flex-col justify-center min-h-full"  
              : ""  
          }`}  
        >  
          {error && (  
            <div className="mb-4 p-4 rounded-lg border text-destructive border-destructive bg-destructive/10">  
              <strong>Error:</strong> {error.message || "An error occurred."}  
            </div>  
          )}  
          {messages.length === 0 && !isLoading && !error && (  
            <div className="text-center py-8">  
              <h1 className="text-4xl font-semibold text-foreground">Hello</h1>  
              <p className="text-muted-foreground mt-2 text-lg">  
                How can I help you today?  
              </p>  
            </div>  
          )}  
          {(messages.length > 0 || (isLoading && !error)) && (  
            <ChatMessagesOutput messages={messages} isLoading={isLoading} />  
          )}  
          <div ref={messagesEndRef} />  
        </div>  
      </div>  
  
      {/* Fixed ChatInput at the bottom */}  
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pointer-events-none">  
        <div className="max-w-[832px] mx-auto w-full py-3 md:py-4 pointer-events-auto">  
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