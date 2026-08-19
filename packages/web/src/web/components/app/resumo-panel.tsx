import type { Aba } from "@/lib/atendimento/types";

interface Props {
  aba: Aba;
  onCopiar: (rotulo: string, valor: string) => void;
}

type Tom = "amber" | "teal" | "default";

interface ItemResumo {
  rotulo: string;
  valor: string;
  tom: Tom;
  largo?: boolean;
}

export function ResumoPanel({ aba, onCopiar }: Props) {
  const itens: ItemResumo[] = [
    { rotulo: "ID CHAT", valor: aba.chat, tom: "amber" },
    { rotulo: "O.S.", valor: aba.os, tom: "amber" },
    { rotulo: "CONTRATO", valor: aba.contrato, tom: "default" },
    { rotulo: "ID CTO", valor: aba.cto, tom: "default" },
    { rotulo: "PORTA RETIRADA", valor: aba.portaRetirada, tom: "amber" },
    { rotulo: "CIDADE/UF", valor: aba.satCidade, tom: "default" },
    { rotulo: "NOME CLIENTE", valor: aba.nomeCli, tom: "default", largo: true },
    { rotulo: "COORD. CTO PRÓXIMA", valor: aba.satLocCto, tom: "teal", largo: true },
    { rotulo: "COORD. CLIENTE", valor: aba.satLocCli, tom: "teal", largo: true },
  ];

  return (
    <section className="panel p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="section-title">
          <span style={{ color: "var(--teal)" }}>◎</span> RESUMO OPERACIONAL
        </h3>
        <span className="text-[8.5px]" style={{ color: "var(--ink-soft)", letterSpacing: ".1em" }}>
          CLIQUE PARA COPIAR
        </span>
      </header>

      <div className="grid grid-cols-3 gap-1.5">
        {itens.map((item) => {
          const valor = (item.valor || "").toUpperCase().trim();
          return (
            <button
              key={item.rotulo}
              type="button"
              className={`resumo-item ${item.largo ? "col-span-3" : ""}`}
              data-tone={item.tom}
              title={valor || "-"}
              onClick={() => onCopiar(item.rotulo, valor)}
            >
              <span className="resumo-label">{item.rotulo}</span>
              <span className="resumo-valor">{valor || "-"}</span>
              <span className="resumo-copy">⧉</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
