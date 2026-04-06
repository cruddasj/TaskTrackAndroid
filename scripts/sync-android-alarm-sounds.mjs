import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

const sourceDir = join(process.cwd(), 'public', 'custom_alarm_sounds');
const destinationDir = join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'raw');
const drawableDir = join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'drawable');
const timerSmallIconPath = join(drawableDir, 'ic_stat_timer.xml');
const supportedExtensions = new Set(['.mp3', '.wav', '.ogg']);
const timerStatusBarIconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M15.07,1L8.93,1L8.93,3L15.07,3L15.07,1ZM11,14L13,14L13,8L11,8L11,14ZM19.03,7.39L20.45,5.97C19.67,5.06 18.74,4.28 17.69,3.69L16.66,5.42C17.53,5.94 18.32,6.6 19.03,7.39ZM12,4C7.03,4 3,8.03 3,13C3,17.97 7.02,22 12,22C16.98,22 21,17.97 21,13C21,8.03 16.97,4 12,4ZM12,20C8.13,20 5,16.87 5,13C5,9.13 8.13,6 12,6C15.87,6 19,9.13 19,13C19,16.87 15.87,20 12,20Z"/>
</vector>
`;

if (!existsSync(sourceDir)) {
  console.warn(`[cap:copy-alarm-sounds] Source directory not found: ${sourceDir}`);
  process.exit(0);
}

if (!existsSync(join(process.cwd(), 'android'))) {
  console.warn('[cap:copy-alarm-sounds] Android project not found. Run "npx cap add android" first.');
  process.exit(0);
}

mkdirSync(destinationDir, { recursive: true });
mkdirSync(drawableDir, { recursive: true });

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
writeFileSync(timerSmallIconPath, timerStatusBarIconXml, 'utf8');
console.info(`[cap:copy-alarm-sounds] Wrote Android timer status-bar icon resource: ${timerSmallIconPath}`);
