const renderChunk = (chunkX, chunkZ, blocks, scene, materials) => {
  const idx = (x, y, z) => x + CHUNK_SIZE * (y + CHUNK_HEIGHT * z);

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const b = blocks[idx(x, y, z)];
        if (b === BLOCK.AIR) continue;

        const worldX = chunkX * CHUNK_SIZE + x;
        const worldZ = chunkZ * CHUNK_SIZE + z;

        const box = BABYLON.MeshBuilder.CreateBox(
          `block_${worldX}_${y}_${worldZ}`,
          { size: BLOCK_SIZE },
          scene
        );

        box.position = new BABYLON.Vector3(worldX, y, worldZ);

        if (b === BLOCK.GRASS) {
          box.material = materials.grassMulti;
          box.subMeshes = [];
          const vc = box.getTotalVertices();
          // back, front, right, left, top, bottom
          box.subMeshes.push(new BABYLON.SubMesh(0, 0, vc, 0,  6, box));
          box.subMeshes.push(new BABYLON.SubMesh(1, 0, vc, 6,  6, box));
          box.subMeshes.push(new BABYLON.SubMesh(2, 0, vc, 12, 6, box));
          box.subMeshes.push(new BABYLON.SubMesh(3, 0, vc, 18, 6, box));
          box.subMeshes.push(new BABYLON.SubMesh(4, 0, vc, 24, 6, box));
          box.subMeshes.push(new BABYLON.SubMesh(5, 0, vc, 30, 6, box));
        } else if (b === BLOCK.DIRT) {
          box.material = materials.dirt;
        } else if (b === BLOCK.STONE) {
          box.material = materials.stone;
        }
      }
    }
  }
};