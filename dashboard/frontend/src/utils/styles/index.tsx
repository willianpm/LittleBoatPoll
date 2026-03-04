import styled from 'styled-components'

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
    padding: 50px 0
`;

export const GuildSelectItemStyle = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 20px;
    background-color: #424549;
    border-radius: 5px;
    border: 1px solid #36393e;
    margin: 8px 0;
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
    box-sizing: border-box;
    border-bottom: 1px solid #36393e;
`;

export const AppMenuTitle = styled.p`
    font-size: 22px;
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

export const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    row-gap: 4px;
`;