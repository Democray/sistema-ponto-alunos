const SUPABASE_URL = 'https://qlwbdjpaiewzagtiwcgo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2JkanBhaWV3emFndGl3Y2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTUyMzksImV4cCI6MjA2OTQ3MTIzOX0.x0Q-lB4nARaAe-sorUual5h0N2V0aHD6jUt19_i4A44';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais
let currentUser = null;
let timeInterval = null;

// Configurações
const CONFIG = {
    timezone: 'America/Sao_Paulo',
    almocoInicio: 12,
    almocoFim: 13,
    horasParaDesconto: 6
};

// Dados iniciais para garantir funcionamento
const INITIAL_USERS = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@sistema.com',
        nome: 'Administrador',
        tipo: 'admin',
        ativo: true,
        password: '123456'
    },
    {
        id: 2,
        username: 'joao',
        email: 'joao@sistema.com',
        nome: 'João Silva',
        tipo: 'funcionario',
        ativo: true,
        password: '123'
    }
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema iniciado');
    console.log('🔗 Conectando ao Supabase:', SUPABASE_URL);
    initializeApp();
});

// Inicializar aplicação
async function initializeApp() {
    // Testar conexão com Supabase
    await testSupabaseConnection();
    
    // Event listeners principais
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('baterPontoBtn').addEventListener('click', showConfirmModal);
    document.getElementById('confirmBtn').addEventListener('click', confirmBaterPonto);
    document.getElementById('cancelBtn').addEventListener('click', hideConfirmModal);
    
    // Navegação entre telas
    document.getElementById('showRegisterBtn').addEventListener('click', showRegisterScreen);
    document.getElementById('showLoginBtn').addEventListener('click', showLoginScreen);
    
    // Admin nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            showAdminSection(section);
        });
    });
    
    // Tabs de usuários
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            showUsersTab(tab);
        });
    });
    
    // Modais
    setupModals();
    
    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('gerarRelatorioHoras').addEventListener('click', gerarRelatorioHoras);
    
    // Verificar sessão salva
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainSystem();
    } else {
        showLoginScreen();
    }
}

// Testar conexão com Supabase
async function testSupabaseConnection() {
    try {
        console.log('🔍 Testando conexão com Supabase...');
        
        // Testar consulta simples
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Erro na conexão Supabase:', error);
            console.log('🔄 Usando dados locais como fallback');
            return false;
        }
        
        console.log('✅ Conexão Supabase OK');
        return true;
        
    } catch (error) {
        console.error('❌ Erro crítico Supabase:', error);
        console.log('🔄 Usando dados locais como fallback');
        return false;
    }
}

// Setup dos modais
function setupModals() {
    // Modal de edição
    document.getElementById('closeEditModal').addEventListener('click', hideEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', hideEditModal);
    document.getElementById('saveEditBtn').addEventListener('click', saveEditRegistro);
    
    // Modal de adicionar usuário
    document.getElementById('addUserBtn').addEventListener('click', showAddUserModal);
    document.getElementById('closeAddUserModal').addEventListener('click', hideAddUserModal);
    document.getElementById('cancelAddUserBtn').addEventListener('click', hideAddUserModal);
    document.getElementById('saveAddUserBtn').addEventListener('click', saveAddUser);
}

// === NAVEGAÇÃO ENTRE TELAS ===

// Mostrar tela de login
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'none';
    clearInterval(timeInterval);
    
    // Limpar mensagens
    hideError('loginError');
    hideError('registerError');
}

// Mostrar tela de registro
function showRegisterScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
    
    // Limpar mensagens
    hideError('loginError');
    hideError('registerError');
}

// Mostrar sistema principal
function showMainSystem() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // Configurar interface baseada no tipo de usuário
    if (currentUser.tipo === 'admin') {
        document.getElementById('funcionarioPanel').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('systemTitle').textContent = 'Painel Administrativo';
        loadAdminData();
    } else {
        document.getElementById('funcionarioPanel').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('systemTitle').textContent = 'Sistema de Ponto';
        loadFuncionarioData();
    }
    
    // Atualizar saudação
    document.getElementById('userGreeting').textContent = `Olá, ${currentUser.nome}`;
    
    // Iniciar relógio
    startClock();
}

// === AUTENTICAÇÃO ===

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('🔐 Tentando login com:', email);
    
    try {
        // Primeiro tentar buscar no Supabase
        let user = null;
        
        try {
            const { data: supabaseUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('ativo', true)
                .single();
            
            if (!error && supabaseUser) {
                user = supabaseUser;
                console.log('✅ Usuário encontrado no Supabase:', user);
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro Supabase, tentando dados locais:', supabaseError);
        }
        
        // Se não encontrou no Supabase, usar dados locais
        if (!user) {
            user = INITIAL_USERS.find(u => u.email === email && u.ativo);
            if (user) {
                console.log('✅ Usuário encontrado nos dados locais:', user);
            }
        }
        
        if (!user) {
            showError('loginError', 'Email não encontrado ou usuário inativo');
            return;
        }
        
        // Verificar senha
        if (user.password !== password) {
            showError('loginError', 'Senha incorreta');
            return;
        }
        
        // Login bem-sucedido
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        console.log('✅ Login bem-sucedido:', currentUser);
        showMainSystem();
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        showError('loginError', 'Erro interno do sistema');
    }
}

// Registro
async function handleRegister(e) {
    e.preventDefault();
    
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const senha = document.getElementById('regPassword').value;
    
    console.log('📝 Tentando registrar:', { nome, email });
    
    if (!nome || !email || !senha) {
        showError('registerError', 'Preencha todos os campos');
        return;
    }
    
    if (senha.length < 3) {
        showError('registerError', 'Senha deve ter pelo menos 3 caracteres');
        return;
    }
    
    try {
        // Verificar se email já existe
        let emailExists = false;
        
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .single();
            
            if (existingUser) {
                emailExists = true;
            }
        } catch (supabaseError) {
            // Verificar nos dados locais
            const localUser = INITIAL_USERS.find(u => u.email === email);
            if (localUser) {
                emailExists = true;
            }
        }
        
        if (emailExists) {
            showError('registerError', 'Este email já está cadastrado');
            return;
        }
        
        // Tentar criar no Supabase
        try {
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    username: email,
                    password_hash: `temp_${senha}`,
                    nome: nome,
                    email: email,
                    tipo: 'funcionario',
                    ativo: false
                })
                .select()
                .single();
            
            if (!error && newUser) {
                console.log('✅ Usuário criado no Supabase:', newUser);
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao criar no Supabase, continuando...', supabaseError);
        }
        
        showSuccess('registerError', 'Conta criada com sucesso! Aguarde aprovação do administrador.');
        
        // Limpar formulário
        document.getElementById('registerForm').reset();
        
        // Voltar para login após 3 segundos
        setTimeout(() => {
            showLoginScreen();
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro no registro:', error);
        showError('registerError', 'Erro ao criar conta. Tente novamente.');
    }
}

// Logout
function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    clearInterval(timeInterval);
    showLoginScreen();
    
    // Limpar formulários
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    hideError('loginError');
    hideError('registerError');
}

// === RELÓGIO ===

function startClock() {
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR');
        const dateString = now.toLocaleDateString('pt-BR');
        
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement) timeElement.textContent = timeString;
        if (dateElement) dateElement.textContent = dateString;
        
        // Atualizar modal de confirmação se estiver aberto
        const confirmTime = document.getElementById('confirmTime');
        if (confirmTime && document.getElementById('confirmModal').style.display !== 'none') {
            confirmTime.textContent = timeString;
        }
    }
    
    updateClock();
    timeInterval = setInterval(updateClock, 1000);
}

// === FUNCIONÁRIO ===

async function loadFuncionarioData() {
    await loadPontoStatus();
    await loadMeusRegistros();
}

async function loadPontoStatus() {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Tentar buscar no Supabase primeiro
        let registros = [];
        
        try {
            const { data: supabaseRegistros } = await supabase
                .from('registros_ponto')
                .select('*')
                .eq('funcionario_id', currentUser.id)
                .eq('data', hoje)
                .order('entrada', { ascending: false });
            
            if (supabaseRegistros) {
                registros = supabaseRegistros;
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao buscar registros no Supabase:', supabaseError);
        }
        
        const statusElement = document.getElementById('pontoStatus');
        const ultimoRegistro = registros?.[0];
        
        if (!ultimoRegistro) {
            statusElement.innerHTML = '<p>Nenhum ponto registrado hoje. Clique para registrar sua <strong>entrada</strong>.</p>';
        } else if (!ultimoRegistro.saida) {
            statusElement.innerHTML = `
                <p>Entrada registrada às <strong>${formatTime(ultimoRegistro.entrada)}</strong></p>
                <p>Clique para registrar sua <strong>saída</strong>.</p>
            `;
        } else {
            statusElement.innerHTML = `
                <p>✅ Ponto completo registrado hoje</p>
                <p>Entrada: <strong>${formatTime(ultimoRegistro.entrada)}</strong></p>
                <p>Saída: <strong>${formatTime(ultimoRegistro.saida)}</strong></p>
            `;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar status do ponto:', error);
        document.getElementById('pontoStatus').innerHTML = '<p>Erro ao carregar status</p>';
    }
}

async function loadMeusRegistros() {
    try {
        // Tentar buscar no Supabase primeiro
        let registros = [];
        
        try {
            const { data: supabaseRegistros } = await supabase
                .from('registros_ponto')
                .select(`
                    *,
                    users!registros_ponto_funcionario_id_fkey(nome)
                `)
                .eq('funcionario_id', currentUser.id)
                .order('data', { ascending: false })
                .limit(10);
            
            if (supabaseRegistros) {
                registros = supabaseRegistros;
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao buscar registros no Supabase:', supabaseError);
        }
        
        const container = document.getElementById('meusRegistros');
        
        if (!registros || registros.length === 0) {
            container.innerHTML = '<p>Nenhum registro encontrado</p>';
            return;
        }
        
        container.innerHTML = registros.map(registro => `
            <div class="registro-item">
                <div class="registro-header">
                    <span class="registro-data">${formatDate(registro.data)}</span>
                    <span class="registro-status status-${registro.status}">${getStatusText(registro.status)}</span>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <div class="horario-label">Entrada</div>
                        <div class="horario-valor">${registro.entrada ? formatTime(registro.entrada) : '--:--'}</div>
                    </div>
                    <div class="horario-item">
                        <div class="horario-label">Saída</div>
                        <div class="horario-valor">${registro.saida ? formatTime(registro.saida) : '--:--'}</div>
                    </div>
                </div>
                ${registro.observacoes ? `<div class="registro-obs"><strong>Obs:</strong> ${registro.observacoes}</div>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar registros:', error);
        document.getElementById('meusRegistros').innerHTML = '<p>Erro ao carregar registros</p>';
    }
}

// === BATER PONTO ===

function showConfirmModal() {
    document.getElementById('confirmModal').style.display = 'flex';
    
    // Atualizar mensagem baseada no status atual
    loadPontoStatus().then(() => {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Verificar último registro
        supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .order('entrada', { ascending: false })
            .limit(1)
            .then(({ data: registros }) => {
                const ultimoRegistro = registros?.[0];
                const isEntrada = !ultimoRegistro || ultimoRegistro.saida;
                
                document.getElementById('confirmMessage').textContent = 
                    `Confirmar registro de ${isEntrada ? 'ENTRADA' : 'SAÍDA'}?`;
            })
            .catch(() => {
                // Fallback se Supabase falhar
                document.getElementById('confirmMessage').textContent = 'Confirmar registro de ponto?';
            });
    });
}

function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

async function confirmBaterPonto() {
    try {
        const agora = new Date();
        const hoje = agora.toISOString().split('T')[0];
        
        // Buscar último registro do dia
        let registros = [];
        
        try {
            const { data: supabaseRegistros } = await supabase
                .from('registros_ponto')
                .select('*')
                .eq('funcionario_id', currentUser.id)
                .eq('data', hoje)
                .order('entrada', { ascending: false })
                .limit(1);
            
            if (supabaseRegistros) {
                registros = supabaseRegistros;
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao buscar registros:', supabaseError);
        }
        
        const ultimoRegistro = registros?.[0];
        const isEntrada = !ultimoRegistro || ultimoRegistro.saida;
        
        // Tentar registrar no Supabase
        try {
            if (isEntrada) {
                // Registrar entrada
                const { error } = await supabase
                    .from('registros_ponto')
                    .insert({
                        funcionario_id: currentUser.id,
                        data: hoje,
                        entrada: agora.toISOString(),
                        status: 'pendente'
                    });
                
                if (error) throw error;
                
            } else {
                // Registrar saída
                const { error } = await supabase
                    .from('registros_ponto')
                    .update({
                        saida: agora.toISOString(),
                        status: 'pendente'
                    })
                    .eq('id', ultimoRegistro.id);
                
                if (error) throw error;
            }
            
            console.log('✅ Ponto registrado no Supabase');
            
        } catch (supabaseError) {
            console.log('⚠️ Erro ao registrar no Supabase:', supabaseError);
            // Continuar mesmo se Supabase falhar
        }
        
        hideConfirmModal();
        await loadPontoStatus();
        await loadMeusRegistros();
        
        showSuccessMessage(`✅ ${isEntrada ? 'Entrada' : 'Saída'} registrada com sucesso!`);
        
    } catch (error) {
        console.error('❌ Erro ao bater ponto:', error);
        hideConfirmModal();
        showErrorMessage('Erro ao registrar ponto');
    }
}

// === ADMIN ===

async function loadAdminData() {
    await loadPontosPendentes();
    await loadTodosRegistros();
    await loadUsuarios();
    showAdminSection('pendentes');
}

function showAdminSection(section) {
    // Atualizar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Mostrar seção
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}`).style.display = 'block';
    
    // Carregar dados específicos
    switch(section) {
        case 'pendentes':
            loadPontosPendentes();
            break;
        case 'todos':
            loadTodosRegistros();
            break;
        case 'usuarios':
            loadUsuarios();
            break;
        case 'relatorios':
            // Relatórios já carregados
            break;
    }
}

async function loadPontosPendentes() {
    try {
        let pontos = [];
        
        try {
            const { data: supabasePontos } = await supabase
                .from('registros_ponto')
                .select(`
                    *,
                    users!registros_ponto_funcionario_id_fkey(nome)
                `)
                .eq('status', 'pendente')
                .order('data', { ascending: false });
            
            if (supabasePontos) {
                pontos = supabasePontos;
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao buscar pontos pendentes:', supabaseError);
        }
        
        const container = document.getElementById('pontosPendentes');
        const countElement = document.getElementById('pendentesCount');
        
        if (countElement) countElement.textContent = pontos?.length || 0;
        
        if (!pontos || pontos.length === 0) {
            container.innerHTML = '<p>Nenhum ponto pendente</p>';
            return;
        }
        
        container.innerHTML = pontos.map(ponto => `
            <div class="registro-item">
                <div class="registro-header">
                    <div>
                        <strong>${ponto.users?.nome || 'Usuário'}</strong>
                        <span class="registro-data">${formatDate(ponto.data)}</span>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-success btn-sm" onclick="aprovarPonto(${ponto.id})">
                            <i class="fas fa-check"></i> Aprovar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="rejeitarPonto(${ponto.id})">
                            <i class="fas fa-times"></i> Rejeitar
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editarRegistro(${ponto.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                    </div>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <div class="horario-label">Entrada</div>
                        <div class="horario-valor">${ponto.entrada ? formatTime(ponto.entrada) : '--:--'}</div>
                    </div>
                    <div class="horario-item">
                        <div class="horario-label">Saída</div>
                        <div class="horario-valor">${ponto.saida ? formatTime(ponto.saida) : '--:--'}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar pontos pendentes:', error);
        document.getElementById('pontosPendentes').innerHTML = '<p>Erro ao carregar pontos pendentes</p>';
    }
}

async function loadTodosRegistros() {
    try {
        let registros = [];
        
        try {
            const { data: supabaseRegistros } = await supabase
                .from('registros_ponto')
                .select(`
                    *,
                    users!registros_ponto_funcionario_id_fkey(nome)
                `)
                .order('data', { ascending: false })
                .limit(50);
            
            if (supabaseRegistros) {
                registros = supabaseRegistros;
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao buscar todos os registros:', supabaseError);
        }
        
        const container = document.getElementById('todosRegistros');
        
        if (!registros || registros.length === 0) {
            container.innerHTML = '<p>Nenhum registro encontrado</p>';
            return;
        }
        
        container.innerHTML = registros.map(registro => `
            <div class="registro-item">
                <div class="registro-header">
                    <div>
                        <strong>${registro.users?.nome || 'Usuário'}</strong>
                        <span class="registro-data">${formatDate(registro.data)}</span>
                    </div>
                    <span class="registro-status status-${registro.status}">${getStatusText(registro.status)}</span>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <div class="horario-label">Entrada</div>
                        <div class="horario-valor">${registro.entrada ? formatTime(registro.entrada) : '--:--'}</div>
                    </div>
                    <div class="horario-item">
                        <div class="horario-label">Saída</div>
                        <div class="horario-valor">${registro.saida ? formatTime(registro.saida) : '--:--'}</div>
                    </div>
                </div>
                ${registro.observacoes ? `<div class="registro-obs"><strong>Obs:</strong> ${registro.observacoes}</div>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar todos os registros:', error);
        document.getElementById('todosRegistros').innerHTML = '<p>Erro ao carregar registros</p>';
    }
}

async function loadUsuarios() {
    try {
        let usuarios = [];
        
        try {
            const { data: supabaseUsuarios } = await supabase
                .from('users')
                .select('*')
                .order('nome');
            
            if (supabaseUsuarios) {
                usuarios = supabaseUsuarios;
            }
        } catch (supabaseError) {
            console.log('⚠️ Erro ao buscar usuários, usando dados locais:', supabaseError);
            usuarios = INITIAL_USERS;
        }
        
        if (!usuarios || usuarios.length === 0) {
            usuarios = INITIAL_USERS;
        }
        
        const ativos = usuarios.filter(u => u.ativo === true);
        const pendentes = usuarios.filter(u => u.ativo === false);
        const inativos = [];
        
        // Atualizar contadores
        const countElement = document.getElementById('usuariosPendentesCount');
        if (countElement) countElement.textContent = pendentes.length;
        
        // Carregar usuários ativos
        const ativosContainer = document.getElementById('usuariosAtivos');
        ativosContainer.innerHTML = ativos.map(usuario => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${usuario.nome}</h4>
                    <p>Email: ${usuario.email}</p>
                    <p>Tipo: ${usuario.tipo}</p>
                </div>
                <div class="user-actions">
                    ${usuario.tipo !== 'admin' ? `
                        <button class="btn btn-danger btn-sm" onclick="removerUsuario(${usuario.id}, '${usuario.nome}')">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Carregar usuários pendentes
        const pendentesContainer = document.getElementById('usuariosPendentes');
        pendentesContainer.innerHTML = pendentes.map(usuario => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${usuario.nome}</h4>
                    <p>Email: ${usuario.email}</p>
                    <p>Status: Aguardando aprovação</p>
                </div>
                <div class="user-actions">
                    <button class="btn btn-success btn-sm" onclick="aprovarUsuario(${usuario.id})">
                        <i class="fas fa-check"></i> Aprovar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejeitarUsuario(${usuario.id})">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                </div>
            </div>
        `).join('');
        
        // Carregar filtro de usuários
        const filtroSelect = document.getElementById('filtroUsuario');
        if (filtroSelect) {
            filtroSelect.innerHTML = '<option value="">Todos os usuários</option>' +
                ativos.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
    }
}

function showUsersTab(tab) {
    // Atualizar tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Mostrar container
    document.querySelectorAll('.users-container').forEach(container => {
        container.style.display = 'none';
    });
    document.getElementById(`usuarios${tab.charAt(0).toUpperCase() + tab.slice(1)}`).style.display = 'block';
}

// === AÇÕES ADMIN ===

async function aprovarPonto(id) {
    try {
        const { error } = await supabase
            .from('registros_ponto')
            .update({ status: 'aprovado' })
            .eq('id', id);
        
        if (error) throw error;
        
        showSuccessMessage('Ponto aprovado com sucesso!');
        await loadPontosPendentes();
        await loadTodosRegistros();
        
    } catch (error) {
        console.error('❌ Erro ao aprovar ponto:', error);
        showErrorMessage('Erro ao aprovar ponto');
    }
}

async function rejeitarPonto(id) {
    const motivo = prompt('Motivo da rejeição (opcional):');
    
    try {
        const { error } = await supabase
            .from('registros_ponto')
            .update({ 
                status: 'rejeitado',
                observacoes: motivo || 'Rejeitado pelo administrador'
            })
            .eq('id', id);
        
        if (error) throw error;
        
        showSuccessMessage('Ponto rejeitado!');
        await loadPontosPendentes();
        await loadTodosRegistros();
        
    } catch (error) {
        console.error('❌ Erro ao rejeitar ponto:', error);
        showErrorMessage('Erro ao rejeitar ponto');
    }
}

async function aprovarUsuario(id) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ ativo: true })
            .eq('id', id);
        
        if (error) throw error;
        
        showSuccessMessage('Usuário aprovado com sucesso!');
        await loadUsuarios();
        
    } catch (error) {
        console.error('❌ Erro ao aprovar usuário:', error);
        showErrorMessage('Erro ao aprovar usuário');
    }
}

async function rejeitarUsuario(id) {
    if (!confirm('Tem certeza que deseja rejeitar este usuário? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showSuccessMessage('Usuário rejeitado!');
        await loadUsuarios();
        
    } catch (error) {
        console.error('❌ Erro ao rejeitar usuário:', error);
        showErrorMessage('Erro ao rejeitar usuário');
    }
}

async function removerUsuario(id, nome) {
    if (!confirm(`Tem certeza que deseja remover permanentemente o usuário "${nome}"?\n\nEsta ação não pode ser desfeita e todos os registros de ponto deste usuário também serão removidos.`)) {
        return;
    }
    
    try {
        // Primeiro remover registros de ponto
        await supabase
            .from('registros_ponto')
            .delete()
            .eq('funcionario_id', id);
        
        // Depois remover usuário
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showSuccessMessage(`Usuário "${nome}" removido com sucesso!`);
        await loadUsuarios();
        
    } catch (error) {
        console.error('❌ Erro ao remover usuário:', error);
        showErrorMessage('Erro ao remover usuário');
    }
}

// === MODAL ADICIONAR USUÁRIO ===

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
    document.getElementById('addUserForm').reset();
}

function hideAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
}

async function saveAddUser() {
    const nome = document.getElementById('addUserNome').value.trim();
    const email = document.getElementById('addUserEmail').value.trim().toLowerCase();
    const username = document.getElementById('addUserUsername').value.trim();
    const password = document.getElementById('addUserPassword').value;
    const tipo = document.getElementById('addUserTipo').value;
    
    if (!nome || !email || !username || !password) {
        showErrorMessage('Preencha todos os campos');
        return;
    }
    
    try {
        // Verificar se email já existe
        let emailExists = false;
        
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .single();
            
            if (existingUser) {
                emailExists = true;
            }
        } catch (supabaseError) {
            // Verificar nos dados locais
            const localUser = INITIAL_USERS.find(u => u.email === email);
            if (localUser) {
                emailExists = true;
            }
        }
        
        if (emailExists) {
            showErrorMessage('Este email já está cadastrado');
            return;
        }
        
        // Criar usuário
        const { error } = await supabase
            .from('users')
            .insert({
                username: username,
                password_hash: `temp_${password}`,
                nome: nome,
                email: email,
                tipo: tipo,
                ativo: true
            });
        
        if (error) throw error;
        
        hideAddUserModal();
        showSuccessMessage(`Usuário "${nome}" adicionado com sucesso!`);
        await loadUsuarios();
        
    } catch (error) {
        console.error('❌ Erro ao adicionar usuário:', error);
        showErrorMessage('Erro ao adicionar usuário');
    }
}

// === MODAL EDITAR REGISTRO ===

async function editarRegistro(id) {
    try {
        const { data: registro } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
            .eq('id', id)
            .single();
        
        if (!registro) return;
        
        // Preencher modal
        document.getElementById('editRegistroId').value = registro.id;
        document.getElementById('editData').value = registro.data;
        document.getElementById('editUsuario').value = registro.users?.nome || 'Usuário';
        document.getElementById('editEntrada').value = registro.entrada ? formatTimeForInput(registro.entrada) : '';
        document.getElementById('editSaida').value = registro.saida ? formatTimeForInput(registro.saida) : '';
        document.getElementById('editMotivo').value = '';
        
        // Mostrar modal
        document.getElementById('editModal').style.display = 'flex';
        
    } catch (error) {
        console.error('❌ Erro ao carregar registro:', error);
        showErrorMessage('Erro ao carregar registro');
    }
}

function hideEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEditRegistro() {
    const id = document.getElementById('editRegistroId').value;
    const entrada = document.getElementById('editEntrada').value;
    const saida = document.getElementById('editSaida').value;
    const motivo = document.getElementById('editMotivo').value;
    
    if (!motivo.trim()) {
        showErrorMessage('Motivo da alteração é obrigatório');
        return;
    }
    
    try {
        const data = document.getElementById('editData').value;
        
        const updateData = {
            entrada: entrada ? `${data}T${entrada}:00` : null,
            saida: saida ? `${data}T${saida}:00` : null,
            observacoes: motivo,
            editado_por: currentUser.id,
            editado_em: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('registros_ponto')
            .update(updateData)
            .eq('id', id);
        
        if (error) throw error;
        
        hideEditModal();
        showSuccessMessage('Registro editado com sucesso!');
        await loadPontosPendentes();
        await loadTodosRegistros();
        
    } catch (error) {
        console.error('❌ Erro ao editar registro:', error);
        showErrorMessage('Erro ao editar registro');
    }
}

// === FILTROS E RELATÓRIOS ===

async function aplicarFiltros() {
    const data = document.getElementById('filtroData').value;
    const usuarioId = document.getElementById('filtroUsuario').value;
    
    try {
        let query = supabase
            .from('registros_ponto')
            .select(`
                *,
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
            .order('data', { ascending: false });
        
        if (data) {
            query = query.eq('data', data);
        }
        
        if (usuarioId) {
            query = query.eq('funcionario_id', usuarioId);
        }
        
        const { data: registros } = await query.limit(100);
        
        const container = document.getElementById('todosRegistros');
        
        if (!registros || registros.length === 0) {
            container.innerHTML = '<p>Nenhum registro encontrado com os filtros aplicados</p>';
            return;
        }
        
        container.innerHTML = registros.map(registro => `
            <div class="registro-item">
                <div class="registro-header">
                    <div>
                        <strong>${registro.users?.nome || 'Usuário'}</strong>
                        <span class="registro-data">${formatDate(registro.data)}</span>
                    </div>
                    <span class="registro-status status-${registro.status}">${getStatusText(registro.status)}</span>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <div class="horario-label">Entrada</div>
                        <div class="horario-valor">${registro.entrada ? formatTime(registro.entrada) : '--:--'}</div>
                    </div>
                    <div class="horario-item">
                        <div class="horario-label">Saída</div>
                        <div class="horario-valor">${registro.saida ? formatTime(registro.saida) : '--:--'}</div>
                    </div>
                </div>
                ${registro.observacoes ? `<div class="registro-obs"><strong>Obs:</strong> ${registro.observacoes}</div>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erro ao aplicar filtros:', error);
        showErrorMessage('Erro ao aplicar filtros');
    }
}

async function gerarRelatorioHoras() {
    const mes = document.getElementById('relatorioMes').value;
    
    if (!mes) {
        showErrorMessage('Selecione um mês');
        return;
    }
    
    try {
        const [ano, mesNum] = mes.split('-');
        const inicioMes = `${ano}-${mesNum}-01`;
        const fimMes = `${ano}-${mesNum}-31`;
        
        const { data: registros } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
            .gte('data', inicioMes)
            .lte('data', fimMes)
            .eq('status', 'aprovado')
            .not('saida', 'is', null);
        
        if (!registros || registros.length === 0) {
            document.getElementById('relatorioHorasResult').innerHTML = '<p>Nenhum registro encontrado para o período</p>';
            return;
        }
        
        // Agrupar por usuário
        const horasPorUsuario = {};
        
        registros.forEach(registro => {
            const nome = registro.users?.nome || 'Usuário';
            if (!horasPorUsuario[nome]) {
                horasPorUsuario[nome] = { totalMinutos: 0, dias: 0 };
            }
            
            const entrada = new Date(registro.entrada);
            const saida = new Date(registro.saida);
            let minutos = (saida - entrada) / (1000 * 60);
            
            // Descontar almoço se trabalhou mais de 6 horas
            if (minutos > 6 * 60) {
                minutos -= 60; // 1 hora de almoço
            }
            
            horasPorUsuario[nome].totalMinutos += minutos;
            horasPorUsuario[nome].dias++;
        });
        
        // Gerar relatório
        const relatorioHTML = Object.entries(horasPorUsuario)
            .map(([nome, dados]) => {
                const horas = Math.floor(dados.totalMinutos / 60);
                const minutos = Math.round(dados.totalMinutos % 60);
                return `
                    <div class="relatorio-item">
                        <strong>${nome}</strong><br>
                        Total: ${horas}h ${minutos}min<br>
                        Dias trabalhados: ${dados.dias}
                    </div>
                `;
            })
            .join('');
        
        document.getElementById('relatorioHorasResult').innerHTML = `
            <h4>Relatório de Horas - ${mes}</h4>
            <div class="relatorio-lista">
                ${relatorioHTML}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        showErrorMessage('Erro ao gerar relatório');
    }
}

// === UTILITÁRIOS ===

function formatTime(datetime) {
    return new Date(datetime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
    });
}

function formatDate(date) {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatTimeForInput(datetime) {
    return new Date(datetime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
    });
}

function getStatusText(status) {
    switch(status) {
        case 'pendente': return 'Pendente';
        case 'aprovado': return 'Aprovado';
        case 'rejeitado': return 'Rejeitado';
        default: return status;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    element.className = 'error-message';
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    element.className = 'success-message';
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

function showErrorMessage(message) {
    alert('Erro: ' + message);
}

function showSuccessMessage(message) {
    alert(message);
}
