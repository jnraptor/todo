import { SupabaseService } from './supabaseService';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  data: any;
  retries: number;
}

export class OfflineQueueService {
  private static QUEUE_KEY = 'todo_offline_queue';
  private static MAX_RETRIES = 3;
  
  static addToQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): void {
    const queue = this.getQueue();
    queue.push({
      ...operation,
      id: `queue_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0
    });
    this.saveQueue(queue);
  }
  
  static async processQueue(): Promise<void> {
    const queue = this.getQueue();
    const failedOps: QueuedOperation[] = [];
    
    for (const op of queue) {
      try {
        await this.processOperation(op);
      } catch (error) {
        console.error(`Failed to process queued operation:`, error);
        op.retries++;
        if (op.retries < this.MAX_RETRIES) {
          failedOps.push(op);
        } else {
          console.error(`Operation failed after ${this.MAX_RETRIES} retries:`, op);
        }
      }
    }
    
    this.saveQueue(failedOps);
  }
  
  static getQueueLength(): number {
    return this.getQueue().length;
  }
  
  static clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY);
  }
  
  private static async processOperation(op: QueuedOperation): Promise<void> {
    switch (op.type) {
      case 'create':
        await SupabaseService.createTodo(op.data.text);
        break;
      case 'update':
        await SupabaseService.updateTodo(op.data.id, op.data.updates);
        break;
      case 'delete':
        await SupabaseService.deleteTodo(op.data.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }
  
  private static getQueue(): QueuedOperation[] {
    const data = localStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  private static saveQueue(queue: QueuedOperation[]): void {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }
}