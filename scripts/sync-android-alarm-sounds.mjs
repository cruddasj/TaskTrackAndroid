import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, parse } from 'node:path';

const sourceDir = join(process.cwd(), 'public', 'custom_alarm_sounds');
const destinationDir = join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'raw');
const supportedExtensions = new Set(['.mp3', '.wav', '.ogg']);

if (!existsSync(sourceDir)) {
  console.warn(`[cap:copy-alarm-sounds] Source directory not found: ${sourceDir}`);
  process.exit(0);
}

if (!existsSync(join(process.cwd(), 'android'))) {
  console.warn('[cap:copy-alarm-sounds] Android project not found. Run "npx cap add android" first.');
  process.exit(0);
}

mkdirSync(destinationDir, { recursive: true });

const audioFiles = readdirSync(sourceDir)
  .filter((fileName) => {
    const { ext } = parse(fileName);
    return supportedExtensions.has(ext.toLowerCase());
  });

if (audioFiles.length === 0) {
  console.warn(`[cap:copy-alarm-sounds] No supported sound files found in ${sourceDir}.`);
  process.exit(0);
}

for (const fileName of audioFiles) {
  cpSync(join(sourceDir, fileName), join(destinationDir, fileName));
}

console.info(`[cap:copy-alarm-sounds] Copied ${audioFiles.length} file(s) to ${destinationDir}.`);
