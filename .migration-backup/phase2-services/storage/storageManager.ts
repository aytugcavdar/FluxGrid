/**
 * @deprecated Use @core/services/storage/StorageService instead
 * This re-export will be removed in Phase 6
 */

export { 
  StorageService as StorageManager,
  storageService as storageManager,
  StorageKeys,
  StorageError,
  StorageErrorType,
  type StorageConfig,
  type StorageValue
} from '@core/services/storage/StorageService';

if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] Importing from @services/storage/storageManager is deprecated. ' +
    'Use @core/services/storage/StorageService instead.'
  );
}
