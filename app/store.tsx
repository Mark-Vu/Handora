"use client";
import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [liveData, setLiveData] = useState(0);
    return (
        <AppContext.Provider value={{ liveData, setLiveData }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppStore() {
    return useContext(AppContext);
}
