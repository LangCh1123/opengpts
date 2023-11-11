import { useEffect } from "react";
import { Chat as ChatType } from "../hooks/useChatList";
import { StreamStateProps } from "../hooks/useStreamState";
import TypingBox from "./TypingBox";
import { Message } from "./Message";
import { useChatMessages } from "../hooks/useChatMessages";

interface ChatProps extends Pick<StreamStateProps, "stream" | "stopStream"> {
  chat: ChatType;
  startStream: (message: string) => Promise<void>;
}

export function Chat(props: ChatProps) {
  const messages = useChatMessages(props.chat.thread_id, props.stream);
  useEffect(() => {
    scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);
  return (
    <div className="flex-1 flex flex-col items-stretch pb-[76px] pt-2">
      {messages?.map((msg, i) => (
        <Message
          {...msg}
          key={i}
          runId={i === messages.length - 1 ? props.stream?.run_id : undefined}
        />
      ))}
      {(props.stream?.status === "inflight" || messages === null) && (
        <div className="leading-6 mb-2 animate-pulse font-black text-gray-400 text-lg">
          ...
        </div>
      )}
      <div className="fixed left-0 lg:left-72 bottom-0 right-0 p-4">
        <TypingBox
          onSubmit={props.startStream}
          disabled={props.stream?.status === "inflight"}
        />
      </div>
    </div>
  );
}
