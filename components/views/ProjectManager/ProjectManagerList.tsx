import type { ProjectResponse } from "@/lib/types";
import { formatDisplayDate } from "@/lib/dates";

interface ProjectManagerListProps {
    projects: ProjectResponse[];
}

export default function ProjectManagerList({ projects }: Readonly<ProjectManagerListProps>) {
    return (
        <ul className="space-y-3">
            {projects.map((project) => (
                <li
                    key={project._id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-medium">{project.name}</h3>
                            {project.description ? (
                                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                    {project.description}
                                </p>
                            ) : null}
                        </div>
                        <time
                            dateTime={project.createdAt}
                            className="shrink-0 text-xs text-zinc-500"
                        >
                            {formatDisplayDate(project.createdAt)}
                        </time>
                    </div>
                </li>
            ))}
        </ul>
    )
}