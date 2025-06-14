export interface User {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  provider?: 'google' | 'github';
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export type AuthProvider = 'google' | 'github';