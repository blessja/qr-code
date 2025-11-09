// src/services/offline-api.service.ts
import { offlineService } from './offline.service';
import config from '../config';

/**
 * Offline-aware API wrapper
 * Automatically queues operations when offline
 */
class OfflineAPIService {
  private baseURL = config.apiBaseUrl;

  /**
   * Worker Check-in with offline support
   */
  async checkIn(data: {
    workerID: string;
    workerName: string;
    blockName: string;
    rowNumber: string;
    jobType: string;
    allowMultipleWorkers?: boolean;
  }): Promise<{ success: boolean; message: string; queued?: boolean }> {
    // If online, try direct API call
    if (offlineService.isOnline()) {
      try {
        const response = await fetch(`${this.baseURL}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Check-in successful' };
        } else {
          const error = await response.json();
          return { success: false, message: error.message || 'Check-in failed' };
        }
      } catch (error) {
        console.error('Check-in error, queuing for later:', error);
        // If API call fails, queue it
        await offlineService.queueOperation('checkin', data);
        return {
          success: true,
          message: 'Check-in queued (connection issue)',
          queued: true,
        };
      }
    } else {
      // If offline, queue immediately
      await offlineService.queueOperation('checkin', data);
      return {
        success: true,
        message: 'Check-in queued (offline mode)',
        queued: true,
      };
    }
  }

  /**
   * Worker Check-out with offline support
   */
  async checkOut(data: {
    workerID: string;
    workerName: string;
    blockName: string;
    rowNumber: string;
    stockCount?: number;
    jobType: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean }> {
    if (offlineService.isOnline()) {
      try {
        const response = await fetch(`${this.baseURL}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Check-out successful' };
        } else {
          const error = await response.json();
          return { success: false, message: error.message || 'Check-out failed' };
        }
      } catch (error) {
        console.error('Check-out error, queuing for later:', error);
        await offlineService.queueOperation('checkout', data);
        return {
          success: true,
          message: 'Check-out queued (connection issue)',
          queued: true,
        };
      }
    } else {
      await offlineService.queueOperation('checkout', data);
      return {
        success: true,
        message: 'Check-out queued (offline mode)',
        queued: true,
      };
    }
  }

  /**
   * Clock In with offline support
   */
  async clockIn(data: {
    workerID: string;
    workerName: string;
    timezone?: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean }> {
    if (offlineService.isOnline()) {
      try {
        const response = await fetch(`${this.baseURL}/clockin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Clock-in successful' };
        } else {
          const error = await response.json();
          return { success: false, message: error.message || 'Clock-in failed' };
        }
      } catch (error) {
        console.error('Clock-in error, queuing for later:', error);
        await offlineService.queueOperation('clockin', data);
        return {
          success: true,
          message: 'Clock-in queued (connection issue)',
          queued: true,
        };
      }
    } else {
      await offlineService.queueOperation('clockin', data);
      return {
        success: true,
        message: 'Clock-in queued (offline mode)',
        queued: true,
      };
    }
  }

  /**
   * Clock Out with offline support
   */
  async clockOut(data: {
    workerID: string;
    workerName: string;
    timezone?: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean }> {
    if (offlineService.isOnline()) {
      try {
        const response = await fetch(`${this.baseURL}/clockout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Clock-out successful' };
        } else {
          const error = await response.json();
          return { success: false, message: error.message || 'Clock-out failed' };
        }
      } catch (error) {
        console.error('Clock-out error, queuing for later:', error);
        await offlineService.queueOperation('clockout', data);
        return {
          success: true,
          message: 'Clock-out queued (connection issue)',
          queued: true,
        };
      }
    } else {
      await offlineService.queueOperation('clockout', data);
      return {
        success: true,
        message: 'Clock-out queued (offline mode)',
        queued: true,
      };
    }
  }

  /**
   * Fast Piecework with offline support
   */
  async fastPiecework(data: {
    workerID: string;
    workerName: string;
    rowNumber: string;
    blockName: string;
    jobType: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean }> {
    if (offlineService.isOnline()) {
      try {
        const response = await fetch(`${this.baseURL}/fast-piecework/fast-checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, message: result.message || 'Fast piecework entry successful' };
        } else {
          const error = await response.json();
          return { success: false, message: error.message || 'Fast piecework entry failed' };
        }
      } catch (error) {
        console.error('Fast piecework error, queuing for later:', error);
        await offlineService.queueOperation('fast-piecework', data);
        return {
          success: true,
          message: 'Fast piecework queued (connection issue)',
          queued: true,
        };
      }
    } else {
      await offlineService.queueOperation('fast-piecework', data);
      return {
        success: true,
        message: 'Fast piecework queued (offline mode)',
        queued: true,
      };
    }
  }

  /**
   * Get pending sync statistics
   */
  async getSyncStats() {
    return await offlineService.getQueueStats();
  }

  /**
   * Manually trigger sync
   */
  async manualSync() {
    return await offlineService.manualSync();
  }
}

export const offlineAPI = new OfflineAPIService();