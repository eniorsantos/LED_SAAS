// Definição OpenAPI 3.0 da API SaaS Controle de Veiculação LED
// Espelha todos os endpoints implementados em src/index.js

module.exports = {
  openapi: '3.0.1',
  info: {
    title: 'SaaS Controle de Veiculação LED',
    version: '1.0.0',
    description:
      'API REST para gerenciar campanhas de veiculação em painéis de LED por cidade. ' +
      'Implementa a spec spec-saas-controle-leds (§§1–9).',
    contact: {
      name: 'Suporte',
      email: 'suporte@saasleds.example.com',
    },
    license: {
      name: 'Proprietário',
    },
  },
  servers: [
    { url: 'http://localhost:3001/api', description: 'Desenvolvimento local' },
    {
      url: 'https://{host}/api',
      description: 'Produção',
      variables: { host: { default: 'saas-leds-api.onrender.com' } },
    },
  ],
  tags: [
    { name: 'auth', description: 'Autenticação' },
    { name: 'config', description: 'Configurações globais' },
    { name: 'cidades', description: 'Cadastro de cidades' },
    { name: 'leds', description: 'Cadastro de painéis LED' },
    { name: 'anunciantes', description: 'Catálogo de anunciantes' },
    { name: 'campanhas', description: 'Campanhas de veiculação' },
    { name: 'reservas', description: 'Reservas de períodos futuros' },
    { name: 'programacoes', description: 'Grade de programação horária (V3)' },
    { name: 'dashboard', description: 'Dashboard consolidado (KPIs, gráficos, Gantt)' },
    { name: 'planilha', description: 'Visualização tipo planilha e exportação' },
    { name: 'relatorios', description: 'Relatórios em PDF' },
    { name: 'importacao', description: 'Importação de planilha CSV' },
    { name: 'notificacoes', description: 'Notificações e varredura diária' },
    { name: 'tema', description: 'Paleta de cores configurável' },
    { name: 'logo', description: 'Logo da empresa' },
    { name: 'usuarios', description: 'Gestão de usuários e permissões' },
    { name: 'backup', description: 'Backup e restauração do banco' },
    { name: 'auditoria', description: 'Log de operações' },
    { name: 'health', description: 'Health check' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Autentica usuário e retorna JWT',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['login', 'senha'],
                properties: {
                  login: { type: 'string', example: 'admin' },
                  senha: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login bem-sucedido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    perfil: { type: 'string', example: 'admin' },
                    nome: { type: 'string', example: 'Administrador' },
                    login: { type: 'string', example: 'admin' },
                  },
                },
              },
            },
          },
          401: { description: 'Credenciais inválidas' },
          429: { description: 'Muitas tentativas (rate limiting)' },
        },
      },
    },
    '/me': {
      get: {
        tags: ['usuarios'],
        summary: 'Retorna perfil e permissões do usuário logado',
        operationId: 'getMe',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dados do usuário',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          401: { description: 'Não autenticado' },
        },
      },
    },
    '/config': {
      get: {
        tags: ['config'],
        summary: 'Retorna configurações globais (N dias, max_clientes, logo)',
        operationId: 'getConfig',
        responses: {
          200: {
            description: 'Configurações',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    hoje: { type: 'string', example: '2026-10-25' },
                    n_inicio_proximo: { type: 'integer', example: 7 },
                    n_vencimento_proximo: { type: 'integer', example: 5 },
                    max_clientes_por_led: { type: 'integer', example: 8 },
                    logo_dataurl: { type: 'string', example: '' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['config'],
        summary: 'Atualiza configurações globais (admin)',
        operationId: 'updateConfig',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  n_inicio_proximo: { type: 'integer' },
                  n_vencimento_proximo: { type: 'integer' },
                  max_clientes_por_led: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Configurações atualizadas' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a config' },
          400: { description: 'Parâmetro inválido' },
        },
      },
    },
    '/cidades': {
      get: {
        tags: ['cidades'],
        summary: 'Lista todas as cidades',
        operationId: 'listCidades',
        responses: {
          200: {
            description: 'Lista de cidades',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'aracaju' },
                      nome: { type: 'string', example: 'Aracaju' },
                      uf: { type: 'string', example: 'SE' },
                      fuso: { type: 'string', example: 'America/Maceio' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['cidades'],
        summary: 'Cria cidade (id fixo)',
        operationId: 'createCidade',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'nome'],
                properties: {
                  id: { type: 'string', example: 'recife' },
                  nome: { type: 'string', example: 'Recife' },
                  uf: { type: 'string', example: 'PE' },
                  fuso: { type: 'string', example: 'America/Recife' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cidade criada' },
          400: { description: 'Campos obrigatórios ausentes' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a cidades' },
          409: { description: 'Cidade já existe' },
        },
      },
    },
    '/cidades/{id}': {
      put: {
        tags: ['cidades'],
        summary: 'Atualiza cidade (id fixo)',
        operationId: 'updateCidade',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nome: { type: 'string' },
                  uf: { type: 'string' },
                  fuso: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cidade atualizada' },
          404: { description: 'Cidade não encontrada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a cidades' },
        },
      },
      delete: {
        tags: ['cidades'],
        summary: 'Exclui cidade (só se vazia)',
        operationId: 'deleteCidade',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Cidade excluída' },
          404: { description: 'Cidade não encontrada' },
          409: { description: 'Cidade possui LEDs' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a cidades' },
        },
      },
    },
    '/leds': {
      get: {
        tags: ['leds'],
        summary: 'Lista LEDs com ocupação de espaços',
        operationId: 'listLeds',
        parameters: [
          {
            in: 'query',
            name: 'cidades',
            schema: { type: 'string' },
            description: 'Filtro por cidade(s)',
          },
        ],
        responses: {
          200: {
            description: 'Lista de LEDs',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      codigo: { type: 'string', example: 'AJU 01' },
                      endereco: { type: 'string', example: 'Silvio Teixeira' },
                      cidade_id: { type: 'string', example: 'aracaju' },
                      espacos_usados: { type: 'integer', example: 2 },
                      espacos_total: { type: 'integer', example: 8 },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['leds'],
        summary: 'Cria LED',
        operationId: 'createLed',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo', 'endereco', 'cidade_id'],
                properties: {
                  codigo: { type: 'string', example: 'AJU 05' },
                  endereco: { type: 'string', example: 'Av. Exemplo' },
                  cidade_id: { type: 'string', example: 'aracaju' },
                  espacos_total: { type: 'integer', example: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'LED criado' },
          400: { description: 'Campos obrigatórios ou parâmetro inválido' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a LEDs ou fora de escopo' },
          409: { description: 'LED já existe' },
        },
      },
    },
    '/leds/{codigo}': {
      put: {
        tags: ['leds'],
        summary: 'Atualiza ou renomeia LED (move campanhas e programações)',
        operationId: 'updateLed',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'codigo', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  endereco: { type: 'string' },
                  cidade_id: { type: 'string' },
                  espacos_total: { type: 'integer' },
                  novo_codigo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'LED atualizado' },
          404: { description: 'LED não encontrado' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
          409: { description: 'Código já existe' },
        },
      },
      delete: {
        tags: ['leds'],
        summary: 'Exclui LED (só se vazio)',
        operationId: 'deleteLed',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'codigo', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'LED excluído' },
          404: { description: 'LED não encontrado' },
          409: { description: 'LED possui campanhas' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
        },
      },
    },
    '/anunciantes': {
      get: {
        tags: ['anunciantes'],
        summary: 'Lista anunciantes',
        operationId: 'listAnunciantes',
        responses: {
          200: {
            description: 'Lista de anunciantes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { type: 'string', example: 'Atakarejo' },
                },
              },
            },
          },
        },
      },
    },
    '/campanhas': {
      get: {
        tags: ['campanhas'],
        summary: 'Lista campanhas com status',
        operationId: 'listCampanhas',
        parameters: [
          { in: 'query', name: 'cidades', schema: { type: 'string' } },
          { in: 'query', name: 'led', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Lista de campanhas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      cidade_id: { type: 'string' },
                      led_codigo: { type: 'string' },
                      anunciante: { type: 'string' },
                      inicio: { type: 'string' },
                      fim: { type: 'string' },
                      reservada: { type: 'integer' },
                      status: {
                        type: 'string',
                        enum: ['veiculando', 'a_vencer', 'vencida', 'agendada', 'reservada'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['campanhas'],
        summary: 'Cria campanha (valida datas, cidade/LED, capacidade)',
        operationId: 'createCampanha',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'cidade_id', 'led_codigo', 'anunciante', 'inicio', 'fim'],
                properties: {
                  id: { type: 'string', example: 'c10' },
                  cidade_id: { type: 'string', example: 'aracaju' },
                  led_codigo: { type: 'string', example: 'AJU 01' },
                  anunciante: { type: 'string', example: 'Novo Anunciante' },
                  inicio: { type: 'string', example: '2026-11-01' },
                  fim: { type: 'string', example: '2026-12-31' },
                  reservada: { type: 'integer', example: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Campanha criada' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
          409: { description: 'LED lotado' },
        },
      },
      delete: {
        tags: ['campanhas'],
        summary: 'Exclusão em lote de campanhas',
        operationId: 'deleteCampanhasLote',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ids'],
                properties: {
                  ids: { type: 'array', items: { type: 'string' }, example: ['c1', 'c2'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Resultado da exclusão em lote' },
          400: { description: 'IDs inválidos' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a campanhas_editar' },
        },
      },
    },
    '/campanhas/{id}': {
      put: {
        tags: ['campanhas'],
        summary: 'Edita campanha (inline da planilha)',
        operationId: 'updateCampanha',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Campanha atualizada' },
          404: { description: 'Campanha não encontrada' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
          409: { description: 'LED lotado' },
        },
      },
      delete: {
        tags: ['campanhas'],
        summary: 'Exclui campanha',
        operationId: 'deleteCampanha',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Campanha excluída' },
          404: { description: 'Campanha não encontrada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
        },
      },
    },
    '/campanhas/{id}/reservas': {
      get: {
        tags: ['reservas'],
        summary: 'Lista reservas de uma campanha',
        operationId: 'listReservasCampanha',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Lista de reservas' },
          404: { description: 'Campanha não encontrada' },
          403: { description: 'Fora de escopo' },
        },
      },
      post: {
        tags: ['reservas'],
        summary: 'Cria reserva para uma campanha',
        operationId: 'createReservaCampanha',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['inicio', 'fim'],
                properties: {
                  inicio: { type: 'string', example: '2026-12-01' },
                  fim: { type: 'string', example: '2026-12-31' },
                  anunciante: { type: 'string', example: 'Anunciante da reserva' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Reserva criada' },
          400: { description: 'Datas inválidas' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
          404: { description: 'Campanha não encontrada' },
        },
      },
    },
    '/reservas': {
      get: {
        tags: ['reservas'],
        summary: 'Lista global de reservas',
        operationId: 'listReservas',
        parameters: [
          { in: 'query', name: 'cidades', schema: { type: 'string' } },
          { in: 'query', name: 'led', schema: { type: 'string' } },
          { in: 'query', name: 'campanha_id', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lista global de reservas' },
        },
      },
      post: {
        tags: ['reservas'],
        summary: 'Cria reserva por LED (cria campanha reservada automaticamente se necessário)',
        operationId: 'createReservaLed',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['led_codigo', 'anunciante', 'inicio', 'fim'],
                properties: {
                  led_codigo: { type: 'string', example: 'AJU 01' },
                  anunciante: { type: 'string', example: 'Novo Cliente' },
                  inicio: { type: 'string', example: '2026-12-01' },
                  fim: { type: 'string', example: '2026-12-15' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Reserva criada' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
          409: { description: 'LED lotado' },
        },
      },
    },
    '/reservas/{id}': {
      put: {
        tags: ['reservas'],
        summary: 'Atualiza reserva',
        operationId: 'updateReserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Reserva atualizada' },
          404: { description: 'Reserva não encontrada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
        },
      },
      delete: {
        tags: ['reservas'],
        summary: 'Exclui reserva',
        operationId: 'deleteReserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Reserva excluída' },
          404: { description: 'Reserva não encontrada' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso ou fora de escopo' },
        },
      },
    },
    '/programacoes': {
      get: {
        tags: ['programacoes'],
        summary: 'Lista programações da grade V3',
        operationId: 'listProgramacoes',
        parameters: [
          { in: 'query', name: 'led', schema: { type: 'string' } },
          { in: 'query', name: 'campanha', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lista de programações' },
        },
      },
      post: {
        tags: ['programacoes'],
        summary: 'Cria spot com validação anti-sobreposição (V3)',
        operationId: 'createProgramacao',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'campanha_id', 'led_codigo', 'horario_inicio'],
                properties: {
                  id: { type: 'string', example: 's10' },
                  campanha_id: { type: 'string', example: 'c1' },
                  led_codigo: { type: 'string', example: 'AJU 01' },
                  horario_inicio: { type: 'string', example: '07:00' },
                  duracao_segundos: { type: 'integer', example: 15 },
                  dias_semana: { type: 'string', example: 'SEG' },
                  insercoes_dia: { type: 'integer', example: 1 },
                  autorizacao_admin: { type: 'boolean', example: false },
                  motivo_autorizacao: { type: 'string', example: 'Sobreposição autorizada' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Spot criado' },
          400: { description: 'Dados inválidos' },
          403: { description: 'Sobreposição requer autorização admin' },
          409: { description: 'Sobreposição sem confirmação de admin' },
          401: { description: 'Não autenticado' },
        },
      },
    },
    '/dashboard': {
      get: {
        tags: ['dashboard'],
        summary: 'Dashboard consolidado (4 KPIs, rosca, linha, barras, Gantt)',
        operationId: 'getDashboard',
        parameters: [{ in: 'query', name: 'cidades', schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Dados do dashboard',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/planilha': {
      get: {
        tags: ['planilha'],
        summary: 'Lista campanhas no formato planilha (Cidade;LED;Anunciante;Início;Fim;Status)',
        operationId: 'listPlanilha',
        parameters: [
          { in: 'query', name: 'cidades', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'q', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Linhas da planilha',
            content: { 'application/json': { schema: { type: 'array' } } },
          },
        },
      },
    },
    '/export/planilha.csv': {
      get: {
        tags: ['planilha'],
        summary: 'Exporta planilha em CSV (mesmos filtros da planilha)',
        operationId: 'exportCSV',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'cidades', schema: { type: 'string' } },
          { in: 'query', name: 'q', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Arquivo CSV',
            content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
          },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a exportar' },
        },
      },
    },
    '/export/planilha.xlsx': {
      get: {
        tags: ['planilha'],
        summary: 'Exporta planilha em XLSX (mesmos filtros da planilha)',
        operationId: 'exportXLSX',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'cidades', schema: { type: 'string' } },
          { in: 'query', name: 'q', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Arquivo XLSX',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a exportar' },
        },
      },
    },
    '/relatorios/pdf': {
      post: {
        tags: ['relatorios'],
        summary: 'Gera relatório PDF por dimensão (LED/cidade/cliente)',
        operationId: 'gerarRelatorioPDF',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  dimensao: { type: 'string', enum: ['led', 'cidade', 'cliente'], example: 'led' },
                  cidades: { type: 'string', example: 'aracaju' },
                  status: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['veiculando', 'a_vencer'],
                  },
                  anunciante: { type: 'string', example: 'Atakarejo' },
                  de: { type: 'string', example: '2026-10-01' },
                  ate: { type: 'string', example: '2026-10-31' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'PDF gerado',
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
          },
          400: { description: 'Parâmetros inválidos' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a relatórios' },
        },
      },
    },
    '/import/modelo.csv': {
      get: {
        tags: ['importacao'],
        summary: 'Retorna modelo CSV para importação',
        operationId: 'getModeloCSV',
        responses: {
          200: {
            description: 'Arquivo CSV modelo',
            content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
          },
        },
      },
    },
    '/import/planilha': {
      post: {
        tags: ['importacao'],
        summary: 'Importa planilha CSV',
        operationId: 'importPlanilha',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['csv'],
                properties: {
                  csv: {
                    type: 'string',
                    example:
                      'Cidade;LED;Anunciante;Início;Fim\nAracaju;AJU 01;Cliente X;01/12/26;31/01/27\n',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Resultado da importação' },
          400: { description: 'CSV inválido' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a importar' },
        },
      },
    },
    '/notificacoes': {
      get: {
        tags: ['notificacoes'],
        summary: 'Lista notificações (toasts)',
        operationId: 'listNotificacoes',
        parameters: [{ in: 'query', name: 'cidades', schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Lista de notificações',
            content: { 'application/json': { schema: { type: 'array' } } },
          },
        },
      },
    },
    '/notificacoes/varredura': {
      post: {
        tags: ['notificacoes'],
        summary: 'Executa varredura diária manualmente',
        operationId: 'varreduraNotificacoes',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Resultado da varredura',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          401: { description: 'Não autenticado' },
        },
      },
    },
    '/notificacoes/{id}/lida': {
      patch: {
        tags: ['notificacoes'],
        summary: 'Marca notificação como lida',
        operationId: 'marcarLida',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Marcada como lida' },
          401: { description: 'Não autenticado' },
        },
      },
    },
    '/tema': {
      get: {
        tags: ['tema'],
        summary: 'Retorna variáveis de tema e rótulos',
        operationId: 'getTema',
        responses: {
          200: {
            description: 'Tema',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
      put: {
        tags: ['tema'],
        summary: 'Atualiza paleta de cores (admin)',
        operationId: 'updateTema',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vars: { type: 'object', example: { teal: '#2dd4bf' } },
                  restaurar: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tema atualizado' },
          400: { description: 'Variável ou cor inválida' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a config' },
        },
      },
    },
    '/logo': {
      get: {
        tags: ['logo'],
        summary: 'Retorna data URL da logo',
        operationId: 'getLogo',
        responses: {
          200: {
            description: 'Logo',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
      put: {
        tags: ['logo'],
        summary: 'Salva logo da empresa (admin, ≤512KB)',
        operationId: 'updateLogo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dataUrl'],
                properties: {
                  dataUrl: { type: 'string', example: 'data:image/png;base64,...' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logo salva' },
          400: { description: 'Tipo ou tamanho inválido' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a config' },
          413: { description: 'Arquivo muito grande' },
        },
      },
      delete: {
        tags: ['logo'],
        summary: 'Remove logo (admin)',
        operationId: 'deleteLogo',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logo removida' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a config' },
        },
      },
    },
    '/usuarios': {
      get: {
        tags: ['usuarios'],
        summary: 'Lista usuários com cidades e permissões (admin)',
        operationId: 'listUsuarios',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de usuários',
            content: { 'application/json': { schema: { type: 'array' } } },
          },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a usuarios' },
        },
      },
      post: {
        tags: ['usuarios'],
        summary: 'Cria usuário (admin)',
        operationId: 'createUsuario',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['login', 'senha'],
                properties: {
                  login: { type: 'string', example: 'novo' },
                  senha: { type: 'string', example: 'senha123' },
                  perfil: {
                    type: 'string',
                    enum: ['admin', 'regional', 'operador', 'visualizador'],
                    example: 'visualizador',
                  },
                  nome: { type: 'string', example: 'Novo Usuário' },
                  cidades: { type: 'array', items: { type: 'string' }, example: ['aracaju'] },
                  permissoes: { type: 'array', items: { type: 'string' }, example: ['exportar'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário criado' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a usuarios' },
          409: { description: 'Login já existe' },
        },
      },
    },
    '/usuarios/{login}': {
      put: {
        tags: ['usuarios'],
        summary: 'Atualiza usuário (admin)',
        operationId: 'updateUsuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'login', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Usuário atualizado' },
          404: { description: 'Usuário não encontrado' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a usuarios' },
        },
      },
      delete: {
        tags: ['usuarios'],
        summary: 'Exclui usuário (admin, não pode excluir a si mesmo nem último admin)',
        operationId: 'deleteUsuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'login', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Usuário excluído' },
          404: { description: 'Usuário não encontrado' },
          409: { description: 'Não pode excluir a si mesmo ou último admin' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a usuarios' },
        },
      },
    },
    '/recursos': {
      get: {
        tags: ['usuarios'],
        summary: 'Catálogo de recursos disponíveis',
        operationId: 'listRecursos',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de recursos',
            content: { 'application/json': { schema: { type: 'array' } } },
          },
          401: { description: 'Não autenticado' },
        },
      },
    },
    '/backup': {
      get: {
        tags: ['backup'],
        summary: 'Exporta todo o banco em JSON (admin)',
        operationId: 'getBackup',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Backup JSON',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a config' },
        },
      },
    },
    '/backup/restaurar': {
      post: {
        tags: ['backup'],
        summary: 'Restaura banco a partir de JSON (admin, substitui tudo)',
        operationId: 'restoreBackup',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tabelas'],
                properties: {
                  tabelas: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Banco restaurado' },
          400: { description: 'Backup inválido' },
          401: { description: 'Não autenticado' },
          403: { description: 'Sem acesso a config' },
        },
      },
    },
    '/auditoria': {
      get: {
        tags: ['auditoria'],
        summary: 'Log de operações (admin, últimas 100)',
        operationId: 'listAuditoria',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de auditoria',
            content: { 'application/json': { schema: { type: 'array' } } },
          },
          401: { description: 'Não autenticado' },
          403: { description: 'Somente admin' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Health check',
        operationId: 'health',
        responses: {
          200: {
            description: 'API saudável',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                    hoje: { type: 'string', example: '2026-10-25' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido via POST /api/auth/login',
      },
    },
    schemas: {
      Campanha: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cidade_id: { type: 'string' },
          led_codigo: { type: 'string' },
          anunciante: { type: 'string' },
          inicio: { type: 'string' },
          fim: { type: 'string' },
          reservada: { type: 'integer' },
          status: { type: 'string' },
        },
      },
      LED: {
        type: 'object',
        properties: {
          codigo: { type: 'string' },
          endereco: { type: 'string' },
          cidade_id: { type: 'string' },
          espacos_total: { type: 'integer' },
          espacos_usados: { type: 'integer' },
        },
      },
    },
  },
};
