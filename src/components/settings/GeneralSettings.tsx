import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FieldLabel, SegmentedControl, SliderControl } from "@/components/studio/primitives";
import { projectStore, type ProjectStatus } from "@/lib/projects";
import {
  FACTORY_DEFAULTS,
  getReconstructionDefaults,
  setReconstructionDefaults,
  type ReconstructionDefaults,
} from "@/lib/settings/reconstructionDefaults";
import { getProfile, updateProfile } from "@/lib/supabase/profile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/authStore";

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-[6px] border border-line bg-surface px-[12px] py-[11px]", className)}
    >
      <h3 className="text-[12px] font-semibold text-txt">{title}</h3>
      <div className="mt-[10px] space-y-[10px]">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[11.5px] text-txt-muted">{label}</dt>
      <dd className="text-[11.5px] text-txt">{value}</dd>
    </div>
  );
}

function useWebGpuAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof navigator !== "undefined" && "gpu" in navigator);
  }, []);
  return available;
}

function AccountSection() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user ? getProfile(user.id) : null),
    enabled: Boolean(user),
  });
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: displayName.trim() || null });
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Display name updated");
    } catch {
      toast.error("Could not update display name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Account">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>Email</FieldLabel>
        <span className="text-[11.5px] text-txt">{user?.email ?? "—"}</span>
      </div>
      <div className="flex items-center gap-[8px]">
        <FieldLabel className="w-[100px] shrink-0">Display Name</FieldLabel>
        <input
          aria-label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-[30px] flex-1 rounded-[4px] border border-line bg-panel px-[10px] text-[11.5px] text-txt outline-none focus-visible:border-accent"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="flex h-[30px] shrink-0 items-center gap-[6px] rounded-[4px] border border-line bg-panel px-[12px] text-[11.5px] text-txt hover:border-line-strong disabled:opacity-50"
        >
          <Save className="size-[13px]" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-[4px] flex h-[32px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-destructive/40 text-[11.5px] text-destructive hover:bg-destructive/10"
      >
        <LogOut className="size-[13px]" />
        Sign Out
      </button>
    </Card>
  );
}

function ReconstructionDefaultsSection() {
  const [defaults, setDefaults] = useState<ReconstructionDefaults>(() =>
    getReconstructionDefaults(),
  );

  const update = (patch: Partial<ReconstructionDefaults>) => {
    setDefaults((prev) => {
      const next = { ...prev, ...patch };
      setReconstructionDefaults(next);
      return next;
    });
  };

  const reset = () => {
    setDefaults(FACTORY_DEFAULTS);
    setReconstructionDefaults(FACTORY_DEFAULTS);
    toast.success("Reset to recommended defaults");
  };

  return (
    <Card title="Reconstruction Defaults">
      <p className="text-[10.5px] leading-[15px] text-txt-dim">
        Where new reconstructions start from — changing these doesn't affect projects you've already
        created.
      </p>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel className="w-[100px] shrink-0">Quality</FieldLabel>
        <SegmentedControl
          options={["Fast", "Balanced", "High"] as const}
          value={defaults.quality}
          onChange={(v) => update({ quality: v })}
          className="w-[200px]"
        />
      </div>
      <SliderControl
        inline
        label="Depth Intensity"
        value={defaults.detail}
        onChange={(v) => update({ detail: v })}
        labelWidth={110}
      />
      <SliderControl
        inline
        label="Smoothing"
        value={defaults.smoothing}
        onChange={(v) => update({ smoothing: v })}
        labelWidth={110}
      />
      <SliderControl
        inline
        label="Edge Feather"
        value={defaults.edgeFeather}
        onChange={(v) => update({ edgeFeather: v })}
        labelWidth={110}
      />
      <SliderControl
        inline
        label="Volume"
        value={defaults.volume}
        onChange={(v) => update({ volume: v })}
        labelWidth={110}
      />
      <button
        type="button"
        onClick={reset}
        className="mt-[4px] flex h-[30px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-line text-[11.5px] text-txt-muted hover:bg-surface-2 hover:text-txt"
      >
        <RotateCcw className="size-[13px]" />
        Reset to Recommended
      </button>
    </Card>
  );
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",
};

function StorageSection() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStore.list(),
  });

  const counts: Record<ProjectStatus, number> = { completed: 0, processing: 0, failed: 0 };
  let totalVertices = 0;
  for (const p of projects) {
    counts[p.status]++;
    totalVertices += p.vertexCount;
  }

  return (
    <Card title="Storage">
      {isLoading ? (
        <p className="text-[11px] text-txt-dim">Loading…</p>
      ) : (
        <dl className="space-y-[7px]">
          <Row label="Total Projects" value={String(projects.length)} />
          {(Object.keys(counts) as ProjectStatus[]).map((status) => (
            <Row key={status} label={STATUS_LABEL[status]} value={String(counts[status])} />
          ))}
          <Row label="Total Vertices Generated" value={totalVertices.toLocaleString()} />
        </dl>
      )}
      <p className="mt-[4px] text-[10.5px] leading-[15px] text-txt-dim">
        Source photos, depth maps, masks and exported models are stored in your account only — other
        users can never see them.
      </p>
    </Card>
  );
}

function PrivacySection() {
  const { user, signOut } = useAuth();
  return (
    <Card title="Privacy & Data">
      <p className="text-[11.5px] leading-[17px] text-txt-muted">
        Background removal and depth estimation run entirely in your browser using WebGPU/WASM —
        your photo is never sent to an external AI service for processing.
      </p>
      <p className="text-[11.5px] leading-[17px] text-txt-muted">
        What's saved to your account: the source photo, depth map, silhouette mask, thumbnail and
        any exported model file — each scoped privately to your user ID.
      </p>
      <Row label="Signed in as" value={user?.email ?? "—"} />
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-[4px] flex h-[32px] w-full items-center justify-center gap-[7px] rounded-[4px] border border-destructive/40 text-[11.5px] text-destructive hover:bg-destructive/10"
      >
        <LogOut className="size-[13px]" />
        Sign Out
      </button>
    </Card>
  );
}

function AboutSection() {
  const webgpu = useWebGpuAvailable();
  return (
    <Card title="About DXF2OBJ">
      <p className="text-[11.5px] leading-[17px] text-txt-muted">
        Turn a portrait photo into a rotatable pseudo-3D relief, entirely client-side — depth
        estimation, background removal and mesh generation all run in your browser.
      </p>
      <dl className="space-y-[7px] pt-[4px]">
        <Row label="WebGPU" value={webgpu ? "Available" : "Unavailable (using CPU/WASM)"} />
        <Row label="Platform" value={navigator.platform || "—"} />
        <Row label="Language" value={navigator.language} />
      </dl>
    </Card>
  );
}

export function GeneralSettings({ section }: { section: string }) {
  return (
    <div className="scroll-thin flex min-w-0 flex-1 flex-col gap-[10px] overflow-y-auto rounded-[6px] border border-line bg-panel px-[14px] py-[13px]">
      <div>
        <h2 className="text-[15px] font-semibold text-txt">{section}</h2>
      </div>

      {section === "Account" ? (
        <AccountSection />
      ) : section === "Reconstruction Defaults" ? (
        <ReconstructionDefaultsSection />
      ) : section === "Storage" ? (
        <StorageSection />
      ) : section === "Privacy & Data" ? (
        <PrivacySection />
      ) : (
        <AboutSection />
      )}
    </div>
  );
}
