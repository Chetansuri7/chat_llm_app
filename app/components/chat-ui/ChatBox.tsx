// app/components/chat-ui/ChatBox.tsx  

import * as React from "react";
import { ChatMessagesOutput, Message } from "./ChatMessagesOutput";
import { ChatInput } from "./ChatInput";
import modelList from "./ChatModelList.json";
// import { useIsMobile } from "~/hooks/use-mobile"; // useIsMobile can be used if more specific mobile logic is needed here

const EXTERNAL_API_URL = "https://api-chat.kwikon.club/api/chat/stream";

interface ModelMeta {
  displayName: string;
  model: string;
  provider: string;
}

interface ChatBoxProps {
  chatId: string | undefined;
  messages: Message[];
  onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
  onNewChatIdGenerated: (newChatId: string, initialMessages: Message[]) => void;
}

export function ChatBox({
  chatId,
  messages,
  onMessagesChange,
  onNewChatIdGenerated,
}: ChatBoxProps) {
  // console.log(`ChatBox RENDER: chatId: ${chatId}, PROPS messages count: ${messages.length}, last prop message: ${messages[messages.length-1]?.content.slice(0,30) || 'N/A'}`);

  const [models] = React.useState<ModelMeta[]>(modelList);
  const [selectedModel, setSelectedModel] = React.useState<ModelMeta>(models[0]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatInputWrapperRef = React.useRef<HTMLDivElement>(null);
  const [chatInputHeight, setChatInputHeight] = React.useState(90); // Default height
  // const isMobile = useIsMobile(); // Available if needed

  React.useEffect(() => {
    const inputWrapper = chatInputWrapperRef.current;
    if (inputWrapper) {
      const updateHeight = () => {
        const newHeight = inputWrapper.offsetHeight;
        if (newHeight > 0 && newHeight !== chatInputHeight) { // Only update if changed
          setChatInputHeight(newHeight);
        }
      };
      updateHeight();
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(inputWrapper);
      // No need for window resize listener if ResizeObserver handles textarea growth
      // window.addEventListener("resize", updateHeight); 
      return () => {
        // Check inputWrapper on cleanup as it might be unmounted
        if (chatInputWrapperRef.current) { // Use ref.current for cleanup
          resizeObserver.unobserve(chatInputWrapperRef.current);
        }
        resizeObserver.disconnect();
        // window.removeEventListener("resize", updateHeight);  
      };
    }
  }, [chatInputHeight]); // Re-run if chatInputHeight changes (e.g. initial value)

  React.useEffect(() => {
    console.log(`ChatBox EFFECT [messages, isLoading, chatInputHeight]: PROPS messages count: ${messages.length}, Last prop message: ${messages[messages.length - 1]?.content.slice(0, 30) || 'N/A'}, isLoading: ${isLoading}`);
    if (messagesEndRef.current) {
      const isAssistantStreaming =
        isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant";
      // Smoother scroll, consider 'auto' for streaming for less jumpiness if preferred
      const scrollBehavior = isAssistantStreaming && messages[messages.length - 1].content.length < 100 ? "auto" : "smooth";

      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: scrollBehavior, block: "end" });
        }
      });
    }
  }, [messages, isLoading, chatInputHeight]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInput(e.target.value);

  const handleModelChange = (modelValue: string) => {
    const found = models.find((m) => m.model === modelValue);
    if (found) setSelectedModel(found);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    console.log(`ChatBox handleSubmit: chatId: ${chatId}, Input: "${input.trim()}"`);
    setError(null);

    const newUserMsg: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: input.trim(),
    };

    console.log(`ChatBox handleSubmit: Calling onMessagesChange to ADD USER message. ID: ${newUserMsg.id}, Content: "${newUserMsg.content.slice(0, 30)}"`);
    onMessagesChange((prevMsgs) => {
      console.log(`ChatBox onMessagesChange (ADD USER) CB: prevMsgs count: ${prevMsgs.length}. Adding user msg ID: ${newUserMsg.id}`);
      const newMsgs = [...prevMsgs, newUserMsg];
      console.log(`ChatBox onMessagesChange (ADD USER) CB: newMsgs count: ${newMsgs.length}. Last is: ${newMsgs[newMsgs.length - 1]?.id}`);
      return newMsgs;
    });
    setInput("");
    setIsLoading(true);
    console.log(`ChatBox handleSubmit: Set isLoading to true. ChatId: ${chatId}`);

    const assistantMsgId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let accumulatedAssistantText = "";
    console.log(`ChatBox handleSubmit: Generated assistantMsgId for upcoming stream: ${assistantMsgId}. ChatId: ${chatId}`);

    onMessagesChange((prevMsgs) => {
      console.log(`ChatBox onMessagesChange (ADD ASSISTANT PLACEHOLDER) CB: prevMsgs count: ${prevMsgs.length}. Adding assistant placeholder ID: ${assistantMsgId}`);
      return [
        ...prevMsgs,
        { id: assistantMsgId, role: "assistant", content: "" },
      ];
    });

    try {
      const requestBody: {
        chatId?: string;
        message: string;
        systemPrompt?: string;
        provider: string;
        model: string;
      } = {
        message: newUserMsg.content,
        provider: selectedModel.provider,
        model: selectedModel.model,
      };
      if (chatId) {
        requestBody.chatId = chatId;
      }
      console.log(`ChatBox handleSubmit: Fetching stream. API URL: ${EXTERNAL_API_URL}. Current chatId prop: ${chatId}. Request body:`, requestBody);

      const response = await fetch(EXTERNAL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.text().catch(() => "Failed to read error body");
        const apiError = new Error(
          `API error: ${response.status} - ${response.statusText}${errorBody
            ? `\nDetails: ${errorBody.substring(0, 200)}...`
            : ""
          }`
        );
        console.error(`ChatBox handleSubmit: API error. ChatId: ${chatId}`, apiError);
        setError(apiError);
        onMessagesChange((prevMsgs) => {
          console.log(`ChatBox handleSubmit API ERROR: Filtering assistantMsgId ${assistantMsgId} if present.`);
          // Replace placeholder with error message or remove it
          const assistantMsgIndex = prevMsgs.findIndex(msg => msg.id === assistantMsgId);
          if (assistantMsgIndex !== -1) {
            const updatedMessages = [...prevMsgs];
            updatedMessages[assistantMsgIndex] = {
              ...updatedMessages[assistantMsgIndex],
              content: `Sorry, I encountered an error: ${response.statusText || 'Network error'}. Please try again.`,
              // You could add an 'error: true' property to Message type for special styling
            };
            return updatedMessages;
          }
          return prevMsgs.filter((m) => m.id !== assistantMsgId); // Fallback if not found (should be)
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";
      let newChatIdFromStream: string | null = null;
      let finalUsageSummary: any = null;
      let firstChunkReceived = false;

      const processStreamData = (jsonStr: string) => {
        try {
          const data = JSON.parse(jsonStr);

          if (data.type === "session_info" && data.chatId) {
            if (!chatId && !newChatIdFromStream) {
              newChatIdFromStream = data.chatId;
              console.log(`ChatBox processStreamData: Received newChatIdFromStream: ${newChatIdFromStream} (current chatId prop is ${chatId})`);
            }
          } else if (data.type === "usage_summary") {
            finalUsageSummary = data;
            console.log(`ChatBox processStreamData: Received usage_summary for chatId ${chatId}.`);
          } else if (typeof data.content === "string") {
            accumulatedAssistantText += data.content;
            if (!firstChunkReceived) firstChunkReceived = true;

            onMessagesChange((prevMsgs) => {
              const assistantMsgIndex = prevMsgs.findIndex(msg => msg.id === assistantMsgId);
              if (assistantMsgIndex !== -1) {
                const updatedMessages = [...prevMsgs];
                updatedMessages[assistantMsgIndex] = {
                  ...updatedMessages[assistantMsgIndex],
                  content: accumulatedAssistantText,
                };
                return updatedMessages;
              }
              return prevMsgs;
            });
          }
        } catch (err) {
          console.warn(`ChatBox processStreamData: Error parsing stream data for chatId ${chatId}:`, err, "Data:", jsonStr);
        }
      };

      console.log(`ChatBox handleSubmit: Starting stream read loop for assistantMsgId ${assistantMsgId}. ChatId: ${chatId}`);
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        if (value) {
          let chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop()!;

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine === "" || cleanLine === "[DONE]" || cleanLine === "data: [DONE]") continue;
            if (cleanLine.startsWith("data:")) {
              processStreamData(cleanLine.substring(5).trim());
            }
          }
        }
        done = doneReading;
      }
      console.log(`ChatBox handleSubmit: Stream read loop finished for assistantMsgId ${assistantMsgId}. ChatId: ${chatId}`);

      if (buffer.trim()) {
        const cleanLine = buffer.trim();
        if (cleanLine.startsWith("data:")) {
          console.log(`ChatBox handleSubmit: Processing final buffer content for assistantMsgId ${assistantMsgId}. ChatId: ${chatId}`);
          processStreamData(cleanLine.substring(5).trim());
        }
      }

      if (!firstChunkReceived && !error) {
        onMessagesChange(prevMsgs => {
          const assistantMsg = prevMsgs.find(m => m.id === assistantMsgId);
          if (assistantMsg && assistantMsg.content === "") {
            console.log(`ChatBox handleSubmit: No content chunks received for ${assistantMsgId}, but stream ended ok. Ensuring content is explicitly empty or a placeholder.`);
            // Could update to "No response received." if desired.
            // For now, leaving it as empty string as per original logic.
          }
          return prevMsgs;
        });
      }

      if (newChatIdFromStream && !chatId && onNewChatIdGenerated) {
        const confirmedNewChatId: string = newChatIdFromStream;
        console.log(`ChatBox handleSubmit: Calling onNewChatIdGenerated. New ChatId: ${confirmedNewChatId}. Accumulated AI Text: "${accumulatedAssistantText.slice(0, 30)}"`);

        onMessagesChange(currentMessages => { // Use the callback form to get latest messages
          const userMessageForNewChat = currentMessages.find(m => m.id === newUserMsg.id);
          const assistantMessageForNewChat = currentMessages.find(m => m.id === assistantMsgId);

          if (userMessageForNewChat && assistantMessageForNewChat) {
            onNewChatIdGenerated(confirmedNewChatId, [userMessageForNewChat, assistantMessageForNewChat]);
          } else {
            console.warn("ChatBox: Could not find user/assistant messages for onNewChatIdGenerated. Fallback may be incomplete.");
            const fallbackAssistantMessage: Message = {
              id: assistantMsgId,
              role: "assistant",
              content: accumulatedAssistantText,
            };
            onNewChatIdGenerated(confirmedNewChatId, [newUserMsg, fallbackAssistantMessage]);
          }
          return currentMessages; // No change to messages needed here
        });
      }

    } catch (err: any) {
      console.error(`ChatBox handleSubmit: CATCH block for submission/streaming error. ChatId: ${chatId}:`, err);
      const newError = err instanceof Error ? err : new Error("Unknown error occurred during streaming.");
      setError(newError);
      onMessagesChange((prevMsgs) => {
        console.log(`ChatBox handleSubmit CATCH: Updating or filtering assistantMsgId ${assistantMsgId}.`);
        const assistantMsgIndex = prevMsgs.findIndex(msg => msg.id === assistantMsgId);
        if (assistantMsgIndex !== -1) {
          const updatedMessages = [...prevMsgs];
          updatedMessages[assistantMsgIndex] = {
            ...updatedMessages[assistantMsgIndex],
            content: `Sorry, an unexpected error occurred: ${newError.message}. Please try again.`,
          };
          return updatedMessages;
        }
        return prevMsgs.filter((m) => m.id !== assistantMsgId);
      });
    } finally {
      setIsLoading(false);
      console.log(`ChatBox handleSubmit: FINALLY block. Set isLoading to false. ChatId: ${chatId}`);
    }
  };

  const PADDING_BUFFER = 16; // Increased buffer slightly for better spacing

  return (
    <div className="flex flex-col h-dvh min-h-dvh w-full bg-background min-w-0">
      <div
        className="flex-1 overflow-y-auto pt-6 px-4 min-w-0"
        style={{
          paddingBottom:
            chatInputHeight > 0
              ? `${chatInputHeight + PADDING_BUFFER}px`
              : `${90 + PADDING_BUFFER}px`, // Fallback padding
        }}
      >
        <div
          className={`max-w-3xl mx-auto w-full ${messages.length === 0 && !isLoading && !error
              ? "flex flex-col justify-center min-h-full" // For centering "Hello" message
              : ""
            }`}
        >
          {error && !isLoading && ( // Show error only if not actively loading a new response
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
          {/* Always render ChatMessagesOutput if there are messages or if it's loading, to show placeholders */}
          {(messages.length > 0 || isLoading) && (
            <ChatMessagesOutput messages={messages} isLoading={isLoading} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area Wrapper */}
      <div
        ref={chatInputWrapperRef}
        className="px-4 bg-background border-t border-border/60 shadow- ऊपर" // Added border-t for separation
      >
        <div className="max-w-[832px] mx-auto w-full py-2.5 md:py-3.5"> {/* Slightly adjusted padding */}
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