import { createContext, useEffect, useState } from "react";
import type { AuthUser } from "../types/auth";
import { AuthService } from "../auth/auth.service";


export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        const initUser = async () => {
            setLoading(true);
            try {
                const user = AuthService.validateToken();
                if (user) {
                    setUser({
                        id: '1',
                        email: 'test@test.com',
                        username: 'test',
                        role: ['ADMIN'],
                    });
                }
            } catch (error) {
                setError(error as string);
            } finally {
                setLoading(false);
            }
        }

        initUser();

    }, [])


    const logout = () => {
        AuthService.removeToken();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, error, logout }}>
            {children}
        </AuthContext.Provider>
    )
}


export { AuthContext, AuthProvider };