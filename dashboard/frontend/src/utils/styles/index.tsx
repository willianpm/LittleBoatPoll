import styled from 'styled-components';

export const MainMenuButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  width: 300px;
  padding: 8px 24px;
  box-sizing: border-box;
  border-radius: 5px;
  margin: 4px 0;

  background-color: #424549;
  border: 1px solid #7289da;
`;

export const MainMenuButtonContent = styled.div`
  font-size: 18px;
`;

export const ConfigMenuButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 120px;
  height: 120px;
  padding: 20px 4px;
  box-sizing: border-box;
  border-radius: 5px;
  margin: 0 4px;

  background-color: #424549;
  border: 1px solid #7289da;
`;

export const DefaultPageBody = styled.div`
  height: 100%;
  padding: 100px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

export const PseudoInfoBody = styled.div`
  display: flex;
  width: 400px;
  justify-content: space-between;
  font-size: 14px;
`;

export const GuildSelectAppBody = styled.div`
  padding: 50px 0;
`;

export const AppMenuContainer = styled.div`
  width: 900px;
  margin: 0 auto;
`;

export const AppMenuNavbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 35px;
  background-color: #2f3337;
  box-sizing: border-box;
  border-bottom: 1px solid #36393e;
`;

export const AppMenuTitle = styled.p`
	color: whitesmoke;	
	font-weight: 800;
  font-size: 24px;
`;

export const FormButtonInput = styled.button`
  padding: 10px 20px;
  background-color: #7289da;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
`;
export const FormTextInput = styled.input`
  width: 500px;
  height: 32px;
  padding: 8px;
  background-color: #424549;
  color: #fff;
  border-radius: 4px;
  border: 2px solid #36393e;
  font-size: 16px;
	font-family: "Google Sans Code", monospace;

  &:focus {
    outline: none;
    border-color: #7289da;
  }
  &:hover {
    outline: none;
    border-color: #7289da;
  }

  &::placeholder {
    color: #f0f0f0;
    opacity: 0.8;
  }
`;

export const FormNumberInput = styled.input`
  width: 100px;
  height: 32px;
  padding: 8px;

  background-color: #424549;
  color: #fff;
  border-radius: 4px;
  border: 2px solid #36393e;
  font-size: 16px;
	font-family: "Google Sans Code", monospace;

  &:focus {
    outline: none;
    border-color: #7289da;
  }
  &:hover {
    outline: none;
    border-color: #7289da;
  }

	&::placeholder {
    color: #f0f0f0;
    opacity: 0.8;
  }
`;

export const FormSelectInput = styled.select`
  display: flex;
  align-items: center;
  width: 120px;
  height: 48px;
  padding: 4px;

  background-color: #424549;
  color: whitesmoke;
  box-sizing: border-box;
  border-radius: 4px;
  border: 2px solid #36393e;
  font-size: 16px;
	font-family: "Google Sans Code", monospace;

  -webkit-appearance: none;
  appearance: none;

  &:focus {
    outline: none;
    border-color: #7289da;
  }
  &:hover {
    outline: none;
    border-color: #7289da;
  }

	&::placeholder {
    color: whitesmoke;
    opacity: 0.75;
  }
`;

export const FormInputArea = styled.div`
  margin-bottom: 20px;
`;

export const FormLabel = styled.div`
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
`;

type FlexProps = Partial<{
  alignItems: string;
  justifyContent: string;
  flexDirection: string;
}>;

export const Flex = styled.div<FlexProps>`
  display: flex;
  align-items: ${({ alignItems }) => alignItems};
  justify-content: ${({ justifyContent }) => justifyContent};
  flex-direction: ${({ flexDirection }) => flexDirection};
`;

type GridProps = Partial<{
  alignItems: string;
  justifyContent: string;
  gridTemplateColumns: string;
  rowGap: string;
  columnGap: string;
}>;

export const Grid = styled.div<GridProps>`
  display: grid;
  align-items: ${({ alignItems }) => alignItems};
  justify-content: ${({ justifyContent }) => justifyContent};
  grid-template-columns: ${({ gridTemplateColumns }) => gridTemplateColumns};
  row-gap: ${({ rowGap }) => rowGap};
  column-gap: ${({ columnGap }) => columnGap};
`;
