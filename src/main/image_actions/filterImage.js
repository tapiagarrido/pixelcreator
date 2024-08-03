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

}

export { applyFilter };
