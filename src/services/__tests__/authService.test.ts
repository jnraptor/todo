import { AuthService } from '../authService';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase');
jest.mock('../migrationService');
jest.mock('../deviceService');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithProvider', () => {
    it('should call supabase auth with correct provider for Google', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.auth.signInWithOAuth = mockSignIn;
      
      await AuthService.signInWithProvider('google');
      
      expect(mockSignIn).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.any(String),
          scopes: 'email profile'
        })
      });
    });

    it('should call supabase auth with correct provider for GitHub', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.auth.signInWithOAuth = mockSignIn;
      
      await AuthService.signInWithProvider('github');
      
      expect(mockSignIn).toHaveBeenCalledWith({
        provider: 'github',
        options: expect.objectContaining({
          redirectTo: expect.any(String),
          scopes: 'read:user user:email'
        })
      });
    });

    it('should throw error if supabase returns error', async () => {
      const mockError = new Error('Auth failed');
      const mockSignIn = jest.fn().mockResolvedValue({ error: mockError });
      mockSupabase.auth.signInWithOAuth = mockSignIn;
      
      await expect(AuthService.signInWithProvider('google')).rejects.toThrow('Auth failed');
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      const mockSignOut = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.auth.signOut = mockSignOut;
      
      await AuthService.signOut();
      
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should throw error if supabase returns error', async () => {
      const mockError = new Error('Sign out failed');
      const mockSignOut = jest.fn().mockResolvedValue({ error: mockError });
      mockSupabase.auth.signOut = mockSignOut;
      
      await expect(AuthService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null if no user', async () => {
      const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });
      mockSupabase.auth.getUser = mockGetUser;
      
      const result = await AuthService.getCurrentUser();
      
      expect(result).toBeNull();
    });

    it('should format and return user if exists', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        app_metadata: {
          provider: 'google'
        },
        created_at: '2023-01-01T00:00:00Z'
      };
      
      const mockGetUser = jest.fn().mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.auth.getUser = mockGetUser;
      
      const result = await AuthService.getCurrentUser();
      
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        provider: 'google',
        createdAt: new Date('2023-01-01T00:00:00Z')
      });
    });
  });
});