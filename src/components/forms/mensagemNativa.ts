const dataPt = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
};

/**
 * Frase em PT-PT para os erros que o próprio browser deteta (vazio, fora dos
 * limites), em vez da mensagem dele, que muda de browser para browser.
 * null quando o campo está bem.
 */
export function mensagemNativa(campo: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string | null {
  const v = campo.validity;
  if (v.valid) return null;
  if (v.customError) return campo.validationMessage;
  const data = campo instanceof HTMLInputElement && campo.type === "date";
  if (v.valueMissing) {
    if (campo instanceof HTMLSelectElement || (campo instanceof HTMLInputElement && campo.type === "radio")) {
      return "Escolha uma opção.";
    }
    return data ? "Indique a data." : "Preencha este campo.";
  }
  if (campo instanceof HTMLInputElement) {
    if (v.badInput) return data ? "Confirme a data." : "Escreva só números.";
    if (v.rangeUnderflow) return data ? `Escolha uma data a partir de ${dataPt(campo.min)}.` : `O mínimo é ${campo.min}.`;
    if (v.rangeOverflow) return data ? `Escolha uma data até ${dataPt(campo.max)}.` : `O máximo é ${campo.max}.`;
    if (v.stepMismatch) return "Use um número inteiro.";
  }
  if (v.tooShort) return `Escreva pelo menos ${(campo as HTMLInputElement | HTMLTextAreaElement).minLength} caracteres.`;
  if (v.tooLong) return `Escreva no máximo ${(campo as HTMLInputElement | HTMLTextAreaElement).maxLength} caracteres.`;
  return campo.validationMessage || "Confirme este campo.";
}
