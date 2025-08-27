module.exports = {
  apps: [{
    name: 'wa-divulgacoes-bot',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,
    ignore_watch: [
      'node_modules',
      'sessions',
      'data',
      'logs'
    ]
  }]
};

// Instruções para uso:
//
// 1. Instalar PM2 globalmente:
//    npm install -g pm2
//
// 2. Iniciar o aplicativo:
//    pm2 start ecosystem.config.js
//
// 3. Monitorar:
//    pm2 monit
//
// 4. Ver logs:
//    pm2 logs wa-divulgacoes-bot
//
// 5. Reiniciar:
//    pm2 restart wa-divulgacoes-bot
//
// 6. Parar:
//    pm2 stop wa-divulgacoes-bot
//
// 7. Configurar inicialização automática:
//    pm2 startup
//    pm2 save