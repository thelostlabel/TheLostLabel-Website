import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getBaseTitle, resolveImageSrc, FALLBACK_IMAGE } from '../shared.ts';

describe('Artist Shared View Lib', () => {
  describe('getBaseTitle', () => {
    test('should return empty string for null or undefined', () => {
      assert.strictEqual(getBaseTitle(null), '');
      assert.strictEqual(getBaseTitle(undefined), '');
      assert.strictEqual(getBaseTitle(''), '');
    });

    test('should remove everything after parenthesis', () => {
      assert.strictEqual(getBaseTitle('Song Name (Remix)'), 'Song Name');
    });

    test('should remove everything after dash', () => {
      assert.strictEqual(getBaseTitle('Song Name - Radio Edit'), 'Song Name');
    });

    test('should remove REMASTER tags', () => {
      assert.strictEqual(getBaseTitle('Song Name 2023 REMASTER'), 'Song Name');
      assert.strictEqual(getBaseTitle('Song Name 2021REMASTER'), 'Song Name');
    });

    test('should remove SLOWED + REVERB', () => {
      assert.strictEqual(getBaseTitle('Song Name SLOWED + REVERB'), 'Song Name');
    });

    test('should remove ULTRA SLOWED', () => {
      assert.strictEqual(getBaseTitle('Song Name ULTRA SLOWED'), 'Song Name');
    });

    test('should remove SPEED UP', () => {
      assert.strictEqual(getBaseTitle('Song Name SPEED UP'), 'Song Name');
    });

    test('should remove ACOUSTIC', () => {
      assert.strictEqual(getBaseTitle('Song Name ACOUSTIC'), 'Song Name');
    });

    test('should remove LIVE', () => {
      assert.strictEqual(getBaseTitle('Song Name LIVE'), 'Song Name');
    });

    test('should remove REMASTERED', () => {
      assert.strictEqual(getBaseTitle('Song Name REMASTERED'), 'Song Name');
    });

    test('should trim result', () => {
      assert.strictEqual(getBaseTitle('  Song Name  '), 'Song Name');
    });

    test('should handle multiple tags', () => {
      assert.strictEqual(getBaseTitle('Song Name (Remix) - 2023 REMASTER'), 'Song Name');
    });
  });

  describe('resolveImageSrc', () => {
    test('should return FALLBACK_IMAGE for non-string inputs', () => {
      assert.strictEqual(resolveImageSrc(null), FALLBACK_IMAGE);
      assert.strictEqual(resolveImageSrc(undefined), FALLBACK_IMAGE);
      assert.strictEqual(resolveImageSrc(123), FALLBACK_IMAGE);
      assert.strictEqual(resolveImageSrc({}), FALLBACK_IMAGE);
    });

    test('should return FALLBACK_IMAGE for empty strings', () => {
      assert.strictEqual(resolveImageSrc(''), FALLBACK_IMAGE);
      assert.strictEqual(resolveImageSrc('   '), FALLBACK_IMAGE);
    });

    test('should resolve private paths with releaseId', () => {
      assert.strictEqual(resolveImageSrc('private/path/to/image.jpg', '123'), '/api/files/release/123');
    });

    test('should return FALLBACK_IMAGE for private paths without releaseId', () => {
      assert.strictEqual(resolveImageSrc('private/path/to/image.jpg'), FALLBACK_IMAGE);
      assert.strictEqual(resolveImageSrc('private/path/to/image.jpg', null), FALLBACK_IMAGE);
    });

    test('should return original path for absolute paths starting with /', () => {
      assert.strictEqual(resolveImageSrc('/uploads/image.jpg'), '/uploads/image.jpg');
    });

    test('should return original URL for http/https URLs', () => {
      assert.strictEqual(resolveImageSrc('http://example.com/image.jpg'), 'http://example.com/image.jpg');
      assert.strictEqual(resolveImageSrc('https://example.com/image.jpg'), 'https://example.com/image.jpg');
    });

    test('should return FALLBACK_IMAGE for other strings', () => {
      assert.strictEqual(resolveImageSrc('some-random-string'), FALLBACK_IMAGE);
    });
  });
});
