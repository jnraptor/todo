import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { loadTodos, saveTodos } from './utils/localStorage';

// Mock localStorage utilities
jest.mock('./utils/localStorage', () => ({
  loadTodos: jest.fn(),
  saveTodos: jest.fn(),
}));

const mockLoadTodos = loadTodos as jest.MockedFunction<typeof loadTodos>;
const mockSaveTodos = saveTodos as jest.MockedFunction<typeof saveTodos>;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(true);
  });

  test('renders todo app with header', () => {
    render(<App />);
    expect(screen.getByText('Todo App')).toBeInTheDocument();
    expect(screen.getByText('Stay organized and get things done!')).toBeInTheDocument();
  });

  test('renders todo input form', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByText('Add Todo')).toBeInTheDocument();
  });

  test('loads todos from localStorage on mount', () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    expect(mockLoadTodos).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });

  test('adds a new todo', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    const addButton = screen.getByText('Add Todo');

    await userEvent.type(input, 'New todo item');
    await userEvent.click(addButton);

    expect(screen.getByText('New todo item')).toBeInTheDocument();
    expect(mockSaveTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'New todo item',
          completed: false
        })
      ])
    );
  });

  test('toggles todo completion', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(mockSaveTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          completed: true
        })
      ])
    );
  });

  test('deletes a todo', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    
    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);

    expect(screen.queryByText('Test todo')).not.toBeInTheDocument();
    expect(mockSaveTodos).toHaveBeenCalledWith([]);
  });

  test('edits a todo', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    
    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated todo');
    fireEvent.blur(editInput);

    await waitFor(() => {
      expect(mockSaveTodos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            text: 'Updated todo'
          })
        ])
      );
    });
  });

  test('shows filter buttons when todos exist', () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Test todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    
    expect(screen.getByText('All (1)')).toBeInTheDocument();
    expect(screen.getByText('Active (1)')).toBeInTheDocument();
    expect(screen.getByText('Completed (0)')).toBeInTheDocument();
  });

  test('filters todos correctly', async () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Active todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      },
      {
        id: '2',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date('2023-01-02')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    
    // Test active filter
    await userEvent.click(screen.getByText('Active (1)'));
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.queryByText('Completed todo')).not.toBeInTheDocument();

    // Test completed filter
    await userEvent.click(screen.getByText('Completed (1)'));
    expect(screen.getByText('Completed todo')).toBeInTheDocument();
    expect(screen.queryByText('Active todo')).not.toBeInTheDocument();

    // Test all filter
    await userEvent.click(screen.getByText('All (2)'));
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();
  });

  test('shows error message when save fails', async () => {
    mockSaveTodos.mockReturnValue(false);

    render(<App />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'New todo');
    await userEvent.click(screen.getByText('Add Todo'));

    expect(screen.getByText('⚠️ Failed to save todos. Storage may be full.')).toBeInTheDocument();
  });

  test('shows empty state when no todos', () => {
    render(<App />);
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
  });

  test('shows correct todo counts', () => {
    const mockTodos = [
      {
        id: '1',
        text: 'Active todo 1',
        completed: false,
        createdAt: new Date('2023-01-01')
      },
      {
        id: '2',
        text: 'Active todo 2',
        completed: false,
        createdAt: new Date('2023-01-02')
      },
      {
        id: '3',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date('2023-01-03')
      }
    ];
    mockLoadTodos.mockReturnValue(mockTodos);

    render(<App />);
    
    expect(screen.getByText('2 items left')).toBeInTheDocument();
    expect(screen.getByText('All (3)')).toBeInTheDocument();
    expect(screen.getByText('Active (2)')).toBeInTheDocument();
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
  });
});
