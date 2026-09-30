import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../components/ui/Button";
import CaixaVerificacao from "../components/forms/VerificacaoHumana";
import { useVerificacaoHumana } from "../components/forms/useVerificacaoHumana";
import CamposRamo, { PREFIXO_CAMPO } from "../components/forms/CamposRamo";
import { CamposContacto, CamposFecho, SeletorRamo } from "../components/forms/CamposBase";
import { enviarContacto, EnvioContactoError, MENSAGEM_ERRO } from "../utils/enviarContacto";
import { montarMensagem } from "../utils/montarMensagem";
import { anuncioPerguntas } from "../utils/anuncioPerguntas";
import { normalizarTelefone, validarCartaVsNascimento } from "../utils/validacoes";
import type { ErroContacto, RamoCrm } from "../utils/enviarContacto";
import { FORMULARIOS } from "../data/formularios";
import type { FormularioRamo } from "../data/formularios";
import { SEGUROS } from "../data/seguros";

type Estado = "inicial" | "a_enviar" | "enviado";


export type ContactoFormProps = {
  ramos: { valor: RamoCrm; nome: string }[];
  /**
   * Página de um ramo: o ramo é fixo (sem o select). Sem ele, o tipo de
   * seguro é o primeiro campo e as perguntas desse ramo aparecem ao escolhê-lo.
   */
  ramoFixo?: { valor: RamoCrm; formulario: FormularioRamo };
  /** Linhas já escolhidas na página (ex.: o nível de proteção), no topo da mensagem do lead. */
  contexto?: string[];
  /** Dentro do pop-up: sem o cartão à volta (o modal já é a superfície). */
  semCartao?: boolean;
  /** Dentro do pop-up: o ecrã de sucesso mostra "Fechar" em vez de outro pedido. */
  onConcluido?: () => void;
};

const seguroDoRamo = (ramo: RamoCrm | "") => SEGUROS.find((s) => s.ramoCrm === ramo);

export default function ContactoForm({ ramos, ramoFixo, contexto = [], semCartao = false, onConcluido }: ContactoFormProps) {
  const cartao = semCartao ? "" : " contact-form-card";
  const [estado, setEstado] = useState<Estado>("inicial");
  const [erro, setErro] = useState<ErroContacto | null>(null);
  const verificacao = useVerificacaoHumana();
  const [ramoEscolhido, setRamoEscolhido] = useState<RamoCrm | "">("");

  const seguro = ramoFixo ? undefined : seguroDoRamo(ramoEscolhido);
  const formulario = ramoFixo?.formulario ?? (seguro ? FORMULARIOS[seguro.key] : undefined);
  const campos = formulario?.campos ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const dados = new FormData(form);
    setErro(null);

    // Honeypot: um humano não vê este campo; se vier preenchido, finge sucesso.
    if (dados.get("empresa")) {
      setEstado("enviado");
      return;
    }

    // Regra entre dois campos (auto): o browser só valida cada campo sozinho.
    const erroCarta = validarCartaVsNascimento(
      String(dados.get(PREFIXO_CAMPO + "ano_carta") ?? ""),
      String(dados.get(PREFIXO_CAMPO + "nascimento_condutor") ?? "")
    );
    const campoCarta = form.elements.namedItem(PREFIXO_CAMPO + "ano_carta");
    if (erroCarta && campoCarta instanceof HTMLInputElement) {
      campoCarta.setCustomValidity(erroCarta);
      campoCarta.addEventListener("input", () => campoCarta.setCustomValidity(""), { once: true });
      campoCarta.reportValidity();
      return;
    }

    const nif = String(dados.get("nif") ?? "").replace(/\D/g, "");

    setEstado("a_enviar");
    try {
      const token = await verificacao.obterToken();
      await enviarContacto({
        nome: String(dados.get("nome") ?? "").trim(),
        email: String(dados.get("email") ?? "").trim(),
        telefone: normalizarTelefone(String(dados.get("telefone") ?? "")),
        ramo: (ramoFixo?.valor ?? (ramoEscolhido || "outro")) as RamoCrm,
        mensagem: montarMensagem(
          campos,
          Object.fromEntries(campos.map((c) => [c.nome, String(dados.get(PREFIXO_CAMPO + c.nome) ?? "")])),
          String(dados.get("mensagem") ?? ""),
          nif ? [`NIF: ${nif}`, ...contexto] : contexto
        ),
        consentimento: dados.get("consentimento") === "sim",
      }, token);
      form.reset();
      setRamoEscolhido("");
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
      <div className={`contact-form-done${cartao}`} role="status">
        <h3>Pedido enviado.</h3>
        <p className="text-secondary">Obrigado pelo contacto. Um mediador da BV Seguros vai falar consigo em breve.</p>
        {onConcluido ? (
          <Button onClick={onConcluido}>Fechar</Button>
        ) : (
          <Button variant="secondary" onClick={() => setEstado("inicial")}>
            Enviar outro pedido
          </Button>
        )}
      </div>
    );
  }

  const isEnviando = estado === "a_enviar";

  return (
    <form onSubmit={handleSubmit} className={`stack${cartao}`}>
      {!ramoFixo && (
        <SeletorRamo
          rotulo="Em que seguro está interessado?"
          ramos={ramos}
          valor={ramoEscolhido}
          onChange={setRamoEscolhido}
          anuncio={anuncioPerguntas(campos.length, seguro)}
        />
      )}

      {campos.length > 0 && <p className="form-section-title">Os seus dados</p>}
      <CamposContacto />

      {campos.length > 0 && (
        <>
          <p className="form-section-title">Sobre o seguro</p>
          {/* key: mudar de ramo limpa as respostas do ramo anterior. */}
          <CamposRamo key={seguro?.key ?? ramoFixo?.valor} campos={campos} />
        </>
      )}

      {!formulario?.semMensagemLivre && (
        <div className="field">
          <label className="field__label" htmlFor="mensagem">
            {formulario ? "Algo mais que devamos saber?" : "Mensagem"}
          </label>
          <textarea id="mensagem" name="mensagem" rows={formulario ? 3 : 4} maxLength={2000} className="field__control" />
        </div>
      )}

      <CamposFecho finalidade="responder ao meu pedido" />
      <CaixaVerificacao verificacao={verificacao} />

      {erro && (
        <p className="contact-form-error" role="alert">
          {MENSAGEM_ERRO[erro]}
        </p>
      )}

      <Button type="submit" loading={isEnviando}>
        {isEnviando ? "A enviar…" : "Enviar pedido"}
      </Button>
    </form>
  );
}
