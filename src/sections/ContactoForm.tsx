import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import Link from "../app/Link";
import Button from "../components/ui/Button";
import CaixaVerificacao from "../components/forms/VerificacaoHumana";
import { useVerificacaoHumana } from "../components/forms/useVerificacaoHumana";
import CamposRamo from "../components/forms/CamposRamo";
import EscolhaRamo from "../components/forms/EscolhaRamo";
import PassosProgresso from "../components/forms/PassosProgresso";
import ResumoPedido from "../components/forms/ResumoPedido";
import { CamposContacto, CamposFecho, PorquePedimos } from "../components/forms/CamposBase";
import type { ValorExterno } from "../components/forms/CampoCodigoPostal";
import { PREFIXO_CAMPO, lerValores } from "../components/forms/valores";
import { enviarContacto, EnvioContactoError, MENSAGEM_ERRO } from "../utils/enviarContacto";
import { blocosDosPassos, montarMensagem } from "../utils/montarMensagem";
import type { Bloco } from "../utils/montarMensagem";
import { nifDeEmpresa, normalizarTelefone } from "../utils/validacoes";
import type { ErroContacto, RamoCrm } from "../utils/enviarContacto";
import { FORMULARIOS } from "../data/formularios";
import type { FormularioRamo, PassoRamo, Valores } from "../data/formularios";
import { SEGUROS } from "../data/seguros";
import type { RamoKey } from "../data/seguros";

type Estado = "inicial" | "a_enviar" | "enviado";

type Passo = { id: string; nome: string; titulo: string; texto?: string; ramo?: PassoRamo };

/** O que o formulário junta no fim e entrega a quem envia (proposta ou sinistro). */
export type EnvioPedido = {
  dados: FormData;
  valores: Valores;
  formulario?: FormularioRamo;
  ramo: RamoCrm;
  contexto: string[];
};

/**
 * O que muda entre o pedido de proposta e o de sinistro. A máquina dos
 * passos (validação, deslize lateral, avanço automático, resumo) é a mesma.
 */
export type Modalidade = {
  formularios: Record<RamoKey, FormularioRamo>;
  tituloTipo: string;
  textoDados: string;
  nifObrigatorio: boolean;
  comCodigoPostal: boolean;
  porquePedimos: string;
  finalidade: string;
  rotuloEnviar: string;
  sucesso: { titulo: string; texto: string };
  /** Por cima de tudo, em todos os passos (ex.: "em caso de feridos, ligue 112"). */
  aviso?: ReactNode;
  enviar: (pedido: EnvioPedido, token: string | null) => Promise<void>;
};

export type ContactoFormProps = {
  ramos: { valor: RamoCrm; nome: string }[];
  /**
   * Página de um ramo: o ramo é fixo (sem o passo do tipo de seguro). Sem
   * ele, o tipo de seguro é o primeiro passo e os passos desse ramo vêm a seguir.
   */
  ramoFixo?: { valor: RamoCrm; formulario: FormularioRamo };
  /** Linhas já escolhidas na página (ex.: o nível de proteção), no topo da mensagem do lead. */
  contexto?: string[];
  /** Com isto, o ecrã de sucesso mostra "Fechar" em vez de "Enviar outro pedido". */
  onConcluido?: () => void;
  /** Por omissão, o pedido de proposta. */
  modalidade?: Modalidade;
};

const texto = (dados: FormData, nome: string) => String(dados.get(nome) ?? "").trim();

/** Pedido de proposta: vai para o CRM como lead, com as respostas na mensagem (opção A). */
async function enviarProposta({ dados, valores, formulario, ramo, contexto }: EnvioPedido, token: string | null) {
  const nif = texto(dados, "nif").replace(/\D/g, "");
  const cp = texto(dados, "codigo_postal");
  const local = texto(dados, "codigo_postal_local");
  const contacto: Bloco = {
    titulo: "Contacto",
    linhas: [
      { rotulo: "NIF", valor: nif },
      { rotulo: "Código postal", valor: local ? `${cp} (${local})` : cp },
    ].filter((l) => l.valor),
  };
  const blocos = [...(formulario ? blocosDosPassos(formulario.passos, valores) : []), ...(contacto.linhas.length ? [contacto] : [])];
  await enviarContacto(
    {
      nome: texto(dados, "nome"),
      email: texto(dados, "email"),
      telefone: normalizarTelefone(texto(dados, "telefone")),
      ramo,
      mensagem: montarMensagem(blocos, texto(dados, "mensagem"), contexto),
      consentimento: dados.get("consentimento") === "sim",
    },
    token
  );
}

const PROPOSTA: Modalidade = {
  formularios: FORMULARIOS,
  tituloTipo: "Que seguro procura?",
  textoDados: "Para lhe enviarmos as propostas.",
  nifObrigatorio: true,
  comCodigoPostal: true,
  porquePedimos: "Só para preparar as propostas que pediu e falar consigo sobre elas.",
  finalidade: "responder ao meu pedido",
  rotuloEnviar: "Enviar pedido",
  sucesso: { titulo: "Pedido recebido.", texto: "Obrigado. Um mediador da BV Seguros vai contactá-lo pelo telefone ou email que indicou." },
  enviar: enviarProposta,
};

/** Põe um erro num campo até à próxima vez que for alterado. */
function erroAte(campo: Element | null, mensagem: string) {
  if (!(campo instanceof HTMLInputElement)) return;
  campo.setCustomValidity(mensagem);
  campo.addEventListener("input", () => campo.setCustomValidity(""), { once: true });
}

/**
 * Pedido por passos (proposta ou sinistro), como os simuladores da Fidelidade: um
 * tema por ecrã, barra de progresso, erros por campo e um resumo no fim.
 * Nada é enviado antes do último passo (com consentimento). Todos os
 * passos ficam montados num só <form>, escondidos com `hidden`, para o
 * envio ter tudo; cada passo é validado antes de se avançar.
 */
export default function ContactoForm({ ramos, ramoFixo, contexto = [], onConcluido, modalidade = PROPOSTA }: ContactoFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const titulos = useRef<(HTMLHeadingElement | null)[]>([]);
  const mudouPasso = useRef<"titulo" | "erro" | null>(null);
  const [estado, setEstado] = useState<Estado>("inicial");
  const [erro, setErro] = useState<ErroContacto | null>(null);
  const verificacao = useVerificacaoHumana();
  const [ramoEscolhido, setRamoEscolhido] = useState<RamoCrm | "">("");
  const [atual, setAtual] = useState(0);
  const [valores, setValores] = useState<Valores>({});
  const [resumo, setResumo] = useState<(Bloco & { indice: number })[]>([]);
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [cpContacto, setCpContacto] = useState<ValorExterno | undefined>(undefined);
  // Para que lado desliza o passo que entra: da direita ao avançar, da esquerda ao voltar.
  const [direcao, setDirecao] = useState<"frente" | "tras" | null>(null);
  // Setas do teclado mudam a escolha num grupo de opções sem avançar; Enter ou "Próximo" avançam.
  const comSetas = useRef(false);
  const respostaAntes = useRef<{ passo: string; resposta: string } | null>(null);

  const seguro = SEGUROS.find((s) => s.ramoCrm === (ramoFixo?.valor ?? ramoEscolhido));
  const formulario = ramoFixo?.formulario ?? (seguro ? modalidade.formularios[seguro.key] : undefined);

  const passos: Passo[] = [
    ...(ramoFixo ? [] : [{ id: "tipo", nome: "O seguro", titulo: modalidade.tituloTipo }]),
    ...(formulario
      ? formulario.passos
          .filter((p) => !p.mostrarSe || p.mostrarSe(valores))
          .map((p) => ({ id: p.id, nome: p.nome, titulo: p.titulo, texto: p.texto, ramo: p }))
      : [{ id: "ramo", nome: "Sobre o seguro", titulo: "" }]),
    { id: "dados", nome: "Os seus dados", titulo: "Agora, os seus dados.", texto: modalidade.textoDados },
    ...(formulario?.semRevisao
      ? []
      : [{ id: "rever", nome: "Rever e enviar", titulo: primeiroNome ? `${primeiroNome}, confirme o pedido.` : "Confirme o pedido." }]),
  ];
  const ultimo = passos.length - 1;

  const recalcular = useCallback(() => {
    if (!formRef.current) return;
    const novos = lerValores(formRef.current);
    setValores((antes) => (JSON.stringify(antes) === JSON.stringify(novos) ? antes : novos));
  }, []);

  // Ao mudar de passo: foco no título (o leitor de ecrã anuncia-o) e a página volta ao topo do formulário.
  useEffect(() => {
    const motivo = mudouPasso.current;
    mudouPasso.current = null;
    if (!motivo) return;
    const form = formRef.current;
    if (form && form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: "start" });
    if (motivo === "erro") validarPasso(atual);
    else titulos.current[atual]?.focus();
    // validarPasso lê o DOM do passo atual; não é dependência de estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual]);

  const seccao = (i: number) => formRef.current?.querySelector<HTMLElement>(`[data-passo="${i}"]`) ?? null;

  /** Valida só os campos de um passo; mostra os erros e foca o primeiro. */
  function validarPasso(i: number): boolean {
    const form = formRef.current;
    const raiz = seccao(i);
    if (!form || !raiz) return true;
    const v = lerValores(form);
    const passo = passos[i];

    // Regras entre campos do ramo, no passo onde está o campo.
    const nomes = new Set(passo.ramo?.campos.map((c) => c.nome));
    for (const r of formulario?.regras?.(v) ?? []) {
      if (nomes.has(r.campo)) erroAte(raiz.querySelector(`[name="${PREFIXO_CAMPO}${r.campo}"]`), r.mensagem);
    }
    if (passo.id === "dados") {
      const nif = raiz.querySelector<HTMLInputElement>('[name="nif"]');
      const mensagem = formulario?.nifParticular?.(v);
      if (nif && mensagem && nifDeEmpresa(nif.value)) erroAte(nif, mensagem);
    }

    const campos = [...raiz.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")];
    // checkValidity em todos: cada campo mostra o seu erro por baixo. O foco vai para o primeiro.
    const invalidos = campos.filter((c) => c.willValidate && !c.checkValidity());
    if (invalidos.length === 0) return true;
    invalidos[0].focus();
    invalidos[0].scrollIntoView({ block: "center" });
    return false;
  }

  function irPara(i: number, motivo: "titulo" | "erro" = "titulo") {
    const form = formRef.current;
    const destino = passos[i];
    if (form && destino?.id === "dados") {
      // Código postal do imóvel como ponto de partida para o de contacto, se este ainda estiver vazio.
      const cpImovel = lerValores(form).codigo_postal_imovel;
      const cp = form.querySelector<HTMLInputElement>('[name="codigo_postal"]');
      if (cpImovel && cp && !cp.value) setCpContacto({ valor: cpImovel, versao: (cpContacto?.versao ?? 0) + 1 });
    }
    if (form && destino?.id === "rever") prepararResumo(form);
    mudouPasso.current = motivo;
    setDirecao(i >= atual ? "frente" : "tras");
    setAtual(i);
  }

  function prepararResumo(form: HTMLFormElement) {
    const dados = new FormData(form);
    const v = lerValores(form);
    const indiceDe = (id: string) => passos.findIndex((p) => p.id === id);
    const doRamo = formulario ? blocosDosPassos(formulario.passos, v).map((b) => ({ ...b, indice: indiceDe(b.passo ?? "") })) : [];
    const cp = texto(dados, "codigo_postal");
    const local = texto(dados, "codigo_postal_local");
    const contacto = [
      { rotulo: "Nome", valor: texto(dados, "nome") },
      { rotulo: "NIF", valor: texto(dados, "nif") },
      { rotulo: "Email", valor: texto(dados, "email") },
      { rotulo: "Telefone", valor: texto(dados, "telefone") },
      { rotulo: "Código postal", valor: local ? `${cp} (${local})` : cp },
    ].filter((l) => l.valor);
    setResumo([...doRamo, { titulo: "Os seus dados", linhas: contacto, indice: indiceDe("dados") }]);
    setPrimeiroNome(texto(dados, "nome").split(" ")[0] ?? "");
  }

  function avancar() {
    if (validarPasso(atual)) irPara(atual + 1);
  }

  const escolherRamo = (valor: RamoCrm) => {
    // Outro ramo: as respostas do anterior deixam de contar (os campos são outros).
    if (valor !== ramoEscolhido) setValores({});
    setRamoEscolhido(valor);
  };

  // Logo a seguir a escolher o ramo os passos ainda são os de antes: avança sem validar.
  const avancarDoTipo = () => {
    mudouPasso.current = "titulo";
    setDirecao("frente");
    setAtual(1);
  };

  // Responder à pergunta que decide o passo (a matrícula completa, um cartão escolhido) passa a página.
  // Só conta uma resposta dada agora, neste passo: voltar a um passo já respondido não o faz saltar.
  const verificarAvanco = useEffectEvent(() => {
    const passo = passos[atual];
    const resposta = passo?.ramo?.campos.map((c) => valores[c.nome] ?? "").join("|") ?? "";
    const antes = respostaAntes.current;
    respostaAntes.current = { passo: passo?.id ?? "", resposta };
    const mudou = antes?.passo === passo?.id && antes.resposta !== resposta;
    if (mudou && passo?.ramo?.avancaQuando?.(valores) && !comSetas.current) avancar();
  });
  useEffect(() => {
    verificarAvanco();
  }, [valores, atual]);

  // Enter num campo ou numa opção avança de passo, em vez de enviar o formulário a meio.
  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    comSetas.current = e.key.startsWith("Arrow");
    if (e.key !== "Enter" || e.defaultPrevented || atual === ultimo) return;
    const alvo = e.target;
    if (!(alvo instanceof HTMLInputElement) || ["checkbox", "button", "submit"].includes(alvo.type)) return;
    e.preventDefault();
    avancar();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (atual !== ultimo) {
      avancar();
      return;
    }
    const dados = new FormData(form);
    setErro(null);

    // Honeypot: um humano não vê este campo; se vier preenchido, finge sucesso.
    if (dados.get("empresa")) {
      setEstado("enviado");
      return;
    }

    // Um passo anterior pode ter ficado inválido (ex.: alterado a partir do resumo).
    for (let i = 0; i < ultimo; i++) {
      if (!validarPasso(i)) {
        irPara(i, "erro");
        return;
      }
    }
    if (!validarPasso(ultimo)) return;

    setEstado("a_enviar");
    try {
      const token = await verificacao.obterToken();
      await modalidade.enviar(
        {
          dados,
          valores: lerValores(form),
          formulario,
          ramo: (ramoFixo?.valor ?? (ramoEscolhido || "outro")) as RamoCrm,
          contexto,
        },
        token
      );
      setRamoEscolhido("");
      setAtual(0);
      setValores({});
      setEstado("enviado");
    } catch (error: unknown) {
      setErro(error instanceof EnvioContactoError ? error.motivo : "falha_envio");
      setEstado("inicial");
    } finally {
      verificacao.reiniciar();
    }
  };

  if (estado === "enviado") {
    return (
      <div className="contact-form-done" role="status">
        <h2 className="form-step__title">{modalidade.sucesso.titulo}</h2>
        <p className="text-secondary">{modalidade.sucesso.texto}</p>
        {onConcluido ? (
          <Button onClick={onConcluido}>Fechar</Button>
        ) : (
          <div className="cluster">
            <Button as={Link} href="/">
              Voltar ao site
            </Button>
            <Button variant="secondary" onClick={() => setEstado("inicial")}>
              Enviar outro pedido
            </Button>
          </div>
        )}
      </div>
    );
  }

  const isEnviando = estado === "a_enviar";

  const fecho = (
    <>
      <CamposFecho finalidade={modalidade.finalidade} />
      <CaixaVerificacao verificacao={verificacao} />
      {erro && (
        <p className="contact-form-error" role="alert">
          {MENSAGEM_ERRO[erro]}
        </p>
      )}
    </>
  );

  const mensagemLivre = !formulario?.semMensagemLivre && (
    <div className="field">
      <label className="field__label" htmlFor="mensagem">
        {formulario ? "Algo mais que devamos saber? (opcional)" : "Mensagem (opcional)"}
      </label>
      <textarea id="mensagem" name="mensagem" rows={3} maxLength={2000} className="field__control" />
    </div>
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      onPointerDown={() => {
        comSetas.current = false;
      }}
      onChange={recalcular}
      noValidate
      className="stack form-wizard"
    >
      {modalidade.aviso}
      <PassosProgresso passos={passos} atual={atual} aoIr={(i) => irPara(i)} />

      {passos.map((p, i) => (
        <section
          key={p.id}
          data-passo={i}
          hidden={i !== atual}
          className={[
            "form-step stack",
            p.ramo?.destaque ? "form-step--destaque" : "",
            i === atual && direcao ? `form-step--${direcao}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-labelledby={`passo-${p.id}`}
        >
          {p.titulo && (
            <div>
              <h2
                id={`passo-${p.id}`}
                ref={(el) => {
                  titulos.current[i] = el;
                }}
                tabIndex={-1}
                className="form-step__title"
              >
                {p.titulo}
              </h2>
              {p.texto && <p className="text-body-small text-secondary">{p.texto}</p>}
            </div>
          )}

          {p.id === "tipo" && <EscolhaRamo ramos={ramos} valor={ramoEscolhido} onChange={escolherRamo} onEscolhido={avancarDoTipo} />}

          {p.ramo && seguro && (
            <CamposRamo
              key={`${seguro.key}-${p.id}`}
              campos={p.ramo.campos}
              valores={valores}
              aoMudar={recalcular}
              destaque={p.ramo.destaque}
            />
          )}

          {p.id === "dados" && (
            <>
              <CamposContacto
                nifObrigatorio={modalidade.nifObrigatorio && !formulario?.nifDispensavel?.(valores)}
                comCodigoPostal={modalidade.comCodigoPostal}
                codigoPostalExterno={cpContacto}
              />
              <PorquePedimos texto={modalidade.porquePedimos} />
              {i === ultimo && (
                <>
                  {mensagemLivre}
                  {fecho}
                </>
              )}
            </>
          )}

          {p.id === "rever" && (
            <>
              <ResumoPedido blocos={resumo} aoAlterar={(indice) => irPara(indice)} />
              {mensagemLivre}
              {fecho}
            </>
          )}
        </section>
      ))}

      <div className="form-nav">
        {atual > 0 && (
          <Button type="button" variant="secondary" onClick={() => irPara(atual - 1)} disabled={isEnviando}>
            Anterior
          </Button>
        )}
        {atual < ultimo ? (
          <Button type="button" className="form-nav__next" onClick={avancar}>
            Próximo
          </Button>
        ) : (
          <Button type="submit" className="form-nav__next" loading={isEnviando}>
            {isEnviando ? "A enviar…" : modalidade.rotuloEnviar}
          </Button>
        )}
      </div>
    </form>
  );
}
