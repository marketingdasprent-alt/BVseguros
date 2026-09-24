import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../components/ui/Button";
import Input from "../components/forms/Input";
import Link from "../app/Link";
import { enviarContacto, EnvioContactoError } from "../utils/enviarContacto";
import type { ErroContacto, RamoCrm } from "../utils/enviarContacto";

type Estado = "inicial" | "a_enviar" | "enviado";

const MENSAGEM_ERRO: Record<ErroContacto, string> = {
  dados_invalidos: "Verifique os dados do formulário e tente novamente.",
  limite_excedido: "Já recebemos vários pedidos deste contacto. Tente novamente mais tarde.",
  falha_envio:
    "Não foi possível enviar o pedido. Verifique a ligação e tente novamente, ou escreva-nos para geral@bvseguros.pt.",
};

export type ContactoFormProps = {
  ramos: { valor: RamoCrm; nome: string }[];
};

export default function ContactoForm({ ramos }: ContactoFormProps) {
  const [estado, setEstado] = useState<Estado>("inicial");
  const [erro, setErro] = useState<ErroContacto | null>(null);

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

    setEstado("a_enviar");
    try {
      await enviarContacto({
        nome: String(dados.get("nome") ?? ""),
        email: String(dados.get("email") ?? ""),
        telefone: String(dados.get("telefone") ?? ""),
        ramo: String(dados.get("ramo") ?? "outro") as RamoCrm,
        mensagem: String(dados.get("mensagem") ?? ""),
        consentimento: dados.get("consentimento") === "sim",
      });
      form.reset();
      setEstado("enviado");
    } catch (error: unknown) {
      setErro(error instanceof EnvioContactoError ? error.motivo : "falha_envio");
      setEstado("inicial");
    }
  };

  if (estado === "enviado") {
    return (
      <div className="contact-form-card contact-form-done" role="status">
        <h3>Pedido enviado.</h3>
        <p className="text-secondary">
          Obrigado pelo contacto. Um mediador da BV Seguros vai falar consigo em breve.
        </p>
        <Button variant="secondary" onClick={() => setEstado("inicial")}>
          Enviar outro pedido
        </Button>
      </div>
    );
  }

  const isEnviando = estado === "a_enviar";

  return (
    <form onSubmit={handleSubmit} className="stack contact-form-card">
      <Input label="Nome" name="nome" type="text" autoComplete="name" required minLength={2} maxLength={120} />
      <Input label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />
      <Input
        label="Telefone"
        name="telefone"
        type="tel"
        autoComplete="tel"
        required
        pattern="\+?[0-9 ]{9,20}"
        title="Indique um número com pelo menos 9 dígitos."
      />

      <div className="field">
        <label className="field__label" htmlFor="ramo">
          Em que seguro está interessado?
        </label>
        <select id="ramo" name="ramo" className="field__control">
          {ramos.map((ramo) => (
            <option key={ramo.valor} value={ramo.valor}>
              {ramo.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="mensagem">
          Mensagem
        </label>
        <textarea id="mensagem" name="mensagem" rows={4} maxLength={2000} className="field__control" />
      </div>

      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="contact-consent">
        <input type="checkbox" name="consentimento" value="sim" required />
        <span>
          Aceito que a BV Seguros use estes dados para responder ao meu pedido, nos termos da{" "}
          <Link href="/privacy">política de privacidade</Link>.
        </span>
      </label>

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
