import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  // 640px em vez de 460px, para formulários com mais de 5 campos.
  largo?: boolean;
}

export function Modal({ title, subtitle, children, onClose, busy = false, largo = false }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    // O React não passa o atributo autofocus ao DOM; sem isto o foco ia sempre para o "Fechar".
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(
    <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy} className={`crm-modal${largo ? ' crm-modal--wide' : ''}`}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="modal-heading">
        <div className="min-w-0">
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p className="mt-1 truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
        <button type="button" className="icon-button" disabled={busy} onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      </div>
      <div className="modal-content">{children}</div>
    </dialog>, document.body,
  );
}
