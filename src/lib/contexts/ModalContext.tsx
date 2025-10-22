'use client';

import { createContext, ReactNode, useContext, useReducer } from 'react';

// Action types for modal reducer
type ModalAction =
  | { type: 'OPEN_MODAL'; id: string; props?: Record<string, any> }
  | { type: 'CLOSE_MODAL'; id: string }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'SET_MODAL_PROPS'; id: string; props: Record<string, any> };

// Modal state interface
interface ModalState {
  modals: Record<string, { isOpen: boolean; props: Record<string, any> }>;
}

// Initial state
const initialState: ModalState = {
  modals: {}
};

// Reducer function
function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.id]: {
            isOpen: true,
            props: action.props || {}
          }
        }
      };
    
    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.id]: {
            ...state.modals[action.id],
            isOpen: false
          }
        }
      };
    
    case 'CLOSE_ALL_MODALS':
      const closedModals = { ...state.modals };
      Object.keys(closedModals).forEach(id => {
        closedModals[id] = { ...closedModals[id], isOpen: false };
      });
      return {
        ...state,
        modals: closedModals
      };
    
    case 'SET_MODAL_PROPS':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.id]: {
            ...state.modals[action.id],
            props: { ...state.modals[action.id]?.props, ...action.props }
          }
        }
      };
    
    default:
      return state;
  }
}

// Context type
interface ModalContextType {
  state: ModalState;
  openModal: (id: string, props?: Record<string, any>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  setModalProps: (id: string, props: Record<string, any>) => void;
  isModalOpen: (id: string) => boolean;
  getModalProps: (id: string) => Record<string, any>;
}

// Create context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Provider component
interface ModalProviderProps {
  children: ReactNode;
}

/**
 * Modal management provider using reducer pattern
 * Centralizes modal state management across the app
 */
export function ModalProvider({ children }: ModalProviderProps) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModal = (id: string, props?: Record<string, any>) => {
    dispatch({ type: 'OPEN_MODAL', id, props });
  };

  const closeModal = (id: string) => {
    dispatch({ type: 'CLOSE_MODAL', id });
  };

  const closeAllModals = () => {
    dispatch({ type: 'CLOSE_ALL_MODALS' });
  };

  const setModalProps = (id: string, props: Record<string, any>) => {
    dispatch({ type: 'SET_MODAL_PROPS', id, props });
  };

  const isModalOpen = (id: string) => {
    return state.modals[id]?.isOpen || false;
  };

  const getModalProps = (id: string) => {
    return state.modals[id]?.props || {};
  };

  return (
    <ModalContext.Provider value={{
      state,
      openModal,
      closeModal,
      closeAllModals,
      setModalProps,
      isModalOpen,
      getModalProps
    }}>
      {children}
    </ModalContext.Provider>
  );
}

/**
 * Hook to access modal context
 * Throws error if used outside of ModalProvider
 */
export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

/**
 * Hook for specific modal management
 */
export function useModalState(id: string) {
  const { isModalOpen, getModalProps, openModal, closeModal, setModalProps } = useModal();
  
  return {
    isOpen: isModalOpen(id),
    props: getModalProps(id),
    open: (props?: Record<string, any>) => openModal(id, props),
    close: () => closeModal(id),
    setProps: (props: Record<string, any>) => setModalProps(id, props)
  };
}

// Common modal IDs for type safety
export const MODAL_IDS = {
  CONFIRM_DELETE: 'confirm-delete',
  EDIT_PRODUCT: 'edit-product',
  ADD_PRODUCT: 'add-product',
  USER_SETTINGS: 'user-settings',
  NOTIFICATION_SETTINGS: 'notification-settings',
  EXPORT_DATA: 'export-data',
  IMPORT_DATA: 'import-data',
  HELP: 'help',
  ABOUT: 'about'
} as const;
