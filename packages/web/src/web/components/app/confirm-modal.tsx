import { useEffect } from "react";

export interface ConfirmacaoPendente {
  titulo: string;
  mensagem: string;
  rotuloConfirmar?: string;
  tom: "rose" | "amber";
  acao: () => void;
}

interface Props {
  pendente: ConfirmacaoPendente | null;
  onFechar: () => void;
}

export function ConfirmModal({ pendente, onFechar }: Props) {
  useEffect(() => {
    if (!pendente) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      if (e.key === "Enter") {
        pendente.acao();
        onFechar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendente, onFechar]);

  if (!pendente) return null;

  const cor = pendente.tom === "rose" ? "251,78,109" : "245,165,36";

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center p-4"
      style={{ background: "rgba(2,4,8,.78)", backdropFilter: "blur(6px)" }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="FECHAR"
        onClick={onFechar}
      />
      <dialog
        open
        aria-modal="true"
        className="anim-zoom panel relative w-full max-w-[420px] p-7 text-center"
        style={{
          borderColor: `rgba(${cor},.4)`,
          boxShadow: `0 0 60px -20px rgba(${cor},.45)`,
          margin: 0,
          color: "var(--ink)",
        }}
      >
        <div
          className="mx-auto mb-4 grid size-11 place-items-center rounded-full text-[18px] font-bold"
          style={{ background: `rgba(${cor},.14)`, color: `rgb(${cor})` }}
        >
          !
        </div>
        <h2
          className="font-display text-[15px] font-bold"
          style={{ letterSpacing: "0.06em", color: `rgb(${cor})` }}
        >
          {pendente.titulo}
        </h2>
        <p className="mt-3 mb-6 text-[11px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {pendente.mensagem}
        </p>
        <div className="flex gap-3">
          <button type="button" className="btn btn-ghost flex-1" onClick={onFechar}>
            CANCELAR
          </button>
          <button
            type="button"
            className={`btn flex-1 ${pendente.tom === "rose" ? "btn-rose" : "btn-amber"}`}
            onClick={() => {
              pendente.acao();
              onFechar();
            }}
          >
            {pendente.rotuloConfirmar ?? "CONFIRMAR"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
