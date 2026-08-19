export type TomToast = "teal" | "rose" | "amber" | "azure";

export interface Toast {
  id: number;
  msg: string;
  tom: TomToast;
}

const ICONES: Record<TomToast, string> = {
  teal: "✔",
  rose: "✖",
  amber: "!",
  azure: "i",
};

const CORES: Record<TomToast, { borda: string; texto: string; brilho: string }> = {
  teal: { borda: "rgba(45,212,191,.45)", texto: "#6ee7d7", brilho: "rgba(45,212,191,.18)" },
  rose: { borda: "rgba(251,78,109,.45)", texto: "#ff92a8", brilho: "rgba(251,78,109,.18)" },
  amber: { borda: "rgba(245,165,36,.45)", texto: "#ffc35c", brilho: "rgba(245,165,36,.18)" },
  azure: { borda: "rgba(56,189,248,.45)", texto: "#7dd7fb", brilho: "rgba(56,189,248,.18)" },
};

interface Props {
  toasts: Toast[];
  onFechar: (id: number) => void;
}

export function ToastHost({ toasts, onFechar }: Props) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-[min(92vw,340px)] flex-col gap-2">
      {toasts.map((t) => {
        const cor = CORES[t.tom];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onFechar(t.id)}
            className="anim-toast pointer-events-auto flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left"
            style={{
              background: "rgba(8,12,18,.92)",
              border: `1px solid ${cor.borda}`,
              backdropFilter: "blur(14px)",
              boxShadow: `0 18px 40px -22px #000, 0 0 0 4px ${cor.brilho}`,
            }}
          >
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
              style={{ background: cor.brilho, color: cor.texto }}
            >
              {ICONES[t.tom]}
            </span>
            <span className="text-[10.5px] font-bold" style={{ letterSpacing: "0.06em" }}>
              {t.msg}
            </span>
          </button>
        );
      })}
    </div>
  );
}
