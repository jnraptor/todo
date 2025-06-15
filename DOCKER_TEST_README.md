# Docker Test Configuration

This project now supports running tests in Docker containers using multiple approaches. Choose the method that best fits your needs.

## Available Test Options

### Option 1: Multi-stage Dockerfile with Test Stage (Recommended for CI/CD)

The main `Dockerfile` now includes a test stage that runs tests before building the production image.

```bash
# Build and run tests as part of the build process
docker build -t todo-app .

# Run only the test stage
docker build --target test -t todo-app-test .

# Run the test container
docker run --rm todo-app-test
```

### Option 2: Dedicated Test Dockerfile

Use the dedicated `Dockerfile.test` for test-only containers:

```bash
# Build test image
docker build -f Dockerfile.test -t todo-app-test .

# Run tests
docker run --rm todo-app-test

# Run tests with volume mounts to save results
docker run --rm \
  -v $(pwd)/coverage:/app/coverage \
  -v $(pwd)/test-results:/app/test-results \
  todo-app-test
```

### Option 3: Development Dockerfile with Test Commands

Use the development Dockerfile and override the command:

```bash
# Build development image
docker build -f Dockerfile.dev -t todo-app-dev .

# Run tests
docker run --rm todo-app-dev npm test -- --coverage --watchAll=false --passWithNoTests

# Run tests with interactive mode (for development)
docker run --rm -it todo-app-dev npm test
```

### Option 4: Docker Compose (Recommended for Local Development)

Use docker-compose with profiles for different environments:

```bash
# Run tests using dedicated test Dockerfile
docker-compose --profile test up todo-app-test

# Run tests using main Dockerfile test stage
docker-compose --profile test up todo-app-test-main

# Run development server
docker-compose --profile dev up todo-app-dev

# Run production build (includes tests)
docker-compose up todo-app
```

## Test Output and Coverage

### Coverage Reports

All test configurations generate coverage reports in multiple formats:
- **Text**: Displayed in console output
- **LCOV**: For CI/CD integration (`coverage/lcov.info`)
- **HTML**: For detailed viewing (`coverage/lcov-report/index.html`)

### Accessing Coverage Reports

When using volume mounts, coverage reports will be saved to your local `./coverage` directory:

```bash
# Run tests with coverage output
docker run --rm -v $(pwd)/coverage:/app/coverage todo-app-test

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Environment Variables for Testing

The test containers use these environment variables:
- `REACT_APP_SUPABASE_URL=https://test.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=test-anon-key`
- `REACT_APP_REDIRECT_URL=http://localhost:3000`
- `CI=true` (enables CI mode for Jest)
- `NODE_ENV=test`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and test
        run: |
          docker build --target test -t todo-app-test .
          docker run --rm \
            -v ${{ github.workspace }}/coverage:/app/coverage \
            todo-app-test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### GitLab CI Example

```yaml
test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build --target test -t todo-app-test .
    - docker run --rm -v $(pwd)/coverage:/app/coverage todo-app-test
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
```

## Troubleshooting

### Common Issues

1. **Tests fail due to missing environment variables**
   - Ensure test environment variables are set correctly
   - Check that mock configurations in `setupTests.ts` are working

2. **Permission issues with volume mounts**
   ```bash
   # Fix permissions for coverage directory
   sudo chown -R $(id -u):$(id -g) coverage/
   ```

3. **Out of memory errors**
   ```bash
   # Increase Docker memory limit or use --max_old_space_size
   docker run --rm -e NODE_OPTIONS="--max_old_space_size=4096" todo-app-test
   ```

### Test Configuration

Tests are configured in:
- `package.json` - Test scripts and Jest configuration
- `src/setupTests.ts` - Test environment setup and mocks
- `tsconfig.json` - TypeScript configuration for tests

## Performance Tips

1. **Use multi-stage builds** to cache dependencies between test and build stages
2. **Use .dockerignore** to exclude unnecessary files from build context
3. **Run tests in parallel** when possible using Jest's built-in parallelization
4. **Cache node_modules** using Docker layer caching or external cache mounts

## Best Practices

1. **Always run tests before building production images**
2. **Use specific Node.js versions** for consistency across environments
3. **Set CI=true** to ensure tests run in non-interactive mode
4. **Save test artifacts** (coverage, test results) for analysis
5. **Use health checks** in production containers
6. **Keep test data separate** from production data