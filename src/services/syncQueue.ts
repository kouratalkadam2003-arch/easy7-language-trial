import { get, set } from 'idb-keyval';
import { Network } from '@capacitor/network';
import { upsertUserProgress, saveBasicUserData, addAppData, updateAppData } from '../../services/firebase';

interface SyncTask {
  id: string;
  type: 'UPSERT_PROGRESS' | 'SAVE_BASIC_USER' | 'ADD_APP_DATA' | 'UPDATE_APP_DATA';
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

const SYNC_QUEUE_KEY = 'lingoblue_sync_queue';

export const getSyncQueue = async (): Promise<SyncTask[]> => {
  const queue = await get<SyncTask[]>(SYNC_QUEUE_KEY);
  return queue || [];
};

export const saveSyncQueue = async (queue: SyncTask[]) => {
  await set(SYNC_QUEUE_KEY, queue);
};

export const addToSyncQueue = async (type: SyncTask['type'], payload: any) => {
  const queue = await getSyncQueue();
  const newTask: SyncTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };
  queue.push(newTask);
  await saveSyncQueue(queue);
  
  // Attempt sync immediately if online
  const status = await Network.getStatus();
  if (status.connected) {
    processSyncQueue();
  }
};

let isSyncing = false;

export const processSyncQueue = async () => {
  if (isSyncing) return;
  
  const status = await Network.getStatus();
  if (!status.connected) return;

  isSyncing = true;
  const queue = await getSyncQueue();
  const pendingTasks = queue.filter(t => t.status === 'pending' || t.status === 'failed');

  if (pendingTasks.length === 0) {
    isSyncing = false;
    return;
  }

  console.log(`Starting sync for ${pendingTasks.length} pending tasks...`);

  const updatedQueue = [...queue];

  for (const task of pendingTasks) {
    try {
      task.status = 'syncing';
      
      switch (task.type) {
        case 'UPSERT_PROGRESS':
          await upsertUserProgress(task.payload.userId, task.payload.userData);
          break;
        case 'SAVE_BASIC_USER':
          await saveBasicUserData(task.payload.userId, task.payload.email, task.payload.displayName);
          break;
        case 'ADD_APP_DATA':
          await addAppData(task.payload.userId, task.payload.collectionName, task.payload.data);
          break;
        case 'UPDATE_APP_DATA':
          await updateAppData(task.payload.userId, task.payload.collectionName, task.payload.docId, task.payload.data);
          break;
      }
      
      // Remove successful task from queue
      const idx = updatedQueue.findIndex(t => t.id === task.id);
      if (idx > -1) {
        updatedQueue.splice(idx, 1);
      }
    } catch (err) {
      console.error(`Sync task ${task.id} failed:`, err);
      task.status = 'failed';
    }
  }

  await saveSyncQueue(updatedQueue);
  isSyncing = false;
};

// Listen for network changes to automatically trigger sync
Network.addListener('networkStatusChange', status => {
  console.log('Network status changed', status.connected ? 'Online' : 'Offline');
  if (status.connected) {
    processSyncQueue();
  }
});
