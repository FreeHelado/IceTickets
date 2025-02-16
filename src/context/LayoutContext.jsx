import { createContext, useContext, useState } from "react";

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    const [mostrarHeader, setMostrarHeader] = useState(true);

    return (
        <LayoutContext.Provider value={{ mostrarHeader, setMostrarHeader }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => useContext(LayoutContext);
