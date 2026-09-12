import { Canvas, useThree } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, OrbitControls } from "@react-three/drei";
import { forwardRef, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { CameraGizmo } from "@/components/studio/CameraGizmo";

export type CameraViewPreset = "front" | "three-quarter" | "side" | "top";

export interface CrystalMeshViewerHandle {
  reset: () => void;
  frame: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  captureSnapshot: () => string | null;
  goToView: (preset: CameraViewPreset) => void;
}

export interface CrystalMaterialSettings {
  /** Hex color tint of the crystal block, e.g. "#ffffff" for clear glass. */
  color: string;
  /** 0-100. Higher is clearer (less rough, more transmissive) glass. */
  clarity: number;
}

export interface SceneStagingSettings {
  showBust: boolean;
  showCrystal: boolean;
  showBase: boolean;
  /** 0-100 each. */
  keyLight: number;
  fillLight: number;
  ambient: number;
  /** Hex color of the environment backdrop. */
  backdrop: string;
}

export const DEFAULT_SCENE_STAGING: SceneStagingSettings = {
  showBust: true,
  showCrystal: true,
  showBase: true,
  keyLight: 65,
  fillLight: 25,
  ambient: 45,
  backdrop: "#4a5064",
};

/** Camera azimuth/polar angles (radians) for each named view preset. */
const VIEW_PRESETS: Record<CameraViewPreset, { azimuth: number; polar: number }> = {
  front: { azimuth: 0, polar: Math.PI / 2 },
  "three-quarter": { azimuth: Math.PI / 4, polar: Math.PI / 2.3 },
  side: { azimuth: Math.PI / 2, polar: Math.PI / 2 },
  top: { azimuth: 0, polar: 0.25 },
};

/** How much bigger the crystal block is than the bust's own bounding box. */
const BLOCK_MARGIN_XY = 1.45;
/** Block depth as a fraction of its (width+height)/2 — a real crystal cube proportion,
 * independent of the bust's own shallow Z extent (a 2.5D relief is only a few mm "deep"). */
const BLOCK_DEPTH_RATIO = 0.6;

function zoomControlsBy(controls: OrbitControlsImpl, camera: THREE.Camera, factor: number) {
  const offset = camera.position.clone().sub(controls.target);
  const distance = THREE.MathUtils.clamp(
    offset.length() * factor,
    controls.minDistance,
    controls.maxDistance,
  );
  offset.setLength(distance);
  camera.position.copy(controls.target.clone().add(offset));
  controls.update();
}

/**
 * Synthetic, offline environment (a couple of bright "light" spheres inside a
 * lit backdrop) rendered to a cubemap by drei's <Environment>, used purely so
 * the glass block has something to refract/reflect — no network HDRI fetch,
 * matching the rest of the app running fully client-side.
 */
function CrystalEnvironment({ backdrop }: { backdrop: string }) {
  return (
    <Environment resolution={256}>
      <mesh scale={12}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={backdrop} side={THREE.BackSide} />
      </mesh>
      <mesh position={[4, 5, 3]} scale={2.2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[-4, 2, -3]} scale={1.6}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#bfe4ff" toneMapped={false} />
      </mesh>
      <mesh position={[0, -4, 3]} scale={1.4}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffe4b8" toneMapped={false} />
      </mesh>
      <mesh position={[3, -2, -4]} scale={1.2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </Environment>
  );
}

/** Lives inside the Canvas so it can reach the R3F camera/renderer for the imperative handle. */
function CrystalControls({
  handleRef,
  autoRotate,
  frameRadius,
}: {
  handleRef: Ref<CrystalMeshViewerHandle> | undefined;
  autoRotate: boolean;
  frameRadius: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();

  useImperativeHandle(
    handleRef,
    () => ({
      reset: () => controlsRef.current?.reset(),
      frame: () => {
        const controls = controlsRef.current;
        if (!controls) return;
        const fovDeg = "fov" in camera ? (camera as THREE.PerspectiveCamera).fov : 30;
        const fitDistance = frameRadius / Math.sin((fovDeg * Math.PI) / 360);
        const distance = THREE.MathUtils.clamp(
          fitDistance * 1.7,
          controls.minDistance,
          controls.maxDistance,
        );
        const dir = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target.clone().add(dir.multiplyScalar(distance)));
        controls.update();
      },
      zoomIn: () => controlsRef.current && zoomControlsBy(controlsRef.current, camera, 0.82),
      zoomOut: () => controlsRef.current && zoomControlsBy(controlsRef.current, camera, 1 / 0.82),
      captureSnapshot: () => {
        try {
          return gl.domElement.toDataURL("image/png");
        } catch {
          return null;
        }
      },
      goToView: (preset) => {
        const controls = controlsRef.current;
        if (!controls) return;
        const { azimuth, polar } = VIEW_PRESETS[preset];
        const distance = camera.position.distanceTo(controls.target) || frameRadius * 3;
        const x = distance * Math.sin(polar) * Math.sin(azimuth);
        const y = distance * Math.cos(polar);
        const z = distance * Math.sin(polar) * Math.cos(azimuth);
        camera.position.set(controls.target.x + x, controls.target.y + y, controls.target.z + z);
        controls.update();
      },
    }),
    [camera, gl, frameRadius],
  );

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={1.3}
        minDistance={1.3}
        maxDistance={14}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI - 0.05}
      />
      <CameraGizmo controlsRef={controlsRef} />
    </>
  );
}

/**
 * Renders the real reconstructed bust — still photo-textured, exactly as it
 * looks everywhere else in the app — encased inside a separate transparent
 * crystal block, like a laser-engraved photo crystal. The bust itself is
 * never turned into glass; only the surrounding block is. Orbit is fully
 * unconstrained (unlike DepthMeshViewer's photo-relief viewports, which clamp
 * rotation): the block reads as a real object from every angle even though
 * the bust inside is still a single-photo relief.
 */
export const CrystalMeshViewer = forwardRef<
  CrystalMeshViewerHandle,
  {
    geometry: THREE.BufferGeometry | null;
    texture: THREE.Texture | null;
    material: CrystalMaterialSettings;
    scene?: SceneStagingSettings | undefined;
    autoRotate?: boolean;
    interactive?: boolean;
    className?: string;
  }
>(function CrystalMeshViewer(
  {
    geometry,
    texture,
    material,
    scene = DEFAULT_SCENE_STAGING,
    autoRotate = false,
    interactive = true,
    className,
  },
  ref,
) {
  const block = useMemo(() => {
    if (!geometry) return null;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return null;

    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const width = size.x * BLOCK_MARGIN_XY;
    const height = size.y * BLOCK_MARGIN_XY;
    const depth = ((width + height) / 2) * BLOCK_DEPTH_RATIO;
    const baseHeight = height * 0.14;
    const totalHeight = height + baseHeight;

    return {
      width,
      height,
      depth,
      center,
      baseHeight,
      baseY: -height / 2 - baseHeight / 2,
      radius: Math.sqrt(width * width + totalHeight * totalHeight + depth * depth) / 2,
    };
  }, [geometry]);

  if (!geometry || !block) return null;

  const roughness = THREE.MathUtils.clamp(0.28 - (material.clarity / 100) * 0.26, 0.01, 0.28);
  const keyIntensity = (scene.keyLight / 100) * 2.4;
  const fillIntensity = (scene.fillLight / 100) * 1.4;
  const ambientIntensity = (scene.ambient / 100) * 1.4;

  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0, block.radius * 3.4], fov: 30 }}
    >
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[2, 3, 4]} intensity={keyIntensity} />
      <directionalLight position={[-3, -1, -2]} intensity={fillIntensity} />
      <directionalLight position={[0, 4, -4]} intensity={fillIntensity * 1.3} />
      <CrystalEnvironment backdrop={scene.backdrop} />

      {scene.showBust ? (
        <group position={[-block.center.x, -block.center.y, -block.center.z]}>
          {/* The real photo-textured bust, unchanged from the rest of the app.
              FrontSide (not DoubleSide): the shell's front and back layers
              are both real geometry with outward-facing normals, so
              DoubleSide would render both at once from any given angle —
              the front layer's inside face bleeding through together with
              the back layer, both carrying the same photo texture, which
              looks like a ghosted double/mirrored image from the side.
              FrontSide shows only whichever layer actually faces the
              camera, which is what a real solid object does. */}
          <mesh geometry={geometry}>
            <meshStandardMaterial
              map={texture ?? null}
              roughness={0.9}
              metalness={0}
              side={THREE.FrontSide}
            />
          </mesh>
        </group>
      ) : null}

      {scene.showCrystal ? (
        <>
          {/* The surrounding crystal block, positioned in the same frame as the bust. */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[block.width, block.height, block.depth]} />
            <MeshTransmissionMaterial
              color={material.color}
              background={new THREE.Color("#6b7280")}
              transmission={0.88}
              thickness={block.depth * 0.5}
              roughness={roughness}
              ior={1.5}
              chromaticAberration={0.06}
              anisotropy={0.15}
              envMapIntensity={1.8}
              clearcoat={0.7}
              clearcoatRoughness={0.06}
              samples={6}
              resolution={512}
            />
          </mesh>
          {/* Bright edge outline so the block reads clearly as a solid object at
              any angle, approximating the strong edge highlights real cut glass
              shows from total internal reflection. */}
          <lineSegments position={[0, 0, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(block.width, block.height, block.depth)]} />
            <lineBasicMaterial color="#ffffff" transparent opacity={0.55} />
          </lineSegments>
        </>
      ) : null}

      {scene.showBase ? (
        <mesh position={[0, block.baseY, 0]}>
          <boxGeometry args={[block.width * 1.15, block.baseHeight, block.depth * 1.15]} />
          <meshStandardMaterial color="#181818" roughness={0.35} metalness={0.5} />
        </mesh>
      ) : null}

      {interactive ? (
        <CrystalControls handleRef={ref} autoRotate={autoRotate} frameRadius={block.radius} />
      ) : null}
    </Canvas>
  );
});
