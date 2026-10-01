import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiContextType {
  API_URL: string;
  updateApiUrl: (newUrl: string) => void;
  counterId: string;
  setCounterId: (id: string) => void;
  userlevel: string;
  setUserlevel: (level: string) => void;
  unit: string;
  setUnit: (unit: string) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [API_URL, setAPI_URL] = useState('http://120.138.9.33:5000');
  const [counterId, setCounterIdState] = useState<string>('');
  const [userlevel, setUserlevelState] = useState<string>('');
  const [unit, setUnitState] = useState<string>(''); 

  useEffect(() => {
    (async () => {
      try {
        const savedApiUrl = await AsyncStorage.getItem('API_URL');
        if (savedApiUrl) setAPI_URL(savedApiUrl);

        const savedCounterId = await AsyncStorage.getItem('counterId');
        if (savedCounterId) setCounterIdState(savedCounterId);

        const savedUserlevel = await AsyncStorage.getItem('userlevel');
        if (savedUserlevel) setUserlevelState(savedUserlevel);

        const savedUnit = await AsyncStorage.getItem('unit'); 
        if (savedUnit) setUnitState(savedUnit);

      } catch (e) {
        console.error('Failed to load data from storage:', e);
      }
    })();
  }, []);

  const updateApiUrl = async (newUrl: string) => {
    try {
      setAPI_URL(newUrl);
      await AsyncStorage.setItem('API_URL', newUrl);
    } catch (e) {
      console.error('Failed to save API_URL to storage:', e);
    }
  };

  const setAndStoreCounterId = async (id: string) => {
    try {
      setCounterIdState(id);
      await AsyncStorage.setItem('counterId', id);
    } catch (e) {
      console.error('Failed to save counterId to storage:', e);
    }
  };

  const setAndStoreUserlevel = async (level: string) => {
    try {
      setUserlevelState(level);
      await AsyncStorage.setItem('userlevel', level);
    } catch (e) {
      console.error('Failed to save userlevel to storage:', e);
    }
  };

  const setAndStoreUnit = async (unit: string) => {  
    try {
      setUnitState(unit);
      await AsyncStorage.setItem('unit', unit);
    } catch (e) {
      console.error('Failed to save unit to storage:', e);
    }
  };

  return (
    <ApiContext.Provider
      value={{
        API_URL,
        updateApiUrl,
        counterId,
        setCounterId: setAndStoreCounterId,
        userlevel,
        setUserlevel: setAndStoreUserlevel,
        unit,
        setUnit: setAndStoreUnit,  
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
