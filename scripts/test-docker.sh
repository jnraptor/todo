#!/bin/bash

# Docker Test Runner Script
# This script provides easy commands to run tests in Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Docker Test Runner"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  test-main      Run tests using main Dockerfile test stage"
    echo "  test-dedicated Run tests using dedicated test Dockerfile"
    echo "  test-compose   Run tests using docker-compose"
    echo "  test-dev       Run tests using development Dockerfile"
    echo "  build-test     Build test images without running tests"
    echo "  clean          Clean up test containers and images"
    echo "  coverage       Run tests and save coverage reports locally"
    echo "  ci             Run tests in CI mode (fail fast, no interactive)"
    echo ""
    echo "Options:"
    echo "  --no-cache     Build without using cache"
    echo "  --verbose      Show verbose output"
    echo "  --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test-main                    # Run tests using main Dockerfile"
    echo "  $0 test-dedicated --no-cache    # Run tests with fresh build"
    echo "  $0 coverage                     # Run tests and save coverage"
    echo "  $0 ci                           # Run in CI mode"
}

# Parse command line arguments
COMMAND=""
NO_CACHE=""
VERBOSE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        test-main|test-dedicated|test-compose|test-dev|build-test|clean|coverage|ci)
            COMMAND="$1"
            shift
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --verbose)
            VERBOSE="--verbose"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if command is provided
if [[ -z "$COMMAND" ]]; then
    print_error "No command provided"
    show_usage
    exit 1
fi

# Create coverage directory if it doesn't exist
mkdir -p coverage

# Execute commands
case $COMMAND in
    test-main)
        print_info "Running tests using main Dockerfile test stage..."
        docker build --target test -t todo-app-test $NO_CACHE .
        docker run --rm todo-app-test
        print_success "Tests completed using main Dockerfile"
        ;;
        
    test-dedicated)
        print_info "Running tests using dedicated test Dockerfile..."
        docker build -f Dockerfile.test -t todo-app-test-dedicated $NO_CACHE .
        docker run --rm todo-app-test-dedicated
        print_success "Tests completed using dedicated Dockerfile"
        ;;
        
    test-compose)
        print_info "Running tests using docker-compose..."
        docker-compose --profile test up todo-app-test --exit-code-from todo-app-test
        print_success "Tests completed using docker-compose"
        ;;
        
    test-dev)
        print_info "Running tests using development Dockerfile..."
        docker build -f Dockerfile.dev -t todo-app-dev $NO_CACHE .
        docker run --rm todo-app-dev npm test -- --coverage --watchAll=false --passWithNoTests
        print_success "Tests completed using development Dockerfile"
        ;;
        
    build-test)
        print_info "Building test images..."
        docker build --target test -t todo-app-test $NO_CACHE .
        docker build -f Dockerfile.test -t todo-app-test-dedicated $NO_CACHE .
        docker build -f Dockerfile.dev -t todo-app-dev $NO_CACHE .
        print_success "All test images built successfully"
        ;;
        
    clean)
        print_info "Cleaning up test containers and images..."
        docker-compose --profile test down --remove-orphans 2>/dev/null || true
        docker rmi todo-app-test todo-app-test-dedicated todo-app-dev 2>/dev/null || true
        docker system prune -f
        print_success "Cleanup completed"
        ;;
        
    coverage)
        print_info "Running tests with coverage reports..."
        docker build -f Dockerfile.test -t todo-app-test-dedicated $NO_CACHE .
        docker run --rm \
            -v "$(pwd)/coverage:/app/coverage" \
            todo-app-test-dedicated
        print_success "Coverage reports saved to ./coverage/"
        print_info "Open ./coverage/lcov-report/index.html to view detailed coverage"
        ;;
        
    ci)
        print_info "Running tests in CI mode..."
        docker build --target test -t todo-app-test $NO_CACHE .
        
        # Run tests and capture exit code
        set +e
        docker run --rm \
            -v "$(pwd)/coverage:/app/coverage" \
            -e CI=true \
            todo-app-test
        TEST_EXIT_CODE=$?
        set -e
        
        if [[ $TEST_EXIT_CODE -eq 0 ]]; then
            print_success "All tests passed in CI mode"
        else
            print_error "Tests failed in CI mode (exit code: $TEST_EXIT_CODE)"
            exit $TEST_EXIT_CODE
        fi
        ;;
        
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac