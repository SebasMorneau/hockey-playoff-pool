#!/bin/bash

# Print header
echo "====================================================="
echo "Hockey Playoff Pool - Complete Restart Script"
echo "====================================================="
echo

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -f, --frontend    Restart only the frontend container"
    echo "  -b, --backend     Restart only the backend container"
    echo "  -a, --all         Restart all components (default)"
    echo "  -h, --help        Show this help message"
    echo
}

# Parse command line arguments
RESTART_FRONTEND_ONLY=false
RESTART_BACKEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
    -f | --frontend)
        RESTART_FRONTEND_ONLY=true
        shift
        ;;
    -b | --backend)
        RESTART_BACKEND_ONLY=true
        shift
        ;;
    -a | --all)
        RESTART_FRONTEND_ONLY=false
        RESTART_BACKEND_ONLY=false
        shift
        ;;
    -h | --help)
        show_usage
        exit 0
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
done

# Change to the project directory
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"
echo

# Function to restart frontend
restart_frontend() {
    echo "Restarting frontend..."
    echo

    # Stop and remove frontend container
    echo "Step 1: Stopping frontend container..."
    docker-compose stop hockey-pool-frontend
    docker-compose rm -f hockey-pool-frontend
    echo "Frontend container stopped!"
    echo

    # Rebuild frontend
    echo "Step 2: Rebuilding frontend..."
    docker-compose build --no-cache hockey-pool-frontend
    echo "Frontend rebuild complete!"
    echo

    # Start frontend
    echo "Step 3: Starting frontend..."
    docker-compose up -d hockey-pool-frontend
    echo "Frontend container started!"
    echo

    # Show frontend logs
    echo "Step 4: Checking frontend logs..."
    echo "Press Ctrl+C to exit logs (container will continue running)"
    echo "====================================================="
    docker-compose logs -f hockey-pool-frontend
}

# Function to restart backend
restart_backend() {
    echo "Restarting backend..."
    echo

    # Stop and remove backend container
    echo "Step 1: Stopping backend container..."
    docker-compose stop hockey-pool-api
    docker-compose rm -f hockey-pool-api
    echo "Backend container stopped!"
    echo

    # Rebuild backend
    echo "Step 2: Rebuilding backend..."
    docker-compose build --no-cache hockey-pool-api
    echo "Backend rebuild complete!"
    echo

    # Start backend
    echo "Step 3: Starting backend..."
    docker-compose up -d hockey-pool-api
    echo "Backend container started!"
    echo

    # Show backend logs
    echo "Step 4: Checking backend logs..."
    echo "Press Ctrl+C to exit logs (container will continue running)"
    echo "====================================================="
    docker-compose logs -f hockey-pool-api
}

# Function to restart everything
restart_all() {
    echo "Restarting all components..."
    echo

    # Completely clean up previous containers and builds
    echo "Step 1: Cleaning up previous containers and builds..."
    docker-compose down
    docker system prune -f
    echo "Cleanup complete!"
    echo

    # Rebuild with the new configuration
    echo "Step 2: Rebuilding containers..."
    docker-compose build --no-cache
    echo "Rebuild complete!"
    echo

    # Start the containers
    echo "Step 3: Starting containers..."
    docker-compose up -d
    echo "Containers started!"
    echo

    # Check logs to verify everything is working
    echo "Step 4: Checking logs..."
    echo "Press Ctrl+C to exit logs (containers will continue running)"
    echo "====================================================="
    docker-compose logs -f
}

# Execute the appropriate restart function based on the options
if [ "$RESTART_FRONTEND_ONLY" = true ]; then
    restart_frontend
elif [ "$RESTART_BACKEND_ONLY" = true ]; then
    restart_backend
else
    restart_all
fi

echo ""
echo "=== Restart Complete ==="
echo "API URL: http://localhost:3300"
echo "Frontend URL: http://localhost:5173"
echo ""
echo "To view the logs, run: docker-compose logs -f"
echo "To stop the containers, run: docker-compose down"
