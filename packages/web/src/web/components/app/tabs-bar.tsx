import type { Aba } from "@/lib/atendimento/types";

interface Props {
  abas: Aba[];
  ativo: string;
  onSelecionar: (id: string) => void;
  onFechar: (id: string) => void;
  onAdicionar: () => void;
  qtdHistorico: number;
}

export const ID_HISTORICO = "tab-historico";

export function TabsBar({ abas, ativo, onSelecionar, onFechar, onAdicionar, qtdHistorico }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {abas.map((aba) => {
        const pendente = !aba.chat && !aba.os && !aba.cto;
        const fechavel = abas.length > 1;
        return (
          <div key={aba.id} className="relative shrink-0">
            <button
              type="button"
              className="tab-btn"
              data-active={ativo === aba.id}
              style={{ paddingRight: fechavel ? 30 : undefined }}
              onClick={() => onSelecionar(aba.id)}
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  background: pendente
                    ? "rgba(255,255,255,.25)"
                    : aba.idReg
                      ? "var(--azure)"
                      : "var(--teal)",
                }}
              />
              ATEND. {aba.titulo}
            </button>
            {fechavel && (
              <button
                type="button"
                className="tab-close absolute top-1/2 right-2 -translate-y-1/2"
                title="FECHAR ABA"
                aria-label={`FECHAR ABA ${aba.titulo}`}
                onClick={() => onFechar(aba.id)}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      <button type="button" className="btn-icon ml-1" title="NOVA ABA" onClick={onAdicionar}>
        +
      </button>

      <button
        type="button"
        className="tab-btn ml-auto"
        data-kind="hist"
        data-active={ativo === ID_HISTORICO}
        onClick={() => onSelecionar(ID_HISTORICO)}
      >
        ▦ HISTÓRICO
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px]"
          style={{
            background: ativo === ID_HISTORICO ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.08)",
          }}
        >
          {qtdHistorico}
        </span>
      </button>
    </div>
  );
}
