import { createContext, useContext } from 'react';

// This is a compatibility wrapper for the Redux auth system
// The actual auth state is managed by Redux (store/slices/authSlice)
// This context exists to satisfy components that expect the AuthProvider wrapper

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    // Auth state is managed by Redux, so this just passes children through
    return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export default AuthContext;
