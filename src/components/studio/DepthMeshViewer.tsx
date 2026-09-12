import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { forwardRef, useImperativeHandle, useRef, type Ref } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { CameraGizmo } from "./CameraGizmo";

export type ViewerMode = "solid" | "wireframe";
export type DragMode = "rotate" | "pan";

export interface DepthMeshViewerHandle {
  reset: () => void;
  frame: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  captureSnapshot: () => string | null;
}

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

/** Lives inside the Canvas so it can reach the R3F camera/renderer for the imperative handle. */
function ViewerControls({
  handleRef,
  dragMode,
  autoRotate,
  geometry,
  scale,
}: {
  handleRef: Ref<DepthMeshViewerHandle> | undefined;
  dragMode: DragMode;
  autoRotate: boolean;
  geometry: THREE.BufferGeometry;
  scale: number;
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
        if (!geometry.boundingSphere) geometry.computeBoundingSphere();
        const sphere = geometry.boundingSphere;
        if (!sphere) return;
        const radius = Math.max(sphere.radius * scale, 0.01);
        const fovDeg = "fov" in camera ? (camera as THREE.PerspectiveCamera).fov : 30;
        const fitDistance = radius / Math.sin((fovDeg * Math.PI) / 360);
        const distance = THREE.MathUtils.clamp(
          fitDistance * 1.35,
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
    }),
    [camera, gl, geometry, scale],
  );

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={dragMode === "pan"}
        mouseButtons={{
          LEFT: dragMode === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: dragMode === "pan" ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
        }}
        autoRotate={autoRotate}
        autoRotateSpeed={1.4}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        minPolarAngle={Math.PI / 2 - 0.4}
        maxPolarAngle={Math.PI / 2 + 0.4}
        minDistance={1.6}
        maxDistance={3.6}
      />
      <CameraGizmo controlsRef={controlsRef} />
    </>
  );
}

/**
 * Renders the real generated depth-displaced mesh. `interactive` viewports
 * clamp orbit to a limited angle range — past that, a single photo has no
 * data and the geometry would visibly stretch/tear, so we don't expose it.
 */
export const DepthMeshViewer = forwardRef<
  DepthMeshViewerHandle,
  {
    geometry: THREE.BufferGeometry | null;
    texture: THREE.Texture | null;
    mode?: ViewerMode;
    interactive?: boolean;
    azimuthDeg?: number;
    scale?: number;
    rotationYDeg?: number;
    dragMode?: DragMode;
    autoRotate?: boolean;
    className?: string;
  }
>(function DepthMeshViewer(
  {
    geometry,
    texture,
    mode = "solid",
    interactive = false,
    azimuthDeg = 0,
    scale = 1,
    rotationYDeg = 0,
    dragMode = "rotate",
    autoRotate = false,
    className,
  },
  ref,
) {
  if (!geometry) return null;

  const distance = 2.6;
  const rad = (azimuthDeg * Math.PI) / 180;
  const cameraPosition: [number, number, number] = [
    Math.sin(rad) * distance,
    0,
    Math.cos(rad) * distance,
  ];

  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: cameraPosition, fov: 30 }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[1.5, 2, 3]} intensity={1.15} />
      <directionalLight position={[-2, -0.5, -1.5]} intensity={0.2} />
      <group scale={scale} rotation={[0, (rotationYDeg * Math.PI) / 180, 0]}>
        {mode === "wireframe" ? (
          <mesh geometry={geometry}>
            <meshBasicMaterial color="#8b7bff" wireframe />
          </mesh>
        ) : (
          <mesh geometry={geometry}>
            <meshStandardMaterial
              map={texture ?? null}
              roughness={0.9}
              metalness={0}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
      {interactive ? (
        <ViewerControls
          handleRef={ref}
          dragMode={dragMode}
          autoRotate={autoRotate}
          geometry={geometry}
          scale={scale}
        />
      ) : null}
    </Canvas>
  );
});
