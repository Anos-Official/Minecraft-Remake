export type SkinVariant = 'steve' | 'alex';

export interface SkinData {
  image: HTMLImageElement;
  variant: SkinVariant;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

// Mojang's API to get player UUID from username
const MOJANG_API = 'https://api.mojang.com/users/profiles/minecraft';
// Mojang's session server to get skin URL from UUID
const SESSION_API = 'https://sessionserver.mojang.com/session/minecraft/profile';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load skin: ${src}`));
    img.src = src;
  });
};

const detectVariant = (img: HTMLImageElement): SkinVariant => {
  // alex skins are 64x64 with specific pixel at 54,20 being transparent
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const pixel = ctx.getImageData(54, 20, 1, 1).data;
  // if alpha is 0 at this position it's alex
  return pixel[3] === 0 ? 'alex' : 'steve';
};

const buildSkinData = (img: HTMLImageElement): SkinData => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const variant = detectVariant(img);
  return { image: img, variant, canvas, ctx };
};

export const loadSkinFromUsername = async (
  username: string
): Promise<SkinData> => {
  try {
    // step 1 get UUID
    const profileRes = await fetch(`${MOJANG_API}/${username}`);
    if (!profileRes.ok) throw new Error('Player not found');
    const profile = await profileRes.json();

    // step 2 get skin URL from UUID
    const sessionRes = await fetch(`${SESSION_API}/${profile.id}`);
    if (!sessionRes.ok) throw new Error('Could not fetch profile');
    const session = await sessionRes.json();

    // step 3 decode skin URL from base64 properties
    const textureProperty = session.properties.find(
      (p: { name: string }) => p.name === 'textures'
    );
    if (!textureProperty) throw new Error('No texture property found');

    const textures = JSON.parse(atob(textureProperty.value));
    const skinUrl = textures.textures.SKIN.url;

    // step 4 load the image
    const img = await loadImage(skinUrl);
    return buildSkinData(img);
  } catch (err) {
    console.warn('Failed to load skin from username, using default:', err);
    return loadDefaultSkin('steve');
  }
};

export const loadSkinFromFile = (file: File): Promise<SkinData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = await loadImage(e.target!.result as string);
        resolve(buildSkinData(img));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const loadDefaultSkin = async (
  variant: SkinVariant = 'steve'
): Promise<SkinData> => {
  const url = variant === 'steve'
    ? 'textures/skins/steve.png'
    : 'textures/skins/alex.png';
  const img = await loadImage(url);
  return buildSkinData(img);
};

export const getPixel = (
  skinData: SkinData,
  x: number,
  y: number
): [number, number, number, number] => {
  const data = skinData.ctx.getImageData(x, y, 1, 1).data;
  return [data[0], data[1], data[2], data[3]];
};

export const getSkinRegion = (
  skinData: SkinData,
  x: number,
  y: number,
  w: number,
  h: number
): ImageData => {
  return skinData.ctx.getImageData(x, y, w, h);
};