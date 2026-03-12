import AppCreateForm from '../../modules/forms/AppCreateForm';
import { AppMenuTitle, Flex } from '../../utils/styles';

export const CreateDraftPage = () => {
  return (
    <div>
      <Flex alignItems="center" justifyContent="space-between">
        <div></div>
        <Flex alignItems="flex-start" flexDirection="column" style={{ width: '840px' }}>
          <AppMenuTitle>Criação de Rascunho [W.I.P.]</AppMenuTitle>
          <AppCreateForm />
        </Flex>
        <div></div>
      </Flex>
    </div>
  );
};
