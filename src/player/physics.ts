import * as BABYLON from '@babylonjs/core';
import { resolveCollision } from './collision';

// Minecraft accurate physics values
const GRAVITY = -0.08;
const JUMP_VELOCITY = 0.42;
const WALK_SPEED = 0.13;
const SPRINT_SPEED = 0.17;
const AIR_RESISTANCE = 0.98;
const GROUND_FRICTION = 0.91;
const TERMINAL_VELOCITY = -3.92;
const TICK_RATE = 20;
const TICK_INTERVAL = 1000 / TICK_RATE;

export type GameMode = 'survival' | 'creative';

interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
}

export class Physics {
  private velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
  private position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
  private onGround: boolean = false;
  private gameMode: GameMode = 'survival';
  private input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  };
  private camera: BABYLON.UniversalCamera;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private keys: Set<string> = new Set();

  constructor(camera: BABYLON.UniversalCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.position = camera.position.clone();
    this.setupInput(canvas);
    this.startTickLoop();
  }

  private setupInput(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);

      // jump
      if (e.code === 'Space') {
        if (this.gameMode === 'survival' && this.onGround) {
          this.velocity.y = JUMP_VELOCITY;
          this.onGround = false;
        }
        if (this.gameMode === 'creative') {
          this.velocity.y = WALK_SPEED * 2;
        }
      }

      // toggle creative mode
      if (e.code === 'KeyF') {
  this.gameMode = this.gameMode === 'survival' ? 'creative' : 'survival';
  // fully reset velocity on mode switch
  this.velocity = BABYLON.Vector3.Zero();
  this.onGround = false;
  console.log('Game mode:', this.gameMode);
}

      // respawn
      if (e.code === 'KeyR') {
        this.onRespawn?.();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);

      if (e.code === 'Space' && this.gameMode === 'creative') {
        this.velocity.y = 0;
      }
    });
  }

  public onRespawn: (() => void) | null = null;

  private getMovementDirection(): BABYLON.Vector3 {
    const forward = this.keys.has('KeyW');
    const backward = this.keys.has('KeyS');
    const left = this.keys.has('KeyA');
    const right = this.keys.has('KeyD');
    const sprint = this.keys.has('ShiftLeft');

    const speed = sprint ? SPRINT_SPEED : WALK_SPEED;

    // get camera yaw only (ignore pitch for movement)
    const yaw = this.camera.rotation.y;
    const dir = BABYLON.Vector3.Zero();

    if (forward) {
      dir.x += Math.sin(yaw) * speed;
      dir.z += Math.cos(yaw) * speed;
    }
    if (backward) {
      dir.x -= Math.sin(yaw) * speed;
      dir.z -= Math.cos(yaw) * speed;
    }
    if (left) {
      dir.x -= Math.cos(yaw) * speed;
      dir.z += Math.sin(yaw) * speed;
    }
    if (right) {
      dir.x += Math.cos(yaw) * speed;
      dir.z -= Math.sin(yaw) * speed;
    }

    return dir;
  }

  private tick(): void {
    console.log('pos:', this.position.y.toFixed(3), 'vel:', this.velocity.y.toFixed(3), 'onGround:', this.onGround);
    if (this.gameMode === 'creative') {
      this.tickCreative();
    } else {
      this.tickSurvival();
    }

    // sync camera to physics position
    this.camera.position.copyFrom(this.position);
  }

private tickSurvival(): void {
  const moveDir = this.getMovementDirection();

  this.velocity.x = moveDir.x;
  this.velocity.z = moveDir.z;

  // only apply gravity when airborne
  // this matches Minecraft — gravity is absorbed by ground, not applied on top of it
  if (!this.onGround) {
    this.velocity.y += GRAVITY;
    if (this.velocity.y < TERMINAL_VELOCITY) {
      this.velocity.y = TERMINAL_VELOCITY;
    }
    this.velocity.y *= AIR_RESISTANCE;
  } else {
    // still apply a tiny downward force to maintain ground contact
    // but not enough to actually move
    this.velocity.y = GRAVITY;
  }

  const result = resolveCollision(this.position, this.velocity);
  this.position = result.position;

  if (result.onGround) {
    this.onGround = true;
    this.velocity.y = 0;
  } else {
    this.onGround = false;
  }

  if (this.onGround) {
    this.velocity.x *= GROUND_FRICTION;
    this.velocity.z *= GROUND_FRICTION;
  }

  if (this.position.y < -10) {
    this.onRespawn?.();
  }
}

private tickCreative(): void {
    const moveDir = this.getMovementDirection();

    // creative fly up/down
    if (this.keys.has('Space')) {
      this.velocity.y = WALK_SPEED * 2;
    } else if (this.keys.has('ShiftLeft')) {
      this.velocity.y = -WALK_SPEED * 2;
    } else {
      this.velocity.y = 0;
    }

    this.position.x += moveDir.x;
    this.position.y += this.velocity.y;
    this.position.z += moveDir.z;
  }

  private startTickLoop(): void {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL);
  }

  public setPosition(position: BABYLON.Vector3): void {
    this.position = position.clone();
    this.velocity = BABYLON.Vector3.Zero();
    this.onGround = false;
  }

  public getPosition(): BABYLON.Vector3 {
    return this.position.clone();
  }

  public getGameMode(): GameMode {
    return this.gameMode;
  }

  public destroy(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }
}