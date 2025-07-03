// Funções utilitárias para EmployeeStatusTable

export function getLogin(email: string) {
  return email.split("@")[0];
}

export function getCargo(name: string) {
  // Apenas para exemplo
  const cargos = ["Analista", "Coordenador", "Gerente", "Assistente", "Diretor"];
  return cargos[(name.charCodeAt(0) + name.length) % cargos.length];
}

export function getDepartamento(name: string) {
  // Apenas para exemplo
  const departamentos = ["RH", "TI", "Financeiro", "Comercial", "Operações"];
  return departamentos[(name.charCodeAt(1) + name.length) % departamentos.length];
}

export function logHistory({ userLogin, employeeName, system, oldStatus, newStatus }: {
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