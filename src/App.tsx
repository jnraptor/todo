import React, { useState } from 'react';
import { Todo, FilterType } from './types';
import { loadTodos, saveTodos } from './utils/localStorage';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import FilterButtons from './components/FilterButtons';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    // Initialize state with data from localStorage
    return loadTodos();
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveToStorage = (newTodos: Todo[]) => {
    const success = saveTodos(newTodos);
    if (!success) {
      setSaveError('Failed to save todos. Storage may be full.');
    } else {
      setSaveError(null);
    }
  };

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      createdAt: new Date()
    };
    const newTodos = [newTodo, ...todos];
    setTodos(newTodos);
    saveToStorage(newTodos);
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newTodos);
    saveToStorage(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    saveToStorage(newTodos);
  };

  const editTodo = (id: string, newText: string) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    );
    setTodos(newTodos);
    saveToStorage(newTodos);
  };

  const todoCount = {
    all: todos.length,
    active: todos.filter(todo => !todo.completed).length,
    completed: todos.filter(todo => todo.completed).length
  };

  return (
    <div className="App">
      <div className="todo-container">
        <header className="app-header">
          <h1>Todo App</h1>
          <p>Stay organized and get things done!</p>
        </header>
        
        <main className="app-main">
          {saveError && (
            <div className="error-message">
              ⚠️ {saveError}
            </div>
          )}
          
          <TodoInput onAddTodo={addTodo} />
          
          {todos.length > 0 && (
            <FilterButtons
              currentFilter={filter}
              onFilterChange={setFilter}
              todoCount={todoCount}
            />
          )}
          
          <TodoList
            todos={todos}
            filter={filter}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
