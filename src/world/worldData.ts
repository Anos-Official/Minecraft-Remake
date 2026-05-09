import { Block, CHUNK_SIZE, CHUNK_HEIGHT } from './blocks';

interface ChunkEntry {
  chunkX: number;
  chunkZ: number;
  blocks: Uint8Array;
}

class WorldData {
  private chunks: Map<string, Uint8Array> = new Map();

  private chunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }

  public setChunk(chunkX: number, chunkZ: number, blocks: Uint8Array): void {
    this.chunks.set(this.chunkKey(chunkX, chunkZ), blocks);
  }

  public getChunk(chunkX: number, chunkZ: number): Uint8Array | undefined {
    return this.chunks.get(this.chunkKey(chunkX, chunkZ));
  }

  public getBlock(worldX: number, y: number, worldZ: number): Block {
    if (y < 0 || y >= CHUNK_HEIGHT) return Block.AIR;

    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);

    const chunk = this.getChunk(chunkX, chunkZ);
    if (!chunk) return Block.AIR;

    const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const idx = localX + CHUNK_SIZE * (y + CHUNK_HEIGHT * localZ);
    return chunk[idx] as Block;
  }

  public isSolid(worldX: number, y: number, worldZ: number): boolean {
    const block = this.getBlock(worldX, y, worldZ);
    return block !== Block.AIR;
  }

  public isChunkLoaded(chunkX: number, chunkZ: number): boolean {
    return this.chunks.has(this.chunkKey(chunkX, chunkZ));
  }

  public getAllChunks(): ChunkEntry[] {
    const result: ChunkEntry[] = [];
    this.chunks.forEach((blocks, key) => {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      result.push({ chunkX, chunkZ, blocks });
    });
    return result;
  }
}

// singleton so physics, spawn and collision all share same world data
export const worldData = new WorldData();