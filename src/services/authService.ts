import { supabase } from '../config/supabase';
import { AuthProvider, User } from '../types/auth';
import { MigrationService } from './migrationService';
import { DeviceService } from './deviceService';
import { getRedirectUrl } from '../utils/env';

export class AuthService {
  static async signInWithProvider(provider: AuthProvider): Promise<void> {
    const redirectTo = getRedirectUrl();
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: provider === 'github' ? 'read:user user:email' : 'email profile'
      }
    });
    
    if (error) throw error;
  }
  
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any local auth state
    localStorage.removeItem('supabase.auth.token');
  }
  
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return this.formatUser(user);
  }
  
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Trigger migration when user signs in
          const deviceId = DeviceService.getDeviceId();
          if (deviceId) {
            try {
              await MigrationService.migrateDeviceToUser(session.user.id);
            } catch (error) {
              console.error('Failed to migrate device todos:', error);
            }
          }
          
          callback(this.formatUser(session.user));
        } else if (event === 'SIGNED_OUT') {
          callback(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }
  
  static async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
  
  private static formatUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      fullName: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name ||
                supabaseUser.user_metadata?.user_name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url ||
                 supabaseUser.user_metadata?.picture,
      provider: supabaseUser.app_metadata?.provider,
      createdAt: new Date(supabaseUser.created_at)
    };
  }
}