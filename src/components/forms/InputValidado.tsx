import { useState } from "react";
import Input from "./Input";
import type { InputProps } from "./Input";
import { mensagemNativa } from "./mensagemNativa";
import type { Validador } from "../../utils/validacoes";

export type InputValidadoProps = InputProps & {
  validar?: Validador;
  /** Arruma o valor ao sair do campo (ex.: "aa00aa" passa a "AA-00-AA"). */
  formatar?: (valor: string) => string;
  /** Limpa o valor tecla a tecla (ex.: só dígitos no NIF). */
  filtrar?: (valor: string) => string;
};

/**
 * Input com validação própria (NIF, telefone, matrícula...). O erro fica no
 * setCustomValidity, por isso o browser não deixa avançar; a mensagem só
 * aparece por baixo depois de o visitante sair do campo ou tentar avançar,
 * para não gritar enquanto ainda está a escrever. Campo vazio, fora dos
 * limites ou com um erro posto de fora (regra entre campos) também fica com
 * a frase por baixo, em vez do balão do browser.
 */
export default function InputValidado({
  validar,
  formatar,
  filtrar,
  onInput,
  onBlur,
  onInvalid,
  message,
  ...rest
}: InputValidadoProps) {
  const [erro, setErro] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);

  const verificar = (campo: HTMLInputElement) => {
    const mensagem = validar?.(campo.value) ?? null;
    campo.setCustomValidity(mensagem ?? "");
    setErro(mensagem ?? mensagemNativa(campo));
  };

  const comErro = mostrar && erro !== null;

  return (
    <Input
      {...rest}
      status={comErro ? "error" : rest.status}
      message={comErro ? erro : message}
      onInput={(e) => {
        const campo = e.currentTarget;
        if (filtrar) {
          const limpo = filtrar(campo.value);
          if (limpo !== campo.value) campo.value = limpo;
        }
        verificar(campo);
        onInput?.(e);
      }}
      onBlur={(e) => {
        const campo = e.currentTarget;
        if (formatar && campo.value) campo.value = formatar(campo.value);
        verificar(campo);
        setMostrar(campo.value !== "" || erro !== null);
        onBlur?.(e);
      }}
      onInvalid={(e) => {
        // Não volta a validar: um erro posto de fora (setCustomValidity) tem de ficar.
        const campo = e.currentTarget;
        setErro(campo.validity.customError ? campo.validationMessage : mensagemNativa(campo));
        setMostrar(true);
        onInvalid?.(e);
      }}
    />
  );
}
