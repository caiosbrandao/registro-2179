import { PortasGrid } from "./portas-grid";
import { ResumoPanel } from "./resumo-panel";
import { SaturacaoPanel } from "./saturacao-panel";
import {
  OBS_OPCOES,
  qtdPortas,
  type Aba,
  type CampoObrigatorio,
  type ModeloCto,
} from "@/lib/atendimento/types";

interface Props {
  aba: Aba;
  onPatch: (patch: Partial<Aba>) => void;
  onChangePorta: (indice: number, valor: string) => void;
  onProcessarImport: () => void;
  onGerarScript: () => void;
  onSalvar: () => void;
  onLimpar: () => void;
  onCopiarScript: () => void;
  onCopiarMapa: () => void;
  onCopiarResumo: (rotulo: string, valor: string) => void;
  onGerarSaturada: () => void;
  onCopiarSaturada: () => void;
  invalidos: Set<CampoObrigatorio>;
  destacarErros: boolean;
  geocodificando: boolean;
  salvoAgora: boolean;
}

export function AtendimentoTab({
  aba,
  onPatch,
  onChangePorta,
  onProcessarImport,
  onGerarScript,
  onSalvar,
  onLimpar,
  onCopiarScript,
  onCopiarMapa,
  onCopiarResumo,
  onGerarSaturada,
  onCopiarSaturada,
  invalidos,
  destacarErros,
  geocodificando,
  salvoAgora,
}: Props) {
  const total = qtdPortas(aba.modeloCto);
  const fid = (nome: string) => `${aba.id}-${nome}`;
  const cls = (campo: CampoObrigatorio) =>
    `input ${destacarErros && invalidos.has(campo) ? "input-error" : ""}`;
  const faltando = invalidos.size;

  return (
    <div className="anim-rise flex flex-col gap-5">
      {/* IMPORTAÇÃO */}
      <section className="panel overflow-hidden">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() => onPatch({ importAberto: !aba.importAberto })}
        >
          <span className="section-title" style={{ color: "var(--violet)" }}>
            ⇩ IMPORTAR SCRIPT DE CAMPO
          </span>
          <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
            {aba.importAberto ? "▲" : "▼"}
          </span>
        </button>
        {aba.importAberto && (
          <div className="flex flex-col gap-3 px-4 pb-4">
            <textarea
              className="input"
              aria-label="SCRIPT DE CAMPO"
              style={{ textTransform: "none", minHeight: 128 }}
              value={aba.importText}
              placeholder="COLE O SCRIPT DO TÉCNICO AQUI..."
              onChange={(e) => onPatch({ importText: e.target.value })}
            />
            <button type="button" className="btn btn-violet self-start" onClick={onProcessarImport}>
              ⚙ PROCESSAR DADOS
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* FORMULÁRIO */}
        <section className="panel flex flex-col gap-4 p-5">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="section-title" style={{ color: "var(--azure)" }}>
              ▤ REGISTRO DE ATENDIMENTO
            </h3>
            <div className="flex items-center gap-2">
              {aba.idReg && (
                <span className="badge" data-tone="azure">
                  EDITANDO REGISTRO SALVO
                </span>
              )}
              <span className="badge" data-tone={faltando ? "rose" : "teal"}>
                {faltando ? `${faltando} CAMPO(S) PENDENTE(S)` : "CAMPOS OK"}
              </span>
            </div>
          </header>

          <div className="field">
            <label
              className="field-label"
              style={{ color: "var(--teal)" }}
              htmlFor={fid("endereco-do-cliente-via-coordenadas")}
            >
              ⌖ ENDEREÇO DO CLIENTE (VIA COORDENADAS)
            </label>
            <input
              id={fid("endereco-do-cliente-via-coordenadas")}
              aria-label="ENDERECO DO CLIENTE VIA COORDENADAS"
              className="input"
              readOnly
              value={aba.enderecoCompleto}
              placeholder={geocodificando ? "BUSCANDO ENDEREÇO..." : "AGUARDANDO COORDENADAS..."}
              style={{
                borderColor: "rgba(45,212,191,.35)",
                background: "rgba(45,212,191,.06)",
                fontWeight: 700,
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label className="field-label" htmlFor={fid("id-chat")}>
                ID CHAT
              </label>
              <input
                id={fid("id-chat")}
                aria-label="ID CHAT"
              className={cls("chat")}
                value={aba.chat}
                onChange={(e) => onPatch({ chat: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor={fid("ordem-de-servico")}>
                ORDEM DE SERVIÇO
              </label>
              <input
                id={fid("ordem-de-servico")}
                aria-label="ORDEM DE SERVICO"
              className={cls("os")}
                value={aba.os}
                onChange={(e) => onPatch({ os: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor={fid("contrato-cliente")}>
                CONTRATO CLIENTE
              </label>
              <input
                id={fid("contrato-cliente")}
                aria-label="CONTRATO CLIENTE"
              className={cls("contrato")}
                value={aba.contrato}
                onChange={(e) => onPatch({ contrato: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor={fid("nome-completo-cliente")}>
                NOME COMPLETO CLIENTE
              </label>
              <input
                id={fid("nome-completo-cliente")}
                aria-label="NOME COMPLETO CLIENTE"
              className={cls("nomeCli")}
                value={aba.nomeCli}
                onChange={(e) => onPatch({ nomeCli: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label className="field-label" htmlFor={fid("id-cto")}>
                ID CTO
              </label>
              <input
                id={fid("id-cto")}
                aria-label="ID CTO"
              className={cls("cto")}
                value={aba.cto}
                onChange={(e) => onPatch({ cto: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label className="field-label" htmlFor={fid("caminho-de-rede-cto")}>
                CAMINHO DE REDE CTO
              </label>
              <input
                id={fid("caminho-de-rede-cto")}
                aria-label="CAMINHO DE REDE CTO"
              className={cls("caminhoRede")}
                value={aba.caminhoRede}
                onChange={(e) => onPatch({ caminhoRede: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label className="field-label" htmlFor={fid("modelo-cto")}>
                MODELO CTO
              </label>
              <select
                id={fid("modelo-cto")}
                aria-label="MODELO CTO"
              className="input"
                value={aba.modeloCto}
                onChange={(e) => onPatch({ modeloCto: e.target.value as ModeloCto })}
              >
                <option value="16 PORTAS">16 PORTAS</option>
                <option value="8 PORTAS">8 PORTAS</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor={fid("porta-utilizada")}>
                PORTA UTILIZADA
              </label>
              <select
                id={fid("porta-utilizada")}
                aria-label="PORTA UTILIZADA"
              className="input"
                value={aba.portaUtilizada}
                onChange={(e) => onPatch({ portaUtilizada: e.target.value })}
              >
                <option value="NENHUMA">NENHUMA</option>
                {Array.from({ length: total }, (_, i) => (
                  <option key={i + 1} value={`PORTA ${i + 1}`}>
                    PORTA {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor={fid("id-porta-retirada")}>
                ID PORTA RETIRADA
              </label>
              <input
                id={fid("id-porta-retirada")}
                aria-label="ID PORTA RETIRADA"
              className={cls("portaRetirada")}
                value={aba.portaRetirada}
                onChange={(e) => onPatch({ portaRetirada: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label className="field-label" htmlFor={fid("correcao-de-caminho-da-porta-liberada")}>
                CORREÇÃO DE CAMINHO DA PORTA LIBERADA ?
              </label>
              <select
                id={fid("correcao-de-caminho-da-porta-liberada")}
                aria-label="CORRECAO DE CAMINHO DA PORTA LIBERADA"
              className="input"
                value={aba.correcaoCaminho}
                onChange={(e) => onPatch({ correcaoCaminho: e.target.value as "NAO" | "SIM" })}
              >
                <option value="NAO">NÃO</option>
                <option value="SIM">SIM</option>
              </select>
            </div>
            <div className="field sm:col-span-2">
              <label className="field-label" htmlFor={fid("observacoes")}>
                OBSERVAÇÕES
              </label>
              <select
                id={fid("observacoes")}
                aria-label="OBSERVACOES"
              className="input"
                value={aba.obsSelect}
                onChange={(e) => onPatch({ obsSelect: e.target.value })}
              >
                {OBS_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {aba.obsSelect === "MANUAL" && (
                <textarea
                  className="input anim-rise mt-2"
                  aria-label="OBSERVACAO MANUAL"
                  value={aba.obsManual}
                  placeholder="DESCREVA A OBSERVAÇÃO..."
                  onChange={(e) => onPatch({ obsManual: e.target.value.toUpperCase() })}
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="btn btn-azure flex-1" onClick={onGerarScript}>
              ⚡ GERAR SCRIPT
            </button>
            <button type="button" className="btn btn-teal flex-1" onClick={onSalvar}>
              {salvoAgora ? "✔ SALVO!" : "✔ SALVAR NO HISTÓRICO"}
            </button>
            <button
              type="button"
              className={`btn flex-1 ${aba.satAberta ? "btn-ghost" : "btn-amber"}`}
              onClick={() => onPatch({ satAberta: !aba.satAberta })}
            >
              {aba.satAberta ? "✖ FECHAR SATURAÇÃO" : "⚠ RELATAR SATURAÇÃO"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              title="LIMPAR FORMULÁRIO"
              onClick={onLimpar}
            >
              ⌫
            </button>
          </div>

          {aba.scriptAt && (
            <div className="anim-rise flex flex-col gap-2">
              <pre className="script-output">{aba.scriptAt}</pre>
              <button type="button" className="btn btn-teal w-full" onClick={onCopiarScript}>
                ⧉ COPIAR SCRIPT
              </button>
            </div>
          )}
        </section>

        {/* PORTAS + RESUMO */}
        <div className="flex flex-col gap-5">
          <PortasGrid
            portas={aba.portas}
            total={total}
            portaUtilizada={aba.portaUtilizada}
            portaRetirada={aba.portaRetirada}
            onChangePorta={onChangePorta}
            onCopiarMapa={onCopiarMapa}
          />
          <ResumoPanel aba={aba} onCopiar={onCopiarResumo} />
        </div>
      </div>

      {aba.satAberta && (
        <SaturacaoPanel
          aba={aba}
          onPatch={onPatch}
          onGerar={onGerarSaturada}
          onCopiar={onCopiarSaturada}
          chaveVisibilidade={aba.id}
          geocodificando={geocodificando}
        />
      )}
    </div>
  );
}
