import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { colors } from "../constants/colors";
import { useState } from "react";

export const Navbar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const navLinks = [
        { path: "/", label: "Home", icon: "🏠" },
        { path: "/tetris", label: "Tic Tac Toe", icon: "🎮" }
    ];

    return (
        <nav
            style={{ 
                backgroundColor: colors.bgSecondary,
                borderBottomColor: colors.border,
                boxShadow: `0 2px 15px rgba(0, 0, 0, 0.5)`
            }}
            className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-lg bg-opacity-95"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center space-x-3"
                        >
                            <span className="text-3xl">🧪</span>
                            <div className="flex flex-col">
                                <span
                                    style={{ color: colors.textPrimary }}
                                    className="text-xl font-bold leading-tight"
                                >
                                    Playground
                                </span>
                                <span
                                    style={{ color: colors.textSecondary }}
                                    className="text-xs"
                                >
                                    just testing things
                                </span>
                            </div>
                        </motion.div>
                    </Link>

                  

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsOpen(!isOpen)}
                            style={{ color: colors.textPrimary }}
                            className="p-2"
                        >
                            {isOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0 }}
                style={{ 
                    backgroundColor: colors.bgSecondary,
                    overflow: "hidden"
                }}
                className="md:hidden"
            >
                <div className="px-4 py-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}>
                            <motion.div
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    backgroundColor: isActive(link.path) 
                                        ? colors.cardHover 
                                        : "transparent",
                                    color: isActive(link.path) 
                                        ? colors.cyan 
                                        : colors.textSecondary
                                }}
                                className="px-4 py-3 rounded-lg font-medium text-base flex items-center space-x-2"
                            >
                                <span>{link.icon}</span>
                                <span>{link.label}</span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </nav>
    );
};

