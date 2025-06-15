# Comprehensive Test Plan

## Current Test Coverage Analysis

### Existing Tests (Good Coverage)
- ✅ **TodoInput.tsx** - 100% coverage (11 tests)
- ✅ **TodoItem.tsx** - 100% coverage (comprehensive component tests)
- ✅ **TodoList.tsx** - 100% coverage (filtering and rendering tests)
- ✅ **FilterButtons.tsx** - 100% coverage (filter state and interactions)
- ✅ **authService.ts** - 51.72% coverage (OAuth flows, basic auth operations)
- ✅ **localStorage.ts** - 79.62% coverage (storage operations, some edge cases)

### Missing Test Coverage

#### **Priority 1: Critical Service Tests (0% coverage)**
- [ ] **DeviceService** - Device ID management
- [ ] **SupabaseService** - Core database operations  
- [ ] **MigrationService** - Data migration logic
- [ ] **OfflineQueueService** - Offline operation queuing

#### **Priority 2: Component Tests (0% coverage)**
- [ ] **AuthModal** - Authentication modal with provider selection
- [ ] **UserProfile** - User profile dropdown with sign-out
- [ ] **ConnectionStatus** - Status display with multiple states
- [ ] **AuthPrompt** - Simple prompt with conditional logic
- [ ] **AuthCallback** - Navigation and timer logic

#### **Priority 3: Integration and App Tests**
- [ ] **App.tsx** - Main application component (0% coverage)
- [ ] **Integration Tests** - Fix router mocking and enhance workflows

#### **Priority 4: Utility and Configuration Tests**
- [ ] **env.ts** - Complete environment utilities (currently 40% coverage)
- [ ] **Supabase config** - Configuration validation

## Implementation Plan

### Phase 1: Critical Services (HIGH PRIORITY)
**Status: ✅ COMPLETED**

#### 1. DeviceService Tests
**Status: ✅ COMPLETED**
- [x] Test device ID generation and persistence
- [x] Test device ID retrieval from localStorage
- [x] Test device ID clearing
- [x] Test device ID existence checking
- [x] Test UUID format validation

#### 2. SupabaseService Tests  
**Status: ✅ COMPLETED**
- [x] Test todo CRUD operations (create, read, update, delete)
- [x] Test authentication state handling (authenticated vs anonymous)
- [x] Test error handling for network failures
- [x] Test data conversion between Supabase and app formats
- [x] Test subscription management and cleanup
- [x] Test query filtering (user vs device todos)

#### 3. MigrationService Tests
**Status: ✅ COMPLETED**
- [x] Test localStorage to Supabase migration
- [x] Test device to user account migration
- [x] Test error handling during migration failures
- [x] Test migration state tracking and logging
- [x] Test edge cases (empty data, duplicate migrations)

#### 4. OfflineQueueService Tests
**Status: ✅ COMPLETED**
- [x] Test queue operations (add, process, clear)
- [x] Test retry logic with maximum retry limits
- [x] Test different operation types (create, update, delete)
- [x] Test queue persistence across sessions
- [x] Test error handling and edge cases

### Phase 2: Component Tests (MEDIUM PRIORITY)
**Status: ⏳ PENDING**

#### 5. AuthModal Tests
- [ ] Test modal open/close behavior
- [ ] Test Google and GitHub provider authentication flows
- [ ] Test error handling and display
- [ ] Test loading states during authentication
- [ ] Test click outside to close functionality
- [ ] Test accessibility features (focus management, ARIA)

#### 6. UserProfile Tests
- [ ] Test profile display with user data
- [ ] Test dropdown menu show/hide functionality
- [ ] Test sign-out functionality and loading states
- [ ] Test click outside behavior
- [ ] Test avatar display vs placeholder logic
- [ ] Test error handling during sign-out

#### 7. ConnectionStatus Tests
- [ ] Test offline state display with queue count
- [ ] Test syncing state with progress indication
- [ ] Test error state display
- [ ] Test synced state display
- [ ] Test conditional rendering logic
- [ ] Test status icon rendering

#### 8. AuthPrompt Tests
- [ ] Test prompt display and messaging
- [ ] Test dismiss functionality
- [ ] Test account creation flow trigger
- [ ] Test conditional onCreateAccount handling
- [ ] Test benefits list rendering

#### 9. AuthCallback Tests
- [ ] Test navigation behavior after timeout
- [ ] Test timer functionality and cleanup
- [ ] Test loading display
- [ ] Test useEffect cleanup

### Phase 3: Integration and App Tests (MEDIUM PRIORITY)
**Status: ⏳ PENDING**

#### 10. App Component Tests
- [ ] Test app initialization and loading states
- [ ] Test authentication state management
- [ ] Test todo operations integration
- [ ] Test offline/online state handling
- [ ] Test sync status management
- [ ] Test error boundaries and error handling
- [ ] Test routing integration

#### 11. Enhanced Integration Tests
- [ ] Fix react-router-dom mocking issues
- [ ] Test complete user authentication workflows
- [ ] Test offline functionality and queue processing
- [ ] Test data synchronization scenarios
- [ ] Test error recovery flows

### Phase 4: Utility and Configuration Tests (LOW PRIORITY)
**Status: ⏳ PENDING**

#### 12. Environment Utilities Tests
- [ ] Test redirect URL generation (dev vs prod)
- [ ] Test environment validation with missing variables
- [ ] Test development vs production behavior
- [ ] Test window.location.origin handling

#### 13. Configuration Tests
- [ ] Test Supabase client configuration
- [ ] Test environment variable handling
- [ ] Test configuration validation

### Test Infrastructure Improvements

#### 14. Mock Improvements
- [ ] Fix react-router-dom mocking issues
- [ ] Enhance Supabase client mocking with realistic responses
- [ ] Add better error simulation capabilities
- [ ] Create reusable mock factories

#### 15. Test Utilities
- [ ] Create helper functions for common test scenarios
- [ ] Add custom matchers for domain-specific assertions
- [ ] Create test data factories for consistent test data
- [ ] Add setup/teardown utilities

## Coverage Goals

### Target Coverage Metrics
- **Overall Coverage**: 85%+ statements, branches, functions, lines
- **Critical Services**: 90%+ coverage
- **Components**: 80%+ coverage
- **Integration Scenarios**: Cover all major user workflows

### Current Coverage Status
- **Overall**: 19.33% statements, 19.42% branches, 22.31% functions, 19.29% lines
- **Components**: 43.63% statements (4/9 components fully tested)
- **Services**: 9.31% statements (1/5 services partially tested)
- **Utils**: 73.43% statements (good coverage on localStorage)

## Test Categories by Risk Level

### High Risk (Must Test) ✅
- Data persistence and migration
- Authentication flows  
- Offline queue management
- Error handling and recovery

### Medium Risk (Should Test) 📋
- UI component interactions
- State management
- Navigation flows
- User experience flows

### Low Risk (Nice to Test) 📝
- Styling and CSS classes
- Performance optimizations
- Edge cases and boundary conditions

## Notes and Considerations

### Known Issues
- react-router-dom mocking currently disabled due to module resolution issues
- localStorage tests have some calculation discrepancies that need investigation
- Integration tests failing due to router dependencies

### Testing Strategy
- Start with unit tests for services (highest risk)
- Move to component tests (medium risk)
- Finish with integration tests (complex but important)
- Maintain high coverage on critical paths

### Dependencies and Blockers
- Need to resolve react-router-dom mocking for App and integration tests
- May need to mock additional Supabase client methods
- Consider adding test-specific environment configuration

---

**Last Updated**: Initial creation
**Next Review**: After Phase 1 completion