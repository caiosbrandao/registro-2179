import { useCallback, useRef, useState } from "react";
import type { Toast, TomToast } from "@/components/app/toasts";

/** Fila de toasts com auto-dismiss em 3s. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const fechar = useCallback((id: number) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (msg: string, tom: TomToast = "teal") => {
      seq.current += 1;
      const id = seq.current;
      setToasts((atuais) => [...atuais.slice(-3), { id, msg, tom }]);
      setTimeout(() => fechar(id), 3000);
    },
    [fechar],
  );

  return { toasts, toast, fechar };
}
