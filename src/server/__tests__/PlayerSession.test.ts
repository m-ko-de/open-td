import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerSession } from '../PlayerSession';

describe('PlayerSession', () => {
  let player: PlayerSession;

  beforeEach(() => {
    player = new PlayerSession('player-123', 'TestPlayer', false);
  });

  describe('initialization', () => {
    it('should create a player with correct properties', () => {
      expect(player.id).toBe('player-123');
      expect(player.name).toBe('TestPlayer');
      expect(player.isHost).toBe(false);
      expect(player.isReady).toBe(false);
    });

    it('should create a host player when isHost is true', () => {
      const host = new PlayerSession('host-123', 'HostPlayer', true);
      expect(host.isHost).toBe(true);
      expect(host.isReady).toBe(false);
    });
  });

  describe('setReady', () => {
    it('should update ready status to true', () => {
      player.setReady(true);
      expect(player.isReady).toBe(true);
    });

    it('should update ready status to false', () => {
      player.setReady(true);
      player.setReady(false);
      expect(player.isReady).toBe(false);
    });

    it('should toggle ready status', () => {
      expect(player.isReady).toBe(false);
      player.setReady(true);
      expect(player.isReady).toBe(true);
      player.setReady(false);
      expect(player.isReady).toBe(false);
    });
  });

  describe('getData', () => {
    it('should return player data object', () => {
      const data = player.getData();
      expect(data).toEqual({
        id: 'player-123',
        name: 'TestPlayer',
        isHost: false,
        isReady: false,
      });
    });

    it('should reflect updated ready status', () => {
      player.setReady(true);
      const data = player.getData();
      expect(data.isReady).toBe(true);
    });

    it('should return correct data for host player', () => {
      const host = new PlayerSession('host-123', 'HostPlayer', true);
      const data = host.getData();
      expect(data).toEqual({
        id: 'host-123',
        name: 'HostPlayer',
        isHost: true,
        isReady: false,
      });
    });
  });
});
