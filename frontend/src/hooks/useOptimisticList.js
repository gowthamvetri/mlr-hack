import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { api } from '../services/api';
import { showErrorToast } from '../store/slices/uiSlice';

/**
 * Hook for handling optimistic list updates with RTK Query.
 * Provides create, update, and delete handlers with automatic rollback on error.
 * 
 * @param {string} queryKey - The RTK Query endpoint name (e.g., 'getPlacements')
 * @param {Object} options - Configuration options
 * @param {Function} options.getId - Function to get item ID (default: item => item._id)
 * @param {*} options.queryArg - Argument passed to the query (for cache key matching)
 * 
 * @example
 * const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticList('getPlacements');
 * 
 * // On create
 * await optimisticCreate(newItem, createMutationFn);
 * 
 * // On update
 * await optimisticUpdate(id, updates, updateMutationFn);
 * 
 * // On delete
 * await optimisticDelete(id, deleteMutationFn);
 */
export const useOptimisticList = (queryKey, options = {}) => {
  const dispatch = useAppDispatch();
  const { getId = (item) => item._id, queryArg = undefined } = options;

  /**
   * Optimistically add an item to the list
   */
  const optimisticCreate = useCallback(
    async (newItem, mutationFn) => {
      // Generate temp ID for optimistic item
      const tempId = 'temp-' + Date.now();
      const optimisticItem = { ...newItem, _id: tempId, isOptimistic: true };

      // Optimistically update cache
      const patchResult = dispatch(
        api.util.updateQueryData(queryKey, queryArg, (draft) => {
          draft.unshift(optimisticItem);
        })
      );

      try {
        // Perform actual mutation
        const result = await mutationFn(newItem);
        return result;
      } catch (error) {
        // Rollback on error
        patchResult.undo();
        dispatch(showErrorToast(error.message || 'Failed to create item'));
        throw error;
      }
    },
    [dispatch, queryKey, queryArg]
  );

  /**
   * Optimistically update an item in the list
   */
  const optimisticUpdate = useCallback(
    async (id, updates, mutationFn) => {
      // Optimistically update cache
      const patchResult = dispatch(
        api.util.updateQueryData(queryKey, queryArg, (draft) => {
          const index = draft.findIndex((item) => getId(item) === id);
          if (index !== -1) {
            draft[index] = { ...draft[index], ...updates };
          }
        })
      );

      try {
        // Perform actual mutation
        const result = await mutationFn({ id, ...updates });
        return result;
      } catch (error) {
        // Rollback on error
        patchResult.undo();
        dispatch(showErrorToast(error.message || 'Failed to update item'));
        throw error;
      }
    },
    [dispatch, queryKey, queryArg, getId]
  );

  /**
   * Optimistically remove an item from the list
   */
  const optimisticDelete = useCallback(
    async (id, mutationFn) => {
      // Store the deleted item for rollback
      let deletedItem = null;
      let deletedIndex = -1;

      // Optimistically remove from cache
      const patchResult = dispatch(
        api.util.updateQueryData(queryKey, queryArg, (draft) => {
          deletedIndex = draft.findIndex((item) => getId(item) === id);
          if (deletedIndex !== -1) {
            deletedItem = draft[deletedIndex];
            draft.splice(deletedIndex, 1);
          }
        })
      );

      try {
        // Perform actual mutation
        const result = await mutationFn(id);
        return result;
      } catch (error) {
        // Rollback on error
        patchResult.undo();
        dispatch(showErrorToast(error.message || 'Failed to delete item'));
        throw error;
      }
    },
    [dispatch, queryKey, queryArg, getId]
  );

  /**
   * Optimistically toggle a boolean property on an item
   */
  const optimisticToggle = useCallback(
    async (id, property, mutationFn) => {
      let previousValue = null;

      // Optimistically toggle in cache
      const patchResult = dispatch(
        api.util.updateQueryData(queryKey, queryArg, (draft) => {
          const item = draft.find((item) => getId(item) === id);
          if (item) {
            previousValue = item[property];
            item[property] = !item[property];
          }
        })
      );

      try {
        // Perform actual mutation
        const result = await mutationFn(id);
        return result;
      } catch (error) {
        // Rollback on error
        patchResult.undo();
        dispatch(showErrorToast(error.message || 'Failed to update item'));
        throw error;
      }
    },
    [dispatch, queryKey, queryArg, getId]
  );

  return {
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    optimisticToggle,
  };
};

export default useOptimisticList;
