/** Conversão entre o estado da aba e o registro do histórico. */

import { obsFinal } from "./script";
import { validarIdentificacaoPorta } from "./parse";
import { OBS_OPCOES, qtdPortas, type Aba, type ModeloCto, type Registro } from "./types";

export function registroDaAba(aba: Aba): Registro {
  const total = qtdPortas(aba.modeloCto);
  const portas = Array.from({ length: total }, (_, i) =>
    validarIdentificacaoPorta(aba.portas[i] ?? ""),
  );
  const agora = new Date();

  return {
    id_reg: aba.idReg ?? `${agora.getTime()}`,
    timestamp: agora.toLocaleString("pt-BR"),
    ts: agora.getTime(),
    chat: aba.chat.toUpperCase().trim(),
    os: aba.os.toUpperCase().trim(),
    contrato: aba.contrato.toUpperCase().trim(),
    cliente: aba.nomeCli.toUpperCase().trim(),
    cto: aba.cto.toUpperCase().trim(),
    caminho_rede: aba.caminhoRede.toUpperCase().trim(),
    modelo: aba.modeloCto,
    porta_utilizada: aba.portaUtilizada,
    porta_retirada: aba.portaRetirada.toUpperCase().trim(),
    correcao: aba.correcaoCaminho,
    obs: obsFinal(aba),
    portas,
    sat_bko: aba.satBko.toUpperCase().trim(),
    sat_data: aba.satData,
    sat_cidade: aba.satCidade.toUpperCase().trim(),
    sat_loc_cli: aba.satLocCli.trim(),
    sat_loc_cto: aba.satLocCto.trim(),
    sat_obs: aba.satObs.toUpperCase().trim(),
  };
}

/** Reconstitui uma aba a partir de um registro salvo, preservando id/título da aba de destino. */
export function abaDeRegistro(base: Aba, r: Registro): Aba {
  const modelo: ModeloCto = qtdPortas(r.modelo) === 8 ? "8 PORTAS" : "16 PORTAS";
  const portas = Array.from({ length: 16 }, (_, i) => {
    const v = r.portas?.[i] ?? "";
    return v === "SEM ID" ? "" : v;
  });
  const obsConhecida = OBS_OPCOES.some((o) => o.value === r.obs && o.value !== "MANUAL");

  return {
    ...base,
    idReg: String(r.id_reg),
    importText: "",
    importAberto: false,
    chat: r.chat ?? "",
    os: r.os ?? "",
    contrato: r.contrato ?? "",
    nomeCli: r.cliente ?? "",
    cto: r.cto ?? "",
    caminhoRede: r.caminho_rede ?? "",
    modeloCto: modelo,
    portaUtilizada: r.porta_utilizada || "NENHUMA",
    portaRetirada: r.porta_retirada ?? "",
    correcaoCaminho: r.correcao === "SIM" ? "SIM" : "NAO",
    obsSelect: obsConhecida ? r.obs : "MANUAL",
    obsManual: obsConhecida ? "" : (r.obs ?? ""),
    portas,
    satBko: r.sat_bko || base.satBko,
    satData: r.sat_data || base.satData,
    satCidade: r.sat_cidade ?? "",
    satCliente: r.os ?? "",
    satCtoVald: r.cto ?? "",
    satLocCli: r.sat_loc_cli ?? "",
    satLocCto: r.sat_loc_cto ?? "",
    satObs: r.sat_obs ?? "",
    scriptAt: "",
    scriptSat: "",
  };
}
