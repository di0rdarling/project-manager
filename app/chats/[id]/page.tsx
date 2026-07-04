import ChatDetailView from "@/components/views/Chats/ChatDetailView";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <ChatDetailView chatId={id} />
    </div>
  );
}
