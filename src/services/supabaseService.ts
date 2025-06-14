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
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase.from('todos').select('*');
    
    if (user) {
      // Authenticated: show only user todos
      query = query.eq('user_id', user.id);
    } else {
      // Anonymous: show only unmigrated device todos
      query = query
        .eq('device_id', DeviceService.getDeviceId())
        .is('migrated_to_user_id', null);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.convertToTodo);
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