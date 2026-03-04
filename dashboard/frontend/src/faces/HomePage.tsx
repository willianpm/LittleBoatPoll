import { FaDiscord, FaCircleQuestion } from 'react-icons/fa6';
import { DefaultPageBody, MainMenuButton, MainMenuButtonContent, PseudoInfoBody } from '../utils/styles';
import { useNavigate } from 'react-router-dom';


export const HomePage = () => {
  
  const navigate = useNavigate();
  return (
    <DefaultPageBody>
      <div></div>
      <div>
        <MainMenuButton onClick={() => navigate('/guild')}>
          <FaDiscord size={40} color='7289da' />
          <MainMenuButtonContent>Login with Discord</MainMenuButtonContent>
        </MainMenuButton>
        <MainMenuButton style={{cursor:'help'}}>
          <FaCircleQuestion size={40} />
          <MainMenuButtonContent>Support the Server</MainMenuButtonContent>
        </MainMenuButton>
      </div>
      <PseudoInfoBody>
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>Contact Us</span>
      </PseudoInfoBody>
    </DefaultPageBody>
  )
}