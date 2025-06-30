import { DatabaseProvider } from '@eshopper/database';
import cron, { ScheduledTask } from 'node-cron';

// Separate the business logic from scheduling
export const CleanupUnverifiedUsers = async (dbProvider: DatabaseProvider) => {
  const startTime = Date.now();

  try {
    console.log('[CLEANUP] Starting inactive session cleanup job');

    // Check if database is available
    if (!dbProvider.getPrisma()) {
      throw new Error('Database connection not available');
    }

    const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours

    const result = await dbProvider.getPrisma().users.deleteMany({
      where: {
        isVerified: false,
        createdAt: {
          lt: cutoffTime,
        },
      },
    });

    const duration = Date.now() - startTime;

    console.log(
      `[CLEANUP] Successfully deleted ${result.count} unverified users in ${duration}ms`
    );

    // Optional: Send metrics to monitoring service
    // await sendMetrics('session_cleanup', { deleted: result.count, duration });

    return { success: true, deletedCount: result.count, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error(
      `[CLEANUP] unverified user cleanup failed after ${duration}ms:`,
      {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }
    );

    // Optional: Send alert to monitoring service
    // await sendAlert('session_cleanup_failed', error);

    return { success: false, error: error.message, duration };
  }
};

// Cron job scheduler
export class UnverifiedUserCleanupJob {
  private task: ScheduledTask | null = null;
  private isRunning = false;
  private dbProvider: DatabaseProvider;

  constructor(dbProvider: DatabaseProvider) {
    this.dbProvider = dbProvider;
  }

  start() {
    if (this.task) {
      console.log('[CLEANUP] Job already scheduled');
      return;
    }

    this.task = cron.schedule(
      '0 * * * *',
      async () => {
        // Prevent overlapping executions
        if (this.isRunning) {
          console.warn(
            '[CLEANUP] Previous job still running, skipping execution'
          );
          return;
        }

        this.isRunning = true;

        try {
          await CleanupUnverifiedUsers(this.dbProvider);
        } finally {
          this.isRunning = false;
        }
      },
      {
        timezone: 'UTC', // Use UTC to avoid timezone issues
      }
    );

    this.task.start();
    console.log(
      '[CLEANUP] unverified user cleanup job scheduled to run every hour'
    );
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('[CLEANUP] unverified user cleanup job stopped');
    }
  }

  // For testing - run immediately
  async runNow() {
    return await CleanupUnverifiedUsers(this.dbProvider);
  }

  getStatus() {
    return {
      scheduled: !!this.task,
      running: this.isRunning,
    };
  }
}
