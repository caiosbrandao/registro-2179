# Registro de Atendimento Pro v3.0 — status

## Concluído (verificado)
- App gerado via app_init em /home/user/registro-atendimento (Bun + Vite + React 19 + Tailwind 4).
- Toda a lógica da v2 portada: parsers, scripts (atendimento e CTO saturada, formato idêntico), mapa de portas,
  resumo operacional, saturação com mapa Leaflet, histórico, abas múltiplas.
- Retenção de 7 dias com expurgo no load (validado no browser: registro de 9 dias foi removido).
- Rascunho de abas em atend_abas_v1 (validado: recarregou mantendo os dados).
- memorizarCaminhoCto agora GRAVA em mapa_cto_caminhos (v2 só lia).
- Exportação CSV/JSON no histórico.
- Destaque de campos inválidos só após tentar GERAR/SALVAR (antes marcava tudo em vermelho no load).
- a11y: aria-labels em todos os campos e botões-ícone; modal virou <dialog>; abas viraram <button>.
- lint (konsistent + oxlint): 0 erros no código do app.
  Obs.: oxlint reporta 2 arquivos template-managed (packages/web/src/__server.ts e
  src/web/types/__analytics.d.ts) com hash divergente — drift do próprio app_init, não editados por mim.
- typecheck: 3/3 pacotes OK. build: OK. dev server: porta 4200.
- Fluxo validado no browser: importar script -> geocode -> gerar script -> salvar -> saturação/mapa ->
  relatório -> histórico -> responsivo em 390px.

## Pendente
- Relatório de pontos de melhoria (melhorias.report/content.md).
