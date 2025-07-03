"use client";
import { useEffect, useState } from "react";

// Simulação de leitura de logs do localStorage
function getHistoryLogs() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("employeeStatusHistory") || "[]");
  } catch {
    return [];
  }
}

type HistoryLog = {
  timestamp: string;
  userLogin: string;
  employeeName: string;
  system: string;
  oldStatus: boolean;
  newStatus: boolean;
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<HistoryLog[]>([]);

  useEffect(() => {
    setLogs(getHistoryLogs().reverse());
  }, []);

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Histórico de Alterações</h1>
      {logs.length === 0 ? (
        <div className="text-muted-foreground">Nenhuma alteração registrada.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-2 py-1 border">Data/Hora</th>
                <th className="px-2 py-1 border">Login</th>
                <th className="px-2 py-1 border">Funcionário</th>
                <th className="px-2 py-1 border">Sistema</th>
                <th className="px-2 py-1 border">Status Anterior</th>
                <th className="px-2 py-1 border">Novo Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 border">{new Date(log.timestamp).toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-1 border">{log.userLogin}</td>
                  <td className="px-2 py-1 border">{log.employeeName}</td>
                  <td className="px-2 py-1 border">{log.system}</td>
                  <td className="px-2 py-1 border">{log.oldStatus ? "Ativo" : "Inativo"}</td>
                  <td className="px-2 py-1 border">{log.newStatus ? "Ativo" : "Inativo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
} 