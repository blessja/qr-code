// src/services/sync.service.ts
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { v4 as uuidv4 } from 'uuid';

const getQueue = async (key: string): Promise<any[]> => {
  const { value } = await Preferences.get({ key });
  return value ? JSON.parse(value) : [];
};

const setQueue = async (key: string, data: any[]) => {
  await Preferences.set({ key, value: JSON.stringify(data) });
};

export class SyncService {
  constructor() {
    this.listenToNetwork();
  }

  async saveOffline(
    type: 'clockin' | 'clockout' | 'stock',
    data: any
  ) {
    const syncId = uuidv4();
    const key = `${type}_queue`;

    const entry = {
      syncId,
      ...data,
      type,
      synced: false,
    };

    const existing = await getQueue(key);
    existing.push(entry);

    await setQueue(key, existing);
  }

  async syncAll() {
    await this.syncType('clockin', '/api/sync/clockins');
    await this.syncType('clockout', '/api/sync/clockouts');
    await this.syncType('stock', '/api/sync/stocks');
  }

  private async syncType(type: string, url: string) {
    const key = `${type}_queue`;
    const queue = await getQueue(key);

    if (queue.length === 0) return;

    const unsynced = queue.filter(item => !item.synced);
    if (unsynced.length === 0) return;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unsynced),
      });

      const response: any[] = await res.json();

      const updated = queue.map(item => {
        const result = response.find(r => r.syncId === item.syncId);
        return result?.status === 'success' || result?.status === 'duplicate'
          ? { ...item, synced: true }
          : item;
      });

      await setQueue(key, updated);
    } catch (err) {
      console.error(`Sync failed for ${type}`, err);
    }
  }

  private listenToNetwork() {
    Network.addListener('networkStatusChange', async status => {
      if (status.connected) {
        console.log('Back online, syncing...');
        await this.syncAll();
      }
    });
  }
}
