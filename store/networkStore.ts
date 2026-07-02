import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  initNetworkListener: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true, // Asumimos true inicialmente
  isInternetReachable: true,
  
  initNetworkListener: () => {
    return NetInfo.addEventListener((state) => {
      set({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    });
  }
}));
