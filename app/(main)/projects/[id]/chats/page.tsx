import { Suspense } from "react";
import ChatsView from "@/components/views/Chats/ChatsView";

type ProjectChatsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectChatsPage({
  params,
}: ProjectChatsPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={null}>
        <ChatsView projectId={id} />
      </Suspense>
    </div>
  );
}
