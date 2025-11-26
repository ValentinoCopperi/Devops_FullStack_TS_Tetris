import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Board } from "../../components/Board";
import { colors } from "../../constants/colors"
import { useTicTacToe } from "../../hooks/useTicTacToe"
import { checkWinner } from "../../hooks/useWinner";
import { WinnerModal } from "../../components/WinnerModal";
import { Turn } from "../../components/Turn";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { WinnerCounts } from "../../components/WinnersCount";

function TetrisPage() {



    const { board, handleBoardChange, turn, reset, isComplete } = useTicTacToe();
    const { getHistorial, saveNewWinner } = useLocalStorage();
    const winner = checkWinner(board);

    const historial = getHistorial();

    // Guardar ganador cuando cambie
    useEffect(() => {
        if (winner !== null) {
            saveNewWinner(winner);
        }
    }, [winner, saveNewWinner]);

    return (
        <main
            style={{ backgroundColor: colors.bgPrimary }}
            className="min-h-screen flex flex-col items-center justify-center space-y-6 pt-16 pb-8"
        >

            <div className="text-5xl text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" as const, stiffness: 200 }}
                    className="text-6xl mb-4"
                >
                    🎮
                </motion.div>
                <h1
                    style={{ color: colors.textPrimary }}
                    className="font-bold text-4xl"
                >
                    Tic Tac Toe
                </h1>
                <p
                    style={{ color: colors.textSecondary }}
                    className="text-lg mt-2"
                >
                    Because why not? 🤷
                </p>
            </div>


            <Board
                board={board}
                handleBoardChange={handleBoardChange}
                turn={turn}
            />


            {
                !isComplete && (
                    <Turn
                        turn={turn}
                    />
                )
            }

            <WinnerCounts
                historial={historial}
            />

            {
                isComplete && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
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
                        🔄 New Game
                    </motion.button>
                )
            }


            {
                winner !== null && <WinnerModal winner={winner} reset={reset} />
            }


        </main>
    )
}

export default TetrisPage
