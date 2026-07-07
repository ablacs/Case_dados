# Análise de Usuários — Automação Orientada a Eventos

Solução para o case técnico de automação de processos orientada a eventos, consumindo a API pública [JSONPlaceholder](https://jsonplaceholder.typicode.com/) para análise dinâmica de usuários, posts e comentários.

## Índice

1. [Visão Geral](#visão-geral)
2. [Linguagens, Bibliotecas e Ferramentas](#linguagens-bibliotecas-e-ferramentas)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Fluxo de Eventos](#fluxo-de-eventos)
5. [Funcionalidades Implementadas (Tasks)](#funcionalidades-implementadas-tasks)
6. [Diferenciais Implementados](#diferenciais-implementados)
7. [Decisões Técnicas](#decisões-técnicas)
8. [Problemas Encontrados e Soluções](#problemas-encontrados-e-soluções)
9. [Como Executar](#como-executar)
10. [Como Rodar os Testes](#como-rodar-os-testes)

---

## Visão Geral

O sistema é uma tela de análise de usuários para um cenário simulado de sistema interno. A interface reage dinamicamente a eventos de interação — seleção de usuário, alteração de filtros — consumindo a API JSONPlaceholder e recalculando métricas em tempo real, sem necessidade de recarregar a página ou clicar em botões de confirmação (exceto para as ações explícitas de gerar/enviar relatório).

## Linguagens, Bibliotecas e Ferramentas

- **JavaScript (ES6+)**, usando Módulos ES nativos (`import`/`export`), sem framework e sem bundler — escolha deliberada, detalhada na seção de Decisões Técnicas.
- **Fetch API** nativa do navegador para consumo de HTTP (GET e POST).
- **Node.js test runner nativo** (`node --test`) para os testes unitários — sem dependência de Jest/Vitest.
- **Google Apps Script** (JavaScript rodando no ambiente do Google) para o diferencial de integração com Google Sheets.
- Nenhuma biblioteca externa de terceiros foi usada no código-fonte da aplicação (sem React, sem jQuery, sem SheetJS) — a geração de CSV foi implementada manualmente.

## Arquitetura do Sistema

O código é organizado em módulos com responsabilidades únicas e bem definidas, dentro da pasta `src/`:

```
case_dados_automacoes/
├── index.html                 → Template da interface (HTML fornecido, com ajustes)
├── package.json                → Metadados e script de testes
├── README.md                   → Este documento
└── src/
    ├── api.js                  → Toda comunicação HTTP (GET/POST) com a JSONPlaceholder
    ├── state.js                 → Estado central da aplicação (única fonte da verdade)
    ├── userData.js              → Busca posts + comentários de um usuário (com cache)
    ├── metrics.js                → Cálculo de métricas e regras de negócio (funções puras)
    ├── render.js                 → Manipulação do DOM (nenhuma lógica de negócio aqui)
    ├── report.js                  → Montagem de linhas do relatório e geração de CSV
    ├── googleSheets.js            → Integração com Google Sheets via Apps Script
    ├── main.js                    → Orquestração de eventos (ponto de entrada da aplicação)
    ├── metrics.test.js            → Testes unitários de metrics.js
    ├── report.test.js             → Testes unitários de report.js
    ├── api.test.js                → Testes unitários de api.js (com fetch mockado)
    └── googleSheets.test.js       → Testes unitários de googleSheets.js (com fetch mockado)
```

### Por que essa separação

- **`api.js`** isola toda a comunicação externa. Se a API mudar de endereço ou de formato de resposta, só esse arquivo muda.
- **`state.js`** centraliza os dados da aplicação, evitando variáveis soltas espalhadas por vários arquivos. Todo dado "bruto" (posts, comentários, filtros) mora aqui.
- **`metrics.js`** contém só funções puras (recebem dados, devolvem números/objetos, sem tocar em DOM ou rede) — o que as torna fáceis de testar isoladamente.
- **`render.js`** só sabe manipular HTML. Não sabe nada sobre API nem sobre regras de negócio — se o design da tela mudar, só esse arquivo é afetado.
- **`report.js`** e **`googleSheets.js`** isolam as duas formas de "saída" dos dados (arquivo local vs. envio para planilha), permitindo reaproveitar a mesma lógica de cálculo (`metrics.js`) sem duplicação.
- **`main.js`** é o único arquivo que conhece todos os outros — ele orquestra eventos e decide quem chama quem, mas delega todo o trabalho pesado para os módulos especializados.

## Fluxo de Eventos

O sistema é inteiramente orientado a eventos. Não há polling nem atualização automática por tempo — tudo é disparado por uma ação do usuário:

```
[Carregamento da página]
        │
        ▼
  GET /users ──────────────────────────► Popula <select> de usuários
        │
        ▼
[Usuário seleciona alguém no <select>]  (evento: change)
        │
        ▼
  GET /posts?userId=X
        │
        ▼
  GET /comments?postId=Y  (em paralelo, um por post, via Promise.all)
        │
        ▼
  Calcula métricas (posts, média de caracteres, média de comentários)
        │
        ▼
  Renderiza resultados na tela
        │
        ▼
[Usuário digita em "Mínimo de caracteres" ou "Mínimo de posts"]  (evento: input, com debounce de 300ms)
        │
        ▼
  Filtra os posts brutos já carregados (sem nova requisição)
        │
        ▼
  Recalcula métricas e status (Ativo/Inativo)
        │
        ▼
  Renderiza resultados atualizados
        │
        ▼
[Usuário clica em "Gerar Relatório"]  (evento: click)
        │
        ▼
  Busca (ou reaproveita do cache) dados de TODOS os usuários em paralelo
        │
        ▼
  Aplica os filtros atuais em cada usuário e monta as linhas do relatório
        │
        ▼
  Gera CSV e dispara o download no navegador
        │
        ▼
[Usuário clica em "Enviar Relatório"]  (evento: click)
        │
        ▼
  Monta as mesmas linhas do relatório e envia via POST /posts (simulação)
        │
        ▼
[Usuário clica em "Enviar para Google Sheets"]  (evento: click)
        │
        ▼
  Monta as mesmas linhas e envia via POST para o Google Apps Script Web App
```

## Funcionalidades Implementadas (Tasks)

### Task 1 — Carregamento Inicial

Ao iniciar a aplicação, o sistema realiza `GET /users`, armazena os dados em `state.users` e popula dinamicamente o `<select>` de usuários.

### Task 2 — Seleção de Usuário

Ao selecionar um usuário, o sistema busca seus posts (`GET /posts?userId=`) e, para cada post, seus comentários (`GET /comments?postId=`) — as buscas de comentários são feitas em paralelo via `Promise.all` para reduzir o tempo total de espera. São calculadas: quantidade de posts, média de caracteres dos posts e média de comentários por post.

### Task 3 — Alteração de Campos

Dois campos reagem em tempo real, sem necessidade de clique em botão:

- **Mínimo de caracteres do post**: filtra os posts considerados no cálculo de métricas.
- **Mínimo de posts para ser ativo**: define o status do usuário como "Ativo" ou "Inativo".

Ambos usam debounce de 300ms para evitar recálculo excessivo a cada tecla digitada.

### Task 4 — Geração de Relatório

O botão "Gerar Relatório" busca dados de **todos os usuários**, aplica os filtros atualmente configurados na tela a cada um deles, e exporta um arquivo CSV contendo: ID, Nome, Quantidade de Posts, Média de Caracteres, Média de Comentários e Status — para cada usuário.

> **Decisão de escopo:** optamos por gerar o relatório de todos os usuários (não apenas o selecionado na tela), por ser a interpretação que mais se alinha a um "relatório" de análise de usuários em um sistema interno, e por demonstrar de forma mais completa o uso de `Promise.all` em escala.

### Task 5 — Simulação de Envio

O botão "Enviar Relatório" envia o mesmo conjunto de dados do relatório via requisição POST, simulando o envio a um backend. Ver a seção [Problemas Encontrados e Soluções](#problemas-encontrados-e-soluções) para a adaptação necessária do endpoint.

## Diferenciais Implementados

| Diferencial                  | Status | Onde                                                                                     |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Cache de dados               | ✅     | `state.cache.postsByUser` — evita refetch de posts já buscados                           |
| Debounce em inputs           | ✅     | `debounce()` em `main.js`, aplicado aos dois filtros                                     |
| Estrutura modular            | ✅     | Ver seção [Arquitetura](#arquitetura-do-sistema)                                         |
| Testes unitários             | ✅     | 33 testes em `metrics.test.js`, `report.test.js`, `api.test.js` e `googleSheets.test.js` |
| Integração com Google Sheets | ✅     | `googleSheets.js` + Google Apps Script (Web App)                                         |

## Decisões Técnicas

**JavaScript vanilla, sem framework.** O template fornecido já era HTML puro, e a complexidade do desafio (manipulação de eventos, chamadas assíncronas, cálculos) não justifica a sobrecarga de um framework como React ou Vue. Essa escolha também evidencia domínio de fundamentos da linguagem, sem depender de abstrações prontas.

**Módulos ES nativos, sem bundler.** Como o projeto não tem múltiplas dependências de terceiros nem necessidade de transpilação, `import`/`export` nativos do navegador (via `<script type="module">`) são suficientes, evitando configurar Webpack/Vite sem necessidade real.

**Estado centralizado (`state.js`).** Em vez de variáveis soltas em cada arquivo, todo o estado da aplicação vive em um único objeto exportado, atuando como fonte única da verdade. Isso evita inconsistências entre o que é mostrado na tela e os dados realmente carregados.

**Separação entre dado bruto e dado filtrado.** `state.posts` sempre guarda os posts sem filtro nenhum aplicado. A cada mudança de filtro, o cálculo é refeito a partir do dado bruto — nunca em cima de um resultado já filtrado anteriormente. Isso evita bugs de "filtro cumulativo" indevido.

**CSV gerado manualmente, sem biblioteca.** Como o formato de saída é simples (texto tabular), optamos por montar o CSV manualmente (incluindo o BOM UTF-8 para acentuação correta no Excel, e escaping de aspas/vírgulas em nomes) em vez de adicionar uma dependência externa (ex: SheetJS) só para essa finalidade.

**Google Apps Script em vez da API oficial do Google Sheets.** Ver detalhamento na seção seguinte.

**Botões separados para "Gerar Relatório", "Enviar Relatório" e "Enviar para Google Sheets".** Cada botão representa uma responsabilidade distinta do sistema (exportar arquivo local vs. simular envio a um backend vs. integrar com uma planilha real), e mantê-los separados deixa mais claro, tanto no código quanto para quem avalia, que são três ações independentes — em vez de uma única ação "mágica" que faz tudo de uma vez.

## Problemas Encontrados e Soluções

### 1. Endpoint `/reports` não existe na JSONPlaceholder

O case pede simulação de envio via `POST /reports`, mas a JSONPlaceholder documenta oficialmente apenas seis recursos fixos: `/posts`, `/comments`, `/albums`, `/photos`, `/todos` e `/users`. Uma requisição para `/reports` retorna 404 genuíno, de forma consistente e reproduzível — confirmado tanto empiricamente (teste direto) quanto na documentação oficial da API.

**Solução:** adaptamos o envio simulado para `POST /posts`, mantendo o payload do relatório completo no corpo da requisição. Isso preserva a intenção do requisito (demonstrar uma simulação de envio via POST, com tratamento de resposta e erro) dentro do que a API de teste realmente suporta, sem inventar comportamento ou mascarar a limitação.

### 2. CORS ao integrar com o Google Apps Script

A primeira tentativa de enviar dados ao Apps Script usando `Content-Type: application/json` disparava uma requisição de pré-voo (`OPTIONS`) que o Apps Script Web App não trata corretamente, resultando em erro de CORS no navegador.

**Solução:** ajustamos o `Content-Type` para `text/plain;charset=utf-8`, técnica documentada para evitar o preflight nesse cenário específico. O corpo continua sendo um JSON válido (como string), e o parse é feito manualmente dentro da função `doPost` no Apps Script.

### 3. Divisão por zero ao calcular médias

Usuários sem posts (ou sem posts que atendam ao filtro de caracteres mínimos) resultariam em `0/0`, gerando `NaN` nas métricas de média.

**Solução:** todas as funções de cálculo de média (`calculateAverageChars`, `calculateAverageComments`) verificam explicitamente o caso de array vazio e retornam `0` antes de realizar a divisão.

### 4. Arredondamento de ponto flutuante em `toFixed`

Durante a escrita dos testes unitários, identificamos que valores como `162.945` não são arredondados de forma "intuitiva" pelo `toFixed(2)` (resultando em `162.94`, não `162.95`), por conta de como números decimais são representados internamente em ponto flutuante binário. Isso não chegou a causar um bug visível na aplicação, mas foi corrigido diretamente no teste unitário para refletir o comportamento real do JavaScript, evitando um falso positivo de teste.

### 5. Volume de requisições ao gerar relatório sem cache

Ao gerar o relatório de todos os usuários sem nenhuma seleção prévia (cache vazio), o sistema dispara ~10 requisições de posts e, em seguida, dezenas de requisições de comentários em paralelo. Chegamos a suspeitar que isso causaria falhas de rede, mas os testes confirmaram (via aba Network, status `304`/`200` consistentes) que a JSONPlaceholder suporta esse volume sem problemas — o cache implementado ainda assim reduz requisições redundantes em usos subsequentes.

### 6. Bugs pontuais de digitação durante o desenvolvimento

Ao longo da implementação, surgiram alguns erros de digitação (nome de propriedade DOM escrito incorretamente, IDs de elementos HTML divergentes entre o markup e o JavaScript, chaves de importação com nomes trocados). Esses foram identificados sistematicamente através de logs no console e da aba Network do navegador, reforçando a importância de testar cada etapa isoladamente antes de avançar para a próxima.

### 7. Tratamento de erro incompleto em `googleSheets.js`, identificado pelos próprios testes

Ao escrever os testes unitários de `googleSheets.js`, ficou evidente que a implementação original não verificava `response.ok` (erros HTTP como 500 eram ignorados, caindo direto em uma mensagem genérica) nem tratava falhas de parse do JSON (uma resposta HTML de erro do Google, por exemplo, quebraria com um `SyntaxError` cru em vez de uma mensagem legível). Ajustamos a função para checar o status HTTP antes de tentar o parse, e envolver o parse em seu próprio `try/catch` com mensagem específica. Esse é um exemplo direto de como escrever testes primeiro (ou em paralelo) ajuda a encontrar lacunas de tratamento de erro que passariam despercebidas em testes manuais na interface.

## Como Executar

1. Clone o repositório.
2. Sirva os arquivos com um servidor local (módulos ES6 exigem HTTP, não funcionam via `file://`):
   ```bash
   python3 -m http.server 8000
   # ou
   npx serve
   ```
3. Acesse `http://localhost:8000` no navegador.
4. (Opcional) Para testar a integração com Google Sheets, é necessário publicar seu próprio Google Apps Script como Web App e colar a URL gerada no campo correspondente da interface.

## Como Rodar os Testes

```bash
npm test
```

Isso executa os 33 testes unitários cobrindo `metrics.js`, `report.js`, `api.js` e `googleSheets.js` (os dois últimos com `fetch` mockado, sem depender de rede real), usando o test runner nativo do Node.js (`node --test`).
