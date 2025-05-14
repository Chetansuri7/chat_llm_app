// app/routes/chat.$chatId.tsx  
  
import * as React from "react";  
import { useParams, useLocation, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";  
import { json, LoaderFunctionArgs } from "@remix-run/node";  
import { ChatBox } from "~/components/chat-ui/ChatBox";  
import type { Message } from "~/components/chat-ui/ChatMessagesOutput";  
import { requireUser } from "~/auth.server"; // Import requireUser
// import { toast } from "sonner"; // Example: If you want to use toast for errors

interface LoaderData {  
  messages: Message[];  
  error: string | null;  
  chatId: string;  
}  
  
export async function loader({ params, request }: LoaderFunctionArgs): Promise<ReturnType<typeof json<LoaderData>>> {  
  await requireUser(request); // Add authentication check here

  const chatId = params.chatId;  
  
  if (!chatId) {  
    console.error("ChatIdPage Loader: Chat ID parameter is missing.");  
    return json({ messages: [], error: "Chat ID not found.", chatId: "" }, { status: 404 });  
  }  
  
  const historyApiUrl = `https://api-chat.kwikon.club/api/chat/${chatId}/history?limit=50`;  
  console.info(`ChatIdPage Loader: Fetching history for chat ${chatId} from ${historyApiUrl}`);
  
  try {  
    const cookieHeader = request.headers.get("Cookie");  
    const fetchHeaders: HeadersInit = {};  
    if (cookieHeader) {  
      fetchHeaders["Cookie"] = cookieHeader;  
    }  
  
    const response = await fetch(historyApiUrl, { 
      headers: fetchHeaders,
      cache: "no-cache" 
    });  

    if (!response.ok) {  
      const errorText = await response.text().catch(() => `HTTP error ${response.status}`);  
      console.error(`ChatIdPage Loader: Failed to fetch chat history for ${chatId}: ${response.status} ${response.statusText}. Body: ${errorText.substring(0, 500)}`);
      // If auth is handled by requireUser, a 401/403 from API might still occur if API has its own auth layer not synced,
      // or if user session is valid for Remix but not for the API (e.g. different token).
      // requireUser will redirect to login if Remix session is invalid.
      if (response.status === 401 || response.status === 403) {
        // This case should ideally be handled by requireUser redirecting, 
        // but if API returns 401/403 for an *authenticated* Remix user, it's an API auth issue.
        return json({ messages: [], error: `Access to chat history denied: ${response.statusText || response.status}`, chatId });
      }
      return json({ messages: [], error: `Failed to load history: ${response.statusText || response.status}`, chatId });  
    }  
  
    const historyData = await response.json();  
    let fetchedMessages: Message[] = [];  
  
    if (Array.isArray(historyData)) {  
      fetchedMessages = historyData;  
    } else if (historyData && Array.isArray(historyData.messages)) {  
      fetchedMessages = historyData.messages;  
    } else if (historyData && Array.isArray(historyData.chatHistory)) {  
      fetchedMessages = historyData.chatHistory;  
    } else {  
      console.warn(`ChatIdPage Loader: Unexpected history data format for chat ${chatId}: ${JSON.stringify(historyData).substring(0, 500)}`);
    }  
  
    fetchedMessages = fetchedMessages.map((m, index) => ({  
      id: m.id || `hist-${chatId}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,  
      role: m.role,  
      content: m.content,  
    }));  
  
    console.info(`ChatIdPage Loader: Successfully fetched ${fetchedMessages.length} messages for chat ${chatId}`);
    return json({ messages: fetchedMessages, error: null, chatId });  
  } catch (error: any) {  
    console.error(`ChatIdPage Loader: Error fetching chat history for chat ${chatId}: ${error.message}`, error);
    return json({ messages: [], error: error.message || "Could not connect to history service.", chatId });  
  }  
}  
  
export default function ChatIdPage() {  
  const routeParams = useParams();  
  const location = useLocation();  
  const navigate = useNavigate();  
  const loaderData = useLoaderData<typeof loader>();  
  const navigation = useNavigation();  
  
  const chatIdFromRoute = routeParams.chatId!;
  const derivedChatId = loaderData.chatId && loaderData.chatId !== "" ? loaderData.chatId : chatIdFromRoute;

  const [messages, setMessagesInternal] = React.useState<Message[]>(() => {
    const navMessages = (location.state as { initialMessages?: Message[] })?.initialMessages;
    const initial = navMessages && navMessages.length > 0 ? navMessages : (loaderData.messages || []);
    console.log(`ChatIdPage RENDER (useState init): derivedChatId: ${derivedChatId}. Initializing messages. FromNav: ${!!navMessages}, FromLoader: ${!!loaderData.messages}. Count: ${initial.length}`);
    return initial;
  });

  const [historyLoadError, setHistoryLoadError] = React.useState<string | null>(loaderData.error);
  
  const navStateAppliedRef = React.useRef(!!((location.state as { initialMessages?: Message[] })?.initialMessages));


  const handleMessagesChange = React.useCallback((newMessagesOrCallback: Message[] | ((prev: Message[]) => Message[])) => {
    console.log(`ChatIdPage: handleMessagesChange called from ChatBox. ChatId: ${derivedChatId}`);
    setMessagesInternal(prevMessages => {
        const updatedMessages = typeof newMessagesOrCallback === 'function'
            ? newMessagesOrCallback(prevMessages)
            : newMessagesOrCallback;
        const lastOldMsg = prevMessages[prevMessages.length-1];
        const lastNewMsg = updatedMessages[updatedMessages.length-1];
        console.log(
            `ChatIdPage: Messages updated in handleMessagesChange. ChatId: ${derivedChatId}. Old count: ${prevMessages.length}, New count: ${updatedMessages.length}. ` +
            `Last old: ${lastOldMsg ? `${lastOldMsg.role.slice(0,1)}:${lastOldMsg.content.slice(0,20)}` : 'N/A'}. ` +
            `Last new: ${lastNewMsg ? `${lastNewMsg.role.slice(0,1)}:${lastNewMsg.content.slice(0,20)}` : 'N/A'}.`
        );
        return updatedMessages;
    });
  }, [derivedChatId]); 

  React.useEffect(() => {
    console.log(`ChatIdPage: messages state changed (useEffect for logging). ChatId: ${derivedChatId}. New count: ${messages.length}. Last message: ${messages[messages.length-1]?.content.slice(0,30) || 'N/A'}`);
  }, [messages, derivedChatId]);


  React.useEffect(() => {
    const navState = location.state as { initialMessages?: Message[] };
    if (navState?.initialMessages && navStateAppliedRef.current) {
      console.log(`ChatIdPage: Clearing initialMessages from navigation state for ${derivedChatId}.`);
      const { initialMessages: _removed, ...restOfState } = navState;
      navigate(
        location.pathname + location.search, 
        {
          replace: true,
          state: Object.keys(restOfState).length > 0 ? restOfState : null, 
        }
      );
      navStateAppliedRef.current = false; 
    }
  }, [location.state, location.pathname, location.search, navigate, derivedChatId]);

  React.useEffect(() => {
    console.log(
      `ChatIdPage: loaderData EFFECT. derivedChatId: ${derivedChatId}, loaderData.chatId: ${loaderData.chatId}, ` +
      `loaderData.error: ${loaderData.error}, loaderData.messages.length: ${loaderData.messages?.length || 0}, ` +
      `current messages.length: ${messages.length}, navStateAppliedRef: ${navStateAppliedRef.current}, ` +
      `location.state.initialMessages: ${!!(location.state as { initialMessages?: Message[] })?.initialMessages}, ` +
      `current historyLoadError: ${historyLoadError}`
    );

    if (loaderData.error) {
      if (historyLoadError !== loaderData.error) {
        setHistoryLoadError(loaderData.error);
        console.log(`ChatIdPage: History load error SET: ${loaderData.error}. ChatId: ${derivedChatId}`);
      }
      return; 
    }

    if (historyLoadError && !loaderData.error) {
      setHistoryLoadError(null);
      console.log(`ChatIdPage: History load error CLEARED. ChatId: ${derivedChatId}`);
    }

    if (loaderData.chatId !== derivedChatId) {
      console.log(`ChatIdPage: loaderData is for a different chatId (${loaderData.chatId} vs ${derivedChatId}). Skipping messages update.`);
      return;
    }
    
    if (!loaderData.messages) {
        console.log(`ChatIdPage: loaderData.messages is null/undefined for ${derivedChatId} even without error. Skipping messages update.`);
        return;
    }

    if (navStateAppliedRef.current && (location.state as { initialMessages?: Message[] })?.initialMessages) {
      console.log(`ChatIdPage: navState initialMessages are active for ${derivedChatId}. Deferring loaderData application.`);
      return;
    }

    if (messages.length === 0 && loaderData.messages.length > 0) {
      console.log(`ChatIdPage: Initializing messages from loaderData for ${derivedChatId}. Loader count: ${loaderData.messages.length}`);
      setMessagesInternal(loaderData.messages);
      return;
    }

    const currentMessagesContent = JSON.stringify(messages.map(m => ({ role: m.role, content: m.content })));
    const loaderMessagesContent = JSON.stringify(loaderData.messages.map(m => ({ role: m.role, content: m.content })));

    if (currentMessagesContent === loaderMessagesContent) {
      console.log(`ChatIdPage: loaderData messages are identical to current for ${derivedChatId}. No update needed.`);
      return;
    }

    let isLoaderPrefixOfCurrent = false;
    if (loaderData.messages.length <= messages.length) {
      isLoaderPrefixOfCurrent = true; 
      for (let i = 0; i < loaderData.messages.length; i++) {
        if (messages[i].role !== loaderData.messages[i].role || messages[i].content !== loaderData.messages[i].content) {
          isLoaderPrefixOfCurrent = false;
          break;
        }
      }
    }
    if (loaderData.messages.length === 0 && messages.length > 0) {
        isLoaderPrefixOfCurrent = true;
    }

    if (isLoaderPrefixOfCurrent) {
      console.log(`ChatIdPage: loaderData for ${derivedChatId} is a prefix of current messages (or empty). Current client state is preferred. Loader: ${loaderData.messages.length}, Current: ${messages.length}.`);
    } else {
      console.log(`ChatIdPage: Updating messages from loaderData (genuinely different or newer history) for ${derivedChatId}. Loader: ${loaderData.messages.length}, Current: ${messages.length}.`);
      setMessagesInternal(loaderData.messages);
    }

  }, [loaderData, derivedChatId, location.state, historyLoadError]);


  const isRouteLoading = navigation.state === "loading" && navigation.location?.pathname === location.pathname;
  const showExplicitPageLoadingMessage = 
    (isRouteLoading && messages.length === 0 && !historyLoadError) ||
    (messages.length === 0 && !historyLoadError && navStateAppliedRef.current && !!(location.state as { initialMessages?: Message[] })?.initialMessages);
  
  console.log(
    `ChatIdPage RENDER: derivedChatId: ${derivedChatId}, messages count: ${messages.length}, ` +
    `showExplicitPageLoading: ${showExplicitPageLoadingMessage}, historyLoadError: ${historyLoadError}, ` +
    `navStateAppliedRef: ${navStateAppliedRef.current}, loaderData messages count: ${loaderData.messages?.length}, ` +
    `loaderData.chatId: ${loaderData.chatId}, loaderData.error: ${loaderData.error}`
  );

  return (  
    <>  
      {showExplicitPageLoadingMessage && (
        <div className="flex items-center justify-center h-full pt-20">  
          <div className="text-center">  
            <p className="text-lg text-muted-foreground">Loading chat...</p>  
          </div>  
        </div>  
      )}  
  
      {historyLoadError && !showExplicitPageLoadingMessage && ( 
        <div  
          className="p-4 m-4 text-sm text-destructive bg-destructive/10 rounded-lg dark:bg-red-200 dark:text-red-800 text-center"  
          role="alert"  
        >  
          <span className="font-medium">Error:</span> Could not load chat history. {historyLoadError}  
        </div>  
      )}  
  
      {derivedChatId && (messages.length > 0 || (!showExplicitPageLoadingMessage && !historyLoadError)) && (
        <ChatBox  
          key={derivedChatId} 
          chatId={derivedChatId}  
          messages={messages}  
          onMessagesChange={handleMessagesChange} 
          onNewChatIdGenerated={(newChatId, initialMessagesFromChatBox) => {  
            console.log(`ChatIdPage: Navigating to new chat ${newChatId} from ${derivedChatId} with initial messages count: ${initialMessagesFromChatBox.length}`);
            navigate(`/chat/${newChatId}`, {  
              replace: true,  
              state: { initialMessages: initialMessagesFromChatBox },  
            });  
          }}  
        />  
      )}  
    </>  
  );  
}