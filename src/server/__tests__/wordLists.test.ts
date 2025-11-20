import { describe, it, expect } from 'vitest';
import { generateWordRoomCode } from '../wordLists';

describe('wordLists', () => {
  describe('generateWordRoomCode', () => {
    it('should generate a room code with correct format', () => {
      const code = generateWordRoomCode();
      expect(code).toMatch(/^[a-z]+-[a-z]+$/);
    });

    it('should generate codes with hyphen separator', () => {
      const code = generateWordRoomCode();
      expect(code).toContain('-');
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateWordRoomCode());
      }
      // Should generate at least 90 unique codes out of 100
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should generate codes with reasonable length', () => {
      const code = generateWordRoomCode();
      const parts = code.split('-');
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThanOrEqual(2);
      expect(parts[0].length).toBeLessThanOrEqual(10);
      expect(parts[1].length).toBeGreaterThanOrEqual(2);
      expect(parts[1].length).toBeLessThanOrEqual(10);
    });

    it('should generate lowercase codes', () => {
      const code = generateWordRoomCode();
      expect(code).toBe(code.toLowerCase());
      expect(code).not.toMatch(/[A-Z]/);
    });
  });
});
