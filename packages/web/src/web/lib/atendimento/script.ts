/** Geração dos scripts de saída — formatos idênticos à v2 (não alterar sem alinhar com o BKO). */

import { validarIdentificacaoPorta } from "./parse";
import { qtdPortas, type Aba } from "./types";

export function obsFinal(aba: Aba): string {
  return (aba.obsSelect === "MANUAL" ? aba.obsManual : aba.obsSelect).toUpperCase().trim();
}

export function mapaPortasTexto(aba: Aba): string {
  const total = qtdPortas(aba.modeloCto);
  let txt = "";
  for (let i = 1; i <= total; i++) {
    txt += `P${i.toString().padStart(2, "0")}: ${validarIdentificacaoPorta(aba.portas[i - 1] ?? "")}\n`;
  }
  return txt.trimEnd();
}

export function gerarScriptAtendimento(aba: Aba): string {
  const u = (v: string) => (v || "").toUpperCase().trim();
  const cabecalho =
    `ID CHAT: ${u(aba.chat)}\n` +
    `ORDEM DE SERVIÇO: ${u(aba.os)}\n` +
    `ID CTO: ${u(aba.cto)}\n` +
    `CAMINHO DE REDE CTO: ${u(aba.caminhoRede)}\n` +
    `MODELO: ${u(aba.modeloCto)}\n` +
    `PORTA UTILIZADA: ${u(aba.portaUtilizada)} \n` +
    `ID PORTA RETIRADA: ${u(aba.portaRetirada)}\n` +
    `CORREÇÃO CAMINHO PORTA UTILIZADA: ${u(aba.correcaoCaminho)}\n` +
    `OBS: ${obsFinal(aba)}\n\nMAPA:\n`;
  return `${cabecalho}${mapaPortasTexto(aba)}\n`;
}

export function gerarScriptSaturada(aba: Aba): string {
  const u = (v: string) => (v || "").toUpperCase().trim();
  return (
    `// CTO SATURADA //\n` +
    `BKO: ${u(aba.satBko)}\n` +
    `DATA: ${u(aba.satData)}\n` +
    `ID CHAT: ${u(aba.chat)}\n` +
    `CIDADE: ${u(aba.satCidade)}\n` +
    `CLIENTE: ${u(aba.satCliente)}\n` +
    `CTO VALIDADA: ${u(aba.satCtoVald)}\n` +
    `LOC. CLIENTE: ${u(aba.satLocCli)}\n` +
    `LOC. CTO: ${u(aba.satLocCto)}\n` +
    `OBS: ${u(aba.satObs)}`
  );
}
