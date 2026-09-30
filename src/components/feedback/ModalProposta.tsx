import { useEffect, useRef } from "react";
import ContactoForm from "../../sections/ContactoForm";
import SinistroForm from "../../sections/SinistroForm";
import { fecharProposta, usePropostaAberta } from "../../app/proposta";
import { FORMULARIOS } from "../../data/formularios";
import { SEGUROS, SEGUROS_FORMULARIO } from "../../data/seguros";

/**
 * Pop-up com o formulário (pedido de proposta ou de sinistro), para não
 * quebrar a leitura da página. <dialog> nativo com showModal(): foco preso no
 * modal, Escape fecha e o resto da página fica inerte. Clicar fora
 * (no backdrop) também fecha.
 */
export default function ModalProposta() {
  const estado = usePropostaAberta();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sinistro = estado.aberto && estado.modo === "sinistro";
  const seguro = estado.aberto && estado.ramo ? SEGUROS.find((s) => s.key === estado.ramo) : undefined;
  const formulario = seguro && !sinistro ? FORMULARIOS[seguro.key] : undefined;
  const titulo = sinistro ? "Participar sinistro." : (formulario?.titulo ?? "Peça uma proposta.");
  const texto = sinistro
    ? "Conte-nos o que aconteceu. Um mediador da BV fala consigo e acompanha o processo junto da seguradora."
    : (formulario?.texto ?? "Diga-nos que seguro procura e um mediador da BV fala consigo.");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (estado.aberto && !dialog.open) dialog.showModal();
    if (!estado.aberto && dialog.open) dialog.close();
  }, [estado.aberto]);

  // Sem scroll da página por trás enquanto o modal está aberto.
  useEffect(() => {
    document.documentElement.classList.toggle("has-modal-open", estado.aberto);
  }, [estado.aberto]);

  return (
    <dialog
      ref={dialogRef}
      className="proposal-dialog"
      aria-labelledby="proposal-dialog-title"
      // Escape dispara "cancel": o estado tem de acompanhar o fecho nativo.
      onCancel={(event) => {
        event.preventDefault();
        fecharProposta();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) fecharProposta();
      }}
    >
      {estado.aberto && (
        // Fora da zona com scroll: o X fica sempre no canto, por mais que o formulário desça.
        <button type="button" className="proposal-dialog__close" aria-label="Fechar" onClick={fecharProposta}>
          <span aria-hidden="true">✕</span>
        </button>
      )}
      {estado.aberto && (
        <div className="proposal-dialog__inner">
          <div className="proposal-dialog__header">
            <div>
              <h2 id="proposal-dialog-title" className="proposal-dialog__title">
                {titulo}
              </h2>
              <p className="text-body-small text-secondary">
                {texto}
              </p>
              {estado.aberto && estado.contexto.length > 0 && (
                <p className="proposal-dialog__context">{estado.contexto.join(" · ")}</p>
              )}
            </div>
          </div>

          {sinistro ? (
            <SinistroForm key={`sinistro-${seguro?.key ?? "geral"}`} ramoInicial={seguro?.key} onConcluido={fecharProposta} />
          ) : (
            <ContactoForm
              key={seguro?.key ?? "geral"}
              ramos={SEGUROS_FORMULARIO}
              ramoFixo={seguro && formulario ? { valor: seguro.ramoCrm, formulario } : undefined}
              contexto={estado.aberto ? estado.contexto : []}
              semCartao
              onConcluido={fecharProposta}
            />
          )}
        </div>
      )}
    </dialog>
  );
}
