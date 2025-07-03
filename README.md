# Sistema de Gerenciamento de Funcionários

Interface unificada para gerenciar o status de acesso de funcionários em múltiplos sistemas usando Next.js e shadcn/ui.

## 🚀 Funcionalidades

- **Interface Unificada**: Gerencia funcionários de diferentes sistemas (ERP, CRM, Portal de Vendas, etc.) em uma única interface
- **Status Individual por Sistema**: Cada funcionário pode ter status ativo/inativo independente para cada sistema
- **Atualização em Tempo Real**: Interface otimista com feedback visual imediato
- **API REST**: Endpoints para buscar e atualizar dados
- **Design Responsivo**: Interface moderna e acessível

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Notificações**: Sonner
- **API**: Next.js API Routes

## 📦 Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd frontend

# Instale as dependências
npm install

# Execute o projeto
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 🏗️ Estrutura do Projeto

```
src/
├── app/
│   ├── api/employees/
│   │   └── route.ts          # API endpoints
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Página inicial
│   └── globals.css           # Estilos globais
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   └── employee-status-table.tsx  # Componente principal
└── types/
    └── employee.ts           # Tipos TypeScript
```

## 📊 Estrutura de Dados

### Tipo Employee
```typescript
type Employee = {
  id: string;                    // ID único do funcionário
  name: string;                  // Nome completo
  email: string;                 // Email (chave única)
  systems: SystemStatus[];       // Lista de sistemas e status
  createdAt: string;             // Data de criação
  lastUpdated: string;           // Última atualização
};

type SystemStatus = {
  system: 'ERP' | 'CRM' | 'Portal de Vendas' | 'Sistema RH' | 'Portal Cliente';
  status: boolean;               // true = ativo, false = inativo
  originalId: string | number;   // ID original no sistema específico
};
```

## 🔌 API Endpoints

### GET /api/employees
Busca todos os funcionários com seus status em diferentes sistemas.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-001",
      "name": "Ana Silva",
      "email": "ana.silva@empresa.com",
      "systems": [
        {
          "system": "ERP",
          "status": true,
          "originalId": "erp-101"
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z",
      "lastUpdated": "2024-03-20T14:30:00Z"
    }
  ],
  "timestamp": "2024-03-21T10:00:00Z"
}
```

### POST /api/employees
Atualiza o status de um funcionário em um sistema específico.

**Request:**
```json
{
  "employeeId": "emp-001",
  "system": "ERP",
  "newStatus": false
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Status do sistema ERP atualizado com sucesso",
  "data": {
    "employeeId": "emp-001",
    "system": "ERP",
    "newStatus": false,
    "updatedAt": "2024-03-21T10:00:00Z"
  }
}
```

## 🔧 Integração com Sistemas Reais

### 1. Conectar com Bancos de Dados Existentes

Substitua a função `consolidateEmployeeData()` em `src/app/api/employees/route.ts`:

```typescript
async function consolidateEmployeeData() {
  const employeeMap = new Map();

  // Conectar com banco ERP
  const erpEmployees = await queryERP('SELECT * FROM funcionarios');
  erpEmployees.forEach(emp => {
    const key = emp.email;
    if (!employeeMap.has(key)) {
      employeeMap.set(key, {
        id: generateUniqueId(),
        name: emp.nome,
        email: emp.email,
        systems: [],
        createdAt: emp.data_criacao,
        lastUpdated: emp.ultima_atualizacao,
      });
    }
    
    const employee = employeeMap.get(key);
    employee.systems.push({
      system: 'ERP',
      status: emp.ativo === 1,
      originalId: emp.id_erp,
    });
  });

  // Conectar com banco CRM
  const crmContacts = await queryCRM('SELECT * FROM contatos');
  // ... lógica similar

  return Array.from(employeeMap.values());
}
```

### 2. Implementar Atualizações Reais

Substitua a lógica de atualização no endpoint POST:

```typescript
export async function POST(request: NextRequest) {
  const { employeeId, system, newStatus } = await request.json();

  try {
    switch (system) {
      case 'ERP':
        await updateERPStatus(employeeId, newStatus);
        break;
      case 'CRM':
        await updateCRMStatus(employeeId, newStatus);
        break;
      // ... outros sistemas
    }

    return NextResponse.json({
      success: true,
      message: `Status do sistema ${system} atualizado com sucesso`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 3. Exemplo de Conexão com MySQL

```typescript
import mysql from 'mysql2/promise';

const erpConnection = mysql.createConnection({
  host: process.env.ERP_DB_HOST,
  user: process.env.ERP_DB_USER,
  password: process.env.ERP_DB_PASSWORD,
  database: process.env.ERP_DB_NAME,
});

async function updateERPStatus(employeeId: string, newStatus: boolean) {
  const connection = await erpConnection;
  await connection.execute(
    'UPDATE funcionarios SET ativo = ? WHERE id_erp = ?',
    [newStatus ? 1 : 0, employeeId]
  );
}
```

## 🎨 Customização

### Adicionar Novos Sistemas

1. Atualize o tipo `SystemStatus`:
```typescript
type SystemStatus = {
  system: 'ERP' | 'CRM' | 'Portal de Vendas' | 'Sistema RH' | 'Portal Cliente' | 'Novo Sistema';
  // ...
};
```

2. Adicione a variante do badge em `getSystemBadgeVariant()`:
```typescript
const variants = {
  // ... sistemas existentes
  "Novo Sistema": "outline",
};
```

### Personalizar Estilos

Os componentes usam Tailwind CSS e podem ser customizados editando as classes ou criando variantes no arquivo `tailwind.config.js`.

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório ou entre em contato através do email: suporte@empresa.com
# manager-colaborators-components
# manager-colaborators-components
