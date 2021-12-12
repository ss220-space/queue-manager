import { Queue, Worker, Job, QueueEvents, QueueScheduler } from 'bullmq';
import path from 'path';

// Create a new connection in every instance,
// because they require blocking connections to Redis,
// which makes it impossible to reuse them.

const fetchPlayersScheduler = new QueueScheduler('FetchPlayers', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

const fetchPlayersQueue = new Queue('FetchPlayers', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

// const processorFile = path.join(__dirname, 'jobs/fetchPlayers.js');
const processorFile = require('./jobs/fetchPlayers.ts');

const worker = new Worker(
  'FetchPlayers',
  processorFile,
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
);

// worker.on('error', (err) => {
//   // log the error
//   console.error(err);
// });

// worker.on('completed', (job) => {
//   console.log(`${job.id} has completed!`);
// });

// worker.on('failed', (job, err) => {
//   console.log(`${job.id} has failed with ${err.message}`);
// });

const queueEvents = new QueueEvents('FetchPlayers');

queueEvents.on('waiting', (jobId: string) => {
  console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on('completed', async (jobId: string, returnvalue: any) => {
  // Called every time a job is completed in any worker.
  console.log(`${jobId} has completed and returned ${returnvalue}`);
  await fetchPlayersQueue.remove(jobId);
});

queueEvents.on('failed', (jobId: string, failedReason: string) => {
  // jobId received a progress event
  console.log(`${jobId} has failed with reason ${failedReason}`);
});

queueEvents.on('progress', (jobId: string, progress: number | object, timestamp: any) => {
  // jobId received a progress event
  console.log(`${jobId} reported progress ${progress} at ${timestamp}`);
});

fetchPlayersQueue.add(
  'FetchPlayers',
  {},
  {
    repeat: {
      every: 5000,
    },
    jobId: 'fetchPlayers1',
  }
);
