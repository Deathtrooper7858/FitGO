import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';
import { reportError } from '../utils/errorReporter';
import { useNetworkStore } from './networkStore';

export interface SyncTask {
  id: string;
  table: string;
  method: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
  payload: any;
  matchCriteria?: any; // Para UPDATE o DELETE
  rpcName?: string; // Para RPC
  createdAt: number;
  retries?: number;
}

const MAX_TASK_RETRIES = 3;

interface SyncState {
  queue: SyncTask[];
  isProcessing: boolean;
  enqueueTask: (task: Omit<SyncTask, 'id' | 'createdAt' | 'retries'>) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      enqueueTask: (task) => {
        const MAX_QUEUE_SIZE = 100;
        const MAX_TASK_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

        const now = Date.now();
        const newTask: SyncTask = {
          ...task,
          id: Crypto.randomUUID(),
          createdAt: now,
          retries: 0,
        };

        set((state) => {
          // Prune tasks older than 24h first, then cap to MAX_QUEUE_SIZE
          const validQueue = state.queue
            .filter(t => now - t.createdAt < MAX_TASK_AGE_MS)
            .slice(-(MAX_QUEUE_SIZE - 1)); // keep last N-1 to make room for new task
          console.log(`[SyncQueue] Tarea añadida a la cola: ${newTask.table} (${newTask.method})`);
          return { queue: [...validQueue, newTask] };
        });

        // Si hay internet, intentamos procesar inmediatamente
        if (useNetworkStore.getState().isInternetReachable) {
          get().processQueue();
        }
      },

      processQueue: async () => {
        const { queue, isProcessing } = get();
        if (isProcessing || queue.length === 0) return;
        if (!useNetworkStore.getState().isInternetReachable) return;

        set({ isProcessing: true });
        console.log(`[SyncQueue] Procesando ${queue.length} tareas pendientes...`);

        const remainingQueue = [...queue];
        
        // Procesamos por orden de antigüedad
        remainingQueue.sort((a, b) => a.createdAt - b.createdAt);

        for (const task of remainingQueue) {
          try {
            console.log(`[SyncQueue] Ejecutando tarea ${task.id} (${task.method} en ${task.table})...`);
            let error = null;

            if (task.method === 'INSERT') {
              const res = await supabase.from(task.table).insert(task.payload);
              error = res.error;
            } else if (task.method === 'UPDATE') {
              const res = await supabase.from(task.table).update(task.payload).match(task.matchCriteria);
              error = res.error;
            } else if (task.method === 'DELETE') {
              const res = await supabase.from(task.table).delete().match(task.matchCriteria);
              error = res.error;
            } else if (task.method === 'RPC' && task.rpcName) {
              const res = await supabase.rpc(task.rpcName, task.payload);
              error = res.error;
            }

            if (error) {
              const currentRetries = (task.retries || 0) + 1;
              reportError(error, { module: 'SyncQueue', action: `processTask.${task.method}`, extra: { taskId: task.id, table: task.table, retries: currentRetries } });

              if (currentRetries >= MAX_TASK_RETRIES) {
                console.warn(`[SyncQueue] Tarea ${task.id} superó el límite de ${MAX_TASK_RETRIES} reintentos. Descartando para no bloquear la cola.`);
                set((state) => ({
                  queue: state.queue.filter((t) => t.id !== task.id)
                }));
              } else {
                set((state) => ({
                  queue: state.queue.map((t) => (t.id === task.id ? { ...t, retries: currentRetries } : t))
                }));
                // Detener el procesamiento por este ciclo para evitar bucles rápidos
                break;
              }
            } else {
              console.log(`[SyncQueue] Tarea ${task.id} completada con éxito.`);
              // Eliminar la tarea completada de la cola
              set((state) => ({
                queue: state.queue.filter((t) => t.id !== task.id)
              }));
            }
          } catch (err) {
            const currentRetries = (task.retries || 0) + 1;
            reportError(err, { module: 'SyncQueue', action: 'processTask.exception', extra: { taskId: task.id, table: task.table, retries: currentRetries } });

            if (currentRetries >= MAX_TASK_RETRIES) {
              console.warn(`[SyncQueue] Tarea ${task.id} descartada tras ${MAX_TASK_RETRIES} excepciones consecutivas.`);
              set((state) => ({
                queue: state.queue.filter((t) => t.id !== task.id)
              }));
            } else {
              set((state) => ({
                queue: state.queue.map((t) => (t.id === task.id ? { ...t, retries: currentRetries } : t))
              }));
              break; // Detener proceso si hay excepción de red grave
            }
          }
        }

        set({ isProcessing: false });
        console.log(`[SyncQueue] Fin del procesamiento.`);
      },

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'fitgo-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
