// src/components/OfflineIndicator.tsx
import React, { useState, useEffect } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { offlineService, NetworkStatus } from '../services/offline.service';

const OfflineIndicator: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    connectionType: 'wifi',
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribeNetwork = offlineService.onNetworkChange((status) => {
      setNetworkStatus(status);
      updatePendingCount();
    });

    // Subscribe to sync events
    const unsubscribeSync = offlineService.onSync((success, operation) => {
      updatePendingCount();
      if (success) {
        console.log(`✅ Successfully synced ${operation.type}`);
      } else {
        console.log(`❌ Failed to sync ${operation.type}`);
      }
    });

    // Initial count
    updatePendingCount();

    // Poll for count updates every 30 seconds
    const interval = setInterval(updatePendingCount, 30000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await offlineService.getPendingCount();
    setPendingCount(count);
  };

  const handleManualSync = async () => {
    if (isSyncing || !networkStatus.isOnline) return;
    
    setIsSyncing(true);
    setLastSyncResult(null);
    
    try {
      const result = await offlineService.manualSync();
      setLastSyncResult(result);
      await updatePendingCount();
      
      // Clear result message after 3 seconds
      setTimeout(() => setLastSyncResult(null), 3000);
    } catch (error) {
      console.error('Manual sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show anything if online with no pending operations
  if (networkStatus.isOnline && pendingCount === 0 && !lastSyncResult) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      {/* Network Status Badge */}
      {!networkStatus.isOnline && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <WifiOff size={18} color="#dc2626" />
          <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
            Offline Mode
          </span>
        </div>
      )}

      {/* Pending Operations Badge */}
      {pendingCount > 0 && (
        <div
          style={{
            backgroundColor: networkStatus.isOnline ? '#eff6ff' : '#fef3c7',
            border: `1px solid ${networkStatus.isOnline ? '#bfdbfe' : '#fde68a'}`,
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <AlertCircle
            size={18}
            color={networkStatus.isOnline ? '#2563eb' : '#d97706'}
          />
          <span
            style={{
              fontSize: '14px',
              color: networkStatus.isOnline ? '#1e40af' : '#92400e',
              fontWeight: '500',
            }}
          >
            {pendingCount} operation{pendingCount !== 1 ? 's' : ''} pending
          </span>
          
          {networkStatus.isOnline && (
            <IonButton
              size="small"
              fill="clear"
              onClick={handleManualSync}
              disabled={isSyncing}
              style={{
                '--padding-start': '8px',
                '--padding-end': '8px',
                height: '28px',
                margin: 0,
              }}
            >
              {isSyncing ? (
                <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
              ) : (
                <RefreshCw size={16} />
              )}
            </IonButton>
          )}
        </div>
      )}

      {/* Sync Result Message */}
      {lastSyncResult && (
        <div
          style={{
            backgroundColor: lastSyncResult.failed === 0 ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${lastSyncResult.failed === 0 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <Wifi
            size={18}
            color={lastSyncResult.failed === 0 ? '#16a34a' : '#dc2626'}
          />
          <span
            style={{
              fontSize: '14px',
              color: lastSyncResult.failed === 0 ? '#166534' : '#991b1b',
              fontWeight: '500',
            }}
          >
            {lastSyncResult.failed === 0
              ? `✓ Synced ${lastSyncResult.success} operation${lastSyncResult.success !== 1 ? 's' : ''}`
              : `⚠ ${lastSyncResult.success} synced, ${lastSyncResult.failed} failed`}
          </span>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;