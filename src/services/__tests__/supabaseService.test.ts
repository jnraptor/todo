import { SupabaseService } from '../supabaseService';
import { supabase } from '../../config/supabase';
import { DeviceService } from '../deviceService';
import { Todo } from '../../types';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('../deviceService');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;

// Enhance the Supabase mock with missing methods
beforeAll(() => {
  (mockSupabase as any).channel = jest.fn();
  (mockSupabase as any).removeChannel = jest.fn();
});

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default environment variables
    process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
    process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
    
    // Setup default device service mock
    mockDeviceService.getDeviceId.mockReturnValue('test-device-id');
  });

  describe('getTodos', () => {
    const mockSupabaseTodos = [
      {
        id: '1',
        text: 'Test todo 1',
        completed: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        device_id: 'test-device-id',
        user_id: null
      },
      {
        id: '2',
        text: 'Test todo 2',
        completed: true,
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        device_id: 'test-device-id',
        user_id: null
      }
    ];

    const expectedTodos: Todo[] = [
      {
        id: '1',
        text: 'Test todo 1',
        completed: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      },
      {
        id: '2',
        text: 'Test todo 2',
        completed: true,
        createdAt: new Date('2023-01-02T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z')
      }
    ];

    it('should get todos for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSupabaseTodos,
          error: null
        })
      };
      
      const mockSelect = jest.fn().mockReturnValue(mockQuery);
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await SupabaseService.getTodos();

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedTodos);
    });

    it('should get todos for anonymous user (device-based)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSupabaseTodos,
          error: null
        })
      };
      
      const mockSelect = jest.fn().mockReturnValue(mockQuery);
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await SupabaseService.getTodos();

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('device_id', 'test-device-id');
      expect(mockQuery.is).toHaveBeenCalledWith('migrated_to_user_id', null);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedTodos);
    });

    it('should return empty array when no device ID available for anonymous user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });
      mockDeviceService.getDeviceId.mockReturnValue(null as any);

      // Mock the from method to return a proper query object
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await SupabaseService.getTodos();

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
    });

    it('should handle auth errors gracefully and continue with anonymous access', async () => {
      const authError = new Error('Auth error');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: authError
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSupabaseTodos,
          error: null
        })
      };
      
      const mockSelect = jest.fn().mockReturnValue(mockQuery);
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await SupabaseService.getTodos();

      expect(result).toEqual(expectedTodos);
      expect(mockQuery.eq).toHaveBeenCalledWith('device_id', 'test-device-id');
    });

    it('should throw error when database query fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const dbError = new Error('Database error');
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: dbError
        })
      };
      
      const mockSelect = jest.fn().mockReturnValue(mockQuery);
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      await expect(SupabaseService.getTodos()).rejects.toThrow('Database error');
    });

    it('should throw error when Supabase is not configured', async () => {
      delete process.env.REACT_APP_SUPABASE_URL;

      await expect(SupabaseService.getTodos()).rejects.toThrow('Supabase not configured');
    });

    it('should handle empty data response', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };
      
      const mockSelect = jest.fn().mockReturnValue(mockQuery);
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

      const result = await SupabaseService.getTodos();

      expect(result).toEqual([]);
    });
  });

  describe('createTodo', () => {
    it('should create todo for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockSupabaseTodo = {
        id: '1',
        text: 'New todo',
        completed: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        user_id: 'user-123'
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseTodo,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await SupabaseService.createTodo('New todo');

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        text: 'New todo',
        completed: false,
        user_id: 'user-123'
      });
      expect(result).toEqual({
        id: '1',
        text: 'New todo',
        completed: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should create todo for anonymous user with device ID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const mockSupabaseTodo = {
        id: '1',
        text: 'New todo',
        completed: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        device_id: 'test-device-id'
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseTodo,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await SupabaseService.createTodo('New todo');

      expect(mockQuery.insert).toHaveBeenCalledWith({
        text: 'New todo',
        completed: false,
        device_id: 'test-device-id'
      });
      expect(result).toEqual({
        id: '1',
        text: 'New todo',
        completed: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should throw error when create fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const createError = new Error('Create failed');
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: createError
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await expect(SupabaseService.createTodo('New todo')).rejects.toThrow('Create failed');
    });
  });

  describe('updateTodo', () => {
    it('should update todo text', async () => {
      const mockSupabaseTodo = {
        id: '1',
        text: 'Updated todo',
        completed: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseTodo,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await SupabaseService.updateTodo('1', { text: 'Updated todo' });

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockQuery.update).toHaveBeenCalledWith({ text: 'Updated todo' });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({
        id: '1',
        text: 'Updated todo',
        completed: false,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should update todo completion status', async () => {
      const mockSupabaseTodo = {
        id: '1',
        text: 'Test todo',
        completed: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseTodo,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await SupabaseService.updateTodo('1', { completed: true });

      expect(mockQuery.update).toHaveBeenCalledWith({ completed: true });
      expect(result.completed).toBe(true);
    });

    it('should update both text and completion status', async () => {
      const mockSupabaseTodo = {
        id: '1',
        text: 'Updated and completed',
        completed: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseTodo,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await SupabaseService.updateTodo('1', { text: 'Updated and completed', completed: true });

      expect(mockQuery.update).toHaveBeenCalledWith({
        text: 'Updated and completed',
        completed: true
      });
    });

    it('should handle undefined values in updates', async () => {
      const mockSupabaseTodo = {
        id: '1',
        text: 'Test todo',
        completed: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSupabaseTodo,
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await SupabaseService.updateTodo('1', { text: undefined, completed: false });

      expect(mockQuery.update).toHaveBeenCalledWith({ completed: false });
    });

    it('should throw error when update fails', async () => {
      const updateError = new Error('Update failed');
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: updateError
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await expect(SupabaseService.updateTodo('1', { text: 'Updated' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo successfully', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await SupabaseService.deleteTodo('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when delete fails', async () => {
      const deleteError = new Error('Delete failed');
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: deleteError
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await expect(SupabaseService.deleteTodo('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('subscribeToTodos', () => {
    it('should subscribe to todos for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockCallback = jest.fn();
      const mockChannel = {
        on: jest.fn(),
        subscribe: jest.fn()
      };
      mockChannel.on.mockReturnValue(mockChannel);
      mockChannel.subscribe.mockReturnValue(mockChannel);
      const mockRemoveChannel = jest.fn();

      (mockSupabase as any).channel.mockReturnValue(mockChannel);
      (mockSupabase as any).removeChannel = mockRemoveChannel;

      // Mock getTodos for the callback
      jest.spyOn(SupabaseService, 'getTodos').mockResolvedValue([]);

      const unsubscribe = await SupabaseService.subscribeToTodos(mockCallback);

      expect((mockSupabase as any).channel).toHaveBeenCalledWith('todos_changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: 'user_id=eq.user-123'
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Test unsubscribe function
      unsubscribe();
      expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should subscribe to todos for anonymous user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const mockCallback = jest.fn();
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
      };

      (mockSupabase as any).channel.mockReturnValue(mockChannel);

      await SupabaseService.subscribeToTodos(mockCallback);

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: 'device_id=eq.test-device-id.and.migrated_to_user_id=is.null'
        },
        expect.any(Function)
      );
    });

    it('should call callback when subscription triggers', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const mockCallback = jest.fn();
      const mockTodos = [{ id: '1', text: 'Test', completed: false, createdAt: new Date() }];
      
      let subscriptionCallback: Function;
      const mockChannel = {
        on: jest.fn().mockImplementation((event, config, callback) => {
          subscriptionCallback = callback;
          return mockChannel;
        }),
        subscribe: jest.fn()
      };

      (mockSupabase as any).channel.mockReturnValue(mockChannel);
      jest.spyOn(SupabaseService, 'getTodos').mockResolvedValue(mockTodos);

      await SupabaseService.subscribeToTodos(mockCallback);

      // Trigger the subscription callback
      await subscriptionCallback!();

      expect(mockCallback).toHaveBeenCalledWith(mockTodos);
    });
  });
});