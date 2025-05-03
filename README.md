# Hockey Playoff Pool

A web application for managing hockey playoff pools, built with Node.js, Express, and React.

## Deployment with Docker Compose

This project uses Docker Compose for deployment, optimized for OrbStack on macOS.

### Prerequisites

- Docker and Docker Compose installed
- OrbStack (recommended for macOS users)
- nginx-proxy-manager (for reverse proxy and SSL)

### Configuration

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/hockey-playoff-pool.git
   cd hockey-playoff-pool
   ```

2. Build and start the containers:

   ```bash
   docker-compose up -d --build
   ```

3. Configure nginx-proxy-manager:
   - Access the nginx-proxy-manager interface at http://your-server-ip:81
   - Add the following proxy hosts:
     ```
     - playoff-pool.emstone.ca -> http://hockey-pool-frontend:5173
     - api-playoff-pool.emstone.ca -> http://hockey-pool-api:3300
     ```
   - Enable SSL for each domain
   - Enable "Force SSL" and "HTTP/2" options
   - Enable "Block Common Exploits"

### Application URL

- https://playoff-pool.emstone.ca

### Automated Deployment

This project includes GitHub Actions for automated deployment:

1. Set up a self-hosted runner on your server
2. Configure the following secrets in your GitHub repository:

   - `SSH_HOST`: Your server's IP address
   - `SSH_USERNAME`: SSH username
   - `SSH_PRIVATE_KEY`: SSH private key for authentication

3. Push to the main branch to trigger a deployment

## Integration with Emma Stone Server Stack

This application is designed to integrate with the Emma Stone Server Stack, a comprehensive server management solution.

## Copyright

© 2023 Emma Stone. All rights reserved.
