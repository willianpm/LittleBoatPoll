import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuildContext } from "../utils/contexts/GuildContext"
import { AppMenuContainer, AppMenuTitle, GuildSelectAppBody } from '../utils/styles/index';
import { mockGuilds } from '../__mocks__/guilds';
import { GuildMenuItem } from '../modules/GuildSelectItem';

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
				<div>
					{mockGuilds.map((guild) => (
						<div onClick={() => handler(guild.id)}>
							<GuildMenuItem guild={ guild }/>
						</div>
					))}
				</div>	
			</AppMenuContainer>
		</GuildSelectAppBody>
	);
}  