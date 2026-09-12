import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import type { RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const AXIS_COLORS: [string, string, string] = ["#e5484d", "#30a46c", "#3b82f6"];

/**
 * A real, live-updating XYZ orientation gizmo: it rotates with the actual
 * camera as you orbit, and clicking a face/axis snaps the real camera there
 * (via the same OrbitControls instance) — not a decorative static icon.
 * Must be rendered inside the same <Canvas> as the OrbitControls it drives.
 */
export function CameraGizmo({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  return (
    <GizmoHelper
      alignment="bottom-right"
      margin={[56, 56]}
      onUpdate={() => controlsRef.current?.update()}
      onTarget={() => controlsRef.current?.target ?? new THREE.Vector3()}
    >
      <GizmoViewport axisColors={AXIS_COLORS} labelColor="black" />
    </GizmoHelper>
  );
}
