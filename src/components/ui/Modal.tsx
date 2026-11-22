"use client";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "./Icon";

/** Dialog built on Radix (focus trap, Esc, focus return, scroll lock). Rendered while mounted. */
export function Modal({ title, onClose, children, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop">
          <Dialog.Content className="modal" aria-describedby={undefined}>
            <div className="modal-header">
              <Dialog.Title asChild><h2>{title}</h2></Dialog.Title>
              <Dialog.Close className="icon-btn" aria-label="Close">
                <Icon name="close" />
              </Dialog.Close>
            </div>
            {children}
            {footer && <div className="modal-footer">{footer}</div>}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
