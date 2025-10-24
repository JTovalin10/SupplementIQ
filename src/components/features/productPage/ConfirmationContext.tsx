'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface ConfirmationContextType {
  confirmedFields: Set<string>;
  totalFields: number;
  confirmField: (fieldId: string) => void;
  unconfirmField: (fieldId: string) => void;
  setTotalFields: (count: number) => void;
  resetTotalFields: () => void;
  allFieldsConfirmed: boolean;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());
  const [totalFields, setTotalFields] = useState(0);

  const confirmField = (fieldId: string) => {
    setConfirmedFields(prev => new Set([...prev, fieldId]));
  };

  const unconfirmField = (fieldId: string) => {
    setConfirmedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });
  };

  const setTotalFieldsCount = (count: number) => {
    setTotalFields(prev => prev + count);
  };

  const resetTotalFields = () => {
    setTotalFields(0);
  };

  const allFieldsConfirmed = totalFields > 0 && confirmedFields.size >= totalFields;

  return (
    <ConfirmationContext.Provider value={{
      confirmedFields,
      totalFields,
      confirmField,
      unconfirmField,
      setTotalFields: setTotalFieldsCount,
      resetTotalFields,
      allFieldsConfirmed
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
