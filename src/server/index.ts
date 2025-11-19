// Server entry point for multiplayer mode
import { GameServer } from './GameServer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadConfig() {
  try {
    const configPath = path.join(__dirname, '../../public/config.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Failed to load config.json:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting Open TD Multiplayer Server...');
  
  const config = await loadConfig();
  
  if (!config.multiplayer.enabled) {
    console.log('⚠️  Multiplayer is disabled in config.json');
    process.exit(0);
  }

  const server = new GameServer(config);
  server.start();
}

main().catch((error) => {
  console.error('❌ Server crashed:', error);
  process.exit(1);
});
