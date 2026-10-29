const { notificationQueue, auctionCloseQueue } = require('../queues');
const AppError = require('../utils/AppError');

const STATES = ['waiting', 'active', 'delayed', 'completed', 'failed'];

exports.stats = async (req, res) => {
    const [notifications, auctionClose] = await Promise.all([
        notificationQueue.getJobCounts(...STATES),
        auctionCloseQueue.getJobCounts(...STATES),
    ]);
    res.json({ success: true, notifications, auctionClose });
};

// The "dead-letter" view: jobs that exhausted all attempts
exports.failed = async (req, res) => {
    const jobs = await notificationQueue.getFailed(0, 19);
    res.json({
        success: true,
        failed: jobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            attemptsMade: j.attemptsMade,
            failedReason: j.failedReason,
        })),
    });
};

// Replay a dead job once the underlying problem is fixed
exports.retryFailed = async (req, res) => {
    const job = await notificationQueue.getJob(req.params.id);
    if (!job) throw new AppError('Job not found', 404);
    await job.retry();
    res.json({ success: true, message: `Job ${job.id} re-queued` });
};

// Delayed jobs = future auction closes
exports.scheduled = async (req, res) => {
    const jobs = await auctionCloseQueue.getDelayed(0, 19);
    res.json({
        success: true,
        scheduled: jobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            runsAt: new Date(j.timestamp + (j.opts.delay || 0)),
        })),
    });
};