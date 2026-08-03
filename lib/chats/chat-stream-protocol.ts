export type ChatStreamTokenEvent = {
  type: "token";
  delta: string;
};

export type ChatStreamDoneEvent<T = unknown> = {
  type: "done";
  data: T;
};

export type ChatStreamErrorEvent = {
  type: "error";
  message: string;
};

export type ChatStreamEvent<T = unknown> =
  | ChatStreamTokenEvent
  | ChatStreamDoneEvent<T>
  | ChatStreamErrorEvent;

export function encodeChatStreamEvent(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createChatStreamResponse(
  producer: (send: (event: ChatStreamEvent) => void) => Promise<void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(encodeChatStreamEvent(event)));
      };

      try {
        await producer(send);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to stream chat reply";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function consumeChatStream<TDone>(
  response: Response,
  onToken: (delta: string) => void,
): Promise<TDone> {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Request failed",
      );
    }

    return data as TDone;
  }

  if (!response.ok || !response.body) {
    throw new Error("Failed to start chat stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: TDone | undefined;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");

    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      for (const line of rawEvent.split("\n")) {
        if (!line.startsWith("data: ")) {
          continue;
        }

        const payload = line.slice(6);

        if (!payload) {
          continue;
        }

        const event = JSON.parse(payload) as ChatStreamEvent<TDone>;

        if (event.type === "token") {
          onToken(event.delta);
          continue;
        }

        if (event.type === "error") {
          throw new Error(event.message);
        }

        if (event.type === "done") {
          donePayload = event.data;
        }
      }
    }
  }

  if (donePayload === undefined) {
    throw new Error("Chat stream ended before completion");
  }

  return donePayload;
}
