import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoItem from '../TodoItem';
import { Todo } from '../../types';

describe('TodoItem Component', () => {
  const mockTodo: Todo = {
    id: '1',
    text: 'Test todo',
    completed: false,
    createdAt: new Date('2023-01-01')
  };

  const mockOnToggle = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders todo item with text', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('renders completed todo with correct styling', () => {
    const completedTodo = { ...mockTodo, completed: true };
    
    render(
      <TodoItem
        todo={completedTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const todoItem = screen.getByText('Test todo').closest('.todo-item');
    expect(todoItem).toHaveClass('completed');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('calls onToggle when checkbox is clicked', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith('1');
  });

  test('calls onDelete when delete button is clicked', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('enters edit mode when edit button is clicked', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('enters edit mode when todo text is double-clicked', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const todoText = screen.getByText('Test todo');
    await userEvent.dblClick(todoText);

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
  });

  test('saves edit when Enter key is pressed', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated todo{enter}');

    expect(mockOnEdit).toHaveBeenCalledWith('1', 'Updated todo');
    // Note: The component doesn't update the displayed text immediately in the test
    // because the parent component would normally handle the state update
  });

  test('saves edit when input loses focus', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated todo');
    fireEvent.blur(editInput);

    expect(mockOnEdit).toHaveBeenCalledWith('1', 'Updated todo');
  });

  test('cancels edit when Escape key is pressed', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Changed text{escape}');

    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  test('does not save edit if text is unchanged', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    fireEvent.blur(editInput);

    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  test('does not save edit if text is empty after trimming', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, '   ');
    fireEvent.blur(editInput);

    expect(mockOnEdit).not.toHaveBeenCalled();
  });

  test('trims whitespace when saving edit', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, '  Updated todo  ');
    fireEvent.blur(editInput);

    expect(mockOnEdit).toHaveBeenCalledWith('1', 'Updated todo');
  });

  test('edit input has autofocus', async () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test todo');
    expect(editInput).toHaveFocus();
  });

  test('todo text has correct title attribute', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const todoText = screen.getByText('Test todo');
    expect(todoText).toHaveAttribute('title', 'Double-click to edit');
  });

  test('has correct CSS classes', () => {
    render(
      <TodoItem
        todo={mockTodo}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    const todoItem = screen.getByText('Test todo').closest('.todo-item');
    expect(todoItem).toHaveClass('todo-item');
    expect(todoItem).not.toHaveClass('completed');

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('todo-checkbox');

    const todoText = screen.getByText('Test todo');
    expect(todoText).toHaveClass('todo-text');

    const editButton = screen.getByText('Edit');
    expect(editButton).toHaveClass('edit-button');

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toHaveClass('delete-button');
  });
});