import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Todo, FilterType } from './types';
import { User } from './types/auth';
import { SupabaseService } from './services/supabaseService';
import { AuthService } from './services/authService';
import { MigrationService } from './services/migrationService';
import { OfflineQueueService } from './services/offlineQueueService';
import { DeviceService } from './services/deviceService';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import FilterButtons from './components/FilterButtons';
import ConnectionStatus from './components/ConnectionStatus';
import AuthPrompt from './components/AuthPrompt';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import AuthCallback from './components/AuthCallback';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // Initialize auth state and app data
  useEffect(() => {
    let mounted = true;
    let authUnsubscribe: (() => void) | null = null;
    let initializationTimeout: NodeJS.Timeout;
    
    const initializeApp = async () => {
      try {
        setSyncStatus('syncing');
        
        // Set a timeout to prevent infinite loading
        initializationTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('App initialization timed out, forcing completion');
            setLoading(false);
            setSyncStatus('error');
          }
        }, 15000); // 15 second timeout for full initialization
        
        // First, initialize auth state with timeout
        const currentUser = await Promise.race([
          AuthService.getCurrentUser(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Auth initialization timeout')), 8000)
          )
        ]);
        
        if (mounted) {
          setUser(currentUser);
        }
        
        // Check for localStorage data to migrate
        await MigrationService.migrateFromLocalStorage();
        
        // Load todos from Supabase with longer timeout - only for anonymous users
        if (!currentUser) {
          try {
            const supabaseTodos = await Promise.race([
              SupabaseService.getTodos(),
              new Promise<Todo[]>((resolve, reject) =>
                setTimeout(() => {
                  console.warn('Initial todo loading timed out after 10 seconds, returning empty array');
                  resolve([]);
                }, 10000)
              )
            ]);
            
            if (mounted) {
              setTodos(supabaseTodos || []); // Ensure we always have an array
            }
          } catch (error) {
            console.error('Failed to load initial todos:', error);
            if (mounted) {
              setTodos([]); // Fallback to empty todos
            }
          }
        } else {
          // For signed-in users, start with empty todos
          if (mounted) {
            setTodos([]);
          }
        }
        
        // Subscribe to auth changes - set up after initial load to prevent duplicate calls
        authUnsubscribe = AuthService.onAuthStateChange(async (newUser, event) => {
          if (!mounted) return;
          
          // Handle migration logic for signed-in users - only during INITIAL_SESSION
          if (newUser && event === 'INITIAL_SESSION') {
            // Check if we need to migrate for this user
            const deviceId = DeviceService.getDeviceId();
            if (deviceId) {
              try {
                console.log('Starting migration for device:', deviceId, 'user:', newUser.id, 'event:', event);
                await MigrationService.migrateDeviceToUser(newUser.id);
                console.log('Migration completed successfully');
                
                // Add a small delay to ensure database consistency
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error('Failed to migrate device todos:', error);
              }
            }
          }
          
          setUser(newUser);
          
          try {
              setSyncStatus('syncing');
              const refreshedTodos = await Promise.race([
                SupabaseService.getTodos(),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Todo refresh timeout after auth change')), 8000)
                )
              ]);
              
              if (mounted) {
                setTodos(refreshedTodos);
                setSyncStatus('synced');
              }
            } catch (error) {
              console.error('Failed to refresh todos after auth change:', error);
              if (mounted) {
                setSyncStatus('error');
                // Don't clear todos on error, keep existing ones
              }
            }
        });
          
        
        // Process any offline queue
        if (navigator.onLine) {
          try {
            await OfflineQueueService.processQueue();
            if (mounted) {
              setQueueLength(OfflineQueueService.getQueueLength());
            }
          } catch (error) {
            console.error('Failed to process offline queue:', error);
          }
        }
        
        if (mounted) {
          setSyncStatus('synced');
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        if (mounted) {
          setSyncStatus('error');
          // Still show the app even if initialization failed
          setTodos([]); // Fallback to empty todos
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
      }
    };
    
    initializeApp();
    
    return () => {
      mounted = false;
      if (authUnsubscribe) {
        authUnsubscribe();
      }
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const setupSubscription = async () => {
      try {
        unsubscribe = await SupabaseService.subscribeToTodos((newTodos) => {
          setTodos(newTodos);
        });
      } catch (error) {
        console.error('Failed to set up real-time subscription:', error);
      }
    };
    
    if (!loading) {
      setupSubscription();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loading]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      try {
        await OfflineQueueService.processQueue();
        const todos = await SupabaseService.getTodos();
        setTodos(todos);
        setQueueLength(0);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Failed to sync after coming online:', error);
        setSyncStatus('error');
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('synced'); // Reset sync status when offline
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if we should show auth prompt
  useEffect(() => {
    const checkAuthPrompt = () => {
      const todoCount = todos.length;
      const deviceId = DeviceService.getDeviceId();
      const authPromptDismissed = localStorage.getItem(`authPromptDismissed_${deviceId}`);
      
      // Show prompt if: not authenticated, has 3+ todos, and hasn't been dismissed for this device
      if (todoCount >= 3 && !user && !authPromptDismissed) {
        setShowAuthPrompt(true);
      }
    };
    
    checkAuthPrompt();
  }, [todos, user]);

  const addTodo = async (text: string) => {
    try {
      if (isOnline) {
        // Create optimistic todo first for immediate UI feedback
        const tempTodo: Todo = {
          id: `temp_${Date.now()}`,
          text,
          completed: false,
          createdAt: new Date(),
          syncStatus: 'pending'
        };
        setTodos([tempTodo, ...todos]);
        
        // Then create in Supabase and replace with real todo
        const newTodo = await SupabaseService.createTodo(text);
        setTodos(prevTodos => {
          const filtered = prevTodos.filter(t => t.id !== tempTodo.id);
          const finalTodo = newTodo || tempTodo; // Fallback to temp todo if newTodo is undefined
          return [finalTodo, ...filtered];
        });
      } else {
        // Optimistic update for offline
        const tempTodo: Todo = {
          id: `temp_${Date.now()}`,
          text,
          completed: false,
          createdAt: new Date(),
          syncStatus: 'pending'
        };
        setTodos([tempTodo, ...todos]);
        OfflineQueueService.addToQueue({ type: 'create', data: { text } });
        setQueueLength(OfflineQueueService.getQueueLength());
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
      setSyncStatus('error');
      // Remove the optimistic todo on error
      setTodos(prevTodos => prevTodos.filter(t => !t.id.startsWith('temp_')));
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      
      // Always do optimistic update first for immediate UI feedback
      setTodos(todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed, syncStatus: isOnline ? 'synced' : 'pending' } : t
      ));
      
      if (isOnline && !id.startsWith('temp_')) {
        await SupabaseService.updateTodo(id, { completed: !todo.completed });
      } else if (!id.startsWith('temp_')) {
        OfflineQueueService.addToQueue({
          type: 'update',
          data: { id, updates: { completed: !todo.completed } }
        });
        setQueueLength(OfflineQueueService.getQueueLength());
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setSyncStatus('error');
      // Revert optimistic update on error
      try {
        const freshTodos = await SupabaseService.getTodos();
        setTodos(freshTodos);
      } catch (revertError) {
        console.error('Failed to revert after toggle error:', revertError);
      }
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      // Always do optimistic update first for immediate UI feedback
      setTodos(todos.filter(t => t.id !== id));
      
      if (isOnline && !id.startsWith('temp_')) {
        await SupabaseService.deleteTodo(id);
      } else if (!id.startsWith('temp_')) {
        OfflineQueueService.addToQueue({ type: 'delete', data: { id } });
        setQueueLength(OfflineQueueService.getQueueLength());
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setSyncStatus('error');
      // Revert optimistic update on error
      try {
        const freshTodos = await SupabaseService.getTodos();
        setTodos(freshTodos);
      } catch (revertError) {
        console.error('Failed to revert after delete error:', revertError);
      }
    }
  };

  const editTodo = async (id: string, newText: string) => {
    try {
      // Always do optimistic update first for immediate UI feedback
      setTodos(todos.map(t =>
        t.id === id ? { ...t, text: newText, syncStatus: isOnline ? 'synced' : 'pending' } : t
      ));
      
      if (isOnline && !id.startsWith('temp_')) {
        await SupabaseService.updateTodo(id, { text: newText });
      } else if (!id.startsWith('temp_')) {
        OfflineQueueService.addToQueue({
          type: 'update',
          data: { id, updates: { text: newText } }
        });
        setQueueLength(OfflineQueueService.getQueueLength());
      }
    } catch (error) {
      console.error('Failed to edit todo:', error);
      setSyncStatus('error');
      // Revert optimistic update on error
      try {
        const freshTodos = await SupabaseService.getTodos();
        setTodos(freshTodos);
      } catch (revertError) {
        console.error('Failed to revert after edit error:', revertError);
      }
    }
  };

  const todoCount = {
    all: todos.length,
    active: todos.filter(todo => todo && !todo.completed).length,
    completed: todos.filter(todo => todo && todo.completed).length
  };

  const handleAuthPromptAction = () => {
    setShowAuthPrompt(false);
    setShowAuthModal(true);
  };

  const handleAuthPromptDismiss = () => {
    const deviceId = DeviceService.getDeviceId();
    localStorage.setItem(`authPromptDismissed_${deviceId}`, 'true');
    setShowAuthPrompt(false);
  };

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={
          <div className="App">
            <ConnectionStatus
              isOnline={isOnline}
              syncStatus={syncStatus}
              queueLength={queueLength}
            />
            
            <div className="todo-container">
              <header className="app-header">
                <div className="header-content">
                  <div>
                    <h1>Todo App</h1>
                    <p>Stay organized and get things done!</p>
                  </div>
                  <div className="auth-section">
                    {user ? (
                      <UserProfile user={user} />
                    ) : (
                      <button
                        className="sign-in-button"
                        onClick={handleSignInClick}
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              </header>
              
              <main className="app-main">
                {showAuthPrompt && !user && (
                  <AuthPrompt
                    onDismiss={handleAuthPromptDismiss}
                    onCreateAccount={handleAuthPromptAction}
                  />
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
            
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
