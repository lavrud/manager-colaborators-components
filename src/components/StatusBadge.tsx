import React from "react";
import { type Employee, type SystemStatus } from "@/types/employee";

interface StatusBadgeProps {
  system: SystemStatus["system"];
  status: boolean;
  isUpdating: boolean;
  employeeObj: Employee;
  onClick?: () => void;
}

export function StatusBadge({
  system,
  status,
  isUpdating,
  employeeObj,
  onClick,
}: StatusBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full cursor-pointer transition-all duration-200
        ${status
          ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
          : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300"
        }
        ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
      `}
      style={{ fontSize: "0.70rem", minHeight: 0 }}
      onClick={isUpdating ? undefined : onClick}
      title={`Clique para ${status ? "desativar" : "ativar"} ${system}`}
    >
      <div
        className={`
          w-1.5 h-1.5 rounded-full ${status ? "bg-green-600" : "bg-red-600"}
          ${isUpdating ? "animate-pulse" : ""}
        `}
      />
      <span className="font-medium" style={{ fontSize: "0.70rem" }}>{system}</span>
      {isUpdating && (
        <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
} 