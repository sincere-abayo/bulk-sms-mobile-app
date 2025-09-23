import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  showOfflineWarning: () => void;
  hideOfflineWarning: () => void;
  isWarningVisible: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = isConnected;
      const nowConnected = state.isConnected ?? true;

      setIsConnected(nowConnected);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable);

      // Show warning when going offline
      if (wasConnected && !nowConnected) {
        setIsWarningVisible(true);
      }

      // Hide warning when coming back online
      if (!wasConnected && nowConnected) {
        setIsWarningVisible(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  const showOfflineWarning = () => {
    if (!isConnected) {
      setIsWarningVisible(true);
    }
  };

  const hideOfflineWarning = () => {
    setIsWarningVisible(false);
  };

  const value: NetworkContextType = {
    isConnected,
    connectionType,
    isInternetReachable,
    showOfflineWarning,
    hideOfflineWarning,
    isWarningVisible,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};