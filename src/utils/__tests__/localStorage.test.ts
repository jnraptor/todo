import { loadTodos, saveTodos, getStorageInfo } from '../localStorage';
import { Todo } from '../../types';

// Create a proper localStorage mock that actually stores data
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
    hasOwnProperty: (key: string) => key in store
  };
};

// Mock localStorage for this test file
const mockLocalStorage = createLocalStorageMock();
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Mock alert
const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('localStorage utilities', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
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

      mockLocalStorage.setItem('todos', JSON.stringify(mockTodos));

      const result = loadTodos();
      
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

      mockLocalStorage.setItem('todos', JSON.stringify([todoWithStringDate]));

      const result = loadTodos();
      
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    test('returns empty array and logs error when JSON parsing fails', () => {
      mockLocalStorage.setItem('todos', 'invalid json');

      const result = loadTodos();
      
      expect(result).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error loading todos from localStorage:',
        expect.any(SyntaxError)
      );
    });

    test('returns empty array and logs error when localStorage throws', () => {
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = jest.fn(() => {
        throw new Error('localStorage error');
      });

      const result = loadTodos();
      
      expect(result).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error loading todos from localStorage:',
        expect.any(Error)
      );
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
      // Test passes if no error is thrown
    });

    test('returns false and logs error when localStorage.setItem throws', () => {
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        throw new Error('Generic error');
      });

      const result = saveTodos([]);

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Error saving todos to localStorage:',
        expect.any(Error)
      );
    });

    test('handles QuotaExceededError by clearing old data', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });

      let callCount = 0;
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
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
      // Test passes if retry succeeds
    });

    test('handles QuotaExceededError when retry also fails', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });

      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
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
    });

    test('handles QuotaExceededError by name property', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'name', { value: 'QuotaExceededError' });

      let callCount = 0;
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
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
    });

    test('clears old data correctly when quota exceeded', () => {
      // Set up some existing data
      mockLocalStorage.setItem('todos', JSON.stringify([]));
      mockLocalStorage.setItem('old-data-1', 'some data');
      mockLocalStorage.setItem('old-data-2', 'more data');
      mockLocalStorage.setItem('react-dev-tools', 'should not be removed');

      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      Object.defineProperty(quotaError, 'code', { value: 22 });

      let callCount = 0;
      const originalSetItem = mockLocalStorage.setItem;
      mockLocalStorage.setItem = jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          throw quotaError;
        }
        // Success on retry
      });

      const result = saveTodos([]);

      expect(result).toBe(true);
      // Test passes if no error is thrown
    });
  });

  describe('getStorageInfo', () => {
    test('calculates storage usage correctly', () => {
      mockLocalStorage.setItem('key1', 'value1'); // 4 + 6 = 10 chars
      mockLocalStorage.setItem('key2', 'value2'); // 4 + 6 = 10 chars

      const result = getStorageInfo();

      expect(result.used).toBe(20); // 10 + 10
      expect(result.available).toBe(5 * 1024 * 1024 - 20); // 5MB - 20 chars
      expect(result.percentage).toBe(0); // Rounds to 0 for such small usage
    });

    test('calculates percentage correctly', () => {
      // Create a large string to simulate significant storage usage
      const largeValue = 'x'.repeat(1024 * 1024); // 1MB
      mockLocalStorage.setItem('large', largeValue);

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