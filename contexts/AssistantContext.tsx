import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { AssistantContextData, AssistantContextType } from '../types';

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [context, setContext] = useState<AssistantContextData | null>(null);

    const value = useMemo(() => ({
        context,
        setContext,
    }), [context]);

    return (
        <AssistantContext.Provider value={value}>
            {children}
        </AssistantContext.Provider>
    );
};

export const useAssistantContext = (): AssistantContextType => {
    const context = useContext(AssistantContext);
    if (context === undefined) {
        throw new Error('useAssistantContext must be used within an AssistantProvider');
    }
    return context;
};
