'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface ConfirmationContextType {
  confirmedFields: Set<string>;
  confirmedValues: Map<string, any>;
  localValues: Map<string, any>; // Track all local changes, not just confirmed ones
  totalFields: number;
  confirmField: (fieldId: string, value?: any) => void;
  unconfirmField: (fieldId: string) => void;
  updateLocalValue: (fieldId: string, value: any) => void; // New function to track local changes
  setTotalFields: (count: number) => void;
  resetTotalFields: () => void;
  allFieldsConfirmed: boolean;
  getConfirmedData: () => Record<string, any>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());
  const [confirmedValues, setConfirmedValues] = useState<Map<string, any>>(new Map());
  const [localValues, setLocalValues] = useState<Map<string, any>>(new Map());
  const [totalFields, setTotalFields] = useState(0);

  const confirmField = (fieldId: string, value?: any) => {
    setConfirmedFields(prev => new Set([...prev, fieldId]));
    if (value !== undefined) {
      setConfirmedValues(prev => new Map([...prev, [fieldId, value]]));
    }
  };

  const unconfirmField = (fieldId: string) => {
    setConfirmedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });
    setConfirmedValues(prev => {
      const newMap = new Map(prev);
      newMap.delete(fieldId);
      return newMap;
    });
  };

  const updateLocalValue = (fieldId: string, value: any) => {
    setLocalValues(prev => new Map([...prev, [fieldId, value]]));
  };

  const setTotalFieldsCount = (count: number) => {
    setTotalFields(prev => prev + count);
  };

  const resetTotalFields = () => {
    setTotalFields(0);
  };

  const getConfirmedData = () => {
    const data: Record<string, any> = {};
    confirmedValues.forEach((value, fieldId) => {
      data[fieldId] = value;
    });
    return data;
  };

  const allFieldsConfirmed = totalFields > 0 && confirmedFields.size >= totalFields;

  return (
    <ConfirmationContext.Provider value={{
      confirmedFields,
      confirmedValues,
      localValues,
      totalFields,
      confirmField,
      unconfirmField,
      updateLocalValue,
      setTotalFields: setTotalFieldsCount,
      resetTotalFields,
      allFieldsConfirmed,
      getConfirmedData
    }}>
      {children}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}
