import { MigrationService } from '../migrationService';
import { loadTodos, clearTodos } from '../../utils/localStorage';
import { SupabaseService } from '../supabaseService';
import { DeviceService } from '../deviceService';
import { supabase } from '../../config/supabase';

// Mock dependencies
jest.mock('../../utils/localStorage');
jest.mock('../supabaseService');
jest.mock('../deviceService');
jest.mock('../../config/supabase');

// Unmock MigrationService to test the real implementation
jest.unmock('../migrationService');

const mockLoadTodos = loadTodos as jest.MockedFunction<typeof loadTodos>;
const mockClearTodos = clearTodos as jest.MockedFunction<typeof clearTodos>;
const mockSupabaseService = SupabaseService as jest.Mocked<typeof SupabaseService>;
const mockDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('MigrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default device service mock
    mockDeviceService.getDeviceId.mockReturnValue('test-device-id');
  });

  describe('migrateFromLocalStorage', () => {
    it('should migrate todos from localStorage to Supabase', async () => {
      const localTodos = [
        {
          id: '1',
          text: 'Local todo 1',
          completed: false,
          createdAt: new Date('2023-01-01')
        },
        {
          id: '2',
          text: 'Local todo 2',
          completed: true,
          createdAt: new Date('2023-01-02')
        }
      ];

      mockLoadTodos.mockReturnValue(localTodos);
      
      const createdTodo1 = {
        id: 'supabase-1',
        text: 'Local todo 1',
        completed: false,
        createdAt: new Date('2023-01-01')
      };
      
      const createdTodo2 = {
        id: 'supabase-2',
        text: 'Local todo 2',
        completed: false,
        createdAt: new Date('2023-01-02')
      };

      mockSupabaseService.createTodo
        .mockResolvedValueOnce(createdTodo1)
        .mockResolvedValueOnce(createdTodo2);
      
      mockSupabaseService.updateTodo.mockResolvedValue({
        ...createdTodo2,
        completed: true
      });

      await MigrationService.migrateFromLocalStorage();

      expect(mockLoadTodos).toHaveBeenCalled();
      expect(mockSupabaseService.createTodo).toHaveBeenCalledTimes(2);
      expect(mockSupabaseService.createTodo).toHaveBeenNthCalledWith(1, 'Local todo 1');
      expect(mockSupabaseService.createTodo).toHaveBeenNthCalledWith(2, 'Local todo 2');
      
      // Should update the completed todo
      expect(mockSupabaseService.updateTodo).toHaveBeenCalledWith('supabase-2', { completed: true });
      
      expect(mockClearTodos).toHaveBeenCalled();
    });

    it('should not migrate when no local todos exist', async () => {
      mockLoadTodos.mockReturnValue([]);

      await MigrationService.migrateFromLocalStorage();

      expect(mockLoadTodos).toHaveBeenCalled();
      expect(mockSupabaseService.createTodo).not.toHaveBeenCalled();
      expect(mockClearTodos).not.toHaveBeenCalled();
    });

    it('should handle migration errors and re-throw them', async () => {
      const localTodos = [
        {
          id: '1',
          text: 'Local todo 1',
          completed: false,
          createdAt: new Date('2023-01-01')
        }
      ];

      mockLoadTodos.mockReturnValue(localTodos);
      mockSupabaseService.createTodo.mockRejectedValue(new Error('Create failed'));

      await expect(MigrationService.migrateFromLocalStorage()).rejects.toThrow('Create failed');
      
      expect(mockLoadTodos).toHaveBeenCalled();
      expect(mockSupabaseService.createTodo).toHaveBeenCalledWith('Local todo 1');
      expect(mockClearTodos).not.toHaveBeenCalled();
    });

    it('should handle update errors during migration', async () => {
      const localTodos = [
        {
          id: '1',
          text: 'Local todo 1',
          completed: true,
          createdAt: new Date('2023-01-01')
        }
      ];

      mockLoadTodos.mockReturnValue(localTodos);
      
      const createdTodo = {
        id: 'supabase-1',
        text: 'Local todo 1',
        completed: false,
        createdAt: new Date('2023-01-01')
      };

      mockSupabaseService.createTodo.mockResolvedValue(createdTodo);
      mockSupabaseService.updateTodo.mockRejectedValue(new Error('Update failed'));

      await expect(MigrationService.migrateFromLocalStorage()).rejects.toThrow('Update failed');
      
      expect(mockSupabaseService.createTodo).toHaveBeenCalledWith('Local todo 1');
      expect(mockSupabaseService.updateTodo).toHaveBeenCalledWith('supabase-1', { completed: true });
      expect(mockClearTodos).not.toHaveBeenCalled();
    });
  });

  describe('migrateDeviceToUser', () => {
    const userId = 'user-123';

    it('should migrate device todos to user account', async () => {
      const deviceTodos = [
        {
          id: 'device-todo-1',
          text: 'Device todo 1',
          completed: false,
          device_id: 'test-device-id',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'device-todo-2',
          text: 'Device todo 2',
          completed: true,
          device_id: 'test-device-id',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z'
        }
      ];

      const insertedTodos = [
        {
          id: 'user-todo-1',
          text: 'Device todo 1',
          completed: false,
          user_id: userId,
          original_device_id: 'test-device-id'
        },
        {
          id: 'user-todo-2',
          text: 'Device todo 2',
          completed: true,
          user_id: userId,
          original_device_id: 'test-device-id'
        }
      ];

      // Mock Supabase queries
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: deviceTodos,
            error: null
          })
        })
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: insertedTodos,
          error: null
        })
      });

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          error: null
        })
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'todos') {
          return {
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate
          } as any;
        }
        return {} as any;
      });

      await MigrationService.migrateDeviceToUser(userId);

      expect(mockDeviceService.getDeviceId).toHaveBeenCalled();
      
      // Verify fetch device todos query
      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockSelect).toHaveBeenCalledWith('*');
      
      // Verify insert user todos
      expect(mockInsert).toHaveBeenCalledWith([
        {
          text: 'Device todo 1',
          completed: false,
          user_id: userId,
          original_device_id: 'test-device-id'
        },
        {
          text: 'Device todo 2',
          completed: true,
          user_id: userId,
          original_device_id: 'test-device-id'
        }
      ]);
      
      // Verify mark originals as migrated
      expect(mockUpdate).toHaveBeenCalledWith({
        migrated_to_user_id: userId,
        migration_timestamp: expect.any(String)
      });
    });

    it('should handle case when no device todos exist', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      await MigrationService.migrateDeviceToUser(userId);

      expect(mockDeviceService.getDeviceId).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      
      // Should not attempt to insert or update when no todos exist
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should handle null data response', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      await MigrationService.migrateDeviceToUser(userId);

      expect(mockDeviceService.getDeviceId).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
    });

    it('should throw error when fetching device todos fails', async () => {
      const fetchError = new Error('Fetch failed');
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: null,
            error: fetchError
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any);

      await expect(MigrationService.migrateDeviceToUser(userId)).rejects.toThrow('Fetch failed');
    });

    it('should throw error when inserting user todos fails', async () => {
      const deviceTodos = [
        {
          id: 'device-todo-1',
          text: 'Device todo 1',
          completed: false,
          device_id: 'test-device-id'
        }
      ];

      const insertError = new Error('Insert failed');

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: deviceTodos,
            error: null
          })
        })
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: insertError
        })
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'todos') {
          return {
            select: mockSelect,
            insert: mockInsert
          } as any;
        }
        return {} as any;
      });

      await expect(MigrationService.migrateDeviceToUser(userId)).rejects.toThrow('Insert failed');
    });

    it('should throw error when marking todos as migrated fails', async () => {
      const deviceTodos = [
        {
          id: 'device-todo-1',
          text: 'Device todo 1',
          completed: false,
          device_id: 'test-device-id'
        }
      ];

      const insertedTodos = [
        {
          id: 'user-todo-1',
          text: 'Device todo 1',
          completed: false,
          user_id: userId
        }
      ];

      const updateError = new Error('Update failed');

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: deviceTodos,
            error: null
          })
        })
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: insertedTodos,
          error: null
        })
      });

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          error: updateError
        })
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'todos') {
          return {
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate
          } as any;
        }
        return {} as any;
      });

      await expect(MigrationService.migrateDeviceToUser(userId)).rejects.toThrow('Update failed');
    });

    it('should log migration progress correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const deviceTodos = [
        {
          id: 'device-todo-1',
          text: 'Device todo 1',
          completed: false,
          device_id: 'test-device-id'
        }
      ];

      const insertedTodos = [
        {
          id: 'user-todo-1',
          text: 'Device todo 1',
          completed: false,
          user_id: userId
        }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: deviceTodos,
            error: null
          })
        })
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: insertedTodos,
          error: null
        })
      });

      const mockUpdate = jest.fn().mockReturnValue({
        in: jest.fn().mockResolvedValue({
          error: null
        })
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'todos') {
          return {
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate
          } as any;
        }
        return {} as any;
      });

      await MigrationService.migrateDeviceToUser(userId);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting migration for device test-device-id to user user-123')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 device todos to migrate:'),
        expect.any(Array)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully created 1 user todos')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Migration completed: 1 todos migrated to user account')
      );

      consoleSpy.mockRestore();
    });
  });
});