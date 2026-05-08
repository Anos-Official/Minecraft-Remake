export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 16;
export const WORLD_CHUNKS_X = 4;
export const WORLD_CHUNKS_Z = 4;
export const BLOCK_SIZE = 1;

export enum Block {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
}

export interface BlockData {
  id: Block;
  solid: boolean;
}

export const BLOCK_DATA: Record<Block, BlockData> = {
  [Block.AIR]:   { id: Block.AIR,   solid: false },
  [Block.GRASS]: { id: Block.GRASS, solid: true  },
  [Block.DIRT]:  { id: Block.DIRT,  solid: true  },
  [Block.STONE]: { id: Block.STONE, solid: true  },
};