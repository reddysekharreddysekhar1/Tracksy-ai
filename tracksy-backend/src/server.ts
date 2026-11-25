import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`  TRACKSY BACKEND API SERVER RUNNING        `);
  console.log(`  Port: ${config.port}                      `);
  console.log(`  Health Check: http://localhost:${config.port}/api/health`);
  console.log(`=============================================`);
});
