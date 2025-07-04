import { EmployeeStatusTable } from "@/components/employee-status-table";

export default function Home() {
  return (
    <main className="container mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Funcionários</h1>
      <EmployeeStatusTable />
    </main>
  );
}
