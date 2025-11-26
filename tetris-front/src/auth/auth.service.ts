import type { AuthUser } from "../types/auth";

export class AuthService {


    static getToken(): string | null {
        return localStorage.getItem('token');
    }


    static removeToken(): void {
        localStorage.removeItem('token');
    }

    static setToken(token: string): void {
        localStorage.setItem('token', token);
    }


    static validateToken(): AuthUser | null {
       //Todo: Api Call to validate token
       return null;
    }


}