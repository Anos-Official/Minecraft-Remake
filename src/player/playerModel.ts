import * as BABYLON from '@babylonjs/core';
import { SkinData } from './skinLoader';

export type CameraMode = 'first' | 'third_back' | 'third_front';

interface ModelPart {
  mesh: BABYLON.Mesh;
  pivot: BABYLON.TransformNode;
}

// skin UV regions for 64x64 layout
const UV = {
  head:         { x: 8,  y: 8,  w: 8, h: 8  },
  headTop:      { x: 8,  y: 0,  w: 8, h: 8  },
  headBottom:   { x: 16, y: 0,  w: 8, h: 8  },
  headLeft:     { x: 0,  y: 8,  w: 8, h: 8  },
  headRight:    { x: 16, y: 8,  w: 8, h: 8  },
  headBack:     { x: 24, y: 8,  w: 8, h: 8  },

  // hat overlay
  hatFront:     { x: 40, y: 8,  w: 8, h: 8  },
  hatTop:       { x: 40, y: 0,  w: 8, h: 8  },
  hatBottom:    { x: 48, y: 0,  w: 8, h: 8  },
  hatLeft:      { x: 32, y: 8,  w: 8, h: 8  },
  hatRight:     { x: 48, y: 8,  w: 8, h: 8  },
  hatBack:      { x: 56, y: 8,  w: 8, h: 8  },

  // body
  bodyFront:    { x: 20, y: 20, w: 8, h: 12 },
  bodyTop:      { x: 20, y: 16, w: 8, h: 4  },
  bodyBottom:   { x: 28, y: 16, w: 8, h: 4  },
  bodyLeft:     { x: 16, y: 20, w: 4, h: 12 },
  bodyRight:    { x: 28, y: 20, w: 4, h: 12 },
  bodyBack:     { x: 32, y: 20, w: 8, h: 12 },

  // right arm (steve 4px, alex 3px)
  rightArmFront:  { x: 44, y: 20, w: 4, h: 12 },
  rightArmTop:    { x: 44, y: 16, w: 4, h: 4  },
  rightArmBottom: { x: 48, y: 16, w: 4, h: 4  },
  rightArmLeft:   { x: 40, y: 20, w: 4, h: 12 },
  rightArmRight:  { x: 48, y: 20, w: 4, h: 12 },
  rightArmBack:   { x: 52, y: 20, w: 4, h: 12 },

  // left arm
  leftArmFront:   { x: 36, y: 52, w: 4, h: 12 },
  leftArmTop:     { x: 36, y: 48, w: 4, h: 4  },
  leftArmBottom:  { x: 40, y: 48, w: 4, h: 4  },
  leftArmLeft:    { x: 32, y: 52, w: 4, h: 12 },
  leftArmRight:   { x: 40, y: 52, w: 4, h: 12 },
  leftArmBack:    { x: 44, y: 52, w: 4, h: 12 },

  // right leg
  rightLegFront:  { x: 4,  y: 20, w: 4, h: 12 },
  rightLegTop:    { x: 4,  y: 16, w: 4, h: 4  },
  rightLegBottom: { x: 8,  y: 16, w: 4, h: 4  },
  rightLegLeft:   { x: 0,  y: 20, w: 4, h: 12 },
  rightLegRight:  { x: 8,  y: 20, w: 4, h: 12 },
  rightLegBack:   { x: 12, y: 20, w: 4, h: 12 },

  // left leg
  leftLegFront:   { x: 20, y: 52, w: 4, h: 12 },
  leftLegTop:     { x: 20, y: 48, w: 4, h: 4  },
  leftLegBottom:  { x: 24, y: 48, w: 4, h: 4  },
  leftLegLeft:    { x: 16, y: 52, w: 4, h: 12 },
  leftLegRight:   { x: 24, y: 52, w: 4, h: 12 },
  leftLegBack:    { x: 28, y: 52, w: 4, h: 12 },
};

const SKIN_SIZE = 64;

const uvToAtlas = (
  x: number,
  y: number,
  w: number,
  h: number
): { u0: number; v0: number; u1: number; v1: number } => ({
  u0: x / SKIN_SIZE,
  v0: y / SKIN_SIZE,
  u1: (x + w) / SKIN_SIZE,
  v1: (y + h) / SKIN_SIZE,
});

const createSkinTexture = (
  skinData: SkinData,
  scene: BABYLON.Scene
): BABYLON.DynamicTexture => {
  const tex = new BABYLON.DynamicTexture(
    'skinTexture',
    { width: 64, height: 64 },
    scene,
    false,
    BABYLON.Texture.NEAREST_NEAREST
  );
  const ctx = tex.getContext();
  ctx.drawImage(skinData.image, 0, 0);
  tex.update();
  return tex;
};

const createBoxWithUVs = (
  name: string,
  width: number,
  height: number,
  depth: number,
  uvFaces: {
    front: { u0: number; v0: number; u1: number; v1: number };
    back:  { u0: number; v0: number; u1: number; v1: number };
    top:   { u0: number; v0: number; u1: number; v1: number };
    bottom:{ u0: number; v0: number; u1: number; v1: number };
    left:  { u0: number; v0: number; u1: number; v1: number };
    right: { u0: number; v0: number; u1: number; v1: number };
  },
  scene: BABYLON.Scene
): BABYLON.Mesh => {
  const mesh = new BABYLON.Mesh(name, scene);
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const faces = [
    // front
    {
      verts: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]],
      normal: [0, 0, 1],
      uv: uvFaces.front,
    },
    // back
    {
      verts: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]],
      normal: [0, 0,-1],
      uv: uvFaces.back,
    },
    // top
    {
      verts: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]],
      normal: [0, 1, 0],
      uv: uvFaces.top,
    },
    // bottom
    {
      verts: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]],
      normal: [0,-1, 0],
      uv: uvFaces.bottom,
    },
    // left
    {
      verts: [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5]],
      normal: [-1, 0, 0],
      uv: uvFaces.left,
    },
    // right
    {
      verts: [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5]],
      normal: [1, 0, 0],
      uv: uvFaces.right,
    },
  ];

  let vertCount = 0;
  faces.forEach(face => {
    face.verts.forEach(([x, y, z]) => {
      positions.push(x * width, y * height, z * depth);
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

  return mesh;
};

export class PlayerModel {
  private root: BABYLON.TransformNode;
  private head: BABYLON.Mesh;
  private body: BABYLON.Mesh;
  private rightArm: BABYLON.Mesh;
  private leftArm: BABYLON.Mesh;
  private rightLeg: BABYLON.Mesh;
  private leftLeg: BABYLON.Mesh;
  private shadow: BABYLON.Mesh;
  private skinMat: BABYLON.StandardMaterial;
  private cameraMode: CameraMode = 'first';
  private scene: BABYLON.Scene;
  private camera: BABYLON.UniversalCamera;
  private isAlex: boolean = false;

  constructor(
    skinData: SkinData,
    scene: BABYLON.Scene,
    camera: BABYLON.UniversalCamera
  ) {
    this.scene = scene;
    this.camera = camera;
    this.isAlex = skinData.variant === 'alex';

    // create skin material
    this.skinMat = new BABYLON.StandardMaterial('skinMat', scene);
    const skinTex = createSkinTexture(skinData, scene);
    this.skinMat.diffuseTexture = skinTex;
    this.skinMat.diffuseTexture.hasAlpha = true;
    this.skinMat.useAlphaFromDiffuseTexture = true;
    this.skinMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    this.skinMat.backFaceCulling = true;

    // root node — position is feet
    this.root = new BABYLON.TransformNode('playerRoot', scene);

    const armWidth = this.isAlex ? 0.1875 : 0.25;

    // build parts
    this.head = this.buildHead();
    this.body = this.buildBody();
    this.rightArm = this.buildRightArm(armWidth);
    this.leftArm = this.buildLeftArm(armWidth);
    this.rightLeg = this.buildRightLeg();
    this.leftLeg = this.buildLeftLeg();
    this.shadow = this.buildShadow();

    // setup F5 key
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyV') {
        this.cycleCameraMode();
      }
    });

    // animate limbs
    scene.registerBeforeRender(() => {
      this.update();
    });
  }

  private buildHead(): BABYLON.Mesh {
    const u = UV;
    const mesh = createBoxWithUVs(
      'head', 0.5, 0.5, 0.5,
      {
        front:  uvToAtlas(u.head.x,       u.head.y,       u.head.w, u.head.h),
        back:   uvToAtlas(u.headBack.x,   u.headBack.y,   u.headBack.w, u.headBack.h),
        top:    uvToAtlas(u.headTop.x,    u.headTop.y,    u.headTop.w, u.headTop.h),
        bottom: uvToAtlas(u.headBottom.x, u.headBottom.y, u.headBottom.w, u.headBottom.h),
        left:   uvToAtlas(u.headLeft.x,   u.headLeft.y,   u.headLeft.w, u.headLeft.h),
        right:  uvToAtlas(u.headRight.x,  u.headRight.y,  u.headRight.w, u.headRight.h),
      },
      this.scene
    );
    mesh.material = this.skinMat;
    // head sits on top of body, centered at y=1.5 from feet
    mesh.position.y = 1.625;
    mesh.parent = this.root;
    return mesh;
  }

  private buildBody(): BABYLON.Mesh {
    const u = UV;
    const mesh = createBoxWithUVs(
      'body', 0.5, 0.75, 0.25,
      {
        front:  uvToAtlas(u.bodyFront.x,  u.bodyFront.y,  u.bodyFront.w,  u.bodyFront.h),
        back:   uvToAtlas(u.bodyBack.x,   u.bodyBack.y,   u.bodyBack.w,   u.bodyBack.h),
        top:    uvToAtlas(u.bodyTop.x,    u.bodyTop.y,    u.bodyTop.w,    u.bodyTop.h),
        bottom: uvToAtlas(u.bodyBottom.x, u.bodyBottom.y, u.bodyBottom.w, u.bodyBottom.h),
        left:   uvToAtlas(u.bodyLeft.x,   u.bodyLeft.y,   u.bodyLeft.w,   u.bodyLeft.h),
        right:  uvToAtlas(u.bodyRight.x,  u.bodyRight.y,  u.bodyRight.w,  u.bodyRight.h),
      },
      this.scene
    );
    mesh.material = this.skinMat;
    mesh.position.y = 0.9375;
    mesh.parent = this.root;
    return mesh;
  }

  private buildRightArm(armWidth: number): BABYLON.Mesh {
    const u = UV;
    const mesh = createBoxWithUVs(
      'rightArm', armWidth, 0.75, 0.25,
      {
        front:  uvToAtlas(u.rightArmFront.x,  u.rightArmFront.y,  u.rightArmFront.w,  u.rightArmFront.h),
        back:   uvToAtlas(u.rightArmBack.x,   u.rightArmBack.y,   u.rightArmBack.w,   u.rightArmBack.h),
        top:    uvToAtlas(u.rightArmTop.x,    u.rightArmTop.y,    u.rightArmTop.w,    u.rightArmTop.h),
        bottom: uvToAtlas(u.rightArmBottom.x, u.rightArmBottom.y, u.rightArmBottom.w, u.rightArmBottom.h),
        left:   uvToAtlas(u.rightArmLeft.x,   u.rightArmLeft.y,   u.rightArmLeft.w,   u.rightArmLeft.h),
        right:  uvToAtlas(u.rightArmRight.x,  u.rightArmRight.y,  u.rightArmRight.w,  u.rightArmRight.h),
      },
      this.scene
    );
    mesh.material = this.skinMat;
    mesh.position.x = -(0.25 + armWidth / 2);
    mesh.position.y = 0.9375;
    mesh.parent = this.root;
    return mesh;
  }

  private buildLeftArm(armWidth: number): BABYLON.Mesh {
    const u = UV;
    const mesh = createBoxWithUVs(
      'leftArm', armWidth, 0.75, 0.25,
      {
        front:  uvToAtlas(u.leftArmFront.x,  u.leftArmFront.y,  u.leftArmFront.w,  u.leftArmFront.h),
        back:   uvToAtlas(u.leftArmBack.x,   u.leftArmBack.y,   u.leftArmBack.w,   u.leftArmBack.h),
        top:    uvToAtlas(u.leftArmTop.x,    u.leftArmTop.y,    u.leftArmTop.w,    u.leftArmTop.h),
        bottom: uvToAtlas(u.leftArmBottom.x, u.leftArmBottom.y, u.leftArmBottom.w, u.leftArmBottom.h),
        left:   uvToAtlas(u.leftArmLeft.x,   u.leftArmLeft.y,   u.leftArmLeft.w,   u.leftArmLeft.h),
        right:  uvToAtlas(u.leftArmRight.x,  u.leftArmRight.y,  u.leftArmRight.w,  u.leftArmRight.h),
      },
      this.scene
    );
    mesh.material = this.skinMat;
    mesh.position.x = 0.25 + armWidth / 2;
    mesh.position.y = 0.9375;
    mesh.parent = this.root;
    return mesh;
  }

  private buildRightLeg(): BABYLON.Mesh {
    const u = UV;
    const mesh = createBoxWithUVs(
      'rightLeg', 0.25, 0.75, 0.25,
      {
        front:  uvToAtlas(u.rightLegFront.x,  u.rightLegFront.y,  u.rightLegFront.w,  u.rightLegFront.h),
        back:   uvToAtlas(u.rightLegBack.x,   u.rightLegBack.y,   u.rightLegBack.w,   u.rightLegBack.h),
        top:    uvToAtlas(u.rightLegTop.x,    u.rightLegTop.y,    u.rightLegTop.w,    u.rightLegTop.h),
        bottom: uvToAtlas(u.rightLegBottom.x, u.rightLegBottom.y, u.rightLegBottom.w, u.rightLegBottom.h),
        left:   uvToAtlas(u.rightLegLeft.x,   u.rightLegLeft.y,   u.rightLegLeft.w,   u.rightLegLeft.h),
        right:  uvToAtlas(u.rightLegRight.x,  u.rightLegRight.y,  u.rightLegRight.w,  u.rightLegRight.h),
      },
      this.scene
    );
    mesh.material = this.skinMat;
    mesh.position.x = -0.125;
    mesh.position.y = 0.375;
    mesh.parent = this.root;
    return mesh;
  }

  private buildLeftLeg(): BABYLON.Mesh {
    const u = UV;
    const mesh = createBoxWithUVs(
      'leftLeg', 0.25, 0.75, 0.25,
      {
        front:  uvToAtlas(u.leftLegFront.x,  u.leftLegFront.y,  u.leftLegFront.w,  u.leftLegFront.h),
        back:   uvToAtlas(u.leftLegBack.x,   u.leftLegBack.y,   u.leftLegBack.w,   u.leftLegBack.h),
        top:    uvToAtlas(u.leftLegTop.x,    u.leftLegTop.y,    u.leftLegTop.w,    u.leftLegTop.h),
        bottom: uvToAtlas(u.leftLegBottom.x, u.leftLegBottom.y, u.leftLegBottom.w, u.leftLegBottom.h),
        left:   uvToAtlas(u.leftLegLeft.x,   u.leftLegLeft.y,   u.leftLegLeft.w,   u.leftLegLeft.h),
        right:  uvToAtlas(u.leftLegRight.x,  u.leftLegRight.y,  u.leftLegRight.w,  u.leftLegRight.h),
      },
      this.scene
    );
    mesh.material = this.skinMat;
    mesh.position.x = 0.125;
    mesh.position.y = 0.375;
    mesh.parent = this.root;
    return mesh;
  }

  private buildShadow(): BABYLON.Mesh {
    const shadow = BABYLON.MeshBuilder.CreateDisc(
      'shadow',
      { radius: 0.35, tessellation: 12 },
      this.scene
    );
    shadow.rotation.x = Math.PI / 2;

    const shadowMat = new BABYLON.StandardMaterial('shadowMat', this.scene);
    shadowMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    shadowMat.alpha = 0.3;
    shadowMat.backFaceCulling = false;
    shadow.material = shadowMat;
    shadow.parent = this.root;
    shadow.position.y = 0.01;

    return shadow;
  }

  private cycleCameraMode(): void {
    if (this.cameraMode === 'first') {
      this.cameraMode = 'third_back';
    } else if (this.cameraMode === 'third_back') {
      this.cameraMode = 'third_front';
    } else {
      this.cameraMode = 'first';
    }
    this.updateCameraMode();
  }

  private updateCameraMode(): void {
    const allParts = [
      this.head, this.body,
      this.rightArm, this.leftArm,
      this.rightLeg, this.leftLeg,
    ];

    if (this.cameraMode === 'first') {
      // hide model in first person
      allParts.forEach(p => p.isVisible = false);
    } else {
      allParts.forEach(p => p.isVisible = true);
    }
  }

  private walkCycle: number = 0;

  private update(): void {
    // sync root to player feet position
    const eyePos = this.camera.position;
    this.root.position.x = eyePos.x;
    this.root.position.y = eyePos.y - 1.62;
    this.root.position.z = eyePos.z;

    // sync yaw from camera
  this.root.rotation.y = this.camera.rotation.y + Math.PI;;

    // update camera offset based on mode
    if (this.cameraMode === 'third_back') {
      const offset = new BABYLON.Vector3(0, 0.5, -3);
      const rotated = BABYLON.Vector3.TransformCoordinates(
        offset,
        BABYLON.Matrix.RotationY(this.camera.rotation.y)
      );
      this.camera.position.x = eyePos.x + rotated.x;
      this.camera.position.y = eyePos.y + rotated.y;
      this.camera.position.z = eyePos.z + rotated.z;
    } else if (this.cameraMode === 'third_front') {
      const offset = new BABYLON.Vector3(0, 0.5, 3);
      const rotated = BABYLON.Vector3.TransformCoordinates(
        offset,
        BABYLON.Matrix.RotationY(this.camera.rotation.y)
      );
      this.camera.position.x = eyePos.x + rotated.x;
      this.camera.position.y = eyePos.y + rotated.y;
      this.camera.position.z = eyePos.z + rotated.z;
    }

    // simple walk animation
    this.walkCycle += 0.1;
    const swing = Math.sin(this.walkCycle) * 0.4;
    this.rightArm.rotation.x = swing;
    this.leftArm.rotation.x = -swing;
    this.rightLeg.rotation.x = -swing;
    this.leftLeg.rotation.x = swing;
  }

  public updateSkin(skinData: SkinData): void {
    const tex = createSkinTexture(skinData, this.scene);
    this.skinMat.diffuseTexture = tex;
    this.skinMat.diffuseTexture.hasAlpha = true;
  }

  public dispose(): void {
    this.head.dispose();
    this.body.dispose();
    this.rightArm.dispose();
    this.leftArm.dispose();
    this.rightLeg.dispose();
    this.leftLeg.dispose();
    this.shadow.dispose();
    this.root.dispose();
  }
}