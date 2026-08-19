/** Parsers e normalizadores — mesma lógica da v2, isolada para poder ser testada/reutilizada. */

import { qtdPortas, type Aba, type ModeloCto } from "./types";

/** Extrai "lat,lon" de um texto/URL. Se não achar par de coordenadas, devolve o texto aparado. */
export function extrairCoordenadasDeTexto(texto: string): string {
  if (!texto) return "";
  const match = texto.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  return match ? `${match[1]},${match[2]}` : texto.trim();
}

/** Qualquer texto no campo vira identificação da porta; vazio/zeros = SEM ID. */
export function validarIdentificacaoPorta(valor: string): string {
  if (!valor) return "SEM ID";
  const v = valor.toString().trim().toUpperCase();
  if (v === "" || /^0+$/.test(v)) return "SEM ID";
  return v;
}

export function limparIdCTO(rawId: string): string {
  if (!rawId) return "";
  const limpo = rawId
    .toUpperCase()
    .replace(
      /CTO A VALIDAR:|CTO RESERVADA:|CTO:|LOCALIZAÇÃO DA CTO:|LOCALIZAÇÃO CLIENTE:|LOCALIZAÇÃO:|LOCALIZAÇÃO|LOCALIZA/g,
      "",
    );
  return limpo
    .trim()
    .replace(/^CTO\s+/g, "CTO")
    .replace(/\s+/g, " ");
}

export interface DadosImportados {
  chat: string;
  os: string;
  cto: string;
  locCliente: string;
  locCto: string;
  modeloCto: ModeloCto;
  portas: string[];
}

/** Lê o script bruto do técnico e devolve os campos reconhecidos. */
export function parseScriptCampo(texto: string): DadosImportados {
  const capturar = (regex: RegExp) => {
    const match = texto.match(regex);
    return match ? match[1].trim() : "";
  };

  const os = capturar(/Ordem:\s*(\d+)/i);
  const chat = capturar(/ID Chat:\s*(\w+)/i);
  const ctoBruta =
    capturar(/CTO a validar:\s*(.*?)(?=Localização|$)/is) ||
    capturar(/CTO Reservada:\s*(.*?)(?=Localização|$)/is);
  const locCliente = extrairCoordenadasDeTexto(capturar(/Localização Cliente:\s*(.*?)(?=\n|$)/i));
  const locCto = extrairCoordenadasDeTexto(
    capturar(/Localização da CTO:\s*(.*?)(?=\n|$)/i) || capturar(/Localização:\s*(.*?)(?=\n|$)/i),
  );

  const modeloCto: ModeloCto = capturar(/Portas da CTO:\s*(\d+)/i).includes("8")
    ? "8 PORTAS"
    : "16 PORTAS";

  const total = qtdPortas(modeloCto);
  const portas = Array.from({ length: 16 }, (_, i) => {
    if (i >= total) return "";
    const valor = capturar(new RegExp(`IDENTIFICAÇÃO PORTA ${i + 1}:\\s*(.*)`, "i"))
      .toUpperCase()
      .trim();
    return valor.length >= 4 ? valor : "";
  });

  return {
    chat,
    os,
    cto: limparIdCTO(ctoBruta),
    locCliente,
    locCto,
    modeloCto,
    portas,
  };
}

/** Aplica os dados importados sobre a aba, preservando o que o parser não reconheceu. */
export function aplicarImportacao(aba: Aba, dados: DadosImportados): Aba {
  return {
    ...aba,
    chat: dados.chat || aba.chat,
    os: dados.os || aba.os,
    cto: dados.cto || aba.cto,
    modeloCto: dados.modeloCto,
    portas: dados.portas,
    satCliente: dados.os || aba.satCliente,
    satCtoVald: dados.cto || aba.satCtoVald,
    satLocCli: dados.locCliente || aba.satLocCli,
    satLocCto: dados.locCto || aba.satLocCto,
    importAberto: false,
  };
}

/** Texto automático da porta utilizada, igual à v2. */
export function textoPortaUtilizada(numero: number, contrato: string, nome: string): string {
  return `USOU A PORTA ${numero} - ${contrato} - ${nome}`;
}

export function numeroDaPorta(portaUtilizada: string): number | null {
  if (!portaUtilizada || portaUtilizada === "NENHUMA") return null;
  const n = Number.parseInt(portaUtilizada.replace("PORTA ", ""), 10);
  return Number.isNaN(n) ? null : n;
}
