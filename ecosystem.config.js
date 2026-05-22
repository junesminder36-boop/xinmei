module.exports = {
  apps: [
    {
      name: "xinmei",
      script: "npm",
      args: "start",
      cwd: "/opt/xinmei",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      log_file: "/opt/xinmei/logs/combined.log",
      out_file: "/opt/xinmei/logs/out.log",
      error_file: "/opt/xinmei/logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "512M",
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: "10s",
      watch: false,
    },
  ],
};
