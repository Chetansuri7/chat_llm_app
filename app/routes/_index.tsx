// app/routes/_index.tsx
import * as React from "react";
import { useNavigate } from "@remix-run/react";
import { ChatBox } from "~/components/chat-ui/ChatBox";
import type { Message } from "~/components/chat-ui/ChatMessagesOutput";

export default function IndexPage() {
  const navigate = useNavigate();
  // messages state for ChatBox. It will contain the user's first message and AI's first response
  // before navigating away.
  const [messages, setMessages] = React.useState<Message[]>([]);

  // This handler receives the newChatId and the fully formed initialMessages
  // (user's first query + AI's first response) from ChatBox.
  function handleNewChatId(newChatId: string, initialMessages: Message[]) {
    navigate(`/chat/${newChatId}`, {
      replace: true, // Replace current URL (/), so back button doesn't go to empty index page
      state: { initialMessages: initialMessages } // Pass the user's first message and AI's first response
    });
  }

  return (
    <ChatBox
      chatId={undefined} // No chatId for a new chat on the index page
      messages={messages}
      onMessagesChange={setMessages} // ChatBox will update this with user's first message and AI's placeholder/response
      onNewChatIdGenerated={handleNewChatId}
    />
  );
}