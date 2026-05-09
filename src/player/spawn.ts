import { worldData } from '../world/worldData';
import { CHUNK_SIZE, CHUNK_HEIGHT, WORLD_CHUNKS_X, WORLD_CHUNKS_Z } from '../world/blocks';
import * as BABYLON from '@babylonjs/core';

const WORLD_WIDTH_X = WORLD_CHUNKS_X * CHUNK_SIZE;
const WORLD_WIDTH_Z = WORLD_CHUNKS_Z * CHUNK_SIZE;

export const findSurface = (worldX: number, worldZ: number): number => {
  // walk down from top until we hit a solid block
  for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
    if (worldData.isSolid(worldX, y, worldZ)) {
      // return one block above surface
      return y + 1;
    }
  }
  // nothing found, return default height
  return CHUNK_HEIGHT;
};

export const getRandomSpawn = (): BABYLON.Vector3 => {
  // pick random X/Z within world bounds with padding from edges
  const padding = 2;
  const x = Math.floor(Math.random() * (WORLD_WIDTH_X - padding * 2)) + padding;
  const z = Math.floor(Math.random() * (WORLD_WIDTH_Z - padding * 2)) + padding;
  const y = findSurface(x, z);

  // eye height offset 1.62 like Minecraft
  return new BABYLON.Vector3(x + 0.5, y + 1.62, z + 0.5);
};

export const waitForWorldThenSpawn = (
  onSpawn: (position: BABYLON.Vector3) => void
): void => {
  // poll until at least some chunks are loaded
  const check = setInterval(() => {
    const spawnX = Math.floor(WORLD_WIDTH_X / 2);
    const spawnZ = Math.floor(WORLD_WIDTH_Z / 2);

    const chunkX = Math.floor(spawnX / CHUNK_SIZE);
    const chunkZ = Math.floor(spawnZ / CHUNK_SIZE);

    if (worldData.isChunkLoaded(chunkX, chunkZ)) {
      clearInterval(check);
      const position = getRandomSpawn();
      onSpawn(position);
    }
  }, 100);
};