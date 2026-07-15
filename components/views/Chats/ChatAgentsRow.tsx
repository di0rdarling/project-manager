"use client";

import { CHAT_TEAMMATES_FOR_DISPLAY } from "@/lib/chats/chat-teammates";
import type { AgentProfileFrom } from "@/lib/chats/agent-profile-navigation";
import TeammateCard from "./TeammateCard";

type ChatAgentsRowProps = {
  from?: AgentProfileFrom | null;
};

export default function ChatAgentsRow({ from }: Readonly<ChatAgentsRowProps>) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        Teammates
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHAT_TEAMMATES_FOR_DISPLAY.map((teammate) => (
          <TeammateCard key={teammate.id} teammate={teammate} from={from} />
        ))}
      </div>
    </section>
  );
}
