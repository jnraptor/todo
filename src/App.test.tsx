import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { SupabaseService } from './services/supabaseService';
import { AuthService } from './services/authService';

// Mock SupabaseService for these specific tests
jest.mock('./services/supabaseService', () => ({
  SupabaseService: {
    getTodos: jest.fn(() => Promise.resolve([])),
    createTodo: jest.fn((text) => {
      const mockTodo = {
        id: `test-id-${Date.now()}`,
        text,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return Promise.resolve(mockTodo);
    }),
    updateTodo: jest.fn((id, updates) => {
      const mockTodo = {
        id,
        text: updates.text || 'Test todo',
        completed: updates.completed !== undefined ? updates.completed : false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return Promise.resolve(mockTodo);
    }),
    deleteTodo: jest.fn(() => Promise.resolve()),
    subscribeToTodos: jest.fn(() => Promise.resolve(() => {})),
  }
}));

// Mock AuthService for these specific tests
jest.mock('./services/authService', () => ({
  AuthService: {
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
    signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn((callback) => {
      // Immediately call callback with no user to simulate initial state
      setTimeout(() => callback(null, 'INITIAL_SESSION'), 0);
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      };
    }),
  }
}));

const mockSupabaseService = SupabaseService as jest.Mocked<typeof SupabaseService>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseService.getTodos.mockResolvedValue([]);
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      // Immediately call callback with no user to simulate initial state
      setTimeout(() => callback(null, 'INITIAL_SESSION'), 0);
      return jest.fn(); // Return unsubscribe function
    });
  });

  test('renders todo app with header', async () => {
    render(<App />);
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Todo App')).toBeInTheDocument();
    expect(screen.getByText('Stay organized and get things done!')).toBeInTheDocument();
  });

  test('renders todo input form', async () => {
    render(<App />);
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByText('Add Todo')).toBeInTheDocument();
  });

  test('loads todos from Supabase on mount', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    expect(mockSupabaseService.getTodos).toHaveBeenCalled();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  test('adds a new todo', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    const addButton = screen.getByText('Add Todo');

    await userEvent.type(input, 'New todo item');
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('New todo item')).toBeInTheDocument();
    });
    
    expect(mockSupabaseService.createTodo).toHaveBeenCalledWith('New todo item');
  });

  test('toggles todo completion', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(mockSupabaseService.updateTodo).toHaveBeenCalledWith('1', { completed: true });
    });
  });

  test('deletes a todo', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Test todo')).not.toBeInTheDocument();
    });
    
    expect(mockSupabaseService.deleteTodo).toHaveBeenCalledWith('1');
  });

  test('edits a todo', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated todo');
    fireEvent.blur(editInput);

    await waitFor(() => {
      expect(mockSupabaseService.updateTodo).toHaveBeenCalledWith('1', { text: 'Updated todo' });
    });
  });

  test('shows filter buttons when todos exist', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    // Check for filter buttons with correct format (space separated)
    await waitFor(() => {
      expect(screen.getByText(/All.*\(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Active.*\(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed.*\(0\)/)).toBeInTheDocument();
    });
  });

  test('filters todos correctly', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Active todo',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      },
      {
        id: '2',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    // Wait for todos to load and filter buttons to appear
    await waitFor(() => {
      expect(screen.getByText('Active todo')).toBeInTheDocument();
      expect(screen.getByText('Completed todo')).toBeInTheDocument();
    });
    
    // Test active filter - use regex to match button text with spaces
    const activeButton = screen.getByText(/Active.*\(1\)/);
    await userEvent.click(activeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Active todo')).toBeInTheDocument();
      expect(screen.queryByText('Completed todo')).not.toBeInTheDocument();
    });

    // Test completed filter
    const completedButton = screen.getByText(/Completed.*\(1\)/);
    await userEvent.click(completedButton);
    
    await waitFor(() => {
      expect(screen.getByText('Completed todo')).toBeInTheDocument();
      expect(screen.queryByText('Active todo')).not.toBeInTheDocument();
    });

    // Test all filter
    const allButton = screen.getByText(/All.*\(2\)/);
    await userEvent.click(allButton);
    
    await waitFor(() => {
      expect(screen.getByText('Active todo')).toBeInTheDocument();
      expect(screen.getByText('Completed todo')).toBeInTheDocument();
    });
  });

  test('shows error message when save fails', async () => {
    // Mock createTodo to reject with an error
    mockSupabaseService.createTodo.mockRejectedValue(new Error('Database error'));

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'New todo');
    await userEvent.click(screen.getByText('Add Todo'));

    // Wait for error state to appear - the app shows sync status as 'error'
    await waitFor(() => {
      // Look for error status indicator instead of specific error message
      const errorStatus = screen.queryByText(/error/i) || screen.queryByText(/failed/i);
      expect(errorStatus).toBeInTheDocument();
    });
  });

  test('shows empty state when no todos', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
  });

  test('shows correct todo counts', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Active todo 1',
        completed: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      },
      {
        id: '2',
        text: 'Active todo 2',
        completed: false,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02')
      },
      {
        id: '3',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03')
      }
    ];
    mockSupabaseService.getTodos.mockResolvedValue(mockTodos);

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });
    
    // Wait for todos to load and counts to be calculated
    await waitFor(() => {
      // Check for the todo count text (may be split across elements)
      expect(screen.getByText(/2.*item.*left/)).toBeInTheDocument();
      expect(screen.getByText(/All.*\(3\)/)).toBeInTheDocument();
      expect(screen.getByText(/Active.*\(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed.*\(1\)/)).toBeInTheDocument();
    });
  });
});
