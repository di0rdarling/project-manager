"use client";

import { CHAT_TEAMMATES_FOR_DISPLAY } from "@/lib/chat-teammates";
import TeammateCard from "./TeammateCard";

export default function ChatAgentsRow() {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        Teammates
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHAT_TEAMMATES_FOR_DISPLAY.map((teammate) => (
          <TeammateCard key={teammate.id} teammate={teammate} />
        ))}
      </div>
    </section>
  );
}
