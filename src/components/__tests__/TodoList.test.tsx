import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from '../TodoList';
import { Todo, FilterType } from '../../types';

describe('TodoList Component', () => {
  const mockTodos: Todo[] = [
    {
      id: '1',
      text: 'Active todo 1',
      completed: false,
      createdAt: new Date('2023-01-01')
    },
    {
      id: '2',
      text: 'Completed todo',
      completed: true,
      createdAt: new Date('2023-01-02')
    },
    {
      id: '3',
      text: 'Active todo 2',
      completed: false,
      createdAt: new Date('2023-01-03')
    }
  ];

  const mockOnToggle = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all todos when filter is "all"', () => {
    render(
      <TodoList
        todos={mockTodos}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Active todo 1')).toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();
    expect(screen.getByText('Active todo 2')).toBeInTheDocument();
  });

  test('renders only active todos when filter is "active"', () => {
    render(
      <TodoList
        todos={mockTodos}
        filter="active"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Active todo 1')).toBeInTheDocument();
    expect(screen.getByText('Active todo 2')).toBeInTheDocument();
    expect(screen.queryByText('Completed todo')).not.toBeInTheDocument();
  });

  test('renders only completed todos when filter is "completed"', () => {
    render(
      <TodoList
        todos={mockTodos}
        filter="completed"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Completed todo')).toBeInTheDocument();
    expect(screen.queryByText('Active todo 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Active todo 2')).not.toBeInTheDocument();
  });

  test('shows empty state when no todos exist', () => {
    render(
      <TodoList
        todos={[]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
  });

  test('shows empty state for active filter when no active todos', () => {
    const completedTodos = [
      {
        id: '1',
        text: 'Completed todo',
        completed: true,
        createdAt: new Date('2023-01-01')
      }
    ];

    render(
      <TodoList
        todos={completedTodos}
        filter="active"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('No active todos.')).toBeInTheDocument();
  });

  test('shows empty state for completed filter when no completed todos', () => {
    const activeTodos = [
      {
        id: '1',
        text: 'Active todo',
        completed: false,
        createdAt: new Date('2023-01-01')
      }
    ];

    render(
      <TodoList
        todos={activeTodos}
        filter="completed"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('No completed todos.')).toBeInTheDocument();
  });

  test('passes correct props to TodoItem components', () => {
    render(
      <TodoList
        todos={[mockTodos[0]]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    // Check that TodoItem is rendered with correct todo data
    expect(screen.getByText('Active todo 1')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('calls onToggle when todo is toggled', async () => {
    render(
      <TodoList
        todos={[mockTodos[0]]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith('1');
  });

  test('calls onDelete when todo is deleted', async () => {
    render(
      <TodoList
        todos={[mockTodos[0]]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('calls onEdit when todo is edited', async () => {
    render(
      <TodoList
        todos={[mockTodos[0]]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Active todo 1');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated todo{enter}');

    expect(mockOnEdit).toHaveBeenCalledWith('1', 'Updated todo');
  });

  test('renders todos in correct order', () => {
    render(
      <TodoList
        todos={mockTodos}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const todoItems = screen.getAllByText(/todo/);
    expect(todoItems[0]).toHaveTextContent('Active todo 1');
    expect(todoItems[1]).toHaveTextContent('Completed todo');
    expect(todoItems[2]).toHaveTextContent('Active todo 2');
  });

  test('has correct CSS class', () => {
    const { container } = render(
      <TodoList
        todos={[mockTodos[0]]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const todoList = container.querySelector('.todo-list');
    expect(todoList).toBeInTheDocument();
  });

  test('empty state has correct CSS class', () => {
    const { container } = render(
      <TodoList
        todos={[]}
        filter="all"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
  });

  test('filters work correctly with mixed todo states', () => {
    const mixedTodos = [
      { id: '1', text: 'Todo 1', completed: false, createdAt: new Date() },
      { id: '2', text: 'Todo 2', completed: true, createdAt: new Date() },
      { id: '3', text: 'Todo 3', completed: false, createdAt: new Date() },
      { id: '4', text: 'Todo 4', completed: true, createdAt: new Date() }
    ];

    // Test active filter
    const { rerender } = render(
      <TodoList
        todos={mixedTodos}
        filter="active"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Todo 3')).toBeInTheDocument();
    expect(screen.queryByText('Todo 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Todo 4')).not.toBeInTheDocument();

    // Test completed filter
    rerender(
      <TodoList
        todos={mixedTodos}
        filter="completed"
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Todo 2')).toBeInTheDocument();
    expect(screen.getByText('Todo 4')).toBeInTheDocument();
    expect(screen.queryByText('Todo 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Todo 3')).not.toBeInTheDocument();
  });
});