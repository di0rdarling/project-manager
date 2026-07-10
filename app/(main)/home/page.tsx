import ProjectManagerView from "@/components/views/ProjectManager/ProjectManagerView";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <ProjectManagerView />
    </div>
  );
}
