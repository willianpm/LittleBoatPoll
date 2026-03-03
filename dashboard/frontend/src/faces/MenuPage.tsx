import { mockGuilds } from "../__mocks__/guilds"

export const MenuPage = () => {    
    
    return (
        <div>
            <ul>
            {
                mockGuilds.map((guild)=> <li>{guild.name}</li>)
            }
            </ul>
        </div>
    )
}  