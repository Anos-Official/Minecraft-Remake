import { worldData } from '../world/worldData';
import * as BABYLON from '@babylonjs/core';

// Minecraft accurate player hitbox
const PLAYER_WIDTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const PLAYER_EYE_HEIGHT = 1.62;

// half extents for AABB
const HX = PLAYER_WIDTH / 2;  // 0.3
const HZ = PLAYER_WIDTH / 2;  // 0.3

export interface AABB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export const getPlayerAABB = (position: BABYLON.Vector3): AABB => {
  // position is eye position so feet are at position.y - EYE_HEIGHT
  const feetY = position.y - PLAYER_EYE_HEIGHT;
  return {
    minX: position.x - HX,
    minY: feetY,
    minZ: position.z - HZ,
    maxX: position.x + HX,
    maxY: feetY + PLAYER_HEIGHT,
    maxZ: position.z + HZ,
  };
};

const getBlocksInAABB = (aabb: AABB): BABYLON.Vector3[] => {
  const blocks: BABYLON.Vector3[] = [];
  const minX = Math.floor(aabb.minX);
  const minY = Math.floor(aabb.minY);
  const minZ = Math.floor(aabb.minZ);
  const maxX = Math.floor(aabb.maxX);
  const maxY = Math.floor(aabb.maxY);
  const maxZ = Math.floor(aabb.maxZ);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (worldData.isSolid(x, y, z)) {
          blocks.push(new BABYLON.Vector3(x, y, z));
        }
      }
    }
  }
  return blocks;
};

const resolveAxisX = (
  aabb: AABB,
  blocks: BABYLON.Vector3[],
  velocityX: number
): number => {
  for (const block of blocks) {
    const blockMaxX = block.x + 1;
    const blockMinX = block.x;

    if (
      aabb.maxY > block.y &&
      aabb.minY < block.y + 1 &&
      aabb.maxZ > block.z &&
      aabb.minZ < block.z + 1
    ) {
      if (velocityX > 0 && aabb.maxX > blockMinX && aabb.minX < blockMinX) {
        velocityX = blockMinX - aabb.maxX;
      }
      if (velocityX < 0 && aabb.minX < blockMaxX && aabb.maxX > blockMaxX) {
        velocityX = blockMaxX - aabb.minX;
      }
    }
  }
  return velocityX;
};

const resolveAxisY = (
  aabb: AABB,
  blocks: BABYLON.Vector3[],
  velocityY: number
): number => {
  for (const block of blocks) {
    const blockMaxY = block.y + 1;
    const blockMinY = block.y;

    if (
      aabb.maxX > block.x &&
      aabb.minX < block.x + 1 &&
      aabb.maxZ > block.z &&
      aabb.minZ < block.z + 1
    ) {
      if (velocityY < 0 && aabb.minY < blockMaxY && aabb.maxY > blockMaxY) {
        velocityY = blockMaxY - aabb.minY;
      }
      if (velocityY > 0 && aabb.maxY > blockMinY && aabb.minY < blockMinY) {
        velocityY = blockMinY - aabb.maxY;
      }
    }
  }
  return velocityY;
};

const resolveAxisZ = (
  aabb: AABB,
  blocks: BABYLON.Vector3[],
  velocityZ: number
): number => {
  for (const block of blocks) {
    const blockMaxZ = block.z + 1;
    const blockMinZ = block.z;

    if (
      aabb.maxX > block.x &&
      aabb.minX < block.x + 1 &&
      aabb.maxY > block.y &&
      aabb.minY < block.y + 1
    ) {
      if (velocityZ > 0 && aabb.maxZ > blockMinZ && aabb.minZ < blockMinZ) {
        velocityZ = blockMinZ - aabb.maxZ;
      }
      if (velocityZ < 0 && aabb.minZ < blockMaxZ && aabb.maxZ > blockMaxZ) {
        velocityZ = blockMaxZ - aabb.minZ;
      }
    }
  }
  return velocityZ;
};

export interface CollisionResult {
  position: BABYLON.Vector3;
  velocityY: number;
  onGround: boolean;
}

export const resolveCollision = (
  position: BABYLON.Vector3,
  velocity: BABYLON.Vector3
): CollisionResult => {
  let aabb = getPlayerAABB(position);
  const blocks = getBlocksInAABB({
    minX: aabb.minX + Math.min(velocity.x, 0),
    minY: aabb.minY + Math.min(velocity.y, 0),
    minZ: aabb.minZ + Math.min(velocity.z, 0),
    maxX: aabb.maxX + Math.max(velocity.x, 0),
    maxY: aabb.maxY + Math.max(velocity.y, 0),
    maxZ: aabb.maxZ + Math.max(velocity.z, 0),
  });

  // resolve each axis separately
  let vx = resolveAxisX(aabb, blocks, velocity.x);
  aabb = {
    ...aabb,
    minX: aabb.minX + vx,
    maxX: aabb.maxX + vx,
  };

  let vy = resolveAxisY(aabb, blocks, velocity.y);
  const onGround = vy !== velocity.y && velocity.y < 0;
  aabb = {
    ...aabb,
    minY: aabb.minY + vy,
    maxY: aabb.maxY + vy,
  };

  let vz = resolveAxisZ(aabb, blocks, velocity.z);

  // new eye position
  const newPosition = new BABYLON.Vector3(
    position.x + vx,
    aabb.minY + PLAYER_EYE_HEIGHT + vy,
    position.z + vz
  );

  return {
    position: newPosition,
    velocityY: vy,
    onGround,
  };
};