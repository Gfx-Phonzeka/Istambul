"use client";
import type { CSSProperties, ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useI18n } from "@/lib/i18n/client";

/**
 * Button that asks for confirmation in an accessible AlertDialog before a destructive or
 * irreversible action. `onConfirm` runs only after the user confirms.
 */
export function ConfirmButton({
  message, onConfirm, children, className = "btn", style, disabled, confirmLabel, danger = true,
}: {
  message: ReactNode; onConfirm: () => void; children: ReactNode; className?: string; style?: CSSProperties;
  disabled?: boolean; confirmLabel?: ReactNode; danger?: boolean;
}) {
  const { t } = useI18n();
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button type="button" className={className} style={style} disabled={disabled}>{children}</button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="modal-backdrop">
          <AlertDialog.Content className="modal modal-sm">
            <AlertDialog.Title className="modal-title">{children}</AlertDialog.Title>
            <AlertDialog.Description className="modal-text">{message}</AlertDialog.Description>
            <div className="modal-footer">
              <AlertDialog.Cancel className="btn">{t("common.cancel")}</AlertDialog.Cancel>
              <AlertDialog.Action className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm}>
                {confirmLabel ?? children}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Overlay>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
