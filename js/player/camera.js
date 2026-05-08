const createCamera = (scene, canvas) => {
  const camera = new BABYLON.UniversalCamera(
    'camera',
    new BABYLON.Vector3(32, 12, 32),
    scene
  );

  camera.setTarget(new BABYLON.Vector3(33, 11, 33));
  camera.attachControl(canvas, true);
  camera.keysUp    = [87];
  camera.keysDown  = [83];
  camera.keysLeft  = [65];
  camera.keysRight = [68];
  camera.speed = 0.3;
  camera.angularSensibility = 800;
  camera.minZ = 0.1;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  return camera;
};