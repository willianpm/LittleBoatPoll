import { useNavigate } from 'react-router-dom';
import { ConfigMenuButton } from '../utils/styles';

type Props = {
  guild: {
    id: string;
    name: string;
    face: string;
  };
};
export const GuildMenuItem = ({ guild }: Props) => {
  const navigate = useNavigate();

  return (
    <ConfigMenuButton onClick={() => navigate('/dashboard/poll/create')}>
      <div>
        <img src={guild.face} alt={guild.name} width={60} height={60} style={{ borderRadius: '50%' }} />
      </div>
      <span>{guild.name}</span>
    </ConfigMenuButton>
  );
};
