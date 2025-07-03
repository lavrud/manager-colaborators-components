import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { type Employee, type SystemStatus } from "@/types/employee";

interface ConfirmStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAction: null | {
    employee: Employee;
    system: SystemStatus;
    newStatus: boolean;
  };
  onConfirm: () => void;
}

export function ConfirmStatusDialog({
  open,
  onOpenChange,
  pendingAction,
  onConfirm,
}: ConfirmStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tem certeza que deseja realizar está ação?</DialogTitle>
          <DialogDescription>
            {pendingAction && (
              <span>
                Você está
                <b
                  className={
                    `underline px-1 font-bold uppercase ` +
                    (pendingAction.system.status
                      ? 'text-red-400'
                      : 'text-green-600')
                  }
                >
                  {pendingAction.system.status ? 'desativando' : 'ativando'}
                </b>
                o acesso de <b>{pendingAction.employee.name}</b> no sistema <b>{pendingAction.system.system}</b>.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex gap-2 w-full justify-start">
            <DialogClose asChild>
              <button className="px-4 py-2 rounded border border-primary text-primary bg-transparent cursor-pointer" type="button">Cancelar</button>
            </DialogClose>
            <button
              className="px-4 py-2 rounded bg-primary text-primary-foreground cursor-pointer"
              type="button"
              onClick={onConfirm}
            >
              Confirmar
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 