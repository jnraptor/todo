import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { SupabaseService } from '../services/supabaseService';
import { AuthService } from '../services/authService';

// Mock SupabaseService for integration tests
jest.mock('../services/supabaseService', () => ({
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

// Mock AuthService for integration tests
jest.mock('../services/authService', () => ({
  AuthService: {
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
    signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn((callback) => {
      // Immediately call callback with no user to simulate initial state
      setTimeout(() => callback(null, 'INITIAL_SESSION'), 0);
      return jest.fn(); // Return unsubscribe function
    }),
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

const mockSupabaseService = SupabaseService as jest.Mocked<typeof SupabaseService>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('Todo App Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    mockSupabaseService.getTodos.mockResolvedValue([]);
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      // Immediately call callback with no user to simulate initial state
      setTimeout(() => callback(null, 'INITIAL_SESSION'), 0);
      return jest.fn(); // Return unsubscribe function
    });
  });

  test('complete todo workflow: add, edit, toggle, filter, delete', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    // Initially should show empty state
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();

    // Add first todo
    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'Buy groceries');
    await userEvent.click(screen.getByText('Add Todo'));

    // Verify todo was added
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('1 item left')).toBeInTheDocument();

    // Add second todo
    await userEvent.type(input, 'Walk the dog');
    await userEvent.click(screen.getByText('Add Todo'));

    // Verify second todo was added
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
    expect(screen.getByText('2 items left')).toBeInTheDocument();

    // Filter buttons should now be visible
    expect(screen.getByText('All (2)')).toBeInTheDocument();
    expect(screen.getByText('Active (2)')).toBeInTheDocument();
    expect(screen.getByText('Completed (0)')).toBeInTheDocument();

    // Complete first todo (Buy groceries)
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[1]); // Click the second checkbox (Buy groceries)

    // Verify todo was completed by checking the counts
    await waitFor(() => {
      expect(screen.getByText(/1 item left/)).toBeInTheDocument();
    });

    // Test filtering - show only active
    await userEvent.click(screen.getByText('Active (1)'));
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
    expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();

    // Test filtering - show only completed
    await userEvent.click(screen.getByText('Completed (1)'));
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument();

    // Test filtering - show all
    await userEvent.click(screen.getByText('All (2)'));
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Walk the dog')).toBeInTheDocument();

    // Edit a todo
    const editButtons = screen.getAllByText('Edit');
    await userEvent.click(editButtons[0]); // Edit "Walk the dog" (first todo)

    const editInput = screen.getByDisplayValue('Walk the dog');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Walk the cat{enter}');

    // Verify edit was saved
    expect(screen.getByText('Walk the cat')).toBeInTheDocument();
    expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument();

    // Delete a todo - delete the active one (Walk the cat)
    const deleteButtons = screen.getAllByText('Delete');
    await userEvent.click(deleteButtons[0]); // Delete "Walk the cat" (first todo, which is active)

    // Verify todo was deleted
    expect(screen.queryByText('Walk the cat')).not.toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('0 items left')).toBeInTheDocument();
    expect(screen.getByText('All (1)')).toBeInTheDocument();
    expect(screen.getByText('Active (0)')).toBeInTheDocument();
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
  });

  test('persistence: todos are saved and loaded from Supabase', async () => {
    // First render - add some todos
    const { unmount } = render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'Persistent todo');
    await userEvent.click(screen.getByText('Add Todo'));

    // Verify todo was added
    expect(screen.getByText('Persistent todo')).toBeInTheDocument();

    // Complete the todo
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    // Verify todo is completed
    expect(checkbox).toBeChecked();
    expect(screen.getByText('0 items left')).toBeInTheDocument();

    // Unmount and remount to simulate page reload
    unmount();

    // Mock SupabaseService to return our saved data
    const { SupabaseService } = require('../services/supabaseService');
    SupabaseService.getTodos.mockResolvedValue([
      {
        id: '1',
        text: 'Persistent todo',
        completed: true,
        createdAt: new Date()
      }
    ]);

    // Render again
    render(<App />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    // Verify todo was loaded from Supabase
    expect(screen.getByText('Persistent todo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByText('0 items left')).toBeInTheDocument();
  });

  test('error handling: shows error when Supabase save fails', async () => {
    // Mock SupabaseService.createTodo to throw an error
    const { SupabaseService } = require('../services/supabaseService');
    SupabaseService.createTodo.mockRejectedValue(new Error('Database error'));

    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'Test todo');
    await userEvent.click(screen.getByText('Add Todo'));

    // Wait a moment for the error to be processed
    await waitFor(() => {
      // The todo should be removed from the UI after the error
      expect(screen.queryByText('Test todo')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show empty state since todo creation failed
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
  });

  test('edge cases: empty input handling', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    const addButton = screen.getByText('Add Todo');

    // Try to add empty todo
    await userEvent.click(addButton);
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();

    // Try to add whitespace-only todo
    await userEvent.type(input, '   ');
    await userEvent.click(addButton);
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();

    // Add valid todo
    await userEvent.clear(input);
    await userEvent.type(input, 'Valid todo');
    await userEvent.click(addButton);
    expect(screen.getByText('Valid todo')).toBeInTheDocument();
  });

  test('keyboard navigation: Enter key works for adding todos', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'Keyboard todo{enter}');

    expect(screen.getByText('Keyboard todo')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('edit mode: Escape cancels edit, Enter saves edit', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    // Add a todo
    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'Original text');
    await userEvent.click(screen.getByText('Add Todo'));

    // Enter edit mode
    await userEvent.click(screen.getByText('Edit'));
    const editInput = screen.getByDisplayValue('Original text');

    // Change text and press Escape
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Changed text{escape}');

    // Should revert to original text
    expect(screen.getByText('Original text')).toBeInTheDocument();
    expect(screen.queryByText('Changed text')).not.toBeInTheDocument();

    // Enter edit mode again
    await userEvent.click(screen.getByText('Edit'));
    const editInput2 = screen.getByDisplayValue('Original text');

    // Change text and press Enter
    await userEvent.clear(editInput2);
    await userEvent.type(editInput2, 'Updated text{enter}');

    // Should save the new text
    expect(screen.getByText('Updated text')).toBeInTheDocument();
    expect(screen.queryByText('Original text')).not.toBeInTheDocument();
  });

  test('filter persistence: filter state is maintained during operations', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    // Add multiple todos
    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'First todo');
    await userEvent.click(screen.getByText('Add Todo'));

    await userEvent.type(input, 'Second todo');
    await userEvent.click(screen.getByText('Add Todo'));

    // Complete the first todo to have both active and completed todos
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[1]); // Complete first todo

    // Wait for the state to update
    await waitFor(() => {
      expect(screen.getByText('Active (1)')).toBeInTheDocument();
      expect(screen.getByText('Completed (1)')).toBeInTheDocument();
    });

    // Switch to active filter
    await userEvent.click(screen.getByText('Active (1)'));
    
    // Should only show active todos
    expect(screen.getByText('Second todo')).toBeInTheDocument();
    expect(screen.queryByText('First todo')).not.toBeInTheDocument();

    // Add a new todo while in active filter
    await userEvent.type(input, 'New active todo');
    await userEvent.click(screen.getByText('Add Todo'));

    // Should still be in active filter and show both active todos
    expect(screen.getByText('Second todo')).toBeInTheDocument();
    expect(screen.getByText('New active todo')).toBeInTheDocument();
    expect(screen.queryByText('First todo')).not.toBeInTheDocument();
  });

  test('double-click to edit functionality', async () => {
    render(<App />);

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    // Add a todo
    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'Double click me');
    await userEvent.click(screen.getByText('Add Todo'));

    // Double-click the todo text to edit
    const todoText = screen.getByText('Double click me');
    await userEvent.dblClick(todoText);

    // Should enter edit mode
    expect(screen.getByDisplayValue('Double click me')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});