export type SystemStatus = {
  system: 'ERP' | 'CRM' | 'Portal de Vendas' | 'Sistema RH' | 'Portal Cliente';
  status: boolean;
  originalId: string | number;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  systems: SystemStatus[];
  createdAt: string;
  lastUpdated: string;
}; 