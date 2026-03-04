import { AppMenuNavbar, AppMenuTitle } from "../utils/styles"
import DummyFace from "../assets/img/dummy.png"
import { useContext } from "react"
import { GuildContext } from "../utils/contexts/GuildContext"

export const AppBar = () => {
	const { guildId } = useContext(GuildContext)
	return (
		<AppMenuNavbar>
			<AppMenuTitle>Dashboard</AppMenuTitle>
			<img 
				src={DummyFace} 
				height={45} 
				width={45} 
				style={{borderRadius: '50%'}}
				alt="guild-face"
			/>		
		</AppMenuNavbar>
	)
}