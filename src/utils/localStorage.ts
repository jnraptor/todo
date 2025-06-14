import { Todo } from '../types';

const TODOS_KEY = 'todos';

export const loadTodos = (): Todo[] => {
  try {
    const todosJson = localStorage.getItem(TODOS_KEY);
    if (!todosJson) return [];
    
    const todos = JSON.parse(todosJson);
    // Convert createdAt strings back to Date objects
    return todos.map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    }));
  } catch (error) {
    console.error('Error loading todos from localStorage:', error);
    return [];
  }
};

export const saveTodos = (todos: Todo[]): boolean => {
  try {
    const todosJson = JSON.stringify(todos);
    localStorage.setItem(TODOS_KEY, todosJson);
    return true;
  } catch (error) {
    if (error instanceof DOMException) {
      // Handle localStorage quota exceeded
      if (error.code === 22 || error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Attempting to free space...');
        
        // Try to clear old data and save again
        try {
          clearOldData();
          localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
          return true;
        } catch (retryError) {
          console.error('Failed to save todos even after clearing old data:', retryError);
          alert('Storage is full! Please clear some browser data or delete old todos.');
          return false;
        }
      }
    }
    console.error('Error saving todos to localStorage:', error);
    return false;
  }
};

// Helper function to clear old localStorage data (except todos)
const clearOldData = (): void => {
  const todosBackup = localStorage.getItem(TODOS_KEY);
  const keysToRemove: string[] = [];
  
  // Find non-essential keys to remove
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key !== TODOS_KEY && !key.startsWith('react-')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove non-essential items
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // If still not enough space, keep only the most recent todos
  if (todosBackup) {
    try {
      const todos = JSON.parse(todosBackup);
      if (Array.isArray(todos) && todos.length > 50) {
        // Keep only the 50 most recent todos
        const recentTodos = todos.slice(0, 50);
        localStorage.setItem(TODOS_KEY, JSON.stringify(recentTodos));
      }
    } catch (error) {
      console.error('Error processing todos backup:', error);
    }
  }
};

// Function to get localStorage usage info
export const getStorageInfo = (): { used: number; available: number; percentage: number } => {
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  // Most browsers have ~5-10MB localStorage limit
  const estimated = 5 * 1024 * 1024; // 5MB estimate
  return {
    used,
    available: estimated - used,
    percentage: Math.round((used / estimated) * 100)
  };
};

// Function to clear todos (used after migration)
export const clearTodos = (): void => {
localStorage.removeItem(TODOS_KEY);
};