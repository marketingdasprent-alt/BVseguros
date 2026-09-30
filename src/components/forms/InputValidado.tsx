import { useState } from "react";
import Input from "./Input";
import type { InputProps } from "./Input";
import type { Validador } from "../../utils/validacoes";

export type InputValidadoProps = InputProps & {
  validar: Validador;
  /** Arruma o valor ao sair do campo (ex.: "aa00aa" passa a "AA-00-AA"). */
  formatar?: (valor: string) => string;
};

/**
 * Input com validação própria (NIF, telefone, matrícula...). O erro fica no
 * setCustomValidity, por isso o browser não deixa enviar o formulário; a
 * mensagem só aparece por baixo depois de o visitante sair do campo ou
 * tentar enviar, para não gritar enquanto ainda está a escrever.
 */
export default function InputValidado({ validar, formatar, onInput, onBlur, onInvalid, message, ...rest }: InputValidadoProps) {
  const [erro, setErro] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);

  const verificar = (campo: HTMLInputElement) => {
    const mensagem = validar(campo.value);
    campo.setCustomValidity(mensagem ?? "");
    setErro(mensagem);
  };

  const comErro = mostrar && erro !== null;

  return (
    <Input
      {...rest}
      status={comErro ? "error" : rest.status}
      message={comErro ? erro : message}
      onInput={(e) => {
        verificar(e.currentTarget);
        onInput?.(e);
      }}
      onBlur={(e) => {
        const campo = e.currentTarget;
        if (formatar && campo.value) campo.value = formatar(campo.value);
        verificar(campo);
        setMostrar(true);
        onBlur?.(e);
      }}
      onInvalid={(e) => {
        verificar(e.currentTarget);
        setMostrar(true);
        onInvalid?.(e);
      }}
    />
  );
}
