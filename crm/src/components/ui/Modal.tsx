import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps { title: string; children: ReactNode; onClose: () => void; busy?: boolean; }

export function Modal({ title, children, onClose, busy = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(
    <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy} className="crm-modal"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button" disabled={busy} onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      </div>
      <div className="modal-content">{children}</div>
    </dialog>, document.body,
  );
}
