import { describe, expect, it } from "vitest";

import { getImportedFormat, loadImportedModel, validateImportSelection } from "./loader";

if (typeof globalThis.ProgressEvent === "undefined") {
  class NodeProgressEvent extends Event {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly total: number;

    constructor(type: string, init: ProgressEventInit = {}) {
      super(type);
      this.lengthComputable = init.lengthComputable ?? false;
      this.loaded = init.loaded ?? 0;
      this.total = init.total ?? 0;
    }
  }
  Object.defineProperty(globalThis, "ProgressEvent", {
    configurable: true,
    value: NodeProgressEvent,
  });
}

function makeFile(contents: string, name: string) {
  return new File([contents], name, { type: "text/plain" });
}

const simpleLineDxf = [
  "0",
  "SECTION",
  "2",
  "ENTITIES",
  "0",
  "LINE",
  "8",
  "0",
  "10",
  "0",
  "20",
  "0",
  "30",
  "0",
  "11",
  "10",
  "21",
  "5",
  "31",
  "0",
  "0",
  "ENDSEC",
  "0",
  "EOF",
].join("\n");

const simpleFaceDxf = [
  "0",
  "SECTION",
  "2",
  "ENTITIES",
  "0",
  "3DFACE",
  "8",
  "0",
  "10",
  "0",
  "20",
  "0",
  "30",
  "0",
  "11",
  "1",
  "21",
  "0",
  "31",
  "0",
  "12",
  "1",
  "22",
  "1",
  "32",
  "0",
  "13",
  "0",
  "23",
  "1",
  "33",
  "0",
  "0",
  "ENDSEC",
  "0",
  "EOF",
].join("\n");

const emptyDxf = ["0", "SECTION", "2", "ENTITIES", "0", "ENDSEC", "0", "EOF"].join("\n");

const asciiStl = [
  "solid triangle",
  "facet normal 0 0 1",
  "outer loop",
  "vertex 0 0 0",
  "vertex 1 0 0",
  "vertex 0 1 0",
  "endloop",
  "endfacet",
  "endsolid triangle",
].join("\n");

const asciiPly = [
  "ply",
  "format ascii 1.0",
  "element vertex 3",
  "property float x",
  "property float y",
  "property float z",
  "element face 1",
  "property list uchar int vertex_indices",
  "end_header",
  "0 0 0",
  "1 0 0",
  "0 1 0",
  "3 0 1 2",
].join("\n");

const simpleObj = ["o triangle", "v 0 0 0", "v 1 0 0", "v 0 1 0", "f 1 2 3"].join("\n");

function makeSimpleGltfFixture(externalBuffer: boolean) {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const bytes = new Uint8Array(positions.buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  const model = makeFile(
    JSON.stringify({
      asset: { version: "2.0" },
      buffers: [
        {
          byteLength: bytes.byteLength,
          uri: externalBuffer ? "triangle.bin" : `data:application/octet-stream;base64,${base64}`,
        },
      ],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bytes.byteLength }],
      accessors: [
        {
          bufferView: 0,
          componentType: 5126,
          count: 3,
          type: "VEC3",
          min: [0, 0, 0],
          max: [1, 1, 0],
        },
      ],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 }, mode: 4 }] }],
      nodes: [{ mesh: 0 }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    }),
    "triangle.gltf",
  );
  const binary = new File([bytes], "triangle.bin", { type: "application/octet-stream" });
  return { model, files: externalBuffer ? [model, binary] : [model] };
}

describe("imported asset loader", () => {
  it("recognizes supported 3D and CAD formats case-insensitively", () => {
    expect(getImportedFormat("part.STL")).toBe("stl");
    expect(getImportedFormat("assembly.glb")).toBe("glb");
    expect(getImportedFormat("drawing.dxf")).toBe("dxf");
    expect(getImportedFormat("notes.pdf")).toBeNull();
  });

  it("requires exactly one main model and accepts its companion files", () => {
    const model = makeFile("o mesh", "mesh.obj");
    const material = makeFile("newmtl sample", "mesh.mtl");
    expect(validateImportSelection([model, material])).toEqual({ primary: model, format: "obj" });
    expect(() => validateImportSelection([model, makeFile("", "other.stl")])).toThrow(
      "Select one model file at a time",
    );
  });

  it("parses STL triangles into a normalized mesh", async () => {
    const file = makeFile(asciiStl, "triangle.stl");
    const result = await loadImportedModel([{ name: file.name, file }], file.name, "stl");
    expect(result.vertexCount).toBe(3);
    expect(result.faceCount).toBe(1);
  });

  it("parses OBJ faces into a renderable mesh", async () => {
    const file = makeFile(simpleObj, "triangle.obj");
    const result = await loadImportedModel([{ name: file.name, file }], file.name, "obj");
    expect(result.vertexCount).toBeGreaterThanOrEqual(3);
    expect(result.faceCount).toBe(1);
  });

  it("parses glTF scenes with embedded geometry buffers", async () => {
    const fixture = makeSimpleGltfFixture(false);
    const result = await loadImportedModel(
      fixture.files.map((file) => ({ name: file.name, file })),
      fixture.model.name,
      "gltf",
    );
    expect(result.vertexCount).toBe(3);
    expect(result.faceCount).toBe(1);
  });

  it("loads external glTF buffers from selected companion files", async () => {
    const fixture = makeSimpleGltfFixture(true);
    const result = await loadImportedModel(
      fixture.files.map((file) => ({ name: file.name, file })),
      fixture.model.name,
      "gltf",
    );
    expect(result.vertexCount).toBe(3);
    expect(result.faceCount).toBe(1);
  });

  it("parses PLY faces into a renderable mesh", async () => {
    const file = makeFile(asciiPly, "triangle.ply");
    const result = await loadImportedModel([{ name: file.name, file }], file.name, "ply");
    expect(result.vertexCount).toBe(3);
    expect(result.faceCount).toBe(1);
  });

  it("converts DXF line entities into normalized 3D-viewable geometry", async () => {
    const file = makeFile(simpleLineDxf, "line.dxf");
    const result = await loadImportedModel([{ name: file.name, file }], file.name, "dxf");
    expect(result.object.children).toHaveLength(1);
    expect(result.vertexCount).toBe(2);
    expect(result.faceCount).toBe(0);
  });

  it("converts DXF 3DFACE entities into a renderable surface", async () => {
    const file = makeFile(simpleFaceDxf, "face.dxf");
    const result = await loadImportedModel([{ name: file.name, file }], file.name, "dxf");
    expect(result.faceCount).toBe(2);
    expect(result.vertexCount).toBe(4);
  });

  it("rejects DXF drawings with no supported visible entities", async () => {
    const file = makeFile(emptyDxf, "empty.dxf");
    await expect(loadImportedModel([{ name: file.name, file }], file.name, "dxf")).rejects.toThrow(
      "no supported visible entities",
    );
  });
});
