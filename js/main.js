const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

const createScene = () => {
  const scene = new BABYLON.Scene(engine);

  // sky
  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0);
  scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogColor = new BABYLON.Color3(0.53, 0.81, 0.98);
  scene.fogStart = 40;
  scene.fogEnd = 80;

  // camera
  createCamera(scene, canvas);

  // lighting
  const sun = new BABYLON.DirectionalLight(
    'sun',
    new BABYLON.Vector3(-1, -2, -1),
    scene
  );
  sun.intensity = 1.2;

  const ambient = new BABYLON.HemisphericLight(
    'ambient',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  ambient.intensity = 0.4;

  // materials
  const materials = createMaterials(scene);

  // generate world
  for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
    for (let cz = 0; cz < WORLD_CHUNKS_Z; cz++) {
      const blocks = generateChunk(cx, cz);
      renderChunk(cx, cz, blocks, scene, materials);
    }
  }

  return scene;
};

const scene = createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener('resize', () => {
  engine.resize();
});