import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { getRedisUrl } from '$lib/server/services/env';
import type { EscalationJobData } from './types';

let redisConnection: IORedis | null = null;
let escalationQueue: Queue<EscalationJobData> | null = null;

function getRedisConnection(): IORedis {
  redisConnection ??= new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
  return redisConnection;
}

export function getEscalationQueue(): Queue<EscalationJobData> {
  escalationQueue ??= new Queue<EscalationJobData>('incident-escalation', {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 500
    }
  });
  return escalationQueue;
}
