
import React from 'react';
import Spinner from './Spinner';
import { RefreshIcon } from './icons';

interface GeneratedImageProps {
    isLoading: boolean | undefined;
    imageUrl: string | null | undefined;
    error: string | undefined;
    alt: string;
    onRegenerate: () => void;
    aspectRatioClass?: string;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({
    isLoading,
    imageUrl,
    error,
    alt,
    onRegenerate,
    aspectRatioClass = "aspect-video",
}) => {
    const baseContainerClass = `w-full bg-pink-100 rounded-lg flex items-center justify-center ${aspectRatioClass}`;

    if (isLoading) {
        return (
            <div className={baseContainerClass}>
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${baseContainerClass} bg-red-100 text-red-600 flex-col text-center p-4`}>
                <p className="font-semibold">{error}</p>
                <button onClick={onRegenerate} className="mt-2 px-4 py-2 text-xs bg-red-200 hover:bg-red-300 transition-colors rounded-full flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4" />
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    if (imageUrl) {
        return (
            <img 
                src={imageUrl} 
                alt={alt} 
                className={`w-full object-cover rounded-lg shadow-md border-4 border-white ${aspectRatioClass}`} 
            />
        );
    }

    return null;
};

export default GeneratedImage;