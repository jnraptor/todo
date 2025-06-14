export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  syncStatus?: 'synced' | 'pending' | 'error';
}

export type FilterType = 'all' | 'active' | 'completed';