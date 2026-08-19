/** Modelos de dados do Registro de Atendimento. */

export type ModeloCto = "16 PORTAS" | "8 PORTAS";

/** Estado completo de uma aba de atendimento (também usado como rascunho no localStorage). */
export interface Aba {
  id: string;
  titulo: number;
  /** id do registro no histórico quando a aba está editando um registro salvo */
  idReg: string | null;

  importText: string;
  importAberto: boolean;

  enderecoCompleto: string;

  chat: string;
  os: string;
  contrato: string;
  nomeCli: string;
  cto: string;
  caminhoRede: string;
  modeloCto: ModeloCto;
  portaUtilizada: string;
  portaRetirada: string;
  correcaoCaminho: "NAO" | "SIM";
  obsSelect: string;
  obsManual: string;
  /** 16 posições, sempre — as extras ficam ocultas quando o modelo é de 8 portas */
  portas: string[];

  satAberta: boolean;
  satBko: string;
  satData: string;
  satCidade: string;
  satCliente: string;
  satCtoVald: string;
  satLocCli: string;
  satLocCto: string;
  satObs: string;

  scriptAt: string;
  scriptSat: string;
}

/** Registro persistido no histórico (chaves mantidas iguais à v2 para não perder dados antigos). */
export interface Registro {
  id_reg: string | number;
  /** carimbo legível pt-BR (compatível com a v2) */
  timestamp: string;
  /** epoch ms — usado no expurgo de 7 dias (registros antigos caem no parse do timestamp) */
  ts?: number;
  chat: string;
  os: string;
  contrato: string;
  cliente: string;
  cto: string;
  caminho_rede: string;
  modelo: string;
  porta_utilizada: string;
  porta_retirada: string;
  correcao: string;
  obs: string;
  portas: string[];
  sat_bko: string;
  sat_data: string;
  sat_cidade: string;
  sat_loc_cli: string;
  sat_loc_cto: string;
  sat_obs: string;
}

export const OBS_PADRAO = "SEM OBSERVAÇÕES ADICIONAIS.";

export const OBS_OPCOES = [
  { value: OBS_PADRAO, label: "SELECIONE UMA OPÇÃO..." },
  {
    value: "CTO MAIS PROXIMA DA CASA DO CLIENTE.",
    label: "CTO MAIS PROXIMA DA CASA DO CLIENTE.",
  },
  {
    value: "USOU A PORTA RESERVADA PARA O CLIENTE",
    label: "USOU A PORTA RESERVADA PARA O CLIENTE",
  },
  { value: "MANUAL", label: "OUTRO..." },
];

export const CAMPOS_OBRIGATORIOS = [
  "chat",
  "os",
  "cto",
  "caminhoRede",
  "contrato",
  "nomeCli",
  "portaRetirada",
] as const;

export type CampoObrigatorio = (typeof CAMPOS_OBRIGATORIOS)[number];

export function qtdPortas(modelo: string): number {
  return Number.parseInt(modelo, 10) === 8 ? 8 : 16;
}

export function novaAba(titulo: number): Aba {
  return {
    id: `at-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    titulo,
    idReg: null,
    importText: "",
    importAberto: true,
    enderecoCompleto: "",
    chat: "",
    os: "",
    contrato: "",
    nomeCli: "",
    cto: "",
    caminhoRede: "",
    modeloCto: "16 PORTAS",
    portaUtilizada: "NENHUMA",
    portaRetirada: "",
    correcaoCaminho: "NAO",
    obsSelect: OBS_PADRAO,
    obsManual: "",
    portas: Array.from({ length: 16 }, () => ""),
    satAberta: false,
    satBko: "CAIO BRANDÃO",
    satData: new Date().toLocaleDateString("pt-BR"),
    satCidade: "",
    satCliente: "",
    satCtoVald: "",
    satLocCli: "",
    satLocCto: "",
    satObs: "",
    scriptAt: "",
    scriptSat: "",
  };
}

/** Zera a aba mantendo id, título e o BKO responsável (equivalente ao "LIMPAR" da v2). */
export function limparAba(aba: Aba): Aba {
  const limpa = novaAba(aba.titulo);
  return { ...limpa, id: aba.id, satBko: aba.satBko };
}
