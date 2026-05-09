import * as BABYLON from '@babylonjs/core';

export const createCamera = (
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement
): BABYLON.UniversalCamera => {
  const camera = new BABYLON.UniversalCamera(
    'camera',
    new BABYLON.Vector3(0, 0, 0),
    scene
  );

  // disable all built in controls
  camera.keysUp = [];
  camera.keysDown = [];
  camera.keysLeft = [];
  camera.keysRight = [];
  camera.minZ = 0.1;

  // handle mouse look manually
  let yaw = 0;
  let pitch = 0;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;
    const sensitivity = 0.002;
    yaw += e.movementX * sensitivity;
    pitch += e.movementY * sensitivity;
    // clamp pitch so you cant flip upside down
    pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
    camera.rotation.x = pitch;
    camera.rotation.y = yaw;
  });

  return camera;
};