import { describe, expect, it, vi, beforeEach } from 'vitest';
import { passwordHash, verifyPassword, migratePassword } from '../utils/passwordHash.js';

describe('Password Hash Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('passwordHash', () => {
    it('generates consistent hash for same input', () => {
      const password = 'testPassword123';
      const hash1 = passwordHash(password);
      const hash2 = passwordHash(password);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(hash1.length).toBeGreaterThan(10);
    });

    it('generates different hashes for different inputs', () => {
      const hash1 = passwordHash('password1');
      const hash2 = passwordHash('password2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('handles empty string', () => {
      const hash = passwordHash('');
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('verifies correct password', () => {
      const password = 'correctPassword';
      const hash = passwordHash(password);
      
      expect(verifyPassword(password, hash)).toBe(true);
    });

    it('rejects incorrect password', () => {
      const hash = passwordHash('correctPassword');
      
      expect(verifyPassword('wrongPassword', hash)).toBe(false);
    });

    it('handles empty password verification', () => {
      const hash = passwordHash('');
      
      expect(verifyPassword('', hash)).toBe(true);
      expect(verifyPassword('notEmpty', hash)).toBe(false);
    });
  });

  describe('migratePassword', () => {
    it('migrates legacy password successfully', () => {
      const legacyUser = { name: 'testUser' };
      const password = 'testPassword';
      
      // Store legacy data
      localStorage.setItem('cardAppUser', JSON.stringify(legacyUser));
      
      const result = migratePassword(legacyUser, password);
      
      expect(result.migrated).toBe(true);
      expect(result.user.passwordHash).toBeDefined();
      expect(result.user.salt).toBeDefined();
      expect(result.user.version).toBe(1);
    });

    it('skips migration for already migrated user', () => {
      const modernUser = {
        name: 'testUser',
        passwordHash: 'existingHash',
        salt: 'existingSalt',
        version: 1
      };
      
      const result = migratePassword(modernUser, 'password');
      
      expect(result.migrated).toBe(false);
      expect(result.user).toBe(modernUser);
    });

    it('handles missing legacy data gracefully', () => {
      const user = { name: 'newUser' };
      
      const result = migratePassword(user, 'password');
      
      expect(result.migrated).toBe(true);
      expect(result.user.passwordHash).toBeDefined();
    });
  });

  describe('Integration scenarios', () => {
    it('full authentication flow with migration', () => {
      const userName = 'migrationUser';
      const password = 'userPassword123';
      
      // Step 1: Legacy user login
      const legacyUser = { name: userName };
      localStorage.setItem('cardAppUser', JSON.stringify(legacyUser));
      
      // Step 2: Migration during login
      const migrationResult = migratePassword(legacyUser, password);
      expect(migrationResult.migrated).toBe(true);
      
      const migratedUser = migrationResult.user;
      localStorage.setItem('cardAppUser', JSON.stringify(migratedUser));
      
      // Step 3: Subsequent login verification
      expect(verifyPassword(password, migratedUser.passwordHash)).toBe(true);
      expect(verifyPassword('wrongPassword', migratedUser.passwordHash)).toBe(false);
    });

    it('handles concurrent user sessions', () => {
      const user1 = { name: 'user1' };
      const user2 = { name: 'user2' };
      const password1 = 'password1';
      const password2 = 'password2';
      
      const migration1 = migratePassword(user1, password1);
      const migration2 = migratePassword(user2, password2);
      
      expect(migration1.user.passwordHash).not.toBe(migration2.user.passwordHash);
      expect(verifyPassword(password1, migration1.user.passwordHash)).toBe(true);
      expect(verifyPassword(password2, migration2.user.passwordHash)).toBe(true);
      expect(verifyPassword(password1, migration2.user.passwordHash)).toBe(false);
    });
  });
});