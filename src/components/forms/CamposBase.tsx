import { useRef, useState } from "react";
import InputValidado from "./InputValidado";
import CampoCodigoPostal from "./CampoCodigoPostal";
import type { ValorExterno } from "./CampoCodigoPostal";
import {
  formatarTelefone,
  sugestaoEmail,
  validarEmail,
  validarNif,
  validarNome,
  validarTelefone,
} from "../../utils/validacoes";
import Link from "../../app/Link";

const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Email com "Quis dizer nome@gmail.com?" quando o domínio parece um engano. Não impede o envio. */
function CampoEmail() {
  const ref = useRef<HTMLInputElement>(null);
  const [sugestao, setSugestao] = useState<string | null>(null);
  return (
    <div className="form-grid__half email-field">
      <InputValidado
        ref={ref}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        validar={validarEmail}
        formatar={(v) => v.trim()}
        onBlur={(e) => setSugestao(validarEmail(e.currentTarget.value) ? null : sugestaoEmail(e.currentTarget.value))}
        onInput={() => setSugestao(null)}
      />
      {sugestao && (
        <button
          type="button"
          className="email-field__suggestion"
          onClick={() => {
            if (ref.current) ref.current.value = sugestao;
            setSugestao(null);
            ref.current?.focus();
          }}
        >
          Quis dizer <strong>{sugestao}</strong>?
        </button>
      )}
    </div>
  );
}

export type CamposContactoProps = {
  /** Pedido de proposta: o NIF é obrigatório (pedido do João, 01/10/2026). */
  nifObrigatorio?: boolean;
  /** Pedido de proposta: código postal obrigatório, confirmado pela moradas.dev. */
  comCodigoPostal?: boolean;
  /** Código postal já conhecido (ex.: o do imóvel), posto no campo. */
  codigoPostalExterno?: ValorExterno;
};

/** Nome, NIF, email e telefone (e código postal no pedido de proposta). */
export function CamposContacto({ nifObrigatorio = false, comCodigoPostal = false, codigoPostalExterno }: CamposContactoProps) {
  return (
    <div className="form-grid">
      <InputValidado
        className="form-grid__half"
        label="Nome completo"
        name="nome"
        type="text"
        autoComplete="name"
        required
        minLength={2}
        maxLength={120}
        validar={validarNome}
        formatar={(v) => v.trim().replace(/\s+/g, " ")}
      />
      <InputValidado
        className="form-grid__half"
        label={nifObrigatorio ? "NIF" : "NIF (opcional)"}
        name="nif"
        inputMode="numeric"
        autoComplete="off"
        maxLength={9}
        required={nifObrigatorio}
        validar={validarNif}
        filtrar={soDigitos}
      />
      <CampoEmail />
      <InputValidado
        className="form-grid__half"
        label="Telefone"
        name="telefone"
        type="tel"
        autoComplete="tel"
        required
        maxLength={20}
        validar={validarTelefone}
        formatar={formatarTelefone}
      />
      {comCodigoPostal && (
        <CampoCodigoPostal
          className="form-grid__half"
          name="codigo_postal"
          label="Código postal"
          required
          valorExterno={codigoPostalExterno}
        />
      )}
    </div>
  );
}

/** Porque pedimos os dados, como a caixa da Fidelidade junto aos dados pessoais. */
export function PorquePedimos({ texto }: { texto: string }) {
  return (
    <div className="form-why" role="note">
      <p className="form-why__title">Porque pedimos estes dados?</p>
      <p>
        {texto} Saiba mais na{" "}
        <Link href="/privacy">política de privacidade</Link>.
      </p>
    </div>
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
