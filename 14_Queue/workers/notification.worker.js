const { Worker, UnrecoverableError } = require('bullmq');
const { createWorkerConnection } = require('../config/redis');
const { QUEUES } = require('../queues');

const FAILURE_RATE = Number(process.env.NOTIFY_FAILURE_RATE ?? 0.4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Simulated email provider that fails randomly, like real ones do
async function sendEmail(job, to, body) {
    // Retrying can't fix bad data, so skip the remaining attempts
    if (!to) throw new UnrecoverableError('Missing recipient');

    await sleep(300);
    if (Math.random() < FAILURE_RATE) throw new Error('SMTP provider timeout');

    console.log(`[EMAIL] ${job.name}#${job.id} -> user ${to} | ${body}`);
    return { delivered: true };
}

const handlers = {
    outbid: (job) => {
        const { toUserId, playerName, newAmount } = job.data;
        return sendEmail(job, toUserId, `You were outbid on ${playerName}. New highest bid: ${newAmount}`);
    },
    won: (job) => {
        const { toUserId, playerName, finalAmount } = job.data;
        return sendEmail(job, toUserId, `You won ${playerName} for ${finalAmount}!`);
    },
};

function createNotificationWorker() {
    const worker = new Worker(
        QUEUES.NOTIFICATIONS,
        async (job) => {
            const handler = handlers[job.name];
            if (!handler) throw new UnrecoverableError(`Unknown job type: ${job.name}`);
            return handler(job);
        },
        { connection: createWorkerConnection(), concurrency: 5 } // up to 5 jobs in parallel
    );

    worker.on('completed', (job) => {
        console.log(`[notifications] ${job.name}#${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        const final = err instanceof UnrecoverableError || (job && job.attemptsMade >= (job.opts.attempts ?? 1));
        console.warn(
            `[notifications] ${job?.name}#${job?.id} failed ` +
            `(attempt ${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message} ` +
            (final ? '-> GAVE UP, kept in failed set' : '-> will retry with backoff')
        );
    });

    worker.on('error', (err) => console.error('[notifications] worker error:', err.message));
    return worker;
}

module.exports = createNotificationWorker;