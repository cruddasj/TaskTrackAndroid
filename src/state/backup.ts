import { AppState } from '../types';
import { normalizeState } from './storage';

type BackupFormatVersion = 1;

interface PlainBackupPayload {
  format: 'tasktrack-backup';
  version: BackupFormatVersion;
  createdAt: string;
  encrypted: false;
  state: AppState;
}

interface EncryptedBackupPayload {
  format: 'tasktrack-backup';
  version: BackupFormatVersion;
  createdAt: string;
  encrypted: true;
  salt: string;
  iv: string;
  ciphertext: string;
}

type BackupPayload = PlainBackupPayload | EncryptedBackupPayload;

const FORMAT = 'tasktrack-backup';
const VERSION: BackupFormatVersion = 1;
const PBKDF2_ITERATIONS = 250000;

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const encodeText = (value: string): ArrayBuffer => {
  const encoded = encodeURIComponent(value);
  const binary = encoded.replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  return toArrayBuffer(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};

const decodeText = (value: Uint8Array): string => {
  const escaped = Array.from(value, (byte) => `%${byte.toString(16).padStart(2, '0')}`).join('');
  return decodeURIComponent(escaped);
};

const toBase64 = (bytes: Uint8Array): string => {
  if (typeof btoa !== 'function') {
    throw new Error('Base64 encoding is unavailable in this environment.');
  }
  return btoa(String.fromCharCode(...bytes));
};

const fromBase64 = (value: string): Uint8Array => {
  if (typeof atob !== 'function') {
    throw new Error('Base64 decoding is unavailable in this environment.');
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const deriveAesKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encodeText(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );
};

const isBackupPayload = (value: unknown): value is BackupPayload => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<BackupPayload>;
  if (payload.format !== FORMAT || payload.version !== VERSION || typeof payload.createdAt !== 'string') {
    return false;
  }
  if (payload.encrypted === false) {
    return typeof payload.state === 'object' && !!payload.state;
  }
  if (payload.encrypted === true) {
    return typeof payload.salt === 'string' && typeof payload.iv === 'string' && typeof payload.ciphertext === 'string';
  }
  return false;
};

export const createBackupJson = async (state: AppState, password?: string): Promise<string> => {
  const trimmedPassword = password?.trim() ?? '';
  if (!trimmedPassword) {
    const payload: PlainBackupPayload = {
      format: FORMAT,
      version: VERSION,
      createdAt: new Date().toISOString(),
      encrypted: false,
      state,
    };
    return JSON.stringify(payload, null, 2);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(trimmedPassword, salt);
  const plaintext = encodeText(JSON.stringify(state));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, plaintext);

  const payload: EncryptedBackupPayload = {
    format: FORMAT,
    version: VERSION,
    createdAt: new Date().toISOString(),
    encrypted: true,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };

  return JSON.stringify(payload, null, 2);
};

export const importBackupJson = async (rawBackupJson: string, password?: string): Promise<AppState> => {
  const parsed = JSON.parse(rawBackupJson) as unknown;
  if (!isBackupPayload(parsed)) {
    throw new Error('Backup file format is not recognized.');
  }

  if (parsed.encrypted === false) {
    return normalizeState(parsed.state);
  }

  const trimmedPassword = password?.trim() ?? '';
  if (!trimmedPassword) {
    throw new Error('This backup is encrypted. Enter the password to import it.');
  }

  try {
    const key = await deriveAesKey(trimmedPassword, fromBase64(parsed.salt));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(parsed.iv)) },
      key,
      toArrayBuffer(fromBase64(parsed.ciphertext)),
    );

    return normalizeState(JSON.parse(decodeText(new Uint8Array(decrypted))) as Partial<AppState>);
  } catch {
    throw new Error('Could not decrypt backup. Check the password and try again.');
  }
};
