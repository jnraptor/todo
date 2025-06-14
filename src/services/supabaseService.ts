import { supabase } from '../config/supabase';
import { Todo } from '../types';
import { DeviceService } from './deviceService';

interface SupabaseTodo {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  device_id?: string;
  user_id?: string;
}

export class SupabaseService {
  private static convertToTodo(supabaseTodo: SupabaseTodo): Todo {
    return {
      id: supabaseTodo.id,
      text: supabaseTodo.text,
      completed: supabaseTodo.completed,
      createdAt: new Date(supabaseTodo.created_at),
      updatedAt: new Date(supabaseTodo.updated_at)
    };
  }
  
  static async getTodos(): Promise<Todo[]> {
    try {
      // Check if Supabase is properly configured
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        console.error('Supabase configuration missing. Please check your environment variables.');
        throw new Error('Supabase not configured');
      }

      console.log('Getting todos...');
      const startTime = Date.now();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('Auth error when getting todos:', authError.message);
        // Continue with anonymous access
      }
      
      let query = supabase.from('todos').select('*');
      
      if (user && !authError) {
        // Authenticated: show only user todos
        console.log(`Loading todos for authenticated user: ${user.id}`);
        query = query.eq('user_id', user.id);
      } else {
        // Anonymous: show only unmigrated device todos
        const deviceId = DeviceService.getDeviceId();
        if (!deviceId) {
          console.warn('No device ID available, returning empty todos');
          return [];
        }
        console.log(`Loading todos for device: ${deviceId}`);
        query = query
          .eq('device_id', deviceId)
          .is('migrated_to_user_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      const endTime = Date.now();
      console.log(`Todo query completed in ${endTime - startTime}ms`);
      
      if (error) {
        console.error('Database error when getting todos:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      const todos = (data || []).map(this.convertToTodo);
      console.log(`Successfully loaded ${todos.length} todos`);
      return todos;
    } catch (error) {
      console.error('Failed to get todos:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      // Re-throw to let caller handle it
      throw error;
    }
  }
  
  static async createTodo(text: string): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const todoData = {
      text,
      completed: false,
      ...(user ? { user_id: user.id } : { device_id: DeviceService.getDeviceId() })
    };
    
    const { data, error } = await supabase
      .from('todos')
      .insert(todoData)
      .select()
      .single();
    
    if (error) throw error;
    return this.convertToTodo(data);
  }
  
  static async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const updateData: any = {};
    
    if (updates.text !== undefined) {
      updateData.text = updates.text;
    }
    if (updates.completed !== undefined) {
      updateData.completed = updates.completed;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.convertToTodo(data);
  }
  
  static async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  static async subscribeToTodos(callback: (todos: Todo[]) => void): Promise<() => void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const channel = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: user
            ? `user_id=eq.${user.id}`
            : `device_id=eq.${DeviceService.getDeviceId()}.and.migrated_to_user_id=is.null`
        },
        async () => {
          const todos = await this.getTodos();
          callback(todos);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }
}