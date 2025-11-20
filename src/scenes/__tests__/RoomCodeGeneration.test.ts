import { describe, it, expect } from 'vitest';
import { generateWordRoomCode } from '../../server/wordLists';

describe('Room Code Generation for Multiplayer', () => {
  describe('generateWordRoomCode', () => {
    it('should generate code in correct format', () => {
      const code = generateWordRoomCode();
      expect(code).toMatch(/^[a-z]+-[a-z]+$/);
    });

    it('should generate different codes', () => {
      const codes = new Set();
      for (let i = 0; i < 20; i++) {
        codes.add(generateWordRoomCode());
      }
      // Should have at least 15 unique codes out of 20
      expect(codes.size).toBeGreaterThan(15);
    });

    it('should use lowercase only', () => {
      for (let i = 0; i < 10; i++) {
        const code = generateWordRoomCode();
        expect(code).toBe(code.toLowerCase());
        expect(code).not.toMatch(/[A-Z]/);
      }
    });

    it('should be reasonable length', () => {
      const code = generateWordRoomCode();
      expect(code.length).toBeGreaterThan(5);
      expect(code.length).toBeLessThan(20);
    });

    it('should not contain invalid characters', () => {
      for (let i = 0; i < 10; i++) {
        const code = generateWordRoomCode();
        expect(code).toMatch(/^[a-z-]+$/);
      }
    });
  });
});
