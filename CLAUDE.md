# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern full-stack React todo application with authentication, real-time sync, and offline support. It features an anonymous-first approach where users can create todos without signing up, with smart prompting to authenticate after 3 todos for sync across devices.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Create React App
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Docker with multi-stage builds, Nginx
- **Testing**: Jest + React Testing Library

## Common Development Commands

```bash
# Development
npm start                    # Start dev server (port 3000)
npm test                     # Run tests
npm test -- --coverage      # Run tests with coverage
npm run build               # Production build

# Docker
docker-compose up -d todo-app                    # Production container
docker-compose --profile dev up todo-app-dev     # Development container with hot reload

# Database migrations
# Run SQL files in supabase/migrations/ in your Supabase SQL editor
```

## Architecture Overview

### Database Schema
- **todos** table with dual ownership (user_id OR device_id)
- **user_profiles** for extended user data
- **device_migrations** for tracking anonymous → authenticated transitions
- **audit_logs** for security monitoring
- Row Level Security (RLS) enabled with comprehensive policies

### Key Services
- **authService.ts**: OAuth (Google/GitHub), session management
- **supabaseService.ts**: Database operations, real-time subscriptions  
- **migrationService.ts**: Anonymous → authenticated user data migration
- **offlineQueueService.ts**: Offline sync queue management
- **deviceService.ts**: Device identification for anonymous users

### Component Structure
- **App.tsx**: Main container with auth state and todo management
- **AuthPrompt.tsx**: Smart authentication prompting after 3 todos
- **AuthModal.tsx**: OAuth sign-in modal
- **TodoList.tsx**: Main todo container with filtering
- **TodoItem.tsx**: Individual todo with edit/delete functionality
- **UserProfile.tsx**: User dropdown with profile info

### Data Flow
1. Anonymous users: todos stored with device_id in localStorage + Supabase
2. Authentication: OAuth flow → user profile creation → data migration
3. Authenticated users: todos synced real-time across devices via Supabase
4. Offline support: localStorage cache + sync queue for when reconnected

## Environment Configuration

Required environment variables (needed at BUILD time for React):
```bash
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_REDIRECT_URL=http://localhost:3000/auth/callback  # Optional
```

## Testing Strategy

- **Unit tests**: Individual components and services
- **Integration tests**: User authentication flows, data migration
- **Service tests**: Database operations, offline sync
- Test files located in `__tests__/` directories alongside source code

## Database Migrations

All migrations are in `supabase/migrations/` with timestamps. Key migrations:
- Table creation (todos, user_profiles, audit_logs, device_migrations)
- RLS policies for data security
- Triggers for updated_at timestamps and audit logging
- Security fixes and optimizations

## Key Development Patterns

### Authentication Flow
1. Anonymous usage first (device-based storage)
2. Smart prompting after 3 todos created
3. OAuth sign-in → profile creation → data migration
4. Real-time sync enabled for authenticated users

### Error Handling
- Graceful localStorage quota management
- Network failure handling with offline queue
- Authentication error recovery
- Database constraint validation

### State Management
- React hooks for local state
- Supabase realtime for cross-device sync
- localStorage for offline persistence
- Optimistic updates for immediate UI feedback

## Production Deployment

The app uses multi-stage Docker builds:
1. **Build stage**: Compiles React app with environment variables
2. **Production stage**: Nginx serves static files
3. Environment variables must be available at BUILD time, not runtime

## Performance Considerations

- Optimistic updates for immediate UI feedback
- Real-time subscriptions only for authenticated users
- localStorage caching with quota management
- Indexed database queries for fast lookups
- React.memo and proper key usage for efficient re-renders

## Security Features

- Row Level Security (RLS) at database level
- OAuth 2.0 with JWT tokens
- Device isolation for anonymous users
- Input validation and XSS protection
- Comprehensive audit logging
- Auto-refresh for JWT tokens