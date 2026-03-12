import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuildContext } from "../utils/contexts/GuildContext"
import { AppMenuContainer, AppMenuTitle, Grid, GuildSelectAppBody } from '../utils/styles/index';
import { mockGuilds } from '../__mocks__/guilds';
import { GuildMenuItem } from '../modules/GuildMenuItem';

export const GuildSelectPage = () => {
	const navigate = useNavigate();
	const {updateGuildId} = useContext(GuildContext)
  const handler = (guildId: string) => {
		updateGuildId(guildId);
		navigate('/dashboard/menu');
	};

	return (
		<GuildSelectAppBody>
			<AppMenuContainer>
				<AppMenuTitle>Select Server</AppMenuTitle>
				<Grid 
					gridTemplateColumns='1fr 1fr 1fr 1fr' 
					justifyContent='space-around' 
					alignItems='center'
					style={{width:'400px'}}
				>
					{mockGuilds.map((guild) => (
						<div onClick={() => handler(guild.id)}>
							<GuildMenuItem guild={ guild }/>
						</div>
					))}
				</Grid>	
			</AppMenuContainer>
		</GuildSelectAppBody>
	);
}  