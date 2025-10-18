module.exports = {
  apps: [
    {
      name: "facial-recognition-app",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        MONGO_URI: "mongodb://localhost:27017/facial_recognition"
      }
    }
  ]
};
