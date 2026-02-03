module.exports = {
  apps: [{
    name: "accufin",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    instances: 2,           // 1GB RAM-ku 1 instance dhaan stable
    exec_mode: "cluster",
    max_memory_restart: "16",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
