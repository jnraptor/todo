// Mock uuid before importing DeviceService
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

// Unmock DeviceService to test the real implementation
jest.unmock('../deviceService');

import { DeviceService } from '../deviceService';
import { v4 as uuidv4 } from 'uuid';

const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('DeviceService', () => {
  const DEVICE_ID_KEY = 'todo_device_id';
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    // Reset the mock to return the expected value
    mockUuidv4.mockReturnValue('mock-uuid-1234');
  });

  describe('getDeviceId', () => {
    it('should generate and store a new device ID when none exists', () => {
      const deviceId = DeviceService.getDeviceId();
      
      expect(deviceId).toBe('device_mock-uuid-1234');
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBe('device_mock-uuid-1234');
    });

    it('should return existing device ID from localStorage', () => {
      const existingId = 'device_existing-123';
      localStorage.setItem(DEVICE_ID_KEY, existingId);
      
      const deviceId = DeviceService.getDeviceId();
      
      expect(deviceId).toBe(existingId);
      // Should not generate a new UUID
      expect(require('uuid').v4).not.toHaveBeenCalled();
    });

    it('should generate device ID with correct prefix format', () => {
      const deviceId = DeviceService.getDeviceId();
      
      expect(deviceId).toMatch(/^device_/);
      expect(deviceId).toBe('device_mock-uuid-1234');
    });

    it('should persist device ID across multiple calls', () => {
      const firstCall = DeviceService.getDeviceId();
      const secondCall = DeviceService.getDeviceId();
      
      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBe('device_mock-uuid-1234');
    });
  });

  describe('clearDeviceId', () => {
    it('should remove device ID from localStorage', () => {
      // Set up initial device ID
      localStorage.setItem(DEVICE_ID_KEY, 'device_test-123');
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBe('device_test-123');
      
      DeviceService.clearDeviceId();
      
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull();
    });

    it('should not throw error when clearing non-existent device ID', () => {
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull();
      
      expect(() => DeviceService.clearDeviceId()).not.toThrow();
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull();
    });
  });

  describe('hasDeviceId', () => {
    it('should return true when device ID exists in localStorage', () => {
      localStorage.setItem(DEVICE_ID_KEY, 'device_test-123');
      
      expect(DeviceService.hasDeviceId()).toBe(true);
    });

    it('should return false when device ID does not exist in localStorage', () => {
      expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull();
      
      expect(DeviceService.hasDeviceId()).toBe(false);
    });

    it('should return false when device ID is empty string', () => {
      localStorage.setItem(DEVICE_ID_KEY, '');
      
      expect(DeviceService.hasDeviceId()).toBe(false);
    });

    it('should return false when device ID is null', () => {
      localStorage.setItem(DEVICE_ID_KEY, 'test');
      localStorage.removeItem(DEVICE_ID_KEY);
      
      expect(DeviceService.hasDeviceId()).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should maintain device ID lifecycle correctly', () => {
      // Initially no device ID
      expect(DeviceService.hasDeviceId()).toBe(false);
      
      // Generate device ID
      const deviceId = DeviceService.getDeviceId();
      expect(DeviceService.hasDeviceId()).toBe(true);
      expect(DeviceService.getDeviceId()).toBe(deviceId);
      
      // Clear device ID
      DeviceService.clearDeviceId();
      expect(DeviceService.hasDeviceId()).toBe(false);
      
      // Generate new device ID (should be different call to uuid)
      const newDeviceId = DeviceService.getDeviceId();
      expect(DeviceService.hasDeviceId()).toBe(true);
      expect(newDeviceId).toBe('device_mock-uuid-1234'); // Same mock value
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      const originalSetItem = localStorage.setItem;
      
      localStorage.getItem = jest.fn(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw error, but behavior may vary
      expect(() => DeviceService.hasDeviceId()).not.toThrow();
      
      localStorage.setItem = jest.fn(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw error during device ID generation
      expect(() => DeviceService.getDeviceId()).not.toThrow();
      
      // Restore original methods
      localStorage.getItem = originalGetItem;
      localStorage.setItem = originalSetItem;
    });
  });
});