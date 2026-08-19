# Registro de Atendimento Pro — Design

Ferramenta interna de BKO (web) para registrar atendimentos de campo, mapear portas de CTO, gerar
scripts padronizados, relatar CTO saturada e consultar o histórico dos últimos 7 dias.
Direção visual: **dark técnico refinado** — superfícies de vidro (glass), hairlines sutis, densidade
controlada, acentos frios, zero decoração inútil. 100% client-side (localStorage), sem backend.

## Brand & Colors

Tokens em `packages/web/src/web/styles.css` (tema único, dark).

| Token | Valor | Uso |
|-------|-------|-----|
| background | #06090F | Fundo da página (com mesh radial + grain) |
| surface | rgba(255,255,255,.03) + blur | Cards / painéis de vidro |
| surface-strong | #0C1219 | Inputs, células de tabela |
| border | rgba(255,255,255,.08) | Hairlines |
| foreground | #E8EEF5 | Texto principal |
| muted | #8A97A8 | Labels, texto secundário |
| primary (azure) | #38BDF8 | Ações principais, foco, títulos |
| accent (teal) | #2DD4BF | Sucesso, salvar, histórico |
| warn (amber) | #F5A524 | Saturação, conflito de porta |
| danger (rose) | #FB4E6D | Exclusão, erros |
| violet | #A78BFA | Importação / ações auxiliares |

Erros de campo obrigatório: borda `--danger/45%` + fundo `--danger/12%` + pulso suave (sem grito visual).

## Typography

- Display/UI: **Sora** (600/700) — títulos, botões, abas.
- Corpo/labels: **Manrope** (500/600) — labels, inputs, tabelas.
- Dados/scripts: **JetBrains Mono** — saída de script, coordenadas, mapa de portas.
- Todo o texto é renderizado em MAIÚSCULAS (requisito operacional), com `letter-spacing` levemente
  aberto em labels (0.08em) para legibilidade em caps.

## Pages & Screens

- **Web — Painel único** (`packages/web/src/web/pages/index.tsx`)
  - Header com identidade, contador de abas e ações globais.
  - Barra de abas: N atendimentos + aba HISTÓRICO fixada à direita.
  - Aba de atendimento: importar script (colapsável) → grid 2 colunas
    (formulário | mapa de portas + resumo operacional) → painel de saturação (colapsável, com mapa Leaflet).
  - Aba histórico: métricas dos 7 dias, busca, exportar CSV/JSON, tabela com editar/excluir.
- Componentes em `src/web/components/app/`, lógica pura em `src/web/lib/atendimento/`.

## Key User Flows

1. Colar script do técnico → PROCESSAR → campos, portas, coordenadas e cidade preenchidos.
2. Preencher/ajustar → GERAR SCRIPT → copiar → SALVAR NO HISTÓRICO.
3. RELATAR SATURAÇÃO → coordenadas → mapa mostra cliente + CTO → GERAR RELATÓRIO TÉCNICO → copiar.
4. HISTÓRICO → buscar → editar (recarrega na aba ativa) ou excluir (modal de confirmação).
5. Rascunho das abas é salvo automaticamente; histórico com mais de 7 dias é expurgado ao abrir.

## Architecture

- Sem API: todo o estado vive em React + `localStorage`
  (`atend_logs_v10` histórico, `atend_abas_v1` rascunhos, `mapa_cto_caminhos` cache CTO→caminho de rede).
- Mapa: Leaflet + tiles CartoDB dark. Geocodificação reversa: Nominatim (OpenStreetMap).
- Layout responsivo: grid de 2 colunas colapsa em 1 abaixo de 1100px; portas 2→1 coluna no mobile.
