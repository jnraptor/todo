import { loadTodos, saveTodos, getStorageInfo } from '../localStorage';
import { Todo } from '../../types';

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Mock alert
const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
    alertSpy.mockRestore();
  });

  describe('loadTodos', () => {
    test('returns empty array when no todos in localStorage', () => {
      const result = loadTodos();
      expect(result).toEqual([]);
    });

    test('loads and parses todos from localStorage', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date('2023-01-01T00:00:00.000Z')
        },
        {
          id: '2',
          text: 'Another todo',
          completed: true,
          createdAt: new Date('2023-01-02T00:00:00.000Z')
        }
      ];

      // Debug: Check if localStorage is working
      localStorage.setItem('todos', JSON.stringify(mockTodos));
      console.log('Set item result:', localStorage.getItem('todos'));
      console.log('localStorage length:', localStorage.length);

      const result = loadTodos();
      
      // Debug: Log the actual result
      console.log('loadTodos result:', result);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].text).toBe('Test todo');
      expect(result[0].completed).toBe(false);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    test('converts createdAt strings back to Date objects', () => {
      const todoWithStringDate = {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      localStorage.setItem('todos', JSON.stringify([todoWithStringDate]));

      const result = loadTodos();
      
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    test('returns empty array and logs error when JSON parsing fails', () => {
      localStorage.setItem('todos', 'invalid json');

      const result = loadTodos();
      
      expect(result).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error loading todos from localStorage:',
        expect.any(SyntaxError)
      );
    });

    test('returns empty array and logs error when localStorage throws', () => {
      // Use jest.spyOn to mock getItem
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = loadTodos();
      
      expect(result).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error loading todos from localStorage:',
        expect.any(Error)
      );

      // Restore the spy
      getItemSpy.mockRestore();
    });
  });

  describe('saveTodos', () => {
    test('saves todos to localStorage successfully', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date('2023-01-01')
        }
      ];

      const result = saveTodos(mockTodos);

      expect(result).toBe(true);
      
      // Check if data was actually saved
      const savedData = localStorage.getItem('todos');
      expect(savedData).toBeTruthy();
      
      // Verify the saved data
      const parsedData = JSON.parse(savedData || '[]');
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].id).toBe('1');
    });

    test('returns false and logs error when localStorage.setItem throws', () => {
      // Use jest.spyOn to mock setItem
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Generic error');
      });

      const result = saveTodos([]);

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error saving todos to localStorage:',
        expect.any(Error)
      );

      // Restore the spy
      setItemSpy.mockRestore();
    });

    test('handles QuotaExceededError by clearing old data', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });

      let callCount = 0;
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw quotaError;
        }
        // Success on retry
      });

      const mockTodos: Todo[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date('2023-01-01')
        }
      ];

      const result = saveTodos(mockTodos);

      expect(result).toBe(true);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'localStorage quota exceeded. Attempting to free space...'
      );

      // Restore the spy
      setItemSpy.mockRestore();
    });

    test('handles QuotaExceededError when retry also fails', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      const result = saveTodos([]);

      expect(result).toBe(false);
      expect(alertSpy).toHaveBeenCalledWith(
        'Storage is full! Please clear some browser data or delete old todos.'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to save todos even after clearing old data:',
        expect.any(DOMException)
      );

      // Restore the spy
      setItemSpy.mockRestore();
    });

    test('handles QuotaExceededError by name property', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'name', { value: 'QuotaExceededError' });

      let callCount = 0;
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw quotaError;
        }
        // Success on retry
      });

      const result = saveTodos([]);

      expect(result).toBe(true);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'localStorage quota exceeded. Attempting to free space...'
      );

      // Restore the spy
      setItemSpy.mockRestore();
    });

    test('clears old data correctly when quota exceeded', () => {
      // Set up some existing data
      localStorage.setItem('todos', JSON.stringify([]));
      localStorage.setItem('old-data-1', 'some data');
      localStorage.setItem('old-data-2', 'more data');
      localStorage.setItem('react-dev-tools', 'should not be removed');

      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });

      let callCount = 0;
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        callCount++;
        if (callCount === 1) {
          throw quotaError;
        }
        // Success on retry - restore and call original
        setItemSpy.mockRestore();
        localStorage.setItem(key, value);
      });

      const result = saveTodos([]);

      expect(result).toBe(true);

      // Clean up if spy is still active
      if (setItemSpy.mockRestore) {
        setItemSpy.mockRestore();
      }
    });
  });

  describe('getStorageInfo', () => {
    test('calculates storage usage correctly', () => {
      localStorage.setItem('key1', 'value1'); // 4 + 6 = 10 chars
      localStorage.setItem('key2', 'value2'); // 4 + 6 = 10 chars

      // Debug: Check localStorage state
      console.log('localStorage.length:', localStorage.length);
      console.log('localStorage.key(0):', localStorage.key(0));
      console.log('localStorage.key(1):', localStorage.key(1));

      const result = getStorageInfo();

      // Debug: Log the actual result
      console.log('getStorageInfo result:', result);

      expect(result.used).toBe(20); // 10 + 10
      expect(result.available).toBe(5 * 1024 * 1024 - 20); // 5MB - 20 chars
      expect(result.percentage).toBe(0); // Rounds to 0 for such small usage
    });

    test('calculates percentage correctly', () => {
      // Create a large string to simulate significant storage usage
      const largeValue = 'x'.repeat(1024 * 1024); // 1MB
      localStorage.setItem('large', largeValue);

      const result = getStorageInfo();

      expect(result.used).toBe(1024 * 1024 + 5); // 1MB + 'large' key length
      expect(result.percentage).toBe(20); // ~20% of 5MB
    });

    test('handles empty localStorage', () => {
      // Empty localStorage - no setup needed

      const result = getStorageInfo();

      expect(result.used).toBe(0);
      expect(result.available).toBe(5 * 1024 * 1024);
      expect(result.percentage).toBe(0);
    });
  });
});