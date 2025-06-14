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
    console.log(`Starting migration for device ${deviceId} to user ${userId}`);
    
    // Get unmigrated todos for this device
    const { data: deviceTodos, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('device_id', deviceId)
      .is('migrated_to_user_id', null);
    
    if (fetchError) {
      console.error('Error fetching device todos for migration:', fetchError);
      throw fetchError;
    }
    
    if (!deviceTodos || deviceTodos.length === 0) {
      console.log('No device todos to migrate');
      return;
    }
    
    console.log(`Found ${deviceTodos.length} device todos to migrate:`, deviceTodos.map(t => ({ id: t.id, text: t.text })));
    
    // Create copies for user account
    const userTodos = deviceTodos.map(todo => ({
      text: todo.text,
      completed: todo.completed,
      user_id: userId,
      original_device_id: deviceId
    }));
    
    console.log('Creating user todos:', userTodos);
    const { data: insertedTodos, error: insertError } = await supabase
      .from('todos')
      .insert(userTodos)
      .select();
    
    if (insertError) {
      console.error('Error inserting user todos:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully created ${insertedTodos?.length || 0} user todos`);
    
    // Mark originals as migrated (don't delete them)
    const todoIds = deviceTodos.map(t => t.id);
    console.log('Marking original todos as migrated:', todoIds);
    
    const { error: updateError } = await supabase
      .from('todos')
      .update({
        migrated_to_user_id: userId,
        migration_timestamp: new Date().toISOString()
      })
      .in('id', todoIds);
    
    if (updateError) {
      console.error('Error marking todos as migrated:', updateError);
      throw updateError;
    }
    
    // Keep device ID for future use (don't clear it)
    console.log(`Migration completed: ${deviceTodos.length} todos migrated to user account, device ID preserved`);
  }
}