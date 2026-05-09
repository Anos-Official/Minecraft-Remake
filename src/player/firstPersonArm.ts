import * as BABYLON from '@babylonjs/core';
import { SkinData } from './skinLoader';

const UV = {
  rightArmFront:  { x: 44, y: 20, w: 4, h: 12 },
  rightArmTop:    { x: 44, y: 16, w: 4, h: 4  },
  rightArmBottom: { x: 48, y: 16, w: 4, h: 4  },
  rightArmLeft:   { x: 40, y: 20, w: 4, h: 12 },
  rightArmRight:  { x: 48, y: 20, w: 4, h: 12 },
  rightArmBack:   { x: 52, y: 20, w: 4, h: 12 },
};

const SKIN_SIZE = 64;

const uvToAtlas = (x: number, y: number, w: number, h: number) => ({
  u0: x / SKIN_SIZE,
  v0: y / SKIN_SIZE,
  u1: (x + w) / SKIN_SIZE,
  v1: (y + h) / SKIN_SIZE,
});

export class FirstPersonArm {
  private mesh: BABYLON.Mesh;
  private mat: BABYLON.StandardMaterial;
  private scene: BABYLON.Scene;
  private camera: BABYLON.UniversalCamera;
  private swingAngle: number = 0;
  private isSwinging: boolean = false;
  private isAlex: boolean;

  constructor(
    skinData: SkinData,
    scene: BABYLON.Scene,
    camera: BABYLON.UniversalCamera
  ) {
    this.scene = scene;
    this.camera = camera;
    this.isAlex = skinData.variant === 'alex';

    this.mat = new BABYLON.StandardMaterial('firstPersonArmMat', scene);
    const tex = new BABYLON.DynamicTexture(
      'firstPersonArmTex',
      { width: 64, height: 64 },
      scene,
      false,
      BABYLON.Texture.NEAREST_NEAREST
    );
    const ctx = tex.getContext();
    ctx.drawImage(skinData.image, 0, 0);
    tex.update();
    this.mat.diffuseTexture = tex;
    this.mat.diffuseTexture.hasAlpha = true;
    this.mat.useAlphaFromDiffuseTexture = true;
    this.mat.specularColor = new BABYLON.Color3(0, 0, 0);
    this.mat.backFaceCulling = true;

    this.mesh = this.buildArm();

    // swing on left click
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.startSwing();
    });

    scene.registerBeforeRender(() => {
      this.update();
    });
  }

  private buildArm(): BABYLON.Mesh {
    const armWidth = this.isAlex ? 0.1875 : 0.25;
    const u = UV;

    const mesh = new BABYLON.Mesh('firstPersonArm', this.scene);
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];

    const faces = [
      {
        verts: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]],
        normal: [0, 0, 1],
        uv: uvToAtlas(u.rightArmFront.x, u.rightArmFront.y, u.rightArmFront.w, u.rightArmFront.h),
      },
      {
        verts: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]],
        normal: [0, 0,-1],
        uv: uvToAtlas(u.rightArmBack.x, u.rightArmBack.y, u.rightArmBack.w, u.rightArmBack.h),
      },
      {
        verts: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]],
        normal: [0, 1, 0],
        uv: uvToAtlas(u.rightArmTop.x, u.rightArmTop.y, u.rightArmTop.w, u.rightArmTop.h),
      },
      {
        verts: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]],
        normal: [0,-1, 0],
        uv: uvToAtlas(u.rightArmBottom.x, u.rightArmBottom.y, u.rightArmBottom.w, u.rightArmBottom.h),
      },
      {
        verts: [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5]],
        normal: [-1, 0, 0],
        uv: uvToAtlas(u.rightArmLeft.x, u.rightArmLeft.y, u.rightArmLeft.w, u.rightArmLeft.h),
      },
      {
        verts: [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5]],
        normal: [1, 0, 0],
        uv: uvToAtlas(u.rightArmRight.x, u.rightArmRight.y, u.rightArmRight.w, u.rightArmRight.h),
      },
    ];

    let vertCount = 0;
    faces.forEach(face => {
      face.verts.forEach(([x, y, z]) => {
        positions.push(x * armWidth, y * 0.75, z * 0.25);
        normals.push(...face.normal);
      });
      uvs.push(
        face.uv.u0, 1 - face.uv.v1,
        face.uv.u1, 1 - face.uv.v1,
        face.uv.u1, 1 - face.uv.v0,
        face.uv.u0, 1 - face.uv.v0,
      );
      indices.push(
        vertCount, vertCount + 1, vertCount + 2,
        vertCount, vertCount + 2, vertCount + 3,
      );
      vertCount += 4;
    });

    const vd = new BABYLON.VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.uvs = uvs;
    vd.normals = normals;
    vd.applyToMesh(mesh);
    mesh.material = this.mat;

    return mesh;
  }

  private startSwing(): void {
    if (this.isSwinging) return;
    this.isSwinging = true;
    this.swingAngle = 0;
  }

  private update(): void {
    // position arm in bottom right of view like Minecraft
    const forward = this.camera.getForwardRay().direction;
    const right = BABYLON.Vector3.Cross(
      forward,
      BABYLON.Vector3.Up()
    ).normalize();
    const up = BABYLON.Vector3.Cross(right, forward).normalize();

    const armOffset = right.scale(0.35)
      .add(up.scale(-0.4))
      .add(forward.scale(0.6));

    this.mesh.position = this.camera.position.add(armOffset);
    this.mesh.rotation.y = this.camera.rotation.y;
    this.mesh.rotation.x = this.camera.rotation.x;

    // swing animation
    if (this.isSwinging) {
      this.swingAngle += 0.2;
      this.mesh.rotation.x += Math.sin(this.swingAngle) * 0.8;
      if (this.swingAngle >= Math.PI) {
        this.isSwinging = false;
        this.swingAngle = 0;
      }
    }
  }

  public setVisible(visible: boolean): void {
    this.mesh.isVisible = visible;
  }

  public updateSkin(skinData: SkinData): void {
    const tex = new BABYLON.DynamicTexture(
      'firstPersonArmTex',
      { width: 64, height: 64 },
      this.scene,
      false,
      BABYLON.Texture.NEAREST_NEAREST
    );
    const ctx = tex.getContext();
    ctx.drawImage(skinData.image, 0, 0);
    tex.update();
    this.mat.diffuseTexture = tex;
    this.mat.diffuseTexture.hasAlpha = true;
  }

  public dispose(): void {
    this.mesh.dispose();
    this.mat.dispose();
  }
}