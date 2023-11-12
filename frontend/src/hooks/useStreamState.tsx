import { useCallback, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Message } from "./useChatList";

export interface StreamState {
  status: "inflight" | "error" | "done";
  messages: Message[];
  run_id?: string;
}

export interface StreamStateProps {
  stream: StreamState | null;
  startStream: (input: { input: Message }, config: unknown) => Promise<void>;
  stopStream?: (clear?: boolean) => void;
}

export function useStreamState(): StreamStateProps {
  const [current, setCurrent] = useState<StreamState | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const startStream = useCallback(
    async (input: { input: Message }, config: unknown) => {
      const controller = new AbortController();
      setController(controller);
      setCurrent({ status: "inflight", messages: [input.input] });

      await fetchEventSource("/stream", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, config }),
        onmessage(msg) {
          if (msg.event === "data") {
            const { messages } = JSON.parse(msg.data);
            setCurrent((current) => ({
              status: "inflight",
              messages: [...(current?.messages ?? []), ...messages],
              run_id: current?.run_id,
            }));
          } else if (msg.event === "metadata") {
            const { run_id } = JSON.parse(msg.data);
            setCurrent((current) => ({
              status: "inflight",
              messages: current?.messages ?? [],
              run_id: run_id,
            }));
          }
        },
        onclose() {
          setCurrent((current) => ({
            status: "done",
            messages: current?.messages ?? [],
            run_id: current?.run_id,
          }));
          setController(null);
        },
        onerror(error) {
          setCurrent((current) => ({
            status: "error",
            messages: current?.messages ?? [],
            run_id: current?.run_id,
          }));
          setController(null);
          throw error;
        },
      });
    },
    []
  );

  const stopStream = useCallback(
    (clear: boolean = false) => {
      controller?.abort();
      setController(null);
      if (clear) {
        setCurrent(null);
      }
    },
    [controller]
  );

  return {
    startStream,
    stopStream,
    stream: current,
  };
}
