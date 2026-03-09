import AppCreateForm from '../../modules/forms/AppCreateForm';
import { AppMenuTitle, Flex } from '../../utils/styles/index';

export const CreatePollPage = () => {
  return (
    <div>
      <Flex alignItems='center' justifyContent='space-between'>
        <div></div>
        <Flex alignItems='flex-start' flexDirection='column' style={{ width: '840px'}}>
          <AppMenuTitle>Criação de Enquete [W.I.P.]</AppMenuTitle>
          <AppCreateForm />
        </Flex>
        <div></div>
      </Flex>
    </div>
  );
};
