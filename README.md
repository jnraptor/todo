# Todo App

A modern, full-stack todo application built with React, TypeScript, and Supabase. Features seamless authentication, real-time sync, offline support, and Docker deployment. Stay organized and get things done with this professional-grade application.

![Todo App Screenshot](https://via.placeholder.com/600x400/667eea/ffffff?text=Todo+App+with+Auth)

## 🚀 Features

### Core Functionality
- ✅ **Add Todos**: Quickly add new tasks with a simple input form
- ✅ **Edit Todos**: Double-click any todo or use the Edit button to modify text
- ✅ **Delete Todos**: Remove completed or unwanted tasks
- ✅ **Toggle Completion**: Mark todos as complete/incomplete with checkboxes
- ✅ **Smart Filtering**: View All, Active, or Completed todos
- ✅ **Live Counters**: See how many items are left and completed

### Authentication & User Management
- 🔐 **Anonymous-First Approach**: App works without authentication, prompts after 3 todos
- 🔑 **Google OAuth Integration**: Sign in with Google account
- 🔑 **GitHub OAuth Integration**: Sign in with GitHub account
- 🔄 **Seamless Migration**: Anonymous todos automatically migrate when user signs in
- 👤 **User Profile**: Beautiful dropdown with user info and sign out option
- 🔒 **Session Management**: Auto-refresh tokens, persistent sessions

### Advanced Features
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- ⌨️ **Keyboard Support**: Press Enter to add todos, Escape to cancel edits
- 💾 **Robust Storage**: Intelligent localStorage management with quota handling
- ⚠️ **Error Handling**: Graceful handling of storage limitations and auth errors
- 🌐 **Real-time Sync**: Data syncs across devices when authenticated
- 📴 **Offline Support**: Works offline with automatic sync when reconnected

### DevOps & Deployment
- 🐳 **Docker Support**: Production and development containers
- 🔧 **Docker Compose**: Easy multi-environment deployment
- 📦 **Optimized Builds**: Multi-stage Docker builds for minimal image size
- 🚀 **Production Ready**: Nginx serving, environment configuration

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: CSS3 with Flexbox and CSS Grid
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router DOM v7
- **Build Tool**: Create React App

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth providers
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Browser localStorage + Supabase sync

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (production)
- **Development**: Hot reload with React Scripts

### Testing
- **Framework**: Jest with React Testing Library
- **Coverage**: Unit tests for services and components
- **Integration**: End-to-end user flow testing

## 📁 Project Structure

```
src/
├── components/
│   ├── AuthCallback.tsx      # OAuth callback handler
│   ├── AuthModal.tsx         # OAuth sign-in modal
│   ├── AuthModal.css         # Modal styling
│   ├── AuthPrompt.tsx        # Smart auth prompting
│   ├── ConnectionStatus.tsx  # Network status indicator
│   ├── FilterButtons.tsx     # Filter controls and counters
│   ├── TodoInput.tsx         # Input form for adding new todos
│   ├── TodoItem.tsx          # Individual todo item with edit/delete
│   ├── TodoList.tsx          # List container for all todos
│   ├── UserProfile.tsx       # User profile dropdown
│   ├── UserProfile.css       # Profile styling
│   └── __tests__/            # Component tests
├── services/
│   ├── authService.ts        # Authentication service
│   ├── deviceService.ts      # Device identification
│   ├── migrationService.ts   # Data migration utilities
│   ├── offlineQueueService.ts # Offline sync queue
│   ├── supabaseService.ts    # Supabase integration
│   └── __tests__/            # Service tests
├── types/
│   ├── auth.ts               # Authentication types
│   └── types.ts              # Core application types
├── utils/
│   ├── env.ts                # Environment utilities
│   └── localStorage.ts       # localStorage utility functions
├── config/
│   └── supabase.ts           # Supabase client configuration
├── App.tsx                   # Main application component
├── App.css                   # Application styles
└── index.tsx                 # Application entry point
```

## 🗄 Data Structure

### Todo Interface
```typescript
interface Todo {
  id: string;           // Unique identifier
  text: string;         // Todo description
  completed: boolean;   // Completion status
  createdAt: Date;     // Creation timestamp
  userId?: string;     // User ID (when authenticated)
  deviceId?: string;   // Device ID (for anonymous users)
}
```

### User Profile Interface
```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  provider: 'google' | 'github';
  created_at: Date;
  updated_at: Date;
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Docker (optional, for containerized deployment)
- Supabase account (for authentication and sync features)

### Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=your-supabase-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

#### Production Deployment

**Important**: For production builds, environment variables must be provided at **build time**, not runtime, because React creates a static bundle.

1. **Create a `.env` file** in your project root:
   ```env
   REACT_APP_SUPABASE_URL=your-supabase-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   REACT_APP_REDIRECT_URL=https://your-domain.com/auth/callback
   ```

2. **Build and run production container**:
   ```bash
   # Docker Compose will automatically use .env file
   docker-compose up -d todo-app
   
   # Access at http://localhost:3000
   ```

3. **Alternative: Pass environment variables directly**:
   ```bash
   # Using environment variables
   REACT_APP_SUPABASE_URL=your-url \
   REACT_APP_SUPABASE_ANON_KEY=your-key \
   docker-compose up -d todo-app
   
   # Or using Docker build args
   docker build \
     --build-arg REACT_APP_SUPABASE_URL=your-url \
     --build-arg REACT_APP_SUPABASE_ANON_KEY=your-key \
     -t todo-app .
   ```

#### Development with Docker
```bash
# Run development container with hot reload
docker-compose --profile dev up todo-app-dev

# Access at http://localhost:3001
```

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Configure OAuth providers**:
   - Enable Google OAuth in Authentication > Providers
   - Enable GitHub OAuth in Authentication > Providers
   - Set redirect URLs to: `https://[project-ref].supabase.co/auth/v1/callback`

3. **Run database migrations**:
   Execute the SQL from `plans/database_migration.sql` in your Supabase SQL editor

4. **Get your credentials**:
   - Project URL: Settings > API > Project URL
   - Anon Key: Settings > API > Project API keys > anon public

## 📱 Usage Guide

### Getting Started
1. **Anonymous Usage**: Start using immediately - no account required
2. **Smart Prompting**: After creating 3 todos, you'll see an optional sign-up prompt
3. **Easy Authentication**: Choose Google or GitHub to create your account
4. **Automatic Migration**: Your existing todos will be saved to your account

### Managing Todos
- **Add**: Type in the input field and press Enter or click "Add Todo"
- **Complete**: Click the checkbox next to any todo
- **Edit**: Double-click the todo text or click the "Edit" button
- **Delete**: Click the "Delete" button to remove a todo
- **Filter**: Use the filter buttons to view All, Active, or Completed todos

### User Account
- **Profile**: Click your avatar in the top-right to see profile info
- **Sign Out**: Use the dropdown menu to sign out
- **Sync**: Your todos automatically sync across all your devices

### Keyboard Shortcuts
- **Enter**: Save new todo or confirm edit
- **Escape**: Cancel editing mode
- **Double-click**: Start editing a todo

## 🐳 Docker Configuration

### Production Container
- **Base Image**: Node.js Alpine for minimal size
- **Web Server**: Nginx for optimal performance
- **Port**: Exposed on port 80 (mapped to 3000)
- **Environment**: Production optimized build

### Development Container
- **Hot Reload**: Live code changes without restart
- **Volume Mounting**: Source code mounted for development
- **Port**: Exposed on port 3000 (mapped to 3001)
- **Environment**: Development mode with debugging

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- AuthService.test.ts
```

### Test Coverage
- **Services**: Authentication, data migration, offline sync
- **Components**: User interface components and interactions
- **Integration**: End-to-end user workflows
- **Utilities**: Helper functions and data management

## 🌐 Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Configuration

### Environment Variables
```env
# Required for authentication and sync
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional - defaults to current domain + /auth/callback
REACT_APP_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Troubleshooting Environment Variables

#### "supabaseUrl is required" Error
This error occurs when environment variables are not available during the build process. Here's how to fix it:

1. **For Docker Production Builds**:
   - Ensure you have a `.env` file in your project root with the required variables
   - Or pass build arguments when building the Docker image
   - Environment variables must be available at **build time**, not runtime

2. **For Local Development**:
   - Create `.env.local` file in your project root
   - Restart your development server after adding environment variables

3. **For Static Hosting (Netlify, Vercel, etc.)**:
   - Set environment variables in your hosting platform's dashboard
   - Ensure variables start with `REACT_APP_` prefix
   - Redeploy your application after setting variables

4. **Validation**:
   - The app now includes environment validation on startup
   - Check browser console for detailed error messages
   - Missing variables will show a user-friendly error page

#### Common Issues
- **Variable not found**: Ensure the variable name starts with `REACT_APP_`
- **Build-time vs Runtime**: React apps need env vars at build time, not runtime
- **Docker caching**: Use `docker-compose build --no-cache` if variables aren't updating
- **Case sensitivity**: Environment variable names are case-sensitive

### Storage Features
- **Automatic Persistence**: Todos saved immediately when created, edited, or deleted
- **Quota Management**: Handles localStorage quota exceeded errors gracefully
- **Data Recovery**: Attempts to free space by clearing non-essential data
- **Fallback Protection**: Keeps the 50 most recent todos if storage is critically low
- **Cloud Sync**: Authenticated users get real-time sync across devices

## 🎨 Customization

### Styling
All styles are contained in component-specific CSS files:
- **Primary gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Border radius**: `8px` for components, `12px` for main container
- **Transition duration**: `0.2s ease` for smooth animations

### Adding Features
The modular architecture makes it easy to extend:
- Add new OAuth providers in `authService.ts`
- Create new filter types in `types.ts`
- Extend the Todo interface for additional properties
- Add new components in the `components/` directory

## 📊 Performance

- ⚡ **Fast Initial Load**: Optimized React build with code splitting
- 🔄 **Efficient Re-renders**: React's virtual DOM with proper key usage
- 💾 **Smart Caching**: localStorage + Supabase caching strategies
- 📦 **Small Bundle Size**: ~2MB development, ~500KB production
- 🌐 **CDN Ready**: Static assets optimized for CDN deployment

## 🔒 Security

### Authentication Security
- **OAuth 2.0**: Industry-standard authentication flow
- **JWT Tokens**: Secure, stateless authentication
- **Auto Refresh**: Automatic token renewal
- **HTTPS Only**: All authentication traffic encrypted

### Data Security
- **Row Level Security**: Database-level access control
- **Device Isolation**: Anonymous data isolated by device
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user inputs

## 🚀 Deployment

### Production Checklist
- [ ] Set up Supabase project with OAuth providers
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Build Docker image or static files
- [ ] Configure reverse proxy (if needed)
- [ ] Set up monitoring and logging

### Deployment Options
1. **Docker**: Use provided Dockerfile and docker-compose.yml
2. **Static Hosting**: Build and deploy to Netlify, Vercel, or similar
3. **Traditional Server**: Build and serve with Nginx or Apache
4. **Cloud Platforms**: Deploy to AWS, Google Cloud, or Azure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation for changes
- Use conventional commit messages
- Ensure Docker builds work

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Create React App](https://create-react-app.dev/)
- Authentication powered by [Supabase](https://supabase.com/)
- Inspired by [TodoMVC](http://todomvc.com/)
- Icons and design patterns from modern web standards

## 📚 Documentation

- **Setup Guide**: `plans/SUPABASE_AUTH_SETUP.md` - Complete setup instructions
- **Implementation Details**: `plans/SUPABASE_AUTH_IMPLEMENTATION_SUMMARY.md`
- **Migration Guide**: `plans/MIGRATION_PLAN.md`
- **Docker Guide**: `DOCKER_README.md`

---

**Happy organizing! 🎉**

For questions, issues, or feature requests, please open an issue in the repository.
