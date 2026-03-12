## Páginas
---
Manter nesta pasta somente o conteúdo estrutural da implementação do frontend do dashboard. Toda alteração deve ser documentada e a formatação dos arquivos deve respeitar a estrutura para clareza/organização do projeto.

### Estrutura
---
`faces/`: Indexadores Principais (Apresentação, Seletor de Servidores, Menu de Opções).\
├──`config/`: Funções de administrador.\
├──`draft/`: Estruturas relacionadas as funções "rascunho".\
└──`poll/`: Estruturas relacionadas as funções "enquete".

### Estilos
---
Evitar ao máximo edição manual de estilos css nos arquivos das páginas do dashboard, todas as páginas devem ser sempre reavaliadas mediante a possibilidade de implementação total utilizando `styled-components` para todos os componentes. Todos os componentes devem estar de acordo com `../utils/styles/`.