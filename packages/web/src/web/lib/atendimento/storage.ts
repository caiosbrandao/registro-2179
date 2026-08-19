/** Persistência local: histórico (retenção 7 dias), cache CTO→caminho de rede e rascunho das abas. */

import type { Aba, Registro } from "./types";

export const CHAVE_HISTORICO = "atend_logs_v10";
export const CHAVE_CAMINHOS = "mapa_cto_caminhos";
export const CHAVE_ABAS = "atend_abas_v1";
export const DIAS_RETENCAO = 7;

const MS_DIA = 86_400_000;

function ler<T>(chave: string, fallback: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : fallback;
  } catch {
    return fallback;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.error(`Falha ao gravar ${chave}`, e);
  }
}

/** Início do dia (00:00) de uma data. */
function inicioDoDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Aceita epoch (ts) ou timestamp pt-BR "dd/mm/aaaa, hh:mm:ss" (registros da v2). */
export function epochDoRegistro(r: Registro): number {
  if (typeof r.ts === "number" && !Number.isNaN(r.ts)) return r.ts;
  const dataParte = (r.timestamp || "").split(",")[0]?.trim() ?? "";
  const [dia, mes, ano] = dataParte.split("/").map((n) => Number.parseInt(n, 10));
  if (!dia || !mes || !ano) return 0;
  return new Date(ano, mes - 1, dia).getTime();
}

export function dataBRDoRegistro(r: Registro): string {
  return (r.timestamp || "").split(",")[0]?.trim() ?? "";
}

/** Remove tudo que for anterior à janela de 7 dias (hoje incluído). */
export function expurgarAntigos(hist: Registro[]): { mantidos: Registro[]; removidos: number } {
  const limite = inicioDoDia(new Date()) - (DIAS_RETENCAO - 1) * MS_DIA;
  const mantidos = hist.filter((r) => {
    const epoch = epochDoRegistro(r);
    // registro sem data reconhecível é mantido para não sumir silenciosamente
    return epoch === 0 || epoch >= limite;
  });
  return { mantidos, removidos: hist.length - mantidos.length };
}

export function carregarHistorico(): Registro[] {
  return ler<Registro[]>(CHAVE_HISTORICO, []);
}

export function salvarHistorico(hist: Registro[]): void {
  gravar(CHAVE_HISTORICO, hist);
}

/** Carrega já aplicando a retenção de 7 dias e reescrevendo o storage quando algo saiu. */
export function carregarHistoricoComExpurgo(): { hist: Registro[]; removidos: number } {
  const { mantidos, removidos } = expurgarAntigos(carregarHistorico());
  if (removidos > 0) salvarHistorico(mantidos);
  return { hist: mantidos, removidos };
}

export function upsertRegistro(hist: Registro[], reg: Registro): Registro[] {
  const idx = hist.findIndex((x) => String(x.id_reg) === String(reg.id_reg));
  if (idx !== -1) {
    const copia = [...hist];
    copia[idx] = reg;
    return copia;
  }
  return [reg, ...hist];
}

export function removerRegistro(hist: Registro[], idReg: string | number): Registro[] {
  return hist.filter((x) => String(x.id_reg) !== String(idReg));
}

/** Contagem por dia dos últimos 7 dias, do mais antigo para hoje. */
export function metricas7Dias(hist: Registro[]): { dia: string; hoje: boolean; qtd: number }[] {
  const hojeBR = new Date().toLocaleDateString("pt-BR");
  const dias: { dia: string; hoje: boolean; qtd: number }[] = [];
  for (let i = DIAS_RETENCAO - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dia = d.toLocaleDateString("pt-BR");
    dias.push({ dia, hoje: dia === hojeBR, qtd: 0 });
  }
  for (const r of hist) {
    const dia = dataBRDoRegistro(r);
    const alvo = dias.find((x) => x.dia === dia);
    if (alvo) alvo.qtd++;
  }
  return dias;
}

/* ---------- cache CTO → caminho de rede ---------- */

export function caminhoDaCto(cto: string): string | null {
  if (!cto) return null;
  const mapa = ler<Record<string, string>>(CHAVE_CAMINHOS, {});
  return mapa[cto.trim().toUpperCase()] ?? null;
}

export function memorizarCaminhoCto(cto: string, caminho: string): void {
  const c = cto.trim().toUpperCase();
  const v = caminho.trim().toUpperCase();
  if (!c || !v) return;
  const mapa = ler<Record<string, string>>(CHAVE_CAMINHOS, {});
  if (mapa[c] === v) return;
  mapa[c] = v;
  gravar(CHAVE_CAMINHOS, mapa);
}

/* ---------- rascunho das abas ---------- */

export function carregarRascunho(): Aba[] {
  const abas = ler<Aba[]>(CHAVE_ABAS, []);
  return abas.filter((a) => a && typeof a.id === "string");
}

export function salvarRascunho(abas: Aba[]): void {
  gravar(CHAVE_ABAS, abas);
}

/* ---------- exportação ---------- */

function baixarArquivo(nome: string, conteudo: string, tipo: string): void {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const COLUNAS_CSV: { chave: keyof Registro; titulo: string }[] = [
  { chave: "timestamp", titulo: "DATA/HORA" },
  { chave: "chat", titulo: "ID CHAT" },
  { chave: "os", titulo: "OS" },
  { chave: "contrato", titulo: "CONTRATO" },
  { chave: "cliente", titulo: "CLIENTE" },
  { chave: "cto", titulo: "ID CTO" },
  { chave: "caminho_rede", titulo: "CAMINHO REDE" },
  { chave: "modelo", titulo: "MODELO" },
  { chave: "porta_utilizada", titulo: "PORTA UTILIZADA" },
  { chave: "porta_retirada", titulo: "PORTA RETIRADA" },
  { chave: "correcao", titulo: "CORRECAO" },
  { chave: "obs", titulo: "OBS" },
  { chave: "sat_cidade", titulo: "CIDADE" },
  { chave: "sat_loc_cli", titulo: "LOC CLIENTE" },
  { chave: "sat_loc_cto", titulo: "LOC CTO" },
  { chave: "sat_obs", titulo: "PARECER SATURACAO" },
];

export function exportarJSON(hist: Registro[]): void {
  const stamp = new Date().toISOString().slice(0, 10);
  baixarArquivo(
    `historico-atendimentos-${stamp}.json`,
    JSON.stringify(hist, null, 2),
    "application/json",
  );
}

export function exportarCSV(hist: Registro[]): void {
  const escapar = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = [
    [...COLUNAS_CSV.map((c) => c.titulo), "MAPA PORTAS"].map(escapar).join(";"),
    ...hist.map((r) =>
      [...COLUNAS_CSV.map((c) => r[c.chave]), (r.portas || []).join(" | ")].map(escapar).join(";"),
    ),
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  // BOM para o Excel pt-BR abrir com acentuação correta
  baixarArquivo(
    `historico-atendimentos-${stamp}.csv`,
    `﻿${linhas.join("\n")}`,
    "text/csv;charset=utf-8",
  );
}
