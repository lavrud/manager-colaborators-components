import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmployeeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { name: string; email: string; cargo: string; departamento: string };
  onFormChange: (form: { name: string; email: string; cargo: string; departamento: string }) => void;
  onSubmit: () => void;
}

export function EmployeeEditDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
}: EmployeeEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={e => onFormChange({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={e => onFormChange({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="edit-cargo">Cargo</Label>
              <Input
                id="edit-cargo"
                value={form.cargo}
                onChange={e => onFormChange({ ...form, cargo: e.target.value })}
                required
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="edit-departamento">Departamento</Label>
              <Input
                id="edit-departamento"
                value={form.departamento}
                onChange={e => onFormChange({ ...form, departamento: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex gap-2 w-full justify-start mt-2">
            <DialogClose asChild>
              <button className="px-4 py-2 rounded border border-primary text-primary bg-transparent cursor-pointer" type="button">Cancelar</button>
            </DialogClose>
            <button
              className="px-4 py-2 rounded bg-primary text-primary-foreground cursor-pointer"
              type="submit"
            >
              Salvar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 