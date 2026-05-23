import { describe, it, expect, beforeEach } from 'vitest';
import { VersionChecker } from '@services/version/versionChecker';

describe('VersionChecker', () => {
  let checker: VersionChecker;

  beforeEach(() => {
    localStorage.clear();
    checker = new VersionChecker();
  });

  it('detects required and recommended updates through checkForUpdate', async () => {
    const required = await checker.checkForUpdate('1.0.0', '1.1.0', '1.2.0');
    expect(required.updateRequired).toBe(true);
    expect(required.updateRecommended).toBe(true);

    const recommended = await checker.checkForUpdate('1.1.0', '1.0.0', '1.2.0');
    expect(recommended.updateRequired).toBe(false);
    expect(recommended.updateRecommended).toBe(true);
  });

  it('validates semantic versions', () => {
    expect(checker.isValidVersion('1.2.3')).toBe(true);
    expect(checker.isValidVersion('v1.2.3')).toBe(false);
    expect(checker.isValidVersion('1.2')).toBe(false);
  });

  it('builds localized update messages and platform URLs', () => {
    expect(checker.getUpdateMessage('required', 'en')).toContain('required update');
    expect(checker.getUpdateMessage('recommended', 'tr')).toBeTruthy();
    expect(checker.getUpdateURL('android', 'com.example.app')).toContain('play.google.com');
    expect(checker.getUpdateURL('ios', '123')).toContain('apps.apple.com');
    expect(checker.getUpdateURL('web', 'https://example.com')).toBe('https://example.com');
  });

  it('tracks update check frequency and dialog state', () => {
    expect(checker.shouldCheckForUpdate(null, 1000)).toBe(true);
    expect(checker.shouldCheckForUpdate(Date.now(), 1000)).toBe(false);

    checker.markUpdateDialogShown('1.2.0');
    expect(checker.wasUpdateDialogShown('1.2.0')).toBe(true);
    expect(checker.shouldShowUpdateDialog('1.2.0')).toBe(false);
  });
});
