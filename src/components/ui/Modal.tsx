import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
export function Modal({
  title,
  description,
  trigger,
  children,
  className = "",
}: {
  title: string;
  description: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal-content ${className}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="icon-button shrink-0"
                aria-label="닫기"
              >
                <X aria-hidden="true" size={20} />
              </Button>
            </Dialog.Close>
          </div>
          <div className="mt-6 space-y-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
