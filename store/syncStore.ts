import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { useNetworkStore } from './networkStore';
import { reportError } from '../utils/errorReporter';

export interface SyncTask {
  id: string;
  table: string;
  method: 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
  payload: any;
  matchCriteria?: any; // Para UPDATE o DELETE
  rpcName?: string; // Para RPC
  createdAt: number;
}

interface SyncState {
  queue: SyncTask[];
  isProcessing: boolean;
  enqueueTask: (task: Omit<SyncTask, 'id' | 'createdAt'>) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      enqueueTask: (task) => {
        const newTask: SyncTask = {
          ...task,
          id: Math.random().toString(36).substring(2, 15),
          createdAt: Date.now(),
        };
        set((state) => ({ queue: [...state.queue, newTask] }));
        console.log(`[SyncQueue] Tarea añadida a la cola: ${newTask.table} (${newTask.method})`);
        
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
              reportError(error, { module: 'SyncQueue', action: `processTask.${task.method}`, extra: { taskId: task.id, table: task.table } });
              // Podríamos decidir si mantenerla o descartarla, por ahora si falla la mantenemos para reintentar luego
              // a menos que sea un error de validación claro, pero para este MVP la dejamos fallar y reintentar.
              // Detenemos la cola si hay un fallo para evitar desincronización
              break; 
            } else {
              console.log(`[SyncQueue] Tarea ${task.id} completada con éxito.`);
              // Eliminar la tarea completada de la cola
              set((state) => ({
                queue: state.queue.filter((t) => t.id !== task.id)
              }));
            }
          } catch (err) {
            reportError(err, { module: 'SyncQueue', action: 'processTask.exception', extra: { taskId: task.id, table: task.table } });
            break; // Detener proceso si hay excepción de red grave
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
