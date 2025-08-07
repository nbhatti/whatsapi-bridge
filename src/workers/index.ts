#!/usr/bin/env node
/**
 * Standalone sync worker process
 * Can be run with PM2 or as a separate Node.js process
 */

import { startSyncWorkerProcess } from './syncWorker';

// Start the sync worker process
startSyncWorkerProcess().catch(error => {
  console.error('Failed to start sync worker:', error);
  process.exit(1);
});
