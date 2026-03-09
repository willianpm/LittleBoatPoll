import { useContext } from "react"
import { GuildContext } from "../utils/contexts/GuildContext"
import { AppMenuContainer, AppMenuTitle, ConfigMenuButton, Flex, Grid } from "../utils/styles"
import { IoFileTrayStackedOutline, IoDuplicateOutline, IoEye, IoMedal, IoTrashOutline, IoRadioOutline, IoCreate, IoPaperPlane, IoOptionsOutline, IoPeopleCircleOutline, IoPeopleCircle } from "react-icons/io5"
import { useNavigate } from "react-router-dom"

export const MenuPage = () => {    
  const { guildId } = useContext(GuildContext);
	const navigate = useNavigate();

	return (
		<div>
			<AppMenuContainer>
				<Flex alignItems="center" justifyContent="space-between" style={{marginTop: '20px'}}>
					<AppMenuTitle>Active Polls</AppMenuTitle>
					<IoRadioOutline size={35} />
				</Flex>
				<Flex alignItems="center">
					<Grid rowGap="4px" gridTemplateColumns="1fr 1fr 1fr 1fr 1fr">
						<ConfigMenuButton onClick={() => navigate('/dashboard/poll/create')}>
							<div>
								<IoDuplicateOutline size={60}/>
							</div>
							<span>Create</span>
						</ConfigMenuButton>
						<ConfigMenuButton onClick={() => navigate('/dashboard/poll/active')}>
							<div>
								<IoEye size={60} />
							</div>
							<span>View</span>
						</ConfigMenuButton>
						<ConfigMenuButton onClick={() => navigate('/dashboard/poll/end')}>
							<div>
								<IoMedal size={60} />
							</div>
							<span>End</span>
						</ConfigMenuButton>
					</Grid>
				</Flex>
				
				<Flex alignItems="center" justifyContent="space-between" style={{marginTop: '10px'}}>
					<AppMenuTitle>Draft</AppMenuTitle>
					<IoFileTrayStackedOutline size={35} />
				</Flex>
				<Flex alignItems="center">
					<Grid rowGap="4px" gridTemplateColumns="1fr 1fr 1fr 1fr 1fr">
						<ConfigMenuButton onClick={() => navigate('/dashboard/draft/create')}>
							<div>
								<IoDuplicateOutline size={60}/>
							</div>
							<span>Create</span>
						</ConfigMenuButton>
						<ConfigMenuButton onClick={() => navigate('/dashboard/draft/edit')}>
							<div>
								<IoCreate size={60}/>
							</div>
							<span>Edit</span>
						</ConfigMenuButton>
						<ConfigMenuButton onClick={() => navigate('/dashboard/draft/send')}>
							<div>
								<IoPaperPlane size={60}/>
							</div>
							<span>Send</span>
						</ConfigMenuButton>
						<ConfigMenuButton onClick={() => navigate('/dashboard/draft/delete')}>
							<div>
								<IoTrashOutline size={60}/>
							</div>
							<span>Delete</span>
						</ConfigMenuButton>
					</Grid>
				</Flex>

				<Flex alignItems="center" justifyContent="space-between" style={{marginTop: '10px'}}>
					<AppMenuTitle>Administrator</AppMenuTitle>
					<IoOptionsOutline size={35} />
				</Flex>
				<Flex alignItems="center">
					<Grid rowGap="4px" gridTemplateColumns="1fr 1fr 1fr 1fr 1fr">
						<ConfigMenuButton onClick={() => navigate('/dashboard/admin/mensalistas')}>
							<div>
								<IoPeopleCircleOutline size={60}/>
							</div>
							<span>Mensalistas</span>
						</ConfigMenuButton>
						<ConfigMenuButton onClick={() => navigate('/dashboard/admin/criadores')}>
							<div>
								<IoPeopleCircle size={60}/>
							</div>
							<span>Criadores</span>
						</ConfigMenuButton>
					</Grid>
				</Flex>
			</AppMenuContainer>
		</div>
	)
}  