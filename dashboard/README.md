# Dashboard Backend Integration (Feature #16)

Esta pasta contém os serviços e controllers necessários para integração backend do Dashboard com o bot, conforme arquitetura planejada.

## Estrutura

- `services/csvService.js`: Parsing, validação e conversão de CSV para JSON.
- `services/botService.js`: Escrita segura de JSON para o bot.
- `controllers/csvController.js`: Endpoint para upload e processamento de CSV.

## Formato do CSV

O CSV entregue pelo frontend deve seguir esta especificação:

### Estrutura Obrigatória

**Delimitador:** ponto e vírgula (`;`)

**Colunas obrigatórias** (exatamente estas 4 colunas, nesta ordem):

1. `nome-da-enquete` - Texto do título da enquete
2. `opções` - Opções separadas por vírgula, barra ou pipe (`,` `|` `/`)
3. `max_votos` - Número inteiro positivo (quantidade máxima de votos por usuário)
4. `peso_mensalistas` - `sim` ou `nao` (se deve aplicar peso para mensalistas)

### Exemplo de CSV Válido

```csv
nome-da-enquete;opções;max_votos;peso_mensalistas
Enquete 1;Opção A,Opção B;2;sim
Enquete 2;Opção X,Opção Y,Opção Z;1;nao
Melhor filme;Star Wars,Matrix,Senhor dos Anéis;1;sim
```

## Diagrama do Payload do CSV

```
{
  "nome-da-enquete": string,
  "opções": string, // Opções separadas por vírgula, barra ou pipe
  "max_votos": number,
  "peso_mensalistas": "sim" | "nao"
}
```

Consulte `INTEGRATION_GUIDE.md` para detalhes sobre integração de comandos do bot via dashboard.
