import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import type { ProjectSummary } from "@/lib/projects";

export function ProjectOpenLink({
  project,
  children,
  className,
  style,
}: {
  project: Pick<ProjectSummary, "id" | "projectKind">;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  if (project.projectKind === "imported") {
    return (
      <Link to="/imported" search={{ project: project.id }} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <Link to="/reconstruct" search={{ project: project.id }} className={className} style={style}>
      {children}
    </Link>
  );
}
