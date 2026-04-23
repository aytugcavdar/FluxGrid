/**
 * @deprecated Use @core/services/storage/StorageService instead
 * This re-export will be removed in Phase 6
 */

export { 
  StorageService as LocalStorageServiceClass,
  storageService as LocalStorageService,
  StorageKeys as STORAGE_KEYS,
  StorageError as LocalStorageError,
  StorageErrorType,
  type StorageConfig
} from '@core/services/storage/StorageService';

if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] Importing from @services/local/localStorageService is deprecated. ' +
    'Use @core/services/storage/StorageService instead.'
  );
}
