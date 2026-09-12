import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { CollapsibleSection, FieldLabel } from "@/components/studio/primitives";
import { projectStore } from "@/lib/projects";
import { useAuth } from "@/stores/authStore";

function useWebGpuAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof navigator !== "undefined" && "gpu" in navigator);
  }, []);
  return available;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[10px] py-[3px] text-[11px]">
      <FieldLabel>{label}</FieldLabel>
      <span className="flex items-center gap-[8px] text-txt">{children}</span>
    </div>
  );
}

export function SettingsSystemPanel() {
  const { user } = useAuth();
  const webgpu = useWebGpuAvailable();
  const online = useOnline();
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStore.list(),
  });

  return (
    <aside className="scroll-thin flex h-full w-full shrink-0 flex-col overflow-y-auto bg-panel lg:border-l lg:border-line">
      <CollapsibleSection title="Session">
        <Row label="Signed in as">
          <span className="truncate">{user?.email ?? "—"}</span>
        </Row>
        <Row label="Projects">{projects.length}</Row>
      </CollapsibleSection>

      <CollapsibleSection title="System">
        <Row label="WebGPU">
          <span className={webgpu ? "text-ok" : "text-txt-dim"}>
            {webgpu ? "Available" : "Unavailable"}
          </span>
        </Row>
        <Row label="Network">
          <span className={online ? "text-ok" : "text-destructive"}>
            {online ? "Online" : "Offline"}
          </span>
        </Row>
      </CollapsibleSection>
    </aside>
  );
}
