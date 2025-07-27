// src/app/services/sync.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { Network } from '@capacitor/network';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage, private http: HttpClient) {
    this.init();
    this.listenToNetwork();
  }

  async init() {
    this._storage = await this.storage.create();
  }

  async saveOffline(type: 'clockin' | 'clockout' | 'stock', data: any) {
    const syncId = uuidv4(); // unique ID
    const entry = {
      syncId,
      ...data,
      type,
      synced: false,
    };

    const key = `${type}_queue`;
    const existing = (await this._storage?.get(key)) || [];
    existing.push(entry);
    await this._storage?.set(key, existing);
  }

  async syncAll() {
    await this.syncType('clockin', '/api/sync/clockins');
    await this.syncType('clockout', '/api/sync/clockouts');
    await this.syncType('stock', '/api/sync/stocks');
  }

  private async syncType(type: string, url: string) {
    const key = `${type}_queue`;
    const queue = (await this._storage?.get(key)) || [];
    if (queue.length === 0) return;

    const unsynced = queue.filter((item: any) => !item.synced);
    if (unsynced.length === 0) return;

    try {
      const response: any[] = await this.http.post<any[]>(url, unsynced).toPromise();
      const updated = queue.map((item: any) => {
        const result = response.find(r => r.syncId === item.syncId);
        return result?.status === 'success' || result?.status === 'duplicate'
          ? { ...item, synced: true }
          : item;
      });
      await this._storage?.set(key, updated);
    } catch (err) {
      console.error(`Sync failed for ${type}`, err);
    }
  }

  private listenToNetwork() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        console.log('Back online, syncing...');
        await this.syncAll();
      }
    });
  }
}
