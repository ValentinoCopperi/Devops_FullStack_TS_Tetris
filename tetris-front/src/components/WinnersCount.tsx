import { colors } from "../constants/colors"

interface WinnerProps {

    historial: Record<number, number>

}

export const WinnerCounts = ({ historial }: WinnerProps) => {


    return (
        <div
            style={{ 
                backgroundColor: colors.cardBg, 
                color: colors.textPrimary,
                borderColor: colors.border
            }}
            className="absolute top-20 left-3 flex text-xl items-center justify-center rounded-xl p-4 border shadow-lg"
        >
            <span className="mr-3 text-2xl">📊</span>

            {
                Object.entries(historial).map(([player, wins]) => {

                    const playerText = Number(player) === 1 ? "X" : "O"
                    const textColor = Number(player) === 1 ? colors.playerX : colors.playerO

                    return (
                        <p
                            key={player}
                            className="mx-3 font-semibold"
                        >
                            <span style={{color : textColor}} className="text-2xl font-bold">{playerText}</span>
                            <span className="mx-1">:</span>
                            <span style={{color: colors.cyan}} className="font-bold">{wins}</span>
                        </p>
                    )


                })
            }


        </div>
    )


}