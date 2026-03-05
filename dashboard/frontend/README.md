# Frontend
---
Nesta pasta concentra-se o frontend do dashboard, desenvolvido em React + Typescript, que deve estar de acordo com a funções implementadas pela raiz do repositório.

## Estrutura de Diretórios

`public/` # Estáticos e demais arquivos web de interesse. Alterar somente se necessário. 
`src/` # Conteúdo de exibição do frontend.
├──`Dashboard.tsx` # Roteador React. 
├──`index.css` # Raiz de estilos da aplicação. Não é aconselhado alterar.
└──`index.tsx` # Indexador da aplicação React. Alterações nesse arquivo podem potencialmente quebrar a aplicação se não feitas com cuidado.

## Padrões de Código

- ESLint para linting de código
- Prettier para formatação consistente

## Como Contribuir?

1. Baixe ou clone a raiz do repositório.
2. Certifique-se de que o ponteiro do terminal está no diretório correto usando `cd ./dashboard/frontend` na raiz.
3. `npm install` para instalar todas as dependências.
4. `npm start` ou `npm run test`.
5. Siga as orientações previstas pelo projeto para contribuições.
5.1 `git checkout -b feature/nova-feature`
5.2 `git commit -m 'Adiciona nova feature'`
5.3 `git push origin feature/nova-feature`
5.4 Publique sua PR.

## Dependências Principais

- React ^19.2.4
- ReactDOM ^19.2.4
- React-Icons @5.4.0
- React-Router-DOM ^7.13.1
- Styled-Components ^6.3.11
- TypeScript ^4.9.5
