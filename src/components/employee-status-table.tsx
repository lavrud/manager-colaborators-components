"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type Employee, type SystemStatus } from "@/types/employee";
import { RotateCcw, Pencil, Search } from "lucide-react";
import {
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { EmployeeEditDialog } from "@/components/EmployeeEditDialog";
import { ConfirmStatusDialog } from "@/components/ConfirmStatusDialog";
import { getLogin, getCargo, getDepartamento } from "@/components/employee-table-utils";

// API real do Next.js
const api = {
  async fetchEmployees(): Promise<Employee[]> {
    const response = await fetch('/api/employees');
    if (!response.ok) {
      throw new Error('Falha ao carregar funcionários');
    }
    const result = await response.json();
    return result.data;
  },

  async updateSystemStatus(
    employeeId: string,
    system: SystemStatus['system'],
    newStatus: boolean
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId,
        system,
        newStatus,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao atualizar status');
    }

    return result;
  }
};

const SYSTEMS = [
  "ERP",
  "CRM",
  "Portal de Vendas",
  "Sistema RH",
  "Portal Cliente"
] as const;

const STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Ativo", value: "active" },
  { label: "Inativo", value: "inactive" },
];

// Simulação de login do usuário atual
const CURRENT_USER_LOGIN = "admin";

const DEPARTAMENTOS = ["RH", "TI", "Financeiro", "Comercial", "Operações"];
const CARGOS = ["Analista", "Coordenador", "Gerente", "Assistente", "Diretor"];

export function EmployeeStatusTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [reloading, setReloading] = useState<string | null>(null);

  // Busca, filtro e paginação
  const [search, setSearch] = useState("");
  const [filterSystem, setFilterSystem] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | {
    employee: Employee;
    system: SystemStatus;
    newStatus: boolean;
  }>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', cargo: '', departamento: '' });

  const [filterDepartamento, setFilterDepartamento] = useState<string>("all");
  const [filterCargo, setFilterCargo] = useState<string>("all");

  // Carregar dados da API
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const data = await api.fetchEmployees();
        setEmployees(data);
        toast.success("Dados carregados com sucesso!");
      } catch (error) {
        toast.error("Erro ao carregar dados dos funcionários");
        console.error("Erro ao carregar funcionários:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleStatusChange = async (
    employeeId: string,
    system: SystemStatus['system'],
    newStatus: boolean
  ) => {
    const updateKey = `${employeeId}-${system}`;
    
    // Previne múltiplas atualizações simultâneas
    if (updatingStatus.has(updateKey)) return;
    
    setUpdatingStatus(prev => new Set(prev).add(updateKey));

    // Atualização otimista da UI
    setEmployees(currentEmployees =>
      currentEmployees.map(emp =>
        emp.id === employeeId
          ? {
              ...emp,
              systems: emp.systems.map(sys =>
                sys.system === system ? { ...sys, status: newStatus } : sys
              ),
              lastUpdated: new Date().toISOString()
            }
          : emp
      )
    );

    try {
      const result = await api.updateSystemStatus(employeeId, system, newStatus);
      toast.success(result.message);
    } catch (error) {
      // Reverte a mudança em caso de erro
      setEmployees(currentEmployees =>
        currentEmployees.map(emp =>
          emp.id === employeeId
            ? {
                ...emp,
                systems: emp.systems.map(sys =>
                  sys.system === system ? { ...sys, status: !newStatus } : sys
                )
              }
            : emp
        )
      );
      toast.error("Erro ao atualizar status. Tente novamente.");
      console.error("Erro ao atualizar status:", error);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  // Simula recarregar dados de um funcionário
  const handleReloadEmployee = async (employeeId: string) => {
    setReloading(employeeId);
    try {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 900));
      // Aqui você pode fazer uma chamada real para buscar os dados atualizados do funcionário
      toast.success("Dados do funcionário atualizados!");
    } catch {
      toast.error("Erro ao atualizar dados do funcionário.");
    } finally {
      setReloading(null);
    }
  };

  // Função para registrar histórico no localStorage
  function logHistory({ userLogin, employeeName, system, oldStatus, newStatus }: {
    userLogin: string;
    employeeName: string;
    system: string;
    oldStatus: boolean;
    newStatus: boolean;
  }) {
    if (typeof window === "undefined") return;
    const logs = JSON.parse(localStorage.getItem("employeeStatusHistory") || "[]");
    logs.push({
      timestamp: new Date().toISOString(),
      userLogin,
      employeeName,
      system,
      oldStatus,
      newStatus,
    });
    localStorage.setItem("employeeStatusHistory", JSON.stringify(logs));
  }

  // Nova função para abrir dialog de confirmação
  const handleBadgeClick = (employee: Employee, system: SystemStatus, newStatus: boolean) => {
    setPendingAction({ employee, system, newStatus });
    setDialogOpen(true);
  };

  // Função para confirmar ação
  const confirmStatusChange = async () => {
    if (!pendingAction) return;
    setDialogOpen(false);
    const { employee, system, newStatus } = pendingAction;
    const oldStatus = system.status;
    await handleStatusChange(employee.id, system.system, newStatus);
    logHistory({
      userLogin: CURRENT_USER_LOGIN,
      employeeName: employee.name,
      system: system.system,
      oldStatus,
      newStatus,
    });
    setPendingAction(null);
  };

  // Filtro e busca
  const filteredEmployees = employees.filter((employee) => {
    // Busca
    const searchLower = search.toLowerCase();
    const login = getLogin(employee.email);
    const cargo = getCargo(employee.name);
    const departamento = getDepartamento(employee.name);
    const matchesSearch =
      employee.name.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      login.toLowerCase().includes(searchLower) ||
      cargo.toLowerCase().includes(searchLower) ||
      departamento.toLowerCase().includes(searchLower);

    // Filtro por sistema
    const matchesSystem =
      filterSystem === "all" ||
      employee.systems.some((sys) => sys.system === filterSystem);

    // Filtro por status
    const matchesStatus =
      filterStatus === "all" ||
      employee.systems.some((sys) => {
        if (filterStatus === "active") return sys.status;
        if (filterStatus === "inactive") return !sys.status;
        return true;
      });

    // Filtro por departamento
    const matchesDepartamento =
      filterDepartamento === "all" || departamento === filterDepartamento;

    // Filtro por cargo
    const matchesCargo =
      filterCargo === "all" || cargo === filterCargo;

    return matchesSearch && matchesSystem && matchesStatus && matchesDepartamento && matchesCargo;
  });

  // Paginação
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Função para gerar os links de página
  function getPaginationLinks(current: number, total: number) {
    const links = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) links.push(i);
    } else {
      if (current <= 3) {
        links.push(1, 2, 3, 4, 'ellipsis', total);
      } else if (current >= total - 2) {
        links.push(1, 'ellipsis', total - 3, total - 2, total - 1, total);
      } else {
        links.push(1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total);
      }
    }
    return links;
  }

  // Resetar página ao filtrar/buscar
  useEffect(() => {
    setPage(1);
  }, [search, filterSystem, filterStatus, filterDepartamento, filterCargo]);

  // Função para abrir modal de edição
  const handleEditClick = (employee: Employee) => {
    setEditEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      cargo: getCargo(employee.name),
      departamento: getDepartamento(employee.name),
    });
    setEditDialogOpen(true);
  };

  // Função para salvar edição
  const handleEditSave = () => {
    if (!editEmployee) return;
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === editEmployee.id
          ? { ...emp, name: editForm.name, email: editForm.email }
          : emp
      )
    );
    setEditDialogOpen(false);
    toast.success('Funcionário atualizado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Funcionários ({employees.length})</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o status de acesso dos funcionários em diferentes sistemas
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </Badge>
      </div>

      {/* Busca e filtros melhorados */}
      <div className="flex flex-row gap-2 mb-2 w-full">
        <div className="flex items-center border rounded px-2 py-1 bg-background w-full shadow-sm flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Buscar funcionário, email, login, cargo ou departamento..."
            className="bg-transparent outline-none w-full text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sistema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Sistemas</SelectItem>
              {SYSTEMS.map(sys => (
                <SelectItem key={sys} value={sys}>{sys}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Departamentos</SelectItem>
              {DEPARTAMENTOS.map(dep => (
                <SelectItem key={dep} value={dep}>{dep}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <Select value={filterCargo} onValueChange={setFilterCargo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Cargos</SelectItem>
              {CARGOS.map(cargo => (
                <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status & Sistemas</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum funcionário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{getLogin(employee.email)}</TableCell>
                  <TableCell>{getCargo(employee.name)}</TableCell>
                  <TableCell>{getDepartamento(employee.name)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {employee.systems.map((system) => {
                        const isUpdating = updatingStatus.has(`${employee.id}-${system.system}`);
                        return (
                          <StatusBadge
                            key={system.system}
                            system={system.system}
                            status={system.status}
                            isUpdating={isUpdating}
                            employeeObj={employee}
                            onClick={() => handleBadgeClick(employee, { system: system.system, status: system.status, originalId: '' }, !system.status)}
                          />
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        className="p-1 rounded hover:bg-muted transition"
                        title="Editar funcionário"
                        onClick={() => handleEditClick(employee)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-muted transition disabled:opacity-50"
                        title="Atualizar dados do funcionário"
                        onClick={() => handleReloadEmployee(employee.id)}
                        disabled={reloading === employee.id}
                      >
                        {reloading === employee.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex w-full items-center justify-between mt-2">
        <span className="text-sm text-muted-foreground font-medium inline-block align-middle min-w-[160px]">
          Página {page} de {totalPages}
        </span>
        <nav
          role="navigation"
          aria-label="pagination"
          data-slot="pagination"
          className="flex w-full justify-end"
        >
          <ul data-slot="pagination-content" className="flex flex-row items-center gap-1">
            <li data-slot="pagination-item">
              <PaginationPrevious
                href="#"
                onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </li>
            {getPaginationLinks(page, totalPages).map((p, idx) =>
              p === 'ellipsis' ? (
                <li data-slot="pagination-item" key={"ellipsis-" + idx}>
                  <PaginationEllipsis />
                </li>
              ) : (
                <li data-slot="pagination-item" key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={e => { e.preventDefault(); setPage(Number(p)); }}
                  >
                    {p}
                  </PaginationLink>
                </li>
              )
            )}
            <li data-slot="pagination-item">
              <PaginationNext
                href="#"
                onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                aria-disabled={page === totalPages}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </li>
          </ul>
        </nav>
      </div>

      {/* Dialog de confirmação */}
      <ConfirmStatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pendingAction={pendingAction}
        onConfirm={confirmStatusChange}
      />

      {/* Dialog de edição */}
      <EmployeeEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        form={editForm}
        onFormChange={setEditForm}
        onSubmit={handleEditSave}
      />
    </div>
  );
} 