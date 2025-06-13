// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage for all tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
    hasOwnProperty: jest.fn((key: string) => key in store)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Date.now for consistent test results
const mockDateNow = jest.spyOn(Date, 'now');
mockDateNow.mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z

// Mock Math.random for consistent test results
const mockMathRandom = jest.spyOn(Math, 'random');
mockMathRandom.mockReturnValue(0.123456789);

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  
  // Reset the mock implementations
  mockDateNow.mockReturnValue(1640995200000);
  mockMathRandom.mockReturnValue(0.123456789);
});

// Cleanup after all tests
afterAll(() => {
  mockDateNow.mockRestore();
  mockMathRandom.mockRestore();
});
