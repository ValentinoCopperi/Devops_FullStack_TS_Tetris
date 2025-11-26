
import { colors } from './../constants/colors';

interface TurnProps {

    turn : number;

}

export const Turn = ( { turn } : TurnProps ) => {

    const turnText = turn === 1 ? "O" : "X"
    const textColor = turn === 1 ? colors.playerO : colors.playerX


    return (
        <div 
            style={{
                backgroundColor : colors.cardBg, 
                color : colors.textPrimary,
                borderColor: colors.border
            }}
            className='p-4 rounded-xl border shadow-lg'
        >
            <span className="text-base">🎮 Current Turn: </span>
            <span 
                style={{color : textColor}}
                className="text-xl font-bold mx-1"
            >
                {turnText}
            </span>
        </div>
    )
    
}