import { useEffect, useRef, useState } from "react";
import Input from "./Input";
import { mensagemNativa } from "./mensagemNativa";
import { consultarCodigoPostal, descreverLocal } from "../../utils/moradas";
import { mascaraCodigoPostal, validarCodigoPostal } from "../../utils/validacoes";

/** Valor posto de fora (sugestão de morada, código do imóvel): cada `versao` nova substitui o que lá está. */
export type ValorExterno = { valor: string; versao: number };

export type CampoCodigoPostalProps = {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  valorExterno?: ValorExterno;
  /** Avisa o formulário de que o valor mudou (para os campos que dependem dele). */
  aoMudar?: () => void;
};

type Resposta = { valor: string; estado: "ok" | "inexistente" | "indisponivel"; local?: string };

const completo = (v: string) => /^\d{4}-\d{3}$/.test(v) && !validarCodigoPostal(v);

/**
 * Código postal com máscara (0000-000 enquanto se escreve) e confirmação
 * pela moradas.dev: mostra a localidade, ou diz que o código não existe.
 * Sem resposta da API, fica só a validação de formato. O texto com a
 * localidade vai num campo escondido `{name}_local`, para a mensagem do CRM.
 */
export default function CampoCodigoPostal({ name, label, required, className, valorExterno, aoMudar }: CampoCodigoPostalProps) {
  const [valor, setValor] = useState("");
  const [externoAplicado, setExternoAplicado] = useState<ValorExterno | undefined>(undefined);
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [erroNativo, setErroNativo] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Valor vindo de fora: aplicado durante o render, sem efeito (padrão do React para props que mudam o estado).
  if (valorExterno && valorExterno !== externoAplicado) {
    setExternoAplicado(valorExterno);
    setValor(mascaraCodigoPostal(valorExterno.valor));
  }

  // Só a resposta do valor atual conta; uma resposta antiga fica ignorada.
  const atual = resposta?.valor === valor ? resposta : null;
  const aProcurar = completo(valor) && !atual;
  const inexistente = atual?.estado === "inexistente";
  const local = atual?.estado === "ok" ? (atual.local ?? "") : "";

  useEffect(() => {
    if (!completo(valor)) return;
    const controlo = new AbortController();
    consultarCodigoPostal(valor, controlo.signal)
      .then((r) => setResposta({ valor, estado: r.estado, local: r.estado === "ok" ? descreverLocal(r.local) : undefined }))
      .catch(() => {
        // Cancelado porque o valor mudou: a consulta nova trata do resto.
      });
    return () => controlo.abort();
  }, [valor]);

  const erroProprio =
    validarCodigoPostal(valor) ?? (inexistente ? "Este código postal não existe. Confirme os dígitos." : null);

  // O erro fica no próprio campo, para o formulário não avançar com ele.
  useEffect(() => {
    inputRef.current?.setCustomValidity(erroProprio ?? "");
    aoMudar?.();
  }, [erroProprio, local, aoMudar]);

  const erro = erroProprio ?? erroNativo;
  const comErro = (mostrar || inexistente) && erro !== null;
  const ajuda = local || (aProcurar ? "A confirmar o código postal…" : undefined);

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        label={label}
        name={name}
        value={valor}
        required={required}
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="0000-000"
        maxLength={8}
        status={comErro ? "error" : undefined}
        message={comErro ? erro : ajuda}
        onChange={(e) => {
          setValor(mascaraCodigoPostal(e.currentTarget.value));
          setErroNativo(null);
        }}
        onBlur={(e) => setMostrar(e.currentTarget.value !== "")}
        onInvalid={(e) => {
          setErroNativo(mensagemNativa(e.currentTarget));
          setMostrar(true);
        }}
      />
      <p className="visually-hidden" aria-live="polite">
        {local || (inexistente ? erroProprio : "")}
      </p>
      <input type="hidden" name={`${name}_local`} value={local} />
    </div>
  );
}
