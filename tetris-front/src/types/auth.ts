

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    role: Roles[];
}


export type Roles = 'ADMIN' | 'USER';
