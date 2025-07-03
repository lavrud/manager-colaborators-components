import { NextRequest, NextResponse } from 'next/server';

// Função utilitária para gerar nomes e emails fictícios
const firstNames = [
  "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João",
  "Karen", "Lucas", "Marina", "Nicolas", "Olívia", "Paulo", "Quésia", "Rafael", "Sofia", "Tiago",
  "Ursula", "Vitor", "Wesley", "Xuxa", "Yasmin", "Zeca", "Amanda", "Bernardo", "Camila", "Diego"
];
const lastNames = [
  "Silva", "Costa", "Dias", "Martins", "Oliveira", "Souza", "Lima", "Almeida", "Ferreira", "Gomes",
  "Barbosa", "Rocha", "Melo", "Pereira", "Ramos", "Teixeira", "Vieira", "Cardoso", "Freitas", "Batista",
  "Monteiro", "Cavalcante", "Azevedo", "Farias", "Rezende", "Peixoto", "Cunha", "Moura", "Santos", "Campos"
];
const systems = ["ERP", "CRM", "Portal de Vendas", "Sistema RH", "Portal Cliente"];

function generateEmployees(count: number) {
  const employees = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@empresa.com`;
    const id = `emp-${i + 1}`;
    const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();
    const lastUpdated = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString();

    // Cada funcionário terá de 2 a 5 sistemas
    const numSystems = 2 + Math.floor(Math.random() * 4);
    const shuffledSystems = systems.sort(() => 0.5 - Math.random());
    const systemsStatus = shuffledSystems.slice(0, numSystems).map((system) => ({
      system,
      status: Math.random() > 0.3, // 70% chance de estar ativo
      originalId: `${system.toLowerCase().replace(/ /g, '-')}-${1000 + i}`
    }));

    employees.push({
      id,
      name,
      email,
      systems: systemsStatus,
      createdAt,
      lastUpdated,
    });
  }
  return employees;
}

// GET /api/employees - Buscar todos os funcionários
export async function GET() {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const employees = generateEmployees(30);
    return NextResponse.json({
      success: true,
      data: employees,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor",
        message: "Não foi possível carregar os dados dos funcionários"
      },
      { status: 500 }
    );
  }
}

// POST /api/employees - Atualizar status de um sistema
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, system, newStatus } = body;
    if (!employeeId || !system || typeof newStatus !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Dados inválidos",
          message: "employeeId, system e newStatus são obrigatórios"
        },
        { status: 400 }
      );
    }
    await new Promise(resolve => setTimeout(resolve, 200));
    if (Math.random() < 0.02) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Erro de conexão",
          message: "Falha na comunicação com o sistema de destino"
        },
        { status: 503 }
      );
    }
    return NextResponse.json({
      success: true,
      message: `Status do sistema ${system} atualizado com sucesso`,
      data: {
        employeeId,
        system,
        newStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor",
        message: "Não foi possível atualizar o status"
      },
      { status: 500 }
    );
  }
} 