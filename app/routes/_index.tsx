// app/routes/_index.tsx
import * as React from "react";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { ChatBox } from "~/components/chat-ui/ChatBox";
import type { Message } from "~/components/chat-ui/ChatMessagesOutput";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUser } from "~/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireUser(request); // Throws redirect if not authenticated
  return json({ user }); // User data available if needed by the component
}

export default function IndexPage() {
  const navigate = useNavigate();
  // const { user } = useLoaderData<typeof loader>(); // User data if needed

  const [messages, setMessages] = React.useState<Message[]>([]);

  function handleNewChatId(newChatId: string, initialMessages: Message[]) {
    navigate(`/chat/${newChatId}`, {
      replace: true,
      state: { initialMessages: initialMessages },
    });
  }

  return (
    <ChatBox
      chatId={undefined}
      messages={messages}
      onMessagesChange={setMessages}
      onNewChatIdGenerated={handleNewChatId}
    />
  );
}