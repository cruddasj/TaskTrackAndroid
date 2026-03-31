import { createBackupJson, importBackupJson } from './backup';
import { seedState } from './storage';

describe('backup', () => {
  beforeAll(() => {
    const encode = (value: string): Uint8Array => Uint8Array.from(Buffer.from(value, 'utf8'));
    const decode = (value: ArrayBuffer): string => Buffer.from(new Uint8Array(value)).toString('utf8');
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (target: Uint8Array) => {
          target.forEach((_, index) => {
            target[index] = (index + 11) % 255;
          });
          return target;
        },
        subtle: {
          importKey: async (_format: string, keyData: ArrayBuffer) => ({ password: decode(keyData) }),
          deriveKey: async (_algorithm: unknown, keyMaterial: { password: string }) => ({ password: keyMaterial.password }),
          encrypt: async (_algorithm: unknown, key: { password: string }, data: ArrayBuffer) =>
            encode(`pw:${key.password}::${decode(data)}`).buffer,
          decrypt: async (_algorithm: unknown, key: { password: string }, data: ArrayBuffer) => {
            const content = decode(data);
            const prefix = `pw:${key.password}::`;
            if (!content.startsWith(prefix)) throw new Error('bad-password');
            return encode(content.slice(prefix.length)).buffer;
          },
        },
      },
      configurable: true,
    });
  });

  it('exports and imports plain JSON backups without a password', async () => {
    const backupJson = await createBackupJson(seedState);
    const parsed = JSON.parse(backupJson) as { encrypted: boolean; state?: unknown };

    expect(parsed.encrypted).toBe(false);
    expect(parsed.state).toBeTruthy();

    const imported = await importBackupJson(backupJson);
    expect(imported).toEqual(seedState);
  });

  it('exports encrypted backups when password is provided', async () => {
    const backupJson = await createBackupJson(seedState, 'secret123');
    const parsed = JSON.parse(backupJson) as { encrypted: boolean; state?: unknown; ciphertext?: string };

    expect(parsed.encrypted).toBe(true);
    expect(parsed.state).toBeUndefined();
    expect(parsed.ciphertext).toBeTruthy();

    await expect(importBackupJson(backupJson, 'secret123')).resolves.toEqual(seedState);
  });

  it('rejects encrypted backup import without matching password', async () => {
    const backupJson = await createBackupJson(seedState, 'secret123');

    await expect(importBackupJson(backupJson)).rejects.toThrow('This backup is encrypted. Enter the password to import it.');
    await expect(importBackupJson(backupJson, 'wrong-password')).rejects.toThrow('Could not decrypt backup. Check the password and try again.');
  });
});
