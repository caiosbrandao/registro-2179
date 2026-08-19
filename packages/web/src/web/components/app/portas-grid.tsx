import { numeroDaPorta } from "@/lib/atendimento/parse";

interface Props {
  portas: string[];
  total: number;
  portaUtilizada: string;
  portaRetirada: string;
  onChangePorta: (indice: number, valor: string) => void;
  onCopiarMapa: () => void;
}

export function PortasGrid({
  portas,
  total,
  portaUtilizada,
  portaRetirada,
  onChangePorta,
  onCopiarMapa,
}: Props) {
  const selecionada = numeroDaPorta(portaUtilizada);
  const retirada = portaRetirada.trim().toUpperCase();
  const ocupadas = portas.slice(0, total).filter((p) => p.trim() !== "").length;

  return (
    <section className="panel p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="section-title">
          <span style={{ color: "var(--azure)" }}>▚</span> MAPEAR PORTAS
        </h3>
        <div className="flex items-center gap-2">
          <span className="badge" data-tone="azure">
            {ocupadas}/{total} OCUPADAS
          </span>
          <button
            type="button"
            className="btn-icon"
            title="COPIAR MAPA DE PORTAS"
            onClick={onCopiarMapa}
          >
            ⧉
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {Array.from({ length: total }, (_, i) => {
          const numero = i + 1;
          const valor = portas[i] ?? "";
          const preenchida = valor.trim() !== "";
          const conflito = retirada !== "" && valor.trim().toUpperCase() === retirada;
          const classes = [
            "porta-row",
            preenchida ? "porta-ocupada" : "porta-livre",
            selecionada === numero ? "porta-selecionada" : "",
            conflito ? "porta-conflito" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={numero} className={classes}>
              <span className="porta-tag">P{numero.toString().padStart(2, "0")}</span>
              <input
                className="porta-input"
                aria-label={`IDENTIFICAÇÃO DA PORTA ${numero}`}
                value={valor}
                placeholder="SEM ID"
                title={conflito ? "ESTA PORTA É IGUAL AO ID DA PORTA RETIRADA" : valor}
                onChange={(e) => onChangePorta(i, e.target.value.toUpperCase())}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
