import ChatAgentProfileView from "@/components/views/Chats/ChatAgentProfileView";

interface ChatAgentProfilePageProps {
  params: Promise<{ teammateId: string }>;
}

export default async function ChatAgentProfilePage({
  params,
}: ChatAgentProfilePageProps) {
  const { teammateId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <ChatAgentProfileView teammateId={teammateId} />
    </div>
  );
}
