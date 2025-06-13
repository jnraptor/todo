import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterButtons from '../FilterButtons';
import { FilterType } from '../../types';

describe('FilterButtons Component', () => {
  const mockOnFilterChange = jest.fn();
  
  const defaultProps = {
    currentFilter: 'all' as FilterType,
    onFilterChange: mockOnFilterChange,
    todoCount: {
      all: 5,
      active: 3,
      completed: 2
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all filter buttons with correct counts', () => {
    render(<FilterButtons {...defaultProps} />);

    expect(screen.getByText('All (5)')).toBeInTheDocument();
    expect(screen.getByText('Active (3)')).toBeInTheDocument();
    expect(screen.getByText('Completed (2)')).toBeInTheDocument();
  });

  test('shows correct active items count', () => {
    render(<FilterButtons {...defaultProps} />);

    expect(screen.getByText('3 items left')).toBeInTheDocument();
  });

  test('shows singular "item" when only one active item', () => {
    const props = {
      ...defaultProps,
      todoCount: {
        all: 1,
        active: 1,
        completed: 0
      }
    };

    render(<FilterButtons {...props} />);

    expect(screen.getByText('1 item left')).toBeInTheDocument();
  });

  test('shows plural "items" when zero active items', () => {
    const props = {
      ...defaultProps,
      todoCount: {
        all: 2,
        active: 0,
        completed: 2
      }
    };

    render(<FilterButtons {...props} />);

    expect(screen.getByText('0 items left')).toBeInTheDocument();
  });

  test('highlights current filter button', () => {
    render(<FilterButtons {...defaultProps} />);

    const allButton = screen.getByText('All (5)');
    expect(allButton).toHaveClass('active');

    const activeButton = screen.getByText('Active (3)');
    expect(activeButton).not.toHaveClass('active');

    const completedButton = screen.getByText('Completed (2)');
    expect(completedButton).not.toHaveClass('active');
  });

  test('highlights active filter button', () => {
    const props = {
      ...defaultProps,
      currentFilter: 'active' as FilterType
    };

    render(<FilterButtons {...props} />);

    const allButton = screen.getByText('All (5)');
    expect(allButton).not.toHaveClass('active');

    const activeButton = screen.getByText('Active (3)');
    expect(activeButton).toHaveClass('active');

    const completedButton = screen.getByText('Completed (2)');
    expect(completedButton).not.toHaveClass('active');
  });

  test('highlights completed filter button', () => {
    const props = {
      ...defaultProps,
      currentFilter: 'completed' as FilterType
    };

    render(<FilterButtons {...props} />);

    const allButton = screen.getByText('All (5)');
    expect(allButton).not.toHaveClass('active');

    const activeButton = screen.getByText('Active (3)');
    expect(activeButton).not.toHaveClass('active');

    const completedButton = screen.getByText('Completed (2)');
    expect(completedButton).toHaveClass('active');
  });

  test('calls onFilterChange when All button is clicked', async () => {
    render(<FilterButtons {...defaultProps} />);

    const allButton = screen.getByText('All (5)');
    await userEvent.click(allButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('all');
  });

  test('calls onFilterChange when Active button is clicked', async () => {
    render(<FilterButtons {...defaultProps} />);

    const activeButton = screen.getByText('Active (3)');
    await userEvent.click(activeButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('active');
  });

  test('calls onFilterChange when Completed button is clicked', async () => {
    render(<FilterButtons {...defaultProps} />);

    const completedButton = screen.getByText('Completed (2)');
    await userEvent.click(completedButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('completed');
  });

  test('shows completed count when there are completed todos', () => {
    render(<FilterButtons {...defaultProps} />);

    expect(screen.getByText('2 completed')).toBeInTheDocument();
  });

  test('does not show completed count when no completed todos', () => {
    const props = {
      ...defaultProps,
      todoCount: {
        all: 3,
        active: 3,
        completed: 0
      }
    };

    render(<FilterButtons {...props} />);

    expect(screen.queryByText('0 completed')).not.toBeInTheDocument();
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();
  });

  test('has correct CSS classes', () => {
    const { container } = render(<FilterButtons {...defaultProps} />);

    expect(container.querySelector('.filter-buttons')).toBeInTheDocument();
    expect(container.querySelector('.todo-count')).toBeInTheDocument();
    expect(container.querySelector('.filter-options')).toBeInTheDocument();
    expect(container.querySelector('.clear-completed')).toBeInTheDocument();

    const filterButtons = container.querySelectorAll('.filter-button');
    expect(filterButtons).toHaveLength(3);
  });

  test('updates counts correctly when props change', () => {
    const { rerender } = render(<FilterButtons {...defaultProps} />);

    expect(screen.getByText('All (5)')).toBeInTheDocument();
    expect(screen.getByText('3 items left')).toBeInTheDocument();

    const newProps = {
      ...defaultProps,
      todoCount: {
        all: 10,
        active: 7,
        completed: 3
      }
    };

    rerender(<FilterButtons {...newProps} />);

    expect(screen.getByText('All (10)')).toBeInTheDocument();
    expect(screen.getByText('Active (7)')).toBeInTheDocument();
    expect(screen.getByText('Completed (3)')).toBeInTheDocument();
    expect(screen.getByText('7 items left')).toBeInTheDocument();
    expect(screen.getByText('3 completed')).toBeInTheDocument();
  });

  test('handles zero counts correctly', () => {
    const props = {
      ...defaultProps,
      todoCount: {
        all: 0,
        active: 0,
        completed: 0
      }
    };

    render(<FilterButtons {...props} />);

    expect(screen.getByText('All (0)')).toBeInTheDocument();
    expect(screen.getByText('Active (0)')).toBeInTheDocument();
    expect(screen.getByText('Completed (0)')).toBeInTheDocument();
    expect(screen.getByText('0 items left')).toBeInTheDocument();
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();
  });

  test('all filter buttons are clickable', async () => {
    render(<FilterButtons {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    for (const button of buttons) {
      expect(button).not.toBeDisabled();
    }
  });

  test('maintains filter state correctly', async () => {
    const { rerender } = render(<FilterButtons {...defaultProps} />);

    // Initially 'all' is active
    expect(screen.getByText('All (5)')).toHaveClass('active');

    // Change to 'active' filter
    const newProps = {
      ...defaultProps,
      currentFilter: 'active' as FilterType
    };

    rerender(<FilterButtons {...newProps} />);

    expect(screen.getByText('All (5)')).not.toHaveClass('active');
    expect(screen.getByText('Active (3)')).toHaveClass('active');
  });
});