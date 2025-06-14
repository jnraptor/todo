import { loadTodos, clearTodos } from '../utils/localStorage';
import { SupabaseService } from './supabaseService';
import { DeviceService } from './deviceService';
import { supabase } from '../config/supabase';

export class MigrationService {
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      const localTodos = loadTodos();
      if (localTodos.length === 0) return;
      
      console.log(`Migrating ${localTodos.length} todos to Supabase...`);
      
      // Create todos in Supabase
      for (const todo of localTodos) {
        const newTodo = await SupabaseService.createTodo(todo.text);
        // If todo was completed, update it
        if (todo.completed) {
          await SupabaseService.updateTodo(newTodo.id, { completed: true });
        }
      }
      
      // Clear localStorage after successful migration
      clearTodos();
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  static async migrateDeviceToUser(userId: string): Promise<void> {
    const deviceId = DeviceService.getDeviceId();
    
    // Get unmigrated todos for this device
    const { data: deviceTodos, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('device_id', deviceId)
      .is('migrated_to_user_id', null);
    
    if (fetchError) throw fetchError;
    if (!deviceTodos || deviceTodos.length === 0) {
      console.log('No device todos to migrate');
      return;
    }
    
    // Create copies for user account
    const userTodos = deviceTodos.map(todo => ({
      text: todo.text,
      completed: todo.completed,
      user_id: userId,
      original_device_id: deviceId
    }));
    
    const { error: insertError } = await supabase
      .from('todos')
      .insert(userTodos);
    
    if (insertError) throw insertError;
    
    // Mark originals as migrated (don't delete them)
    const todoIds = deviceTodos.map(t => t.id);
    const { error: updateError } = await supabase
      .from('todos')
      .update({
        migrated_to_user_id: userId,
        migration_timestamp: new Date().toISOString()
      })
      .in('id', todoIds);
    
    if (updateError) throw updateError;
    
    // Keep device ID for future use (don't clear it)
    console.log(`Migrated ${deviceTodos.length} todos to user account, device ID preserved`);
  }
}