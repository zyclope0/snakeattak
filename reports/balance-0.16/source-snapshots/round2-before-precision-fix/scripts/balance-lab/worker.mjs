import { parentPort } from 'node:worker_threads';
import { runCampaign } from './core.ts';
parentPort.on('message', (job) => parentPort.postMessage(runCampaign(job)));
