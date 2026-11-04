import type { BufferGeometry } from "three";

/** Neutral matte treatment for the unseen rear surface of a single-photo relief. */
export const DEFAULT_RELIEF_BACK_COLOR = "#596273";

/** Stored on built geometry so renderers and exports agree on whether the back has real imagery. */
export const RELIEF_BACK_USES_TEXTURE_KEY = "reliefBackUsesTexture";

export function hasReliefBackSurface(geometry: BufferGeometry): boolean {
  return geometry.groups.some((group) => group.materialIndex === 1);
}

export function reliefBackUsesTexture(geometry: BufferGeometry): boolean {
  return hasReliefBackSurface(geometry) && geometry.userData[RELIEF_BACK_USES_TEXTURE_KEY] === true;
}
