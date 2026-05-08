import * as BABYLON from '@babylonjs/core';

export const registerShaders = (): void => {
  BABYLON.Effect.ShadersStore['voxelVertexShader'] = `
    precision highp float;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    uniform mat4 worldViewProjection;
    uniform mat4 world;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 worldPos = world * vec4(position, 1.0);
      gl_Position = worldViewProjection * vec4(position, 1.0);
      vUV = uv;
      vNormal = normal;
      vPosition = worldPos.xyz;
    }
  `;

  BABYLON.Effect.ShadersStore['voxelFragmentShader'] = `
    precision highp float;

    uniform sampler2D textureSampler;
    uniform vec3 lightDirection;
    uniform float fogStart;
    uniform float fogEnd;
    uniform vec3 fogColor;
    uniform vec3 cameraPosition;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 texColor = texture2D(textureSampler, vUV);

      // directional lighting per face
      float ambient = 0.4;
      float diff = max(dot(normalize(vNormal), normalize(-lightDirection)), 0.0);
      float light = ambient + diff * 0.6;

      // darken sides slightly like Minecraft
      if (abs(vNormal.x) > 0.5) light *= 0.8;
      if (abs(vNormal.z) > 0.5) light *= 0.8;
      if (vNormal.y < -0.5)     light *= 0.5;

      vec3 finalColor = texColor.rgb * light;

      // fog
      float dist = length(vPosition - cameraPosition);
      float fogFactor = clamp((dist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
      finalColor = mix(finalColor, fogColor, fogFactor);

      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `;
};

export const createVoxelMaterial = (
  name: string,
  atlasCanvas: HTMLCanvasElement,
  scene: BABYLON.Scene
): BABYLON.ShaderMaterial => {
  const material = new BABYLON.ShaderMaterial(
    name,
    scene,
    { vertex: 'voxel', fragment: 'voxel' },
    {
      attributes: ['position', 'normal', 'uv'],
      uniforms: [
        'worldViewProjection',
        'world',
        'lightDirection',
        'fogStart',
        'fogEnd',
        'fogColor',
        'cameraPosition',
      ],
      samplers: ['textureSampler'],
    }
  );

  const atlasTexture = new BABYLON.DynamicTexture(
    'atlas',
    { width: atlasCanvas.width, height: atlasCanvas.height },
    scene,
    false,
    BABYLON.Texture.NEAREST_NEAREST
  );

  const ctx = atlasTexture.getContext();
  ctx.drawImage(atlasCanvas, 0, 0);
  atlasTexture.update();

  material.setTexture('textureSampler', atlasTexture);
  material.setVector3('lightDirection', new BABYLON.Vector3(-1, -2, -1));
  material.setFloat('fogStart', 40);
  material.setFloat('fogEnd', 80);
  material.setVector3('fogColor', new BABYLON.Vector3(0.53, 0.81, 0.98));
  material.backFaceCulling = true;

  return material;
};