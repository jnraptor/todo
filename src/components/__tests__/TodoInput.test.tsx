import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoInput from '../TodoInput';

describe('TodoInput Component', () => {
  const mockOnAddTodo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input field and button', () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByText('Add Todo')).toBeInTheDocument();
  });

  test('input field has autofocus', () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    expect(input).toHaveFocus();
  });

  test('calls onAddTodo when form is submitted with valid text', async () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText('Add Todo');

    await userEvent.type(input, 'New todo item');
    await userEvent.click(button);

    expect(mockOnAddTodo).toHaveBeenCalledWith('New todo item');
    expect(input).toHaveValue('');
  });

  test('calls onAddTodo when Enter key is pressed', async () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');

    await userEvent.type(input, 'New todo item{enter}');

    expect(mockOnAddTodo).toHaveBeenCalledWith('New todo item');
    expect(input).toHaveValue('');
  });

  test('trims whitespace from input', async () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');

    await userEvent.type(input, '  Spaced todo  ');
    fireEvent.submit(input.closest('form')!);

    expect(mockOnAddTodo).toHaveBeenCalledWith('Spaced todo');
  });

  test('does not call onAddTodo with empty or whitespace-only input', async () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText('Add Todo');

    // Test empty input
    await userEvent.click(button);
    expect(mockOnAddTodo).not.toHaveBeenCalled();

    // Test whitespace-only input
    await userEvent.type(input, '   ');
    await userEvent.click(button);
    expect(mockOnAddTodo).not.toHaveBeenCalled();

    // Input should still contain the whitespace (not cleared)
    expect(input).toHaveValue('   ');
  });

  test('clears input after successful submission', async () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');

    await userEvent.type(input, 'Test todo');
    fireEvent.submit(input.closest('form')!);

    expect(input).toHaveValue('');
  });

  test('updates input value as user types', async () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');

    await userEvent.type(input, 'Typing test');

    expect(input).toHaveValue('Typing test');
  });

  test('form has correct CSS class', () => {
    const { container } = render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const form = container.querySelector('.todo-input-form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass('todo-input-form');
  });

  test('input has correct CSS classes', () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    expect(input).toHaveClass('todo-input');
  });

  test('button has correct CSS class', () => {
    render(<TodoInput onAddTodo={mockOnAddTodo} />);
    
    const button = screen.getByText('Add Todo');
    expect(button).toHaveClass('add-button');
  });
});