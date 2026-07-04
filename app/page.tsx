import ProjectManagerView from "@/components/views/ProjectManager/ProjectManagerView";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <ProjectManagerView />
    </div>
  );
}
