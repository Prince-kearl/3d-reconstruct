import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CollapsibleSection, FieldLabel, ToggleSwitch } from "@/components/studio/primitives";
import { useAuth } from "@/stores/authStore";
import { useReconstruct } from "@/stores/reconstructStore";

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

export function ConsoleSystemPanel({
  followTail,
  onToggleFollowTail,
  onClearFilters,
}: {
  followTail: boolean;
  onToggleFollowTail: (v: boolean) => void;
  onClearFilters: () => void;
}) {
  const { user } = useAuth();
  const { sourceFileName, status, logLines, vertexCount, faceCount, projectId } = useReconstruct();
  const webgpu = useWebGpuAvailable();
  const online = useOnline();

  const exportReport = () => {
    const lines = [
      "DXF2OBJ Diagnostic Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "-- Session --",
      `Signed in as: ${user?.email ?? "unknown"}`,
      `Project: ${sourceFileName ?? "none loaded"}`,
      `Project ID: ${projectId ?? "—"}`,
      `Status: ${status}`,
      `Vertices: ${vertexCount}`,
      `Faces: ${faceCount}`,
      "",
      "-- System --",
      `WebGPU: ${webgpu ? "available" : "unavailable"}`,
      `Network: ${online ? "online" : "offline"}`,
      `User agent: ${navigator.userAgent}`,
      "",
      "-- Log --",
      ...logLines,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dxf2obj-diagnostic-report.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Diagnostic report downloaded");
  };

  return (
    <aside className="scroll-thin flex h-full w-full shrink-0 flex-col overflow-y-auto bg-panel lg:border-l lg:border-line">
      <CollapsibleSection title="Session">
        <Row label="Signed in as">
          <span className="truncate">{user?.email ?? "—"}</span>
        </Row>
        <Row label="Project">{sourceFileName ?? "None"}</Row>
        <Row label="Status">
          <span className="rounded-[3px] bg-accent/15 px-[6px] text-[10px] text-accent-2">
            {status}
          </span>
        </Row>
      </CollapsibleSection>

      <CollapsibleSection title="System">
        <Row label="WebGPU">
          <span className={webgpu ? "text-ok" : "text-txt-dim"}>
            {webgpu ? "Available" : "Unavailable (CPU/WASM)"}
          </span>
        </Row>
        <Row label="Network">
          <span className={online ? "text-ok" : "text-destructive"}>
            {online ? "Online" : "Offline"}
          </span>
        </Row>
      </CollapsibleSection>

      <CollapsibleSection title="Console Settings">
        <Row label="Follow Tail">
          <ToggleSwitch label="Follow tail" checked={followTail} onChange={onToggleFollowTail} />
        </Row>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-[10px] flex h-[30px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line text-[11.5px] text-txt-muted hover:bg-surface-2 hover:text-txt"
        >
          Clear Filters
        </button>
      </CollapsibleSection>

      <div className="mt-auto px-[14px] py-[14px]">
        <button
          type="button"
          onClick={exportReport}
          style={{ background: "var(--gradient-lime)" }}
          className="flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[5px] text-[12.5px] font-semibold text-app"
        >
          Export Diagnostic Report
        </button>
      </div>
    </aside>
  );
}
