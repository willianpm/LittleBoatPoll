import { GuildSelectItemStyle } from '../utils/styles';

type Props = {
    guild : {
        id: string;
        name: string;
        face: string;
    }
}
export const GuildMenuItem = ({guild} : Props) => <GuildSelectItemStyle>
    <img 
        src={guild.face} 
        alt={guild.name} 
        width={40} 
        height={40}
        style={{borderRadius: '50%'}}
    />
    <p>{guild.name}</p>
</GuildSelectItemStyle>