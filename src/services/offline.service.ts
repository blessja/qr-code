// src/services/offline.service.ts
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

// Types for offline operations
export interface OfflineOperation {
  id: string;
  type: 'checkin' | 'checkout' | 'clockin' | 'clockout' | 'fast-piecework';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
}

class OfflineService {
  private static instance: OfflineService;
  private syncInProgress = false;
  private networkStatus: NetworkStatus = { isOnline: true, connectionType: 'wifi' };
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private syncListeners: Array<(success: boolean, operation: OfflineOperation) => void> = [];

  private constructor() {
    this.initializeNetworkListener();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Initialize network status listener
   */
  private async initializeNetworkListener() {
    // Get initial network status
    const status = await Network.getStatus();
    this.networkStatus = {
      isOnline: status.connected,
      connectionType: status.connectionType,
    };

    // Listen for network changes
    Network.addListener('networkStatusChange', (status) => {
      const wasOffline = !this.networkStatus.isOnline;
      this.networkStatus = {
        isOnline: status.connected,
        connectionType: status.connectionType,
      };

      // Notify listeners
      this.notifyNetworkListeners(this.networkStatus);

      // Auto-sync when coming back online
      if (wasOffline && status.connected) {
        console.log('📶 Network restored, starting sync...');
        this.syncPendingOperations();
      }
    });
  }

  /**
   * Subscribe to network status changes
   */
  public onNetworkChange(callback: (status: NetworkStatus) => void) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.networkStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Subscribe to sync events
   */
  public onSync(callback: (success: boolean, operation: OfflineOperation) => void) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify network listeners
   */
  private notifyNetworkListeners(status: NetworkStatus) {
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(success: boolean, operation: OfflineOperation) {
    this.syncListeners.forEach(listener => listener(success, operation));
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.networkStatus.isOnline;
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Queue an operation for later sync
   */
  public async queueOperation(
    type: OfflineOperation['type'],
    data: any
  ): Promise<OfflineOperation> {
    const operation: OfflineOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    const queue = await this.getQueue();
    queue.push(operation);
    await this.saveQueue(queue);

    console.log(`📦 Queued ${type} operation:`, operation.id);
    return operation;
  }

  /**
   * Get all pending operations
   */
  public async getQueue(): Promise<OfflineOperation[]> {
    try {
      const { value } = await Preferences.get({ key: 'offline_queue' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error reading queue:', error);
      return [];
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(queue: OfflineOperation[]): Promise<void> {
    await Preferences.set({
      key: 'offline_queue',
      value: JSON.stringify(queue),
    });
  }

  /**
   * Get pending operations count
   */
  public async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter(op => op.status === 'pending').length;
  }

  /**
   * Sync all pending operations
   */
  public async syncPendingOperations(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return { success: 0, failed: 0 };
    }

    if (!this.isOnline()) {
      console.log('📵 Cannot sync - offline');
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const queue = await this.getQueue();
    const pendingOps = queue.filter(op => op.status === 'pending');

    if (pendingOps.length === 0) {
      console.log('✅ No operations to sync');
      this.syncInProgress = false;
      return { success: 0, failed: 0 };
    }

    console.log(`🔄 Syncing ${pendingOps.length} operations...`);
    let successCount = 0;
    let failedCount = 0;

    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        await this.saveQueue(queue);

        const success = await this.syncOperation(operation);
        
        if (success) {
          // Remove from queue
          const index = queue.findIndex(op => op.id === operation.id);
          if (index !== -1) {
            queue.splice(index, 1);
          }
          successCount++;
          this.notifySyncListeners(true, operation);
          console.log(`✅ Synced ${operation.type}:`, operation.id);
        } else {
          operation.status = 'failed';
          operation.retryCount++;
          failedCount++;
          this.notifySyncListeners(false, operation);
          
          // Remove if too many retries
          if (operation.retryCount >= 3) {
            console.log(`❌ Removing failed operation after 3 retries:`, operation.id);
            const index = queue.findIndex(op => op.id === operation.id);
            if (index !== -1) {
              queue.splice(index, 1);
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing operation ${operation.id}:`, error);
        operation.status = 'failed';
        operation.retryCount++;
        failedCount++;
        this.notifySyncListeners(false, operation);
      }

      await this.saveQueue(queue);
    }

    this.syncInProgress = false;
    console.log(`📊 Sync complete: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: OfflineOperation): Promise<boolean> {
    const apiBaseUrl = 'https://farm-server-02-production.up.railway.app/api';
    
    try {
      let endpoint = '';
      
      switch (operation.type) {
        case 'checkin':
          endpoint = '/checkin';
          break;
        case 'checkout':
          endpoint = '/checkout';
          break;
        case 'clockin':
          endpoint = '/clockin';
          break;
        case 'clockout':
          endpoint = '/clockout';
          break;
        case 'fast-piecework':
          endpoint = '/fast-piecework/fast-checkin';
          break;
        default:
          console.error('Unknown operation type:', operation.type);
          return false;
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.data),
      });

      return response.ok;
    } catch (error) {
      console.error('Error syncing operation:', error);
      return false;
    }
  }

  /**
   * Clear all pending operations (use with caution)
   */
  public async clearQueue(): Promise<void> {
    await Preferences.remove({ key: 'offline_queue' });
    console.log('🗑️ Queue cleared');
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    failed: number;
    oldestTimestamp: number | null;
  }> {
    const queue = await this.getQueue();
    
    const stats = {
      total: queue.length,
      pending: queue.filter(op => op.status === 'pending').length,
      syncing: queue.filter(op => op.status === 'syncing').length,
      failed: queue.filter(op => op.status === 'failed').length,
      oldestTimestamp: queue.length > 0 
        ? Math.min(...queue.map(op => op.timestamp))
        : null,
    };

    return stats;
  }

  /**
   * Manual sync trigger
   */
  public async manualSync(): Promise<{ success: number; failed: number }> {
    console.log('🔄 Manual sync triggered');
    return await this.syncPendingOperations();
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();