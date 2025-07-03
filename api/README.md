# API .NET - Funcionários (Exemplo Completo)

Este documento descreve a estrutura de uma API C# .NET moderna para integração com um frontend React/Next.js, incluindo:
- Entity Framework Core
- AutoMapper
- JWT (autenticação)
- CORS
- Paginação, busca e filtros no backend
- Controllers organizados

---

## 1. Modelos

```csharp
public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Departamento { get; set; } = "";
    public string Cargo { get; set; } = "";
    public List<EmployeeSystem> Systems { get; set; } = new();
}

public class EmployeeSystem
{
    public int Id { get; set; }
    public string System { get; set; } = "";
    public bool Status { get; set; }
    public string OriginalId { get; set; } = "";
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; }
}
```

---

## 2. DTOs

```csharp
public class EmployeeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Departamento { get; set; } = "";
    public string Cargo { get; set; } = "";
    public List<EmployeeSystemDto> Systems { get; set; } = new();
}

public class EmployeeSystemDto
{
    public string System { get; set; } = "";
    public bool Status { get; set; }
    public string OriginalId { get; set; } = "";
}

public class UpdateStatusDto
{
    public int EmployeeId { get; set; }
    public string System { get; set; } = "";
    public bool NewStatus { get; set; }
}

public class LoginDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}
```

---

## 3. DbContext

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeSystem> EmployeeSystems => Set<EmployeeSystem>();
}
```

---

## 4. AutoMapper Profile

```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Employee, EmployeeDto>();
        CreateMap<EmployeeSystem, EmployeeSystemDto>();
    }
}
```

---

## 5. Program.cs (Startup)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddAutoMapper(typeof(Program));
builder.Services.AddControllers();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "suaempresa",
            ValidAudience = "suaempresa",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SUA_CHAVE_SECRETA_FORTE"))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

---

## 6. EmployeesController

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public EmployeesController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // GET: api/employees
    [HttpGet]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search,
        [FromQuery] string? system,
        [FromQuery] string? status,
        [FromQuery] string? departamento,
        [FromQuery] string? cargo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Employees
            .Include(e => e.Systems)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(e =>
                e.Name.Contains(search) ||
                e.Email.Contains(search) ||
                e.Departamento.Contains(search) ||
                e.Cargo.Contains(search)
            );
        }

        if (!string.IsNullOrEmpty(system))
            query = query.Where(e => e.Systems.Any(s => s.System == system));

        if (!string.IsNullOrEmpty(status))
        {
            bool isActive = status == "active";
            query = query.Where(e => e.Systems.Any(s => s.Status == isActive));
        }

        if (!string.IsNullOrEmpty(departamento))
            query = query.Where(e => e.Departamento == departamento);

        if (!string.IsNullOrEmpty(cargo))
            query = query.Where(e => e.Cargo == cargo);

        var total = await query.CountAsync();
        var employees = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<EmployeeDto>>(employees);

        return Ok(new
        {
            data = dtos,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    // GET: api/employees/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmployeeById(int id)
    {
        var employee = await _context.Employees
            .Include(e => e.Systems)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return NotFound();
        return Ok(_mapper.Map<EmployeeDto>(employee));
    }

    // PUT: api/employees/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto dto)
    {
        var employee = await _context.Employees.Include(e => e.Systems).FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return NotFound();

        employee.Name = dto.Name;
        employee.Email = dto.Email;
        employee.Departamento = dto.Departamento;
        employee.Cargo = dto.Cargo;
        // Atualize outros campos conforme necessário

        await _context.SaveChangesAsync();
        return Ok();
    }

    // PATCH: api/employees/{id}/system-status
    [HttpPatch("{id}/system-status")]
    public async Task<IActionResult> UpdateSystemStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        var system = await _context.EmployeeSystems
            .FirstOrDefaultAsync(s => s.EmployeeId == id && s.System == dto.System);
        if (system == null) return NotFound();

        system.Status = dto.NewStatus;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
```

---

## 7. AuthController (JWT)

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        // Exemplo fixo, troque por validação real
        if (dto.Username == "admin" && dto.Password == "123456")
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, dto.Username)
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("SUA_CHAVE_SECRETA_FORTE"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "suaempresa",
                audience: "suaempresa",
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds);

            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }
        return Unauthorized();
    }
}
```

---

## 8. HistoryController (Opcional)

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly AppDbContext _context;
    public HistoryController(AppDbContext context) { _context = context; }

    // GET: api/history
    [HttpGet]
    public async Task<IActionResult> GetHistory()
    {
        // Implemente conforme seu modelo de histórico
        return Ok(new { data = new List<object>() });
    }
}
```

---

## 9. Resumo das Rotas

| Método | Rota                                 | Descrição                                 |
|--------|--------------------------------------|-------------------------------------------|
| GET    | /api/employees                       | Lista todos os funcionários (com filtros, busca, paginação) |
| GET    | /api/employees/{id}                  | Detalhe de um funcionário                 |
| PUT    | /api/employees/{id}                  | Edita funcionário                         |
| PATCH  | /api/employees/{id}/system-status    | Atualiza status de sistema do funcionário |
| POST   | /api/auth/login                      | Login/JWT                                 |
| GET    | /api/history                         | Histórico de alterações (opcional)        |

---

## 10. Observações

- **CORS**: Habilite para o domínio do frontend.
- **JWT**: Use o token retornado no login em todas as requisições protegidas.
- **Paginação, busca e filtros**: Sempre trate no backend para performance.
- **AutoMapper**: Facilita o mapeamento entre entidades e DTOs.
- **EF Core**: Use migrations para criar o banco de dados.

---

Se precisar de exemplos de migration, seed, ou integração frontend, consulte a documentação ou peça exemplos específicos! 