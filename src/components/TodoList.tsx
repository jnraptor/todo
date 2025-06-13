import React from 'react';
import { Todo, FilterType } from '../types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  filter: FilterType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, filter, onToggle, onDelete, onEdit }) => {
  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  if (filteredTodos.length === 0) {
    return (
      <div className="empty-state">
        {filter === 'all' && todos.length === 0 
          ? "No todos yet. Add one above!" 
          : `No ${filter} todos.`}
      </div>
    );
  }

  return (
    <div className="todo-list">
      {filteredTodos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default TodoList;