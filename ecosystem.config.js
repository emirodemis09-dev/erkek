const path = require('path');

module.exports = {
  apps: [{
    name: 'ykb-server',
    script: path.join(__dirname, 'server.js'),
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: path.join(__dirname, 'logs', 'err.log'),
    out_file: path.join(__dirname, 'logs', 'out.log'),
    merge_logs: true,
    time: true,
    restart_delay: 2000
  }]
};
