import { useMemo, useState } from "react";
import { exportarCSV, exportarJSON, metricas7Dias } from "@/lib/atendimento/storage";
import type { Registro } from "@/lib/atendimento/types";

interface Props {
  hist: Registro[];
  onEditar: (id: string | number) => void;
  onExcluir: (id: string | number) => void;
  onCopiarRegistro: (r: Registro) => void;
}

export function HistoricoPanel({ hist, onEditar, onExcluir, onCopiarRegistro }: Props) {
  const [busca, setBusca] = useState("");

  const metricas = useMemo(() => metricas7Dias(hist), [hist]);
  const filtrados = useMemo(() => {
    const termo = busca.trim().toUpperCase();
    if (!termo) return hist;
    return hist.filter((r) =>
      Object.values(r)
        .map((v) => (Array.isArray(v) ? v.join(" ") : String(v ?? "")))
        .join(" ")
        .toUpperCase()
        .includes(termo),
    );
  }, [hist, busca]);

  const totalSemana = metricas.reduce((acc, m) => acc + m.qtd, 0);

  return (
    <div className="anim-rise flex flex-col gap-5">
      <section className="panel p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="section-title" style={{ color: "var(--teal)" }}>
            ▦ RESUMO DOS ÚLTIMOS 7 DIAS
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge" data-tone="teal">
              {totalSemana} ATENDIMENTOS NA JANELA
            </span>
            <span className="badge">RETENÇÃO AUTOMÁTICA: 7 DIAS</span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {metricas.map((m) => (
            <div key={m.dia} className="metric-card" data-today={m.hoje}>
              <div className="metric-day">{m.hoje ? "HOJE" : m.dia}</div>
              <div className="metric-qty">{m.qtd}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className="input flex-1"
            aria-label="BUSCAR NO HISTORICO"
            style={{ minWidth: 220 }}
            value={busca}
            placeholder="BUSCAR NO HISTÓRICO (CHAT, OS, CTO, CLIENTE, OBS...)"
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="button" className="btn btn-ghost" onClick={() => exportarCSV(hist)}>
            ⇩ CSV
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => exportarJSON(hist)}>
            ⇩ JSON
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--line)" }}>
          <table className="hist-table">
            <thead>
              <tr>
                <th>DATA/HORA</th>
                <th>ID CHAT</th>
                <th>OS</th>
                <th>CTO</th>
                <th>CLIENTE</th>
                <th>PORTA UTIL.</th>
                <th>CORREÇÃO</th>
                <th>OBS</th>
                <th className="text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {hist.length === 0
                      ? "NENHUM ATENDIMENTO SALVO NOS ÚLTIMOS 7 DIAS."
                      : "NADA ENCONTRADO PARA ESSA BUSCA."}
                  </td>
                </tr>
              )}
              {filtrados.map((r) => (
                <tr key={String(r.id_reg)}>
                  <td className="font-mono whitespace-nowrap">{r.timestamp}</td>
                  <td className="font-mono" style={{ color: "var(--amber)" }}>
                    {r.chat}
                  </td>
                  <td className="font-mono">{r.os}</td>
                  <td>{r.cto}</td>
                  <td className="max-w-[180px] truncate" title={r.cliente}>
                    {r.cliente}
                  </td>
                  <td className="whitespace-nowrap">{r.porta_utilizada}</td>
                  <td>
                    <span className="badge" data-tone={r.correcao === "SIM" ? "amber" : undefined}>
                      {r.correcao}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate" title={r.obs}>
                    {r.obs}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn-icon"
                        title="COPIAR SCRIPT DESTE REGISTRO"
                        aria-label="COPIAR SCRIPT DESTE REGISTRO"
                        onClick={() => onCopiarRegistro(r)}
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="EDITAR NA ABA ATIVA"
                        aria-label="EDITAR NA ABA ATIVA"
                        style={{ color: "var(--azure)" }}
                        onClick={() => onEditar(r.id_reg)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="EXCLUIR REGISTRO"
                        aria-label="EXCLUIR REGISTRO"
                        style={{ color: "var(--rose)" }}
                        onClick={() => onExcluir(r.id_reg)}
                      >
                        ⌫
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
