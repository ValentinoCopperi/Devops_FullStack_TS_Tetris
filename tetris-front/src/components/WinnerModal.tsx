
import { motion } from 'framer-motion';
import { colors } from '../constants/colors';

interface WinnerModalProps {
    winner: number;
    reset: () => void;
}

export const WinnerModal = ({ winner , reset}: WinnerModalProps) => {


    const ganador = winner === 1 ? "X" : "O"
    const textColor = winner === 1 ? colors.playerX : colors.playerO

    return (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed z-50 w-full h-full bg-black/90 backdrop-blur-sm flex items-center justify-center'
        >

            <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    delay: 0.1
                }}
                style={{ 
                    backgroundColor: colors.modalCard,
                    borderColor: colors.cyan,
                    boxShadow: `0 0 50px rgba(34, 211, 238, 0.3)`
                }}
                className='relative w-[500px] rounded-2xl border-2 shadow-2xl overflow-hidden'
            >
                {/* Efecto de brillo en el borde */}
                <div 
                    style={{ 
                        background: `radial-gradient(circle, ${textColor}40 0%, transparent 70%)`
                    }}
                    className='absolute inset-0 pointer-events-none'
                />

                {/* Contenido */}
                <div className='relative p-12 flex flex-col items-center justify-center space-y-6'>
                    {/* Trofeo animado */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                            type: "spring" as const, 
                            stiffness: 200, 
                            damping: 10,
                            delay: 0.2
                        }}
                        className='text-7xl'
                    >
                        🎉
                    </motion.div>

                    {/* Ícono de victoria animado */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            type: "spring" as const, 
                            stiffness: 200, 
                            damping: 10,
                            delay: 0.3
                        }}
                        style={{ color: textColor }}
                        className='text-8xl font-bold'
                    >
                        {ganador}
                    </motion.div>

                    {/* Título */}
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ color: colors.textPrimary }}
                        className='text-3xl font-bold text-center'
                    >
                        Player{' '}
                        <span 
                            style={{ color: textColor }}
                            className='font-extrabold'
                        >
                            {ganador}
                        </span>
                        {' '}Wins!
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        style={{ color: colors.cyan }}
                        className='text-xl font-semibold'
                    >
                        Congratulations! 🎮
                    </motion.p>

                    {/* Botón de reiniciar */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ 
                            background: colors.gradient1,
                            color: colors.textPrimary,
                            boxShadow: `0 4px 15px rgba(102, 126, 234, 0.4)`
                        }}
                        className='px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300'
                        onClick={reset}
                    >
                        🔄 Play Again
                    </motion.button>
                </div>
            </motion.div>

        </motion.div>

    )

}