import Input from "./Input";
import Link from "../../app/Link";
import type { RamoCrm } from "../../utils/enviarContacto";

/** Nome, email e telefone: iguais no pedido de proposta e no de sinistro. */
export function CamposContacto() {
  return (
    <>
      <Input label="Nome" name="nome" type="text" autoComplete="name" required minLength={2} maxLength={120} />
      <div className="form-grid">
        <Input
          className="form-grid__half"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
        <Input
          className="form-grid__half"
          label="Telefone"
          name="telefone"
          type="tel"
          autoComplete="tel"
          required
          pattern="\+?[0-9 ]{9,20}"
          title="Indique um número com pelo menos 9 dígitos."
        />
      </div>
    </>
  );
}

/** Campo invisível para robôs (se vier preenchido, o envio é ignorado) + consentimento RGPD. */
export function CamposFecho({ finalidade }: { finalidade: string }) {
  return (
    <>
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="contact-consent">
        <input type="checkbox" name="consentimento" value="sim" required />
        <span>
          Aceito que a BV Seguros use estes dados para {finalidade}, nos termos da{" "}
          <Link href="/privacy">política de privacidade</Link>.
        </span>
      </label>
    </>
  );
}

/**
 * Tipo de seguro, o primeiro campo: escolhê-lo faz aparecer as perguntas
 * desse ramo por baixo. A frase em aria-live anuncia-as ao leitor de ecrã.
 */
export function SeletorRamo({
  rotulo,
  ramos,
  valor,
  onChange,
  anuncio,
}: {
  rotulo: string;
  ramos: { valor: RamoCrm; nome: string }[];
  valor: RamoCrm | "";
  onChange: (valor: RamoCrm | "") => void;
  anuncio: string;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor="ramo">
        {rotulo}
      </label>
      <select
        id="ramo"
        name="ramo"
        className="field__control"
        required
        value={valor}
        onChange={(e) => onChange(e.target.value as RamoCrm | "")}
      >
        <option value="">Escolha o tipo de seguro</option>
        {ramos.map((ramo) => (
          <option key={ramo.valor} value={ramo.valor}>
            {ramo.nome}
          </option>
        ))}
      </select>
      <p className="visually-hidden" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}
