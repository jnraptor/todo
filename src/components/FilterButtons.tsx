import React from 'react';
import { FilterType } from '../types';

interface FilterButtonsProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  todoCount: {
    all: number;
    active: number;
    completed: number;
  };
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ 
  currentFilter, 
  onFilterChange, 
  todoCount 
}) => {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' }
  ];

  return (
    <div className="filter-buttons">
      <div className="todo-count">
        {todoCount.active} {todoCount.active === 1 ? 'item' : 'items'} left
      </div>
      
      <div className="filter-options">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-button ${currentFilter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {label} ({todoCount[key]})
          </button>
        ))}
      </div>
      
      {todoCount.completed > 0 && (
        <div className="clear-completed">
          <span className="completed-count">
            {todoCount.completed} completed
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterButtons;