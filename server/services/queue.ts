import { storage } from '../storage';
import { DeeplinkService } from './deeplink';

interface MessageJob {
  messageId: string;
  instanceId: string;
  to: string;
  text: string;
  mediaUrl?: string;
}

// Simple in-memory queue as fallback when Redis is not available
class SimpleQueue {
  private jobs: MessageJob[] = [];
  private processing = false;

  async add(messageData: MessageJob): Promise<void> {
    this.jobs.push(messageData);
    this.process();
  }

  async addBulk(messages: MessageJob[]): Promise<void> {
    this.jobs.push(...messages);
    this.process();
  }

  private async process() {
    if (this.processing || this.jobs.length === 0) return;
    
    this.processing = true;
    
    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (job) {
        try {
          await QueueService.processMessageSync(job);
        } catch (error) {
          console.error('Failed to process message:', error);
        }
        // Add small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.processing = false;
  }

  getStats() {
    return {
      waiting: this.jobs.length,
      active: this.processing ? 1 : 0,
      completed: 0,
      failed: 0,
    };
  }
}

export class QueueService {
  private static queue = new SimpleQueue();

  static async init() {
    console.log('Queue service initialized with in-memory fallback');
  }

  static async queueMessage(messageData: MessageJob): Promise<null> {
    await this.queue.add(messageData);
    return null;
  }

  static async queueMessages(messages: MessageJob[]): Promise<[]> {
    await this.queue.addBulk(messages);
    return [];
  }

  static async processMessageSync(messageData: MessageJob) {
    const { messageId, to, text, mediaUrl } = messageData;

    try {
      // Update message status to processing
      await storage.updateMessage(messageId, { 
        status: 'queued',
        meta: { processedAt: new Date().toISOString() }
      });

      // Generate deeplink
      const deeplink = DeeplinkService.generateDeeplink(to, text, mediaUrl);
      
      // Update message with deeplink
      await storage.updateMessage(messageId, {
        meta: { 
          deeplink,
          generatedAt: new Date().toISOString()
        }
      });

      console.log(`Message ${messageId} processed successfully`);
    } catch (error) {
      console.error(`Failed to process message ${messageId}:`, error);
      
      // Update message status to failed
      await storage.updateMessage(messageId, { 
        status: 'failed',
        meta: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  static async getQueueStats() {
    return this.queue.getStats();
  }

  static async removeJob(jobId: string) {
    console.warn('Job removal not supported in simple queue mode');
  }
}