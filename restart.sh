#!/bin/bash

# Print header
echo "====================================================="
echo "Hockey Playoff Pool - Docker Environment Restart Script"
echo "====================================================="
echo

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -f, --frontend    Restart only the frontend container"
    echo "  -a, --all        Restart all containers (default)"
    echo "  -h, --help       Show this help message"
    echo
}

# Parse command line arguments
RESTART_FRONTEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
    -f | --frontend)
        RESTART_FRONTEND_ONLY=true
        shift
        ;;
    -a | --all)
        RESTART_FRONTEND_ONLY=false
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

if [ "$RESTART_FRONTEND_ONLY" = true ]; then
    echo "Restarting frontend only..."
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
else
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
fi
