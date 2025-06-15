import { OfflineQueueService } from '../offlineQueueService';
import { SupabaseService } from '../supabaseService';

// Mock dependencies
jest.mock('../supabaseService');

const mockSupabaseService = SupabaseService as jest.Mocked<typeof SupabaseService>;

describe('OfflineQueueService', () => {
  const QUEUE_KEY = 'todo_offline_queue';
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('addToQueue', () => {
    it('should add operation to queue with generated id and timestamp', () => {
      const operation = {
        type: 'create' as const,
        data: { text: 'New todo' }
      };

      OfflineQueueService.addToQueue(operation);

      const queueData = localStorage.getItem(QUEUE_KEY);
      expect(queueData).toBeTruthy();
      
      const queue = JSON.parse(queueData!);
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        type: 'create',
        data: { text: 'New todo' },
        retries: 0
      });
      expect(queue[0].id).toMatch(/^queue_\d+_/);
      expect(queue[0].timestamp).toBeGreaterThan(0);
    });

    it('should add multiple operations to queue', () => {
      const operation1 = {
        type: 'create' as const,
        data: { text: 'Todo 1' }
      };
      
      const operation2 = {
        type: 'update' as const,
        data: { id: '1', updates: { completed: true } }
      };

      OfflineQueueService.addToQueue(operation1);
      OfflineQueueService.addToQueue(operation2);

      const queueData = localStorage.getItem(QUEUE_KEY);
      const queue = JSON.parse(queueData!);
      
      expect(queue).toHaveLength(2);
      expect(queue[0].type).toBe('create');
      expect(queue[1].type).toBe('update');
    });

    it('should preserve existing queue when adding new operations', () => {
      // Pre-populate queue
      const existingQueue = [
        {
          id: 'existing-1',
          type: 'delete',
          data: { id: 'todo-1' },
          timestamp: Date.now() - 1000,
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));

      const newOperation = {
        type: 'create' as const,
        data: { text: 'New todo' }
      };

      OfflineQueueService.addToQueue(newOperation);

      const queueData = localStorage.getItem(QUEUE_KEY);
      const queue = JSON.parse(queueData!);
      
      expect(queue).toHaveLength(2);
      expect(queue[0]).toMatchObject(existingQueue[0]);
      expect(queue[1].type).toBe('create');
    });
  });

  describe('getQueueLength', () => {
    it('should return 0 for empty queue', () => {
      expect(OfflineQueueService.getQueueLength()).toBe(0);
    });

    it('should return correct queue length', () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'Todo 1' },
          timestamp: Date.now(),
          retries: 0
        },
        {
          id: 'op-2',
          type: 'update',
          data: { id: '1', updates: { completed: true } },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      expect(OfflineQueueService.getQueueLength()).toBe(2);
    });

    it('should throw error for corrupted queue data', () => {
      localStorage.setItem(QUEUE_KEY, 'invalid json');
      
      expect(() => OfflineQueueService.getQueueLength()).toThrow();
    });
  });

  describe('clearQueue', () => {
    it('should remove queue from localStorage', () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'Todo 1' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      OfflineQueueService.clearQueue();

      expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
    });

    it('should not throw error when clearing non-existent queue', () => {
      expect(() => OfflineQueueService.clearQueue()).not.toThrow();
    });
  });

  describe('processQueue', () => {
    it('should process create operations successfully', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'New todo' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      const mockTodo = {
        id: '1',
        text: 'New todo',
        completed: false,
        createdAt: new Date()
      };
      mockSupabaseService.createTodo.mockResolvedValue(mockTodo);

      await OfflineQueueService.processQueue();

      expect(mockSupabaseService.createTodo).toHaveBeenCalledWith('New todo');
      expect(localStorage.getItem(QUEUE_KEY)).toBe('[]');
    });

    it('should process update operations successfully', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'update',
          data: { id: 'todo-1', updates: { completed: true } },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      const mockTodo = {
        id: 'todo-1',
        text: 'Updated todo',
        completed: true,
        createdAt: new Date()
      };
      mockSupabaseService.updateTodo.mockResolvedValue(mockTodo);

      await OfflineQueueService.processQueue();

      expect(mockSupabaseService.updateTodo).toHaveBeenCalledWith('todo-1', { completed: true });
      expect(localStorage.getItem(QUEUE_KEY)).toBe('[]');
    });

    it('should process delete operations successfully', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'delete',
          data: { id: 'todo-1' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      mockSupabaseService.deleteTodo.mockResolvedValue();

      await OfflineQueueService.processQueue();

      expect(mockSupabaseService.deleteTodo).toHaveBeenCalledWith('todo-1');
      expect(localStorage.getItem(QUEUE_KEY)).toBe('[]');
    });

    it('should process multiple operations in order', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'Todo 1' },
          timestamp: Date.now() - 2000,
          retries: 0
        },
        {
          id: 'op-2',
          type: 'update',
          data: { id: 'todo-1', updates: { completed: true } },
          timestamp: Date.now() - 1000,
          retries: 0
        },
        {
          id: 'op-3',
          type: 'delete',
          data: { id: 'todo-2' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      const mockTodo = {
        id: '1',
        text: 'Todo 1',
        completed: false,
        createdAt: new Date()
      };
      mockSupabaseService.createTodo.mockResolvedValue(mockTodo);
      mockSupabaseService.updateTodo.mockResolvedValue({ ...mockTodo, completed: true });
      mockSupabaseService.deleteTodo.mockResolvedValue();

      await OfflineQueueService.processQueue();

      expect(mockSupabaseService.createTodo).toHaveBeenCalledWith('Todo 1');
      expect(mockSupabaseService.updateTodo).toHaveBeenCalledWith('todo-1', { completed: true });
      expect(mockSupabaseService.deleteTodo).toHaveBeenCalledWith('todo-2');
      expect(localStorage.getItem(QUEUE_KEY)).toBe('[]');
    });

    it('should retry failed operations up to max retries', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'Failing todo' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      mockSupabaseService.createTodo.mockRejectedValue(new Error('Network error'));

      await OfflineQueueService.processQueue();

      // Operation should be retried (retries incremented)
      const queueData = localStorage.getItem(QUEUE_KEY);
      const updatedQueue = JSON.parse(queueData!);
      
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].retries).toBe(1);
      expect(mockSupabaseService.createTodo).toHaveBeenCalledWith('Failing todo');
    });

    it('should remove operations that exceed max retries', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'Failing todo' },
          timestamp: Date.now(),
          retries: 3 // Already at max retries
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      mockSupabaseService.createTodo.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await OfflineQueueService.processQueue();

      // Operation should be removed from queue
      expect(localStorage.getItem(QUEUE_KEY)).toBe('[]');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed after 3 retries:'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should handle mixed success and failure operations', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'create',
          data: { text: 'Success todo' },
          timestamp: Date.now() - 1000,
          retries: 0
        },
        {
          id: 'op-2',
          type: 'create',
          data: { text: 'Failing todo' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      const mockTodo = {
        id: '1',
        text: 'Success todo',
        completed: false,
        createdAt: new Date()
      };

      mockSupabaseService.createTodo
        .mockResolvedValueOnce(mockTodo)
        .mockRejectedValueOnce(new Error('Network error'));

      await OfflineQueueService.processQueue();

      // Only the failed operation should remain
      const queueData = localStorage.getItem(QUEUE_KEY);
      const updatedQueue = JSON.parse(queueData!);
      
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].data.text).toBe('Failing todo');
      expect(updatedQueue[0].retries).toBe(1);
    });

    it('should handle unknown operation types', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'unknown',
          data: { text: 'Unknown operation' },
          timestamp: Date.now(),
          retries: 0
        }
      ];
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await OfflineQueueService.processQueue();

      // Operation should be retried once, then removed after max retries
      const queueData = localStorage.getItem(QUEUE_KEY);
      const updatedQueue = JSON.parse(queueData!);
      
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].retries).toBe(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process queued operation:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty queue gracefully', async () => {
      await expect(OfflineQueueService.processQueue()).resolves.not.toThrow();
      // After processing empty queue, it saves an empty array
      expect(localStorage.getItem(QUEUE_KEY)).toBe('[]');
    });

    it('should throw error for corrupted queue data during processing', async () => {
      localStorage.setItem(QUEUE_KEY, 'invalid json');

      await expect(OfflineQueueService.processQueue()).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete offline workflow', async () => {
      // Add operations while offline
      OfflineQueueService.addToQueue({
        type: 'create',
        data: { text: 'Offline todo 1' }
      });
      
      OfflineQueueService.addToQueue({
        type: 'create',
        data: { text: 'Offline todo 2' }
      });

      expect(OfflineQueueService.getQueueLength()).toBe(2);

      // Mock successful processing
      const mockTodo1 = {
        id: '1',
        text: 'Offline todo 1',
        completed: false,
        createdAt: new Date()
      };
      
      const mockTodo2 = {
        id: '2',
        text: 'Offline todo 2',
        completed: false,
        createdAt: new Date()
      };

      mockSupabaseService.createTodo
        .mockResolvedValueOnce(mockTodo1)
        .mockResolvedValueOnce(mockTodo2);

      // Process queue when back online
      await OfflineQueueService.processQueue();

      expect(OfflineQueueService.getQueueLength()).toBe(0);
      expect(mockSupabaseService.createTodo).toHaveBeenCalledTimes(2);
    });

    it('should handle queue persistence across service instances', () => {
      // Simulate first instance adding to queue
      OfflineQueueService.addToQueue({
        type: 'create',
        data: { text: 'Persistent todo' }
      });

      expect(OfflineQueueService.getQueueLength()).toBe(1);

      // Simulate second instance (e.g., after page reload)
      // Queue should still be there
      expect(OfflineQueueService.getQueueLength()).toBe(1);
    });

    it('should demonstrate localStorage dependency', () => {
      // This test demonstrates that the service depends on localStorage
      // In a real implementation, we might want to add error handling
      
      // Test that operations work with valid localStorage
      OfflineQueueService.addToQueue({
        type: 'create',
        data: { text: 'Test' }
      });
      
      expect(OfflineQueueService.getQueueLength()).toBe(1);
      
      OfflineQueueService.clearQueue();
      expect(OfflineQueueService.getQueueLength()).toBe(0);
    });
  });
});