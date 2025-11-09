// src/services/offline-api.service.ts
// IMPROVED VERSION: Try API first, queue only if it fails
import { offlineService } from './offline.service';
import config from '../config';

/**
 * Smart offline-aware API wrapper
 * ALWAYS tries the API first, only queues on failure
 */
class OfflineAPIService {
  private baseURL = config.apiBaseUrl;

  /**
   * Worker Check-in with smart offline handling
   * Tries API first, queues only if network fails
   */
  async checkIn(data: {
    workerID: string;
    workerName: string;
    blockName: string;
    rowNumber: string;
    jobType: string;
    allowMultipleWorkers?: boolean;
  }): Promise<{ success: boolean; message: string; queued?: boolean; data?: any }> {
    try {
      // ALWAYS TRY API FIRST - even if we think we're offline
      const response = await fetch(`${this.baseURL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        // Add timeout to fail fast if truly offline
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Check-in succeeded online');
        return { 
          success: true, 
          message: result.message || 'Check-in successful',
          data: result
        };
      } else {
        // API returned an error (like row already occupied)
        const error = await response.json();
        console.log('❌ Check-in failed with API error:', error.message);
        
        // DON'T QUEUE if it's a business logic error (409, 400, etc)
        // Only queue if it's a network error
        if (response.status === 409 || response.status === 400) {
          return { 
            success: false, 
            message: error.message || 'Check-in failed' 
          };
        }
        
        // For server errors (500, 503), queue it
        console.log('⚠️ Server error, queuing operation...');
        await offlineService.queueOperation('checkin', data);
        return {
          success: true,
          message: 'Check-in queued (server error - will retry)',
          queued: true,
        };
      }
    } catch (error: any) {
      // Network error (no connection, timeout, etc.)
      console.log('📵 Network error, queuing operation:', error.message);
      await offlineService.queueOperation('checkin', data);
      return {
        success: true,
        message: 'Check-in queued (no connection - will sync automatically)',
        queued: true,
      };
    }
  }

  /**
   * Worker Check-out with smart offline handling
   */
  async checkOut(data: {
    workerID: string;
    workerName: string;
    blockName: string;
    rowNumber: string;
    stockCount?: number;
    jobType: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean; data?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Check-out succeeded online');
        return { 
          success: true, 
          message: result.message || 'Check-out successful',
          data: result
        };
      } else {
        const error = await response.json();
        
        // Business logic errors - don't queue
        if (response.status === 409 || response.status === 400 || response.status === 404) {
          return { success: false, message: error.message };
        }
        
        // Server errors - queue
        await offlineService.queueOperation('checkout', data);
        return {
          success: true,
          message: 'Check-out queued (server error - will retry)',
          queued: true,
        };
      }
    } catch (error: any) {
      console.log('📵 Network error, queuing check-out:', error.message);
      await offlineService.queueOperation('checkout', data);
      return {
        success: true,
        message: 'Check-out queued (no connection - will sync automatically)',
        queued: true,
      };
    }
  }

  /**
   * Clock In with smart offline handling
   */
  async clockIn(data: {
    workerID: string;
    workerName: string;
    timezone?: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean; data?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/clockin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Clock-in succeeded online');
        return { 
          success: true, 
          message: result.message || 'Clock-in successful',
          data: result
        };
      } else {
        const error = await response.json();
        
        if (response.status === 400) {
          return { success: false, message: error.message };
        }
        
        await offlineService.queueOperation('clockin', data);
        return {
          success: true,
          message: 'Clock-in queued (server error - will retry)',
          queued: true,
        };
      }
    } catch (error: any) {
      console.log('📵 Network error, queuing clock-in:', error.message);
      await offlineService.queueOperation('clockin', data);
      return {
        success: true,
        message: 'Clock-in queued (no connection - will sync automatically)',
        queued: true,
      };
    }
  }

  /**
   * Clock Out with smart offline handling
   */
  async clockOut(data: {
    workerID: string;
    workerName: string;
    timezone?: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean; data?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/clockout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Clock-out succeeded online');
        return { 
          success: true, 
          message: result.message || 'Clock-out successful',
          data: result
        };
      } else {
        const error = await response.json();
        
        if (response.status === 400 || response.status === 404) {
          return { success: false, message: error.message };
        }
        
        await offlineService.queueOperation('clockout', data);
        return {
          success: true,
          message: 'Clock-out queued (server error - will retry)',
          queued: true,
        };
      }
    } catch (error: any) {
      console.log('📵 Network error, queuing clock-out:', error.message);
      await offlineService.queueOperation('clockout', data);
      return {
        success: true,
        message: 'Clock-out queued (no connection - will sync automatically)',
        queued: true,
      };
    }
  }

  /**
   * Fast Piecework with smart offline handling
   */
  async fastPiecework(data: {
    workerID: string;
    workerName: string;
    rowNumber: string;
    blockName: string;
    jobType: string;
  }): Promise<{ success: boolean; message: string; queued?: boolean; data?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/fast-piecework/fast-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Fast piecework succeeded online');
        return { 
          success: true, 
          message: result.message || 'Fast piecework entry successful',
          data: result
        };
      } else {
        const error = await response.json();
        
        // Don't queue business logic errors (row already complete, invalid data)
        if (response.status === 409 || response.status === 400 || response.status === 404) {
          return { success: false, message: error.message };
        }
        
        // Queue server errors
        await offlineService.queueOperation('fast-piecework', data);
        return {
          success: true,
          message: 'Fast piecework queued (server error - will retry)',
          queued: true,
        };
      }
    } catch (error: any) {
      console.log('📵 Network error, queuing fast piecework:', error.message);
      await offlineService.queueOperation('fast-piecework', data);
      return {
        success: true,
        message: 'Fast piecework queued (no connection - will sync automatically)',
        queued: true,
      };
    }
  }

  /**
   * Generic wrapper for any API call with offline support
   * Use this for custom operations not covered above
   */
  async makeOfflineRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    queueType?: string
  ): Promise<{ success: boolean; message: string; queued?: boolean; data?: T }> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, message: 'Success', data: result };
      } else {
        const error = await response.json();
        
        // Don't queue client errors (400-499)
        if (response.status >= 400 && response.status < 500) {
          return { success: false, message: error.message || 'Request failed' };
        }
        
        // Queue server errors if queueType provided
        if (queueType && method === 'POST') {
          await offlineService.queueOperation(queueType as any, data);
          return {
            success: true,
            message: 'Operation queued (server error)',
            queued: true,
          };
        }
        
        return { success: false, message: error.message || 'Request failed' };
      }
    } catch (error: any) {
      // Queue POST operations on network error
      if (queueType && method === 'POST' && data) {
        await offlineService.queueOperation(queueType as any, data);
        return {
          success: true,
          message: 'Operation queued (no connection)',
          queued: true,
        };
      }
      
      return { 
        success: false, 
        message: 'Network error: ' + (error.message || 'Unknown error')
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