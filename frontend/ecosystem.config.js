module.exports = {
  apps: [
    {
      name: "hockey-pool-frontend",
      script: "serve",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 5174,
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_SPA: "true",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5173,
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_SPA: "true",
      },
    },
  ],
};
