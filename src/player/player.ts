import * as BABYLON from '@babylonjs/core';
import { Physics } from './physics';
import { waitForWorldThenSpawn, getRandomSpawn } from './spawn';
import { PlayerModel, CameraMode } from './playerModel';
import { FirstPersonArm } from './firstPersonArm';
import { loadDefaultSkin, loadSkinFromUsername, loadSkinFromFile, SkinData } from './skinLoader';

export class Player {
  private physics: Physics;
  private camera: BABYLON.UniversalCamera;
  private model: PlayerModel | null = null;
  private firstPersonArm: FirstPersonArm | null = null;
  private scene: BABYLON.Scene;
  private skinData: SkinData | null = null;

  constructor(
    camera: BABYLON.UniversalCamera,
    canvas: HTMLCanvasElement,
    scene: BABYLON.Scene
  ) {
    this.camera = camera;
    this.scene = scene;
    this.physics = new Physics(camera, canvas);

    this.physics.onRespawn = () => {
      this.respawn();
    };

    // load default skin then init model
    loadDefaultSkin('steve').then(skin => {
      this.skinData = skin;
      this.model = new PlayerModel(skin, scene, camera);
      this.firstPersonArm = new FirstPersonArm(skin, scene, camera);
      this.updateVisibility();
    });

    // wait for world then spawn
    waitForWorldThenSpawn((position) => {
      this.physics.setPosition(position);
    });

    // listen for F5 to update arm visibility
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyV') {
        this.updateVisibility();
      }
    });
  }

  private updateVisibility(): void {
  if (!this.model || !this.firstPersonArm) return;
  const isFirstPerson = this.model['cameraMode'] === 'first';
  this.firstPersonArm.setVisible(isFirstPerson);
}

  public respawn(): void {
    const position = getRandomSpawn();
    this.physics.setPosition(position);
  }

  public async loadSkinFromUsername(username: string): Promise<void> {
    const skin = await loadSkinFromUsername(username);
    this.skinData = skin;
    this.model?.updateSkin(skin);
    this.firstPersonArm?.updateSkin(skin);
  }

  public async loadSkinFromFile(file: File): Promise<void> {
    const skin = await loadSkinFromFile(file);
    this.skinData = skin;
    this.model?.updateSkin(skin);
    this.firstPersonArm?.updateSkin(skin);
  }

  public getPosition(): BABYLON.Vector3 {
    return this.physics.getPosition();
  }

  public getGameMode() {
    return this.physics.getGameMode();
  }

  public destroy(): void {
    this.physics.destroy();
    this.model?.dispose();
    this.firstPersonArm?.dispose();
  }
}