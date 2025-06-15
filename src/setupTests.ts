// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: any }) => children,
  Routes: ({ children }: { children: any }) => children,
  Route: ({ element }: { element: any }) => element,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' })
}));

// Export the mock navigate function for tests to access
(global as any).mockNavigate = mockNavigate;

// Mock Supabase client with proper method chaining
jest.mock('./config/supabase', () => {
  const mockTodo = {
    id: 'test-id-1',
    text: 'Test todo',
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    device_id: 'test-device-id',
    user_id: null
  };

  const createMockQuery: any = (data: any[] = []) => ({
    select: jest.fn(() => createMockQuery(data)),
    order: jest.fn(() => Promise.resolve({ data, error: null })),
    eq: jest.fn(() => createMockQuery(data)),
    is: jest.fn(() => createMockQuery(data)),
    insert: jest.fn((insertData) => {
      const newTodo = {
        ...mockTodo,
        id: `test-id-${Date.now()}`,
        text: insertData.text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return {
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: newTodo, error: null }))
        }))
      };
    }),
    update: jest.fn((updateData) => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { ...mockTodo, ...updateData }, error: null }))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  });

  return {
    supabase: {
      auth: {
        signInWithOAuth: jest.fn(() => Promise.resolve({ data: null, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: jest.fn((callback) => {
          // Immediately call callback with no user to simulate initial state
          setTimeout(() => callback(null, 'INITIAL_SESSION'), 0);
          return {
            data: { subscription: { unsubscribe: jest.fn() } }
          };
        }),
      },
      from: jest.fn(() => createMockQuery([])),
      channel: jest.fn(() => ({
        on: jest.fn(() => ({
          subscribe: jest.fn(() => ({
            unsubscribe: jest.fn()
          }))
        }))
      })),
      removeChannel: jest.fn()
    },
    getSupabaseClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null }))
      }
    }))
  };
});

// Mock services
// Note: MigrationService is not mocked globally to allow its own tests to run
// Individual tests can mock it as needed

jest.mock('./services/deviceService', () => ({
  DeviceService: {
    getDeviceId: jest.fn(() => 'test-device-id'),
    hasDeviceId: jest.fn(() => true),
  }
}));

// Note: AuthService is not mocked globally to allow its own tests to run
// Individual tests can mock it as needed

// Note: OfflineQueueService is not mocked globally to allow its own tests to run
// Individual tests can mock it as needed

// Note: SupabaseService is not mocked globally to allow its own tests to run
// Individual tests can mock it as needed

// Note: localStorage utilities are not mocked globally to allow their own tests to run
// Individual tests can mock them as needed
