import { AppMenuNavbar, AppMenuTitle } from "../utils/styles"
import DummyFace from "../assets/img/dummy.png"
import { useNavigate } from "react-router-dom"

export const AppBar = () => {
	
	const navigate = useNavigate();
	
	return (
		<AppMenuNavbar>
			<div onClick={() => navigate('/dashboard/menu')} style={{cursor:"pointer"}}>
				<AppMenuTitle>Dashboard</AppMenuTitle>
			</div>
			<div>
				<img 
					src={DummyFace} 
					height={45} 
					width={45} 
					style={{borderRadius: '50%'}}
					alt="guild-face"
				/>		
			</div>
		</AppMenuNavbar>
	)
}