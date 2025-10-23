'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer } from 'react';

// Action types for the reducer
type ProductFormAction =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SET_INGREDIENT_ACTION'; field: string; action: 'not_in_product' | 'not_specified' }
  | { type: 'INITIALIZE_FORM'; formData: Record<string, string> }
  | { type: 'SET_CATEGORY'; category: string };

// State interface
interface ProductFormState {
  formData: Record<string, string>;
  category: string;
}

// Context type
interface ProductFormContextType {
  state: ProductFormState;
  setField: (field: string, value: string) => void;
  setIngredientAction: (field: string, action: 'not_in_product' | 'not_specified') => void;
  setCategory: (category: string) => void;
}

// Reducer function
function productFormReducer(state: ProductFormState, action: ProductFormAction): ProductFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value
        }
      };
    
    case 'SET_INGREDIENT_ACTION':
      const currentValue = state.formData[action.field];
      
      // If clicking the same button that's already active, clear it
      if ((action.action === 'not_in_product' && currentValue === 'not_in_product') ||
          (action.action === 'not_specified' && currentValue === 'not_specified')) {
        return {
          ...state,
          formData: {
            ...state.formData,
            [action.field]: ''
          }
        };
      }
      
      // Otherwise, set the new value
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.action === 'not_in_product' ? 'not_in_product' : 'not_specified'
        }
      };
    
    case 'INITIALIZE_FORM':
      return {
        ...state,
        formData: action.formData
      };
    
    case 'SET_CATEGORY':
      return {
        ...state,
        category: action.category
      };
    
    default:
      return state;
  }
}

// Create context
const ProductFormContext = createContext<ProductFormContextType | undefined>(undefined);

// Provider component
interface ProductFormProviderProps {
  children: ReactNode;
  initialFormData?: Record<string, string>;
  initialCategory?: string;
}

/**
 * Context provider for product form data using reducer pattern
 * Eliminates all prop drilling by managing state internally
 */
export function ProductFormProvider({ 
  children, 
  initialFormData = {},
  initialCategory = ''
}: ProductFormProviderProps) {
  console.log('ProductFormProvider - initialCategory:', initialCategory);
  console.log('ProductFormProvider - initialFormData:', initialFormData);
  
  const [state, dispatch] = useReducer(productFormReducer, {
    formData: initialFormData,
    category: initialCategory
  });
  
  console.log('ProductFormProvider - state after reducer:', state);
  
  // Update category when initialCategory changes
  useEffect(() => {
    if (initialCategory && initialCategory !== state.category) {
      console.log('ProductFormProvider - updating category from', state.category, 'to', initialCategory);
      dispatch({ type: 'SET_CATEGORY', category: initialCategory });
    }
  }, [initialCategory]); // Remove state.category dependency to prevent loops

  const setField = useCallback((field: string, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setIngredientAction = useCallback((field: string, action: 'not_in_product' | 'not_specified') => {
    dispatch({ type: 'SET_INGREDIENT_ACTION', field, action });
  }, []);

  const setCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_CATEGORY', category });
  }, []);

  return (
    <ProductFormContext.Provider value={{ state, setField, setIngredientAction, setCategory }}>
      {children}
    </ProductFormContext.Provider>
  );
}

/**
 * Hook to access product form context
 * Throws error if used outside of ProductFormProvider
 */
export function useProductForm() {
  const context = useContext(ProductFormContext);
  if (context === undefined) {
    throw new Error('useProductForm must be used within a ProductFormProvider');
  }
  return context;
}