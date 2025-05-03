module.exports = {
  apps: [{
    name: 'hockey-pool-api',
    script: 'dist/src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3301
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3300
    }
  }]
}; 