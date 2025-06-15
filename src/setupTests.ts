// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock react-router-dom - commented out due to module resolution issues
// jest.mock('react-router-dom', () => ({
//   BrowserRouter: ({ children }: { children: any }) => children,
//   Routes: ({ children }: { children: any }) => children,
//   Route: ({ element }: { element: any }) => element,
//   useNavigate: () => jest.fn(),
// }));

// Mock Supabase client
jest.mock('./config/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          then: jest.fn()
        }))
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    }))
  },
  getSupabaseClient: jest.fn()
}));

// Mock services
jest.mock('./services/migrationService', () => ({
  MigrationService: {
    migrateDeviceToUser: jest.fn(),
    migrateFromLocalStorage: jest.fn(),
  }
}));

jest.mock('./services/deviceService', () => ({
  DeviceService: {
    getDeviceId: jest.fn(() => 'test-device-id'),
    hasDeviceId: jest.fn(() => true),
  }
}));
