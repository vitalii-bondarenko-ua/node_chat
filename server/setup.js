import 'dotenv/config';
import { client } from './src/utils/db.js';
import './src/models/message.js';
import './src/models/room.js';

try {
  await client.authenticate();
  await client.sync();

  console.info('Database tables are ready');
} catch (error) {
  console.error('Database setup failed:', error);
  process.exitCode = 1;
} finally {
  await client.close();
}
