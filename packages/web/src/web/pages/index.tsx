import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AtendimentoTab } from "@/components/app/atendimento-tab";
import { ConfirmModal, type ConfirmacaoPendente } from "@/components/app/confirm-modal";
import { HistoricoPanel } from "@/components/app/historico-panel";
import { ID_HISTORICO, TabsBar } from "@/components/app/tabs-bar";
import { ToastHost } from "@/components/app/toasts";
import { useToasts } from "@/hooks/use-toasts";
import { copiarTexto } from "@/lib/clipboard";
import { coordenadasValidas, resolverEndereco } from "@/lib/atendimento/geo";
import { abaDeRegistro, registroDaAba } from "@/lib/atendimento/mapper";
import {
  aplicarImportacao,
  extrairCoordenadasDeTexto,
  numeroDaPorta,
  parseScriptCampo,
  textoPortaUtilizada,
} from "@/lib/atendimento/parse";
import {
  gerarScriptAtendimento,
  gerarScriptSaturada,
  mapaPortasTexto,
} from "@/lib/atendimento/script";
import {
  caminhoDaCto,
  carregarHistoricoComExpurgo,
  carregarRascunho,
  memorizarCaminhoCto,
  removerRegistro,
  salvarHistorico,
  salvarRascunho,
  upsertRegistro,
} from "@/lib/atendimento/storage";
import {
  CAMPOS_OBRIGATORIOS,
  limparAba,
  novaAba,
  qtdPortas,
  type Aba,
  type CampoObrigatorio,
  type Registro,
} from "@/lib/atendimento/types";

function invalidosDaAba(aba: Aba): Set<CampoObrigatorio> {
  const set = new Set<CampoObrigatorio>();
  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (!String(aba[campo] ?? "").trim()) set.add(campo);
  }
  return set;
}

function Index() {
  const { toasts, toast, fechar } = useToasts();

  const [abas, setAbas] = useState<Aba[]>(() => {
    const rascunho = carregarRascunho();
    return rascunho.length > 0 ? rascunho : [novaAba(1)];
  });
  const [ativo, setAtivo] = useState<string>(() => abas[0]?.id ?? ID_HISTORICO);
  const [hist, setHist] = useState<Registro[]>([]);
  const [pendente, setPendente] = useState<ConfirmacaoPendente | null>(null);
  const [geocodificando, setGeocodificando] = useState<Record<string, boolean>>({});
  const [salvoAgora, setSalvoAgora] = useState<string | null>(null);

  const timersGeo = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const contadorTitulo = useRef<number>(Math.max(0, ...abas.map((a) => a.titulo)));

  const abaAtiva = abas.find((a) => a.id === ativo) ?? null;

  /* ---------- carga inicial: histórico com retenção de 7 dias ---------- */
  useEffect(() => {
    const { hist: carregado, removidos } = carregarHistoricoComExpurgo();
    setHist(carregado);
    if (removidos > 0) {
      toast(`${removidos} REGISTRO(S) COM MAIS DE 7 DIAS REMOVIDO(S)`, "amber");
    }
  }, [toast]);

  /* ---------- rascunho automático das abas ---------- */
  useEffect(() => {
    const t = setTimeout(() => salvarRascunho(abas), 400);
    return () => clearTimeout(t);
  }, [abas]);

  /* ---------- limpeza dos timers de geocodificação ---------- */
  useEffect(() => {
    const timers = timersGeo.current;
    return () => {
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, []);

  const atualizarAba = useCallback((id: string, fn: (aba: Aba) => Aba) => {
    setAbas((atuais) => atuais.map((a) => (a.id === id ? fn(a) : a)));
  }, []);

  /** Busca cidade/endereço a partir de coordenadas (debounce de 800ms por aba). */
  const agendarGeocode = useCallback(
    (id: string, coordenadas: string) => {
      clearTimeout(timersGeo.current[id]);
      if (!coordenadasValidas(coordenadas)) return;
      timersGeo.current[id] = setTimeout(async () => {
        setGeocodificando((g) => ({ ...g, [id]: true }));
        try {
          const resultado = await resolverEndereco(coordenadas);
          if (resultado) {
            atualizarAba(id, (aba) => ({
              ...aba,
              satCidade: resultado.cidadeUf || aba.satCidade,
              enderecoCompleto: resultado.enderecoCompleto || aba.enderecoCompleto,
            }));
            if (resultado.cidade) toast(`LOCALIZADO: ${resultado.cidade}`, "azure");
          }
        } catch {
          toast("FALHA AO BUSCAR ENDEREÇO (NOMINATIM)", "rose");
        } finally {
          setGeocodificando((g) => ({ ...g, [id]: false }));
        }
      }, 800);
    },
    [atualizarAba, toast],
  );

  /** Patch central: aplica regras de sincronização automática da v2. */
  const patchAba = useCallback(
    (id: string, patch: Partial<Aba>) => {
      let coordParaGeocode: string | null = null;
      let toastPendente: string | null = null;

      setAbas((atuais) =>
        atuais.map((aba) => {
          if (aba.id !== id) return aba;
          let proxima: Aba = { ...aba, ...patch };

          // normaliza coordenadas coladas como link/texto
          for (const campo of ["satLocCli", "satLocCto"] as const) {
            if (patch[campo] !== undefined) {
              const limpo = extrairCoordenadasDeTexto(String(patch[campo]));
              proxima = { ...proxima, [campo]: limpo };
              if (coordenadasValidas(limpo)) coordParaGeocode = limpo;
            }
          }

          // CTO alterada → tenta recuperar o caminho de rede memorizado
          if (patch.cto !== undefined && patch.cto !== aba.cto) {
            const memorizado = caminhoDaCto(String(patch.cto));
            if (memorizado && memorizado !== proxima.caminhoRede) {
              proxima = { ...proxima, caminhoRede: memorizado };
              toastPendente = "CAMINHO DE REDE RECUPERADO!";
            }
            if (!proxima.satCtoVald || proxima.satCtoVald === aba.cto) {
              proxima = { ...proxima, satCtoVald: String(patch.cto) };
            }
          }

          // OS alterada → espelha na OS do relatório de saturação
          if (patch.os !== undefined && (!aba.satCliente || aba.satCliente === aba.os)) {
            proxima = { ...proxima, satCliente: String(patch.os) };
          }

          // modelo reduzido para 8 portas → limpa as portas 9..16
          if (patch.modeloCto !== undefined && qtdPortas(patch.modeloCto) === 8) {
            proxima = {
              ...proxima,
              portas: proxima.portas.map((p, i) => (i >= 8 ? "" : p)),
              portaUtilizada:
                (numeroDaPorta(proxima.portaUtilizada) ?? 0) > 8
                  ? "NENHUMA"
                  : proxima.portaUtilizada,
            };
          }

          // porta utilizada / contrato / nome → preenche o texto da porta automaticamente
          const mexeuNaPorta =
            patch.portaUtilizada !== undefined ||
            patch.contrato !== undefined ||
            patch.nomeCli !== undefined;
          if (mexeuNaPorta) {
            const numero = numeroDaPorta(proxima.portaUtilizada);
            const contrato = proxima.contrato.trim();
            const nome = proxima.nomeCli.trim();
            if (numero && (contrato || nome)) {
              const portas = [...proxima.portas];
              portas[numero - 1] = textoPortaUtilizada(numero, contrato, nome);
              proxima = { ...proxima, portas };
            }
          }

          return proxima;
        }),
      );

      if (coordParaGeocode) agendarGeocode(id, coordParaGeocode);
      if (toastPendente) toast(toastPendente, "azure");
    },
    [agendarGeocode, toast],
  );

  /* ---------- ações de aba ---------- */

  const adicionarAba = useCallback(() => {
    contadorTitulo.current += 1;
    const aba = novaAba(contadorTitulo.current);
    setAbas((atuais) => [...atuais, aba]);
    setAtivo(aba.id);
  }, []);

  const fecharAba = useCallback((id: string) => {
    setPendente({
      titulo: "FECHAR ABA",
      mensagem: "OS DADOS NÃO SALVOS DESTA ABA SERÃO PERDIDOS. DESEJA FECHAR?",
      rotuloConfirmar: "FECHAR",
      tom: "amber",
      acao: () => {
        setAbas((atuais) => {
          const restantes = atuais.filter((a) => a.id !== id);
          const finais = restantes.length > 0 ? restantes : [novaAba(1)];
          setAtivo((atual) => (atual === id ? finais[0].id : atual));
          return finais;
        });
      },
    });
  }, []);

  const limparFormulario = useCallback(
    (id: string) => {
      setPendente({
        titulo: "LIMPAR FORMULÁRIO",
        mensagem: "TODOS OS CAMPOS DESTA ABA SERÃO ZERADOS. LIMPAR MESMO ASSIM?",
        rotuloConfirmar: "LIMPAR",
        tom: "amber",
        acao: () => {
          setAbas((atuais) => atuais.map((a) => (a.id === id ? limparAba(a) : a)));
          toast("FORMULÁRIO LIMPO!", "amber");
        },
      });
    },
    [toast],
  );

  /* ---------- importação e scripts ---------- */

  const processarImport = useCallback(
    (id: string) => {
      const aba = abas.find((a) => a.id === id);
      if (!aba) return;
      if (!aba.importText.trim()) {
        toast("COLE O SCRIPT DO TÉCNICO ANTES DE PROCESSAR", "amber");
        return;
      }
      const dados = parseScriptCampo(aba.importText);
      const atualizada = aplicarImportacao(aba, dados);
      const memorizado = caminhoDaCto(atualizada.cto);
      const comCaminho = memorizado ? { ...atualizada, caminhoRede: memorizado } : atualizada;
      setAbas((atuais) => atuais.map((a) => (a.id === id ? comCaminho : a)));

      const coord = dados.locCliente || dados.locCto;
      if (coordenadasValidas(coord)) agendarGeocode(id, coord);
      toast("DADOS IMPORTADOS!", "teal");
    },
    [abas, agendarGeocode, toast],
  );

  const copiar = useCallback(
    async (texto: string, msgOk: string) => {
      const ok = await copiarTexto(texto);
      toast(ok ? msgOk : "NÃO FOI POSSÍVEL COPIAR", ok ? "teal" : "rose");
    },
    [toast],
  );

  const gerarScript = useCallback(
    (id: string) => {
      const aba = abas.find((a) => a.id === id);
      if (!aba) return;
      const faltando = invalidosDaAba(aba);
      atualizarAba(id, (a) => ({ ...a, scriptAt: gerarScriptAtendimento(a) }));
      if (faltando.size > 0) {
        toast(`SCRIPT GERADO COM ${faltando.size} CAMPO(S) PENDENTE(S)`, "amber");
      } else {
        toast("SCRIPT GERADO!", "teal");
      }
    },
    [abas, atualizarAba, toast],
  );

  const gerarSaturada = useCallback(
    (id: string) => {
      atualizarAba(id, (a) => ({ ...a, scriptSat: gerarScriptSaturada(a) }));
      toast("RELATÓRIO TÉCNICO GERADO!", "amber");
    },
    [atualizarAba, toast],
  );

  /* ---------- histórico ---------- */

  const salvarAtendimento = useCallback(
    (id: string) => {
      const aba = abas.find((a) => a.id === id);
      if (!aba) return;
      if (!aba.chat.trim() || !aba.os.trim() || !aba.cto.trim()) {
        toast("PREENCHA ID CHAT, ORDEM DE SERVIÇO E ID CTO!", "rose");
        return;
      }
      const registro = registroDaAba(aba);
      setHist((atual) => {
        const proximo = upsertRegistro(atual, registro);
        salvarHistorico(proximo);
        return proximo;
      });
      memorizarCaminhoCto(aba.cto, aba.caminhoRede);
      atualizarAba(id, (a) => ({ ...a, idReg: String(registro.id_reg) }));
      setSalvoAgora(id);
      setTimeout(() => setSalvoAgora((atual) => (atual === id ? null : atual)), 2000);
      toast("ATENDIMENTO SALVO COM SUCESSO!", "teal");
    },
    [abas, atualizarAba, toast],
  );

  const editarRegistro = useCallback(
    (idReg: string | number) => {
      const registro = hist.find((r) => String(r.id_reg) === String(idReg));
      if (!registro) return;

      const destino = abas.find((a) => a.id === ativo && a.id !== ID_HISTORICO) ?? abas[0];
      if (!destino) return;

      setAbas((atuais) =>
        atuais.map((a) => (a.id === destino.id ? abaDeRegistro(a, registro) : a)),
      );
      setAtivo(destino.id);
      if (coordenadasValidas(registro.sat_loc_cli))
        agendarGeocode(destino.id, registro.sat_loc_cli);
      toast("DADOS CARREGADOS NA ABA!", "azure");
    },
    [abas, ativo, agendarGeocode, hist, toast],
  );

  const excluirRegistro = useCallback(
    (idReg: string | number) => {
      setPendente({
        titulo: "CONFIRMAR EXCLUSÃO",
        mensagem: "VOCÊ REALMENTE DESEJA ELIMINAR ESTE REGISTRO DO HISTÓRICO?",
        rotuloConfirmar: "EXCLUIR",
        tom: "rose",
        acao: () => {
          setHist((atual) => {
            const proximo = removerRegistro(atual, idReg);
            salvarHistorico(proximo);
            return proximo;
          });
          toast("REGISTRO EXCLUÍDO!", "rose");
        },
      });
    },
    [toast],
  );

  const copiarRegistro = useCallback(
    (r: Registro) => {
      const mapa = (r.portas ?? [])
        .map((p, i) => `P${(i + 1).toString().padStart(2, "0")}: ${p}`)
        .join("\n");
      const texto =
        `ID CHAT: ${r.chat}\nORDEM DE SERVIÇO: ${r.os}\nID CTO: ${r.cto}\n` +
        `CAMINHO DE REDE CTO: ${r.caminho_rede}\nMODELO: ${r.modelo}\n` +
        `PORTA UTILIZADA: ${r.porta_utilizada} \nID PORTA RETIRADA: ${r.porta_retirada}\n` +
        `CORREÇÃO CAMINHO PORTA UTILIZADA: ${r.correcao}\nOBS: ${r.obs}\n\nMAPA:\n${mapa}\n`;
      void copiar(texto, "SCRIPT DO REGISTRO COPIADO!");
    },
    [copiar],
  );

  /* ---------- atalhos de teclado ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tecla = e.key.toLowerCase();
      if (tecla === "s" && abaAtiva) {
        e.preventDefault();
        salvarAtendimento(abaAtiva.id);
      } else if (tecla === "enter" && abaAtiva) {
        e.preventDefault();
        gerarScript(abaAtiva.id);
      } else if (tecla === "m") {
        e.preventDefault();
        adicionarAba();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abaAtiva, adicionarAba, gerarScript, salvarAtendimento]);

  const [validados, setValidados] = useState<Record<string, boolean>>({});

  const invalidos = useMemo(
    () => (abaAtiva ? invalidosDaAba(abaAtiva) : new Set<CampoObrigatorio>()),
    [abaAtiva],
  );

  return (
    <div className="relative z-[1] mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4 sm:p-6">
      <ToastHost toasts={toasts} onFechar={fechar} />
      <ConfirmModal pendente={pendente} onFechar={() => setPendente(null)} />

      {/* HEADER */}
      <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="font-display grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-bold"
            style={{
              background: "linear-gradient(145deg, #7dd7fb, #2dd4bf)",
              color: "#04141d",
              boxShadow: "0 12px 30px -14px rgba(56,189,248,.8)",
            }}
          >
            RA
          </div>
          <div>
            <h1 className="font-display text-[15px] leading-tight font-bold">
              REGISTRO DE ATENDIMENTO
            </h1>
            <p
              className="text-[9.5px]"
              style={{ color: "var(--ink-soft)", letterSpacing: ".14em" }}
            >
              BKO · MAPEAMENTO DE CTO · PRO V3.0
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge" data-tone="azure">
            {abas.length} ABA(S) ATIVA(S)
          </span>
          <span className="badge" data-tone="teal">
            {hist.length} NO HISTÓRICO
          </span>
          <span className="badge" title="CTRL+S SALVAR · CTRL+ENTER GERAR · CTRL+M NOVA ABA">
            ⌨ ATALHOS
          </span>
        </div>
      </header>

      <TabsBar
        abas={abas}
        ativo={ativo}
        onSelecionar={setAtivo}
        onFechar={fecharAba}
        onAdicionar={adicionarAba}
        qtdHistorico={hist.length}
      />

      {ativo === ID_HISTORICO ? (
        <HistoricoPanel
          hist={hist}
          onEditar={editarRegistro}
          onExcluir={excluirRegistro}
          onCopiarRegistro={copiarRegistro}
        />
      ) : (
        abaAtiva && (
          <AtendimentoTab
            key={abaAtiva.id}
            aba={abaAtiva}
            invalidos={invalidos}
            destacarErros={Boolean(validados[abaAtiva.id])}
            geocodificando={Boolean(geocodificando[abaAtiva.id])}
            salvoAgora={salvoAgora === abaAtiva.id}
            onPatch={(patch) => patchAba(abaAtiva.id, patch)}
            onChangePorta={(indice, valor) =>
              atualizarAba(abaAtiva.id, (a) => {
                const portas = [...a.portas];
                portas[indice] = valor;
                return { ...a, portas };
              })
            }
            onProcessarImport={() => processarImport(abaAtiva.id)}
            onGerarScript={() => {
              setValidados((v) => ({ ...v, [abaAtiva.id]: true }));
              gerarScript(abaAtiva.id);
            }}
            onSalvar={() => {
              setValidados((v) => ({ ...v, [abaAtiva.id]: true }));
              salvarAtendimento(abaAtiva.id);
            }}
            onLimpar={() => limparFormulario(abaAtiva.id)}
            onCopiarScript={() => void copiar(abaAtiva.scriptAt, "SCRIPT COPIADO!")}
            onCopiarMapa={() => void copiar(mapaPortasTexto(abaAtiva), "MAPA DE PORTAS COPIADO!")}
            onCopiarResumo={(rotulo, valor) => {
              if (!valor || valor === "-") {
                toast(`${rotulo} ESTÁ VAZIO`, "amber");
                return;
              }
              void copiar(valor, `COPIADO: ${valor}`);
            }}
            onGerarSaturada={() => gerarSaturada(abaAtiva.id)}
            onCopiarSaturada={() => void copiar(abaAtiva.scriptSat, "RELATÓRIO COPIADO!")}
          />
        )
      )}

      <footer
        className="mt-2 flex flex-wrap items-center justify-between gap-2 pb-6 text-[9px]"
        style={{ color: "var(--ink-soft)", letterSpacing: ".1em" }}
      >
        <span>DADOS ARMAZENADOS APENAS NESTE NAVEGADOR · RETENÇÃO DE 7 DIAS</span>
        <span>CTRL+S SALVAR · CTRL+ENTER GERAR SCRIPT · CTRL+M NOVA ABA</span>
      </footer>
    </div>
  );
}

export default Index;
