import { useId } from "react";
import { distanciaEntre, MapaCoordenadas } from "./mapa-coordenadas";
import type { Aba } from "@/lib/atendimento/types";

interface Props {
  aba: Aba;
  onPatch: (patch: Partial<Aba>) => void;
  onGerar: () => void;
  onCopiar: () => void;
  chaveVisibilidade: string;
  geocodificando: boolean;
}

function abrirLink(valor: string) {
  if (!valor.includes("http")) return;
  const largura = 900;
  const altura = 640;
  const esquerda = (screen.width - largura) / 2;
  const topo = (screen.height - altura) / 2;
  window.open(
    valor,
    "popup",
    `width=${largura},height=${altura},top=${topo},left=${esquerda},scrollbars=yes`,
  );
}

interface CampoCoordProps {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
}

function CampoCoordenadas({ rotulo, valor, onChange }: CampoCoordProps) {
  const campoId = useId();
  const temLink = valor.includes("http");
  return (
    <div className="field">
      <label className="field-label" htmlFor={campoId}>
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={campoId}
          aria-label={rotulo}
          className="input font-mono"
          style={{ paddingRight: temLink ? 44 : undefined, textTransform: "none" }}
          value={valor}
          placeholder="-23.55052,-46.63331"
          onChange={(e) => onChange(e.target.value)}
        />
        {temLink && (
          <button
            type="button"
            className="btn-icon absolute top-1/2 right-1.5 -translate-y-1/2"
            title="ABRIR LINK"
            onClick={() => abrirLink(valor)}
          >
            ↗
          </button>
        )}
      </div>
    </div>
  );
}

export function SaturacaoPanel({
  aba,
  onPatch,
  onGerar,
  onCopiar,
  chaveVisibilidade,
  geocodificando,
}: Props) {
  const distancia = distanciaEntre(aba.satLocCli, aba.satLocCto);
  const fid = (nome: string) => `${aba.id}-sat-${nome}`;

  return (
    <section
      className="anim-rise mt-5 rounded-xl p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(251,78,109,.07), rgba(255,255,255,.015)), rgba(255,255,255,.01)",
        border: "1px solid rgba(251,78,109,.28)",
        backdropFilter: "blur(14px)",
      }}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="section-title" style={{ color: "var(--rose)" }}>
          ⛔ RELATÓRIO DE CTO SATURADA
        </h3>
        <div className="flex items-center gap-2">
          {geocodificando && (
            <span className="badge" data-tone="azure">
              BUSCANDO ENDEREÇO...
            </span>
          )}
          {distancia !== null && (
            <span className="badge" data-tone="amber">
              DISTÂNCIA CLIENTE ↔ CTO: {distancia} M
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label className="field-label" htmlFor={fid("bko-responsavel")}>
              BKO RESPONSÁVEL
            </label>
            <input
              id={fid("bko-responsavel")}
              aria-label="BKO RESPONSAVEL"
              className="input"
              value={aba.satBko}
              onChange={(e) => onPatch({ satBko: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={fid("data")}>
              DATA
            </label>
            <input
              id={fid("data")}
              aria-label="DATA"
              className="input"
              value={aba.satData}
              onChange={(e) => onPatch({ satData: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={fid("cidade-uf")}>
              CIDADE/UF
            </label>
            <input
              id={fid("cidade-uf")}
              aria-label="CIDADE UF"
              className="input"
              value={aba.satCidade}
              onChange={(e) => onPatch({ satCidade: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={fid("ordem-de-servico-atendimento")}>
              ORDEM DE SERVIÇO (ATENDIMENTO)
            </label>
            <input
              id={fid("ordem-de-servico-atendimento")}
              aria-label="ORDEM DE SERVICO ATENDIMENTO"
              className="input"
              value={aba.satCliente}
              onChange={(e) => onPatch({ satCliente: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={fid("cto-validada")}>
              CTO VALIDADA
            </label>
            <input
              id={fid("cto-validada")}
              aria-label="CTO VALIDADA"
              className="input"
              value={aba.satCtoVald}
              onChange={(e) => onPatch({ satCtoVald: e.target.value.toUpperCase() })}
            />
          </div>
          <CampoCoordenadas
            rotulo="COORDENADAS CLIENTE"
            valor={aba.satLocCli}
            onChange={(v) => onPatch({ satLocCli: v })}
          />
          <div className="field sm:col-span-2">
            <label className="field-label" htmlFor={fid("motivo-parecer-tecnico")}>
              MOTIVO / PARECER TÉCNICO
            </label>
            <textarea
              id={fid("motivo-parecer-tecnico")}
              aria-label="MOTIVO PARECER TECNICO"
              className="input"
              value={aba.satObs}
              onChange={(e) => onPatch({ satObs: e.target.value.toUpperCase() })}
              placeholder="DESCREVA O MOTIVO DA SATURAÇÃO E O PARECER TÉCNICO..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <CampoCoordenadas
            rotulo="COORDENADAS CTO MAIS PROXIMA"
            valor={aba.satLocCto}
            onChange={(v) => onPatch({ satLocCto: v })}
          />
          <MapaCoordenadas
            locCliente={aba.satLocCli}
            locCto={aba.satLocCto}
            chaveVisibilidade={chaveVisibilidade}
          />
          <button type="button" className="btn btn-amber w-full" onClick={onGerar}>
            ⚡ GERAR RELATÓRIO TÉCNICO
          </button>
        </div>
      </div>

      {aba.scriptSat && (
        <div className="anim-rise mt-4 flex flex-col gap-2">
          <pre className="script-output" data-kind="sat">
            {aba.scriptSat}
          </pre>
          <button type="button" className="btn btn-rose w-full" onClick={onCopiar}>
            ⧉ COPIAR RELATÓRIO PROFISSIONAL
          </button>
        </div>
      )}
    </section>
  );
}
