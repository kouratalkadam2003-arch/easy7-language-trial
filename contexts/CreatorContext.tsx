import React, { createContext, useContext, useState, useEffect } from 'react';

interface CreatorContextType {
    myCreatorId: string;
    viewingCreatorId: string | null;
    setViewingCreatorId: (id: string | null) => void;
    isCreatorMode: boolean; // True if viewing my own content
}

const CreatorContext = createContext<CreatorContextType | undefined>(undefined);

export const CreatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [myCreatorId, setMyCreatorId] = useState<string>('');
    const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);

    useEffect(() => {
        // Load or generate my unique Creator ID
        let storedId = localStorage.getItem('my_creator_id');
        if (!storedId) {
            // Generate a simple 6-char random ID (e.g., A7X29B)
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            storedId = '';
            for (let i = 0; i < 6; i++) {
                storedId += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            localStorage.setItem('my_creator_id', storedId);
        }
        setMyCreatorId(storedId);
    }, []);

    const isCreatorMode = viewingCreatorId === null || viewingCreatorId === myCreatorId;

    return (
        <CreatorContext.Provider value={{ 
            myCreatorId, 
            viewingCreatorId, 
            setViewingCreatorId,
            isCreatorMode
        }}>
            {children}
        </CreatorContext.Provider>
    );
};

export const useCreator = () => {
    const context = useContext(CreatorContext);
    if (!context) {
        throw new Error('useCreator must be used within a CreatorProvider');
    }
    return context;
};
