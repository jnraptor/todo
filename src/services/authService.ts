import { supabase } from '../config/supabase';
import { AuthProvider, User } from '../types/auth';
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
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.warn('Error getting current user:', error);
        return null;
      }
      
      if (!user) return null;
      
      return this.formatUser(user);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
  
  static onAuthStateChange(callback: (user: User | null, event?: string) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session:', !!session?.user);
        
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          callback(this.formatUser(session.user), event);
        } else if (event === 'SIGNED_OUT') {
          callback(null, event);
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