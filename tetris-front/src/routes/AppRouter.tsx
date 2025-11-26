import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoutes";
import type { Roles } from "../types/auth";
import TetrisPage from "../pages/tetris/TetrisPage";
import HomePage from "../pages/home/HomePage";
import { PageLayout } from "../layout/PageLayout";

interface RouteObject {
    path: string;
    element: React.ReactNode;
    isProtected: boolean;
    roles: Roles[];
    children?: RouteObject[];
}


const publicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <HomePage />,
        isProtected: false,
        roles: ['ADMIN', 'USER'],
    },
    {
        path: '/tetris',
        element: <TetrisPage />,
        isProtected: true,
        roles: ['ADMIN', 'USER'],
    },  
]

const privateRoutes: RouteObject[] = [
    {
        path: '/games',
        element: <p>Games</p>,
        isProtected: true,
        roles: ['ADMIN'],
    },
]

const AppRoutes = () => {
    return (
        <PageLayout>
            <Routes>
                {publicRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={route.element}
                    />
                ))}

                {privateRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<ProtectedRoute roles={route.roles}>{route.element}</ProtectedRoute>}
                    />
                ))}

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </PageLayout>
    )
}

export default AppRoutes;