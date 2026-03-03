import { useContext } from "react"
import { GuildContext } from "../utils/contexts/GuildContext"

export const GuildSelectPage = () => {
    const {guildId} = useContext(GuildContext)
    
    return (
        <div>
            {guildId}
        </div>
    );
}  