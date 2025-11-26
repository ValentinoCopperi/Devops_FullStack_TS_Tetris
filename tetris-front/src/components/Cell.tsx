import { colors } from "../constants/colors";
import { useTicTacToe } from "../hooks/useTicTacToe";

interface CellProps {

    value: number;
    rowIndex: number;
    collIndex: number;
    onClick: (row: number, col: number) => void
}


export const Cell = ({ value, rowIndex, collIndex, onClick }: CellProps) => {



    const handleClickCell = () => {

        onClick(rowIndex, collIndex)

    }
    
    const cellColor = value === 1 ? colors.playerX : colors.playerO;
    const isOccupied = value !== 0;

    return (
        <div
            style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                cursor: isOccupied ? 'not-allowed' : 'pointer'
            }}
            className={`flex items-center justify-center min-w-[120px] min-h-[120px] m-1 border transition-all duration-200 ease-in-out rounded-lg ${
                !isOccupied ? 'hover:bg-[#242938] hover:border-opacity-100 hover:scale-105' : ''
            }`}
            onClick={handleClickCell}
        >
            <p
                style={{ color: cellColor }}
                className={`text-5xl font-bold transition-all duration-200 ${
                    isOccupied ? 'scale-100' : ''
                }`}
            >
                {value !== 0 && (value === 1 ? "X" : "O")}
            </p>
        </div>
    )

}