import sharp from 'sharp';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { app } from 'electron';

const tempDirPath = path.join(app.getAppPath(), 'resources', 'temp');

async function ensureTempDirExists() {
  try {
    await fsPromises.access(tempDirPath);
  } catch (error) {
    await fsPromises.mkdir(tempDirPath, { recursive: true });
  }
}

async function applyFilter(imageDataUrl, filters) {
  const buffer = Buffer.from(imageDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const tempImagePath = path.join(tempDirPath, 'temp-image.png');

  await ensureTempDirExists();

  await fsPromises.writeFile(tempImagePath, buffer);

  const originalFileName = path.parse(tempImagePath).name;

  let image = sharp(tempImagePath);

  if (filters.brightness !== undefined) {
    image = image.modulate({ brightness: filters.brightness + 1 });
  }
  if (filters.contrast !== undefined) {
    image = image.modulate({ contrast: filters.contrast + 1 });
  }
  if (filters.saturation !== undefined) {
    image = image.modulate({ saturation: filters.saturation + 1 });
  }

  const outputImagePath = path.join(tempDirPath, `${originalFileName}-edited.png`);

  await image.toFile(outputImagePath);

  const editedImageBuffer = await fsPromises.readFile(outputImagePath);
  const editedImageDataUrl = `data:image/png;base64,${editedImageBuffer.toString('base64')}`;

  return editedImageDataUrl;
}

export { applyFilter };
