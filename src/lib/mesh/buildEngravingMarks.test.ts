import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { buildEngravingMarkGeometry } from "./buildEngravingMarks";
import { buildLaserEngravingSTL } from "./exportMesh";
import { RELIEF_BACK_USES_TEXTURE_KEY } from "./reliefSurface";

const OPTIONS = {
  maxDimensionMm: 2,
  markSizeMm: 0.01,
  spacingMm: 0.5,
  seed: 12345,
};

function makeBox(color = "#ffffff") {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color });
  return { mesh: new THREE.Mesh(geometry, material), geometry, material };
}

describe("buildEngravingMarkGeometry", () => {
  it("scales to millimetres and makes closed micro-tetrahedra with the requested edge size", () => {
    const { mesh, geometry: sourceGeometry, material } = makeBox();
    const result = buildEngravingMarkGeometry(mesh, OPTIONS);

    expect(result.dimensionsMm).toEqual([2, 2, 2]);
    expect(result.markCount).toBeGreaterThan(0);
    expect(result.triangleCount).toBe(result.markCount * 4);
    expect(result.geometry.getAttribute("position").count).toBe(result.markCount * 4);

    const positions = result.geometry.getAttribute("position");
    const index = result.geometry.index!;
    const firstTetVertices = new Set<number>();
    for (let i = 0; i < 12; i++) firstTetVertices.add(index.getX(i));
    const vertices = [...firstTetVertices];
    const edgeLengths = new Set<string>();
    for (let a = 0; a < vertices.length; a++) {
      for (let b = a + 1; b < vertices.length; b++) {
        const pa = new THREE.Vector3(
          positions.getX(vertices[a]!),
          positions.getY(vertices[a]!),
          positions.getZ(vertices[a]!),
        );
        const pb = new THREE.Vector3(
          positions.getX(vertices[b]!),
          positions.getY(vertices[b]!),
          positions.getZ(vertices[b]!),
        );
        edgeLengths.add(pa.distanceTo(pb).toFixed(5));
      }
    }
    expect(edgeLengths).toEqual(new Set(["0.01000"]));

    result.geometry.dispose();
    sourceGeometry.dispose();
    material.dispose();
  });

  it("uses visible material tone to reduce mark density in dark regions", () => {
    const bright = makeBox("#ffffff");
    const dark = makeBox("#080808");
    const brightResult = buildEngravingMarkGeometry(bright.mesh, OPTIONS);
    const darkResult = buildEngravingMarkGeometry(dark.mesh, OPTIONS);

    expect(brightResult.markCount).toBeGreaterThan(0);
    expect(darkResult.markCount).toBeLessThan(brightResult.markCount);

    brightResult.geometry.dispose();
    darkResult.geometry.dispose();
    bright.geometry.dispose();
    bright.material.dispose();
    dark.geometry.dispose();
    dark.material.dispose();
  });

  it("samples the UV channel selected by a glTF texture map", () => {
    const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => ({
          width: 2,
          height: 1,
          getContext: () => ({
            drawImage: () => undefined,
            getImageData: () => ({
              data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]),
            }),
          }),
        }),
      },
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0.1, 0.5, 0.1, 0.5, 0.1, 0.5], 2),
    );
    geometry.setAttribute(
      "uv1",
      new THREE.Float32BufferAttribute([0.9, 0.5, 0.9, 0.5, 0.9, 0.5], 2),
    );
    const texture = new THREE.Texture({ width: 2, height: 1 } as HTMLImageElement);
    texture.channel = 1;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    try {
      const result = buildEngravingMarkGeometry(mesh, OPTIONS);
      expect(result.markCount).toBeGreaterThan(0);
      result.geometry.dispose();
    } finally {
      if (previousDocument) {
        Object.defineProperty(globalThis, "document", previousDocument);
      } else {
        Reflect.deleteProperty(globalThis, "document");
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
    }
  });

  it("omits a synthetic untextured rear shell from a photo-derived relief", () => {
    const geometry = new THREE.BufferGeometry();
    const frontPositions = [
      -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, -0.2, 1, -1, -0.2, 1, 1,
      -0.2, -1, -1, -0.2, 1, 1, -0.2, -1, 1, -0.2,
    ];
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(frontPositions, 3));
    geometry.addGroup(0, 6, 0);
    geometry.addGroup(6, 6, 1);
    geometry.setIndex([...Array(12).keys()]);
    geometry.userData[RELIEF_BACK_USES_TEXTURE_KEY] = false;
    const mesh = new THREE.Mesh(geometry, [
      new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    ]);

    const result = buildEngravingMarkGeometry(mesh, OPTIONS);
    expect(result.sampledSurfaceAreaMm2).toBeCloseTo(4, 5);

    result.geometry.dispose();
    geometry.dispose();
    for (const material of mesh.material as THREE.Material[]) material.dispose();
  });

  it("writes a binary STL with four triangles per engraving mark", async () => {
    const { mesh, geometry, material } = makeBox();
    const result = buildLaserEngravingSTL(mesh, OPTIONS);
    const expectedTriangleCount = result.markCount * 4;
    const stlHeader = new DataView(await result.blob.arrayBuffer());

    expect(result.blob.type).toBe("model/stl");
    expect(result.triangleCount).toBe(expectedTriangleCount);
    expect(result.blob.size).toBe(84 + expectedTriangleCount * 50);
    expect(stlHeader.getUint32(80, true)).toBe(expectedTriangleCount);

    geometry.dispose();
    material.dispose();
  });
});
