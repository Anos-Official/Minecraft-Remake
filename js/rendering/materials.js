const createMaterials = (scene) => {
  const setTexture = (path) => {
    const tex = new BABYLON.Texture(path, scene);
    tex.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST);
    tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    return tex;
  };

  const grassTopMat = new BABYLON.StandardMaterial('grassTop', scene);
  grassTopMat.diffuseTexture = setTexture('textures/grass/grass_block_top.png');
  grassTopMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const grassSideCombined = new BABYLON.StandardMaterial('grassSideCombined', scene);
  grassSideCombined.diffuseTexture = setTexture('textures/grass/grass_block_side.png');
  grassSideCombined.emissiveTexture = setTexture('textures/grass/grass_block_side_overlay.png');
  grassSideCombined.emissiveTexture.hasAlpha = true;
  grassSideCombined.emissiveColor = new BABYLON.Color3(0.47, 0.72, 0.3);
  grassSideCombined.specularColor = new BABYLON.Color3(0, 0, 0);

  const dirtMat = new BABYLON.StandardMaterial('dirt', scene);
  dirtMat.diffuseTexture = setTexture('textures/dirt/dirt.png');
  dirtMat.specularColor = new BABYLON.Color3(0, 0, 0);

  const stoneMat = new BABYLON.StandardMaterial('stone', scene);
  stoneMat.diffuseTexture = setTexture('textures/stone/stone.png');
  stoneMat.specularColor = new BABYLON.Color3(0, 0, 0);

  // babylon face order for CreateBox:
  // 0=back, 1=front, 2=right, 3=left, 4=top, 5=bottom
  const grassMultiMat = new BABYLON.MultiMaterial('grassMulti', scene);
  grassMultiMat.subMaterials[0] = grassSideCombined; // back
  grassMultiMat.subMaterials[1] = grassSideCombined; // front
  grassMultiMat.subMaterials[2] = grassSideCombined; // right
  grassMultiMat.subMaterials[3] = grassSideCombined; // left
  grassMultiMat.subMaterials[4] = grassTopMat;       // top
  grassMultiMat.subMaterials[5] = dirtMat;           // bottom

  return {
    grassTop: grassTopMat,
    grassSide: grassSideCombined,
    dirt: dirtMat,
    stone: stoneMat,
    grassMulti: grassMultiMat,
  };
};