/**
 * Lazy Asset Component
 * 
 * React component wrapper for lazy-loaded assets with loading indicators.
 * Requirements: 5.7
 */

import React, { useEffect, useState } from 'react';
import { getAssetLoader } from '../../utils/storage/assetLoader';

export interface LazyAssetProps {
  assetId: string;
  fallback?: React.ReactNode;
  onLoad?: (asset: any) => void;
  onError?: (error: Error) => void;
  children: (asset: any) => React.ReactNode;
}

/**
 * Lazy Asset Component
 * 
 * Loads an asset on mount and renders children with the loaded asset.
 * Shows fallback while loading.
 */
export const LazyAsset: React.FC<LazyAssetProps> = ({
  assetId,
  fallback = <div>Loading...</div>,
  onLoad,
  onError,
  children,
}) => {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loader = getAssetLoader();
    
    // Check if already loaded
    if (loader.isLoaded(assetId)) {
      const loadedAsset = loader.get(assetId);
      setAsset(loadedAsset);
      setLoading(false);
      onLoad?.(loadedAsset);
      return;
    }
    
    // Load asset
    setLoading(true);
    loader.load(assetId)
      .then(loadedAsset => {
        setAsset(loadedAsset);
        setLoading(false);
        onLoad?.(loadedAsset);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
        onError?.(err);
      });
  }, [assetId, onLoad, onError]);
  
  if (loading) {
    return <>{fallback}</>;
  }
  
  if (error) {
    return <div>Error loading asset: {error.message}</div>;
  }
  
  return <>{children(asset)}</>;
};

/**
 * Lazy Image Component
 * 
 * Specialized component for lazy-loaded images.
 */
export interface LazyImageProps {
  assetId: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
  onLoad?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  assetId,
  alt,
  className,
  style,
  fallback = <div className="animate-pulse bg-gray-700 rounded" style={style} />,
  onLoad,
}) => {
  return (
    <LazyAsset assetId={assetId} fallback={fallback} onLoad={onLoad}>
      {(img: HTMLImageElement) => (
        <img
          src={img.src}
          alt={alt}
          className={className}
          style={style}
        />
      )}
    </LazyAsset>
  );
};

/**
 * Loading Progress Component
 * 
 * Shows loading progress for multiple assets.
 */
export interface LoadingProgressProps {
  show: boolean;
  onComplete?: () => void;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  show,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState<string>('');
  
  useEffect(() => {
    if (!show) return;
    
    const loader = getAssetLoader();
    
    const updateProgress = () => {
      const prog = loader.getProgress();
      setProgress(prog.percentage);
      setCurrentAsset(prog.currentAsset || '');
      
      if (prog.percentage >= 100) {
        onComplete?.();
      }
    };
    
    loader.onProgress(updateProgress);
    updateProgress(); // Initial update
  }, [show, onComplete]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-80 p-6 bg-gray-800 rounded-xl">
        <div className="mb-4 text-center">
          <div className="text-2xl font-bold text-white mb-2">
            {Math.round(progress)}%
          </div>
          <div className="text-sm text-gray-400">
            {currentAsset || 'Loading assets...'}
          </div>
        </div>
        
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
