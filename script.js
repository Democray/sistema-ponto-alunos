// Configuração do Supabase
const SUPABASE_URL = 'https://rnnfrcddzzonddfbeddv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubmZyY2RkenpvbmRkZmJlZGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTU0ODUsImV4cCI6MjA2OTQ3MTQ4NX0.FOQcJ2D9uBbkuKs1utCYzeLUdCnpdaky2NqFxONnaF4';

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

// Senhas simples para demonstração
const PASSWORDS = {
    'admin': '123456',
    'joao': '123',
    'maria': '123',
    'pedro': '123'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema iniciado');
    initializeApp();
});

// Inicializar aplicação
function initializeApp() {
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
    document.getElementById('username').focus();
}

// Mostrar tela de cadastro
function showRegisterScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('regNome').focus();
}

// Mostrar sistema principal
function showMainSystem() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // Configurar interface baseada no tipo de usuário
    if (currentUser.tipo === 'admin') {
        showAdminPanel();
    } else {
        showFuncionarioPanel();
    }
    
    // Iniciar relógio
    startClock();
}

// Mostrar painel do funcionário
function showFuncionarioPanel() {
    document.getElementById('funcionarioPanel').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('systemTitle').textContent = 'Sistema de Ponto';
    document.getElementById('userGreeting').textContent = `Olá, ${currentUser.nome}`;
    
    loadFuncionarioData();
}

// Mostrar painel do administrador
function showAdminPanel() {
    document.getElementById('funcionarioPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('systemTitle').textContent = 'Painel Administrativo';
    document.getElementById('userGreeting').textContent = `Olá, Administrador`;
    
    showAdminSection('pendentes');
    loadUsuariosForFilter();
}

// === RELÓGIO ===

// Iniciar relógio
function startClock() {
    updateClock();
    timeInterval = setInterval(updateClock, 1000);
}

// Atualizar relógio
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        timeZone: CONFIG.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('pt-BR', {
        timeZone: CONFIG.timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// === AUTENTICAÇÃO ===

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    // Limpar erro anterior
    errorElement.style.display = 'none';
    
    if (!username || !password) {
        showError('Preencha todos os campos');
        return;
    }
    
    try {
        // Buscar usuário no Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('ativo', true)
            .single();
            
        if (error || !users) {
            showError('Usuário não encontrado ou inativo');
            return;
        }
        
        // Verificar senha (simplificada)
        if (PASSWORDS[username] !== password) {
            showError('Senha incorreta');
            return;
        }
        
        // Login bem-sucedido
        currentUser = users;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMainSystem();
        showSuccess('Login realizado com sucesso!');
        
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Erro de conexão. Tente novamente.');
    }
}

// Cadastro
async function handleRegister(e) {
    e.preventDefault();
    
    const nome = document.getElementById('regNome').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const errorElement = document.getElementById('registerError');
    
    // Limpar erro anterior
    errorElement.style.display = 'none';
    
    if (!nome || !email || !username || !password) {
        showRegisterError('Preencha todos os campos');
        return;
    }
    
    if (password.length < 3) {
        showRegisterError('Senha deve ter pelo menos 3 caracteres');
        return;
    }
    
    try {
        // Verificar se usuário já existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();
            
        if (existingUser) {
            showRegisterError('Nome de usuário já existe');
            return;
        }
        
        // Criar usuário (pendente de aprovação)
        const { data, error } = await supabase
            .from('users')
            .insert({
                username: username,
                password_hash: `temp_${password}`, // Temporário para demonstração
                nome: nome,
                email: email,
                tipo: 'funcionario',
                ativo: false // Pendente de aprovação
            })
            .select()
            .single();
            
        if (error) throw error;
        
        // Adicionar à lista de senhas temporárias
        PASSWORDS[username] = password;
        
        showSuccess('Conta criada! Aguarde aprovação do administrador.');
        showLoginScreen();
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showRegisterError('Erro ao criar conta. Tente novamente.');
    }
}

// Logout
function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
    
    showLoginScreen();
    showSuccess('Logout realizado com sucesso!');
}

// === REGISTRO DE PONTO ===

// Mostrar modal de confirmação
function showConfirmModal() {
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    const timeElement = document.getElementById('confirmTime');
    
    // Determinar tipo de ponto
    const hoje = new Date().toLocaleDateString('en-CA', {
        timeZone: CONFIG.timezone
    });
    
    // Verificar se já tem entrada hoje
    checkExistingRecord(hoje).then(registro => {
        if (!registro || !registro.entrada) {
            message.textContent = 'Tem certeza que deseja registrar sua ENTRADA?';
        } else if (!registro.saida) {
            message.textContent = 'Tem certeza que deseja registrar sua SAÍDA?';
        } else {
            message.textContent = 'Você já completou o ponto hoje!';
            return;
        }
        
        // Atualizar horário no modal
        updateConfirmTime();
        modal.style.display = 'flex';
        
        // Atualizar horário a cada segundo
        window.confirmInterval = setInterval(updateConfirmTime, 1000);
    });
}

// Ocultar modal de confirmação
function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'none';
    
    if (window.confirmInterval) {
        clearInterval(window.confirmInterval);
    }
}

// Atualizar horário no modal
function updateConfirmTime() {
    const timeElement = document.getElementById('confirmTime');
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        timeZone: CONFIG.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    timeElement.textContent = timeString;
}

// Confirmar bater ponto
async function confirmBaterPonto() {
    hideConfirmModal();
    
    const btn = document.getElementById('baterPontoBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;
    
    try {
        const hoje = new Date().toLocaleDateString('en-CA', {
            timeZone: CONFIG.timezone
        });
        const agora = new Date().toISOString();
        
        // Verificar registro existente
        const registroExistente = await checkExistingRecord(hoje);
        
        if (!registroExistente) {
            // Registrar entrada
            const { data, error } = await supabase
                .from('registros_ponto')
                .insert({
                    funcionario_id: currentUser.id,
                    data: hoje,
                    entrada: agora,
                    status: 'pendente',
                    registrado_por: currentUser.id,
                    ip_registro: 'web'
                })
                .select()
                .single();
                
            if (error) throw error;
            
            showSuccess('Entrada registrada com sucesso!');
            
        } else if (registroExistente.entrada && !registroExistente.saida) {
            // Registrar saída
            const horasTrabalhadas = calcularHoras(registroExistente.entrada, agora);
            
            const { data, error } = await supabase
                .from('registros_ponto')
                .update({
                    saida: agora,
                    horas_trabalhadas: horasTrabalhadas
                })
                .eq('id', registroExistente.id)
                .select()
                .single();
                
            if (error) throw error;
            
            showSuccess('Saída registrada com sucesso!');
        } else {
            showError('Ponto já completo para hoje');
        }
        
        // Recarregar dados
        if (currentUser.tipo === 'funcionario') {
            loadFuncionarioData();
        } else {
            loadPontosPendentes();
        }
        
    } catch (error) {
        console.error('Erro ao bater ponto:', error);
        showError('Erro ao registrar ponto');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// === DADOS DO FUNCIONÁRIO ===

// Carregar dados do funcionário
async function loadFuncionarioData() {
    await Promise.all([
        updatePontoStatus(),
        loadMeusRegistros()
    ]);
}

// Atualizar status do ponto
async function updatePontoStatus() {
    try {
        const hoje = new Date().toLocaleDateString('en-CA', {
            timeZone: CONFIG.timezone
        });
        
        const registro = await checkExistingRecord(hoje);
        const statusElement = document.getElementById('pontoStatus');
        
        if (!registro) {
            statusElement.innerHTML = '<p>Você ainda não bateu ponto hoje. Clique no botão para registrar sua entrada.</p>';
        } else if (registro.entrada && !registro.saida) {
            statusElement.innerHTML = `<p>Entrada registrada às ${formatTime(registro.entrada)}. Clique no botão para registrar sua saída.</p>`;
        } else if (registro.entrada && registro.saida) {
            const status = registro.status === 'pendente' ? 'aguardando aprovação' : registro.status;
            statusElement.innerHTML = `<p>Ponto completo para hoje (${status}). Entrada: ${formatTime(registro.entrada)}, Saída: ${formatTime(registro.saida)}</p>`;
        }
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
    }
}

// Carregar registros do funcionário
async function loadMeusRegistros() {
    try {
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select('*, editado_por:users!registros_ponto_editado_por_fkey(nome)')
            .eq('funcionario_id', currentUser.id)
            .order('data', { ascending: false })
            .limit(5);
            
        if (error) throw error;
        
        displayMeusRegistros(registros || []);
        
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
        document.getElementById('meusRegistros').innerHTML = '<p class="no-data">Erro ao carregar registros</p>';
    }
}

// Exibir registros do funcionário
function displayMeusRegistros(registros) {
    const container = document.getElementById('meusRegistros');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhum registro encontrado</p>';
        return;
    }
    
    const html = registros.map(registro => {
        const editadoInfo = registro.editado_em ? 
            `<div class="registro-info">
                <i class="fas fa-edit"></i> 
                Editado por ${registro.editado_por?.nome || 'Admin'} em ${formatDateTime(registro.editado_em)}
                ${registro.motivo_edicao ? `<br>Motivo: ${registro.motivo_edicao}` : ''}
            </div>` : '';
            
        return `
            <div class="registro-card ${registro.editado_em ? 'editado' : ''}">
                ${registro.editado_em ? '<div class="edit-indicator">Editado</div>' : ''}
                <div class="registro-header">
                    <div>
                        <span class="registro-data">${formatDate(registro.data)}</span>
                        ${editadoInfo}
                    </div>
                    <span class="status-badge status-${registro.status}">${registro.status.toUpperCase()}</span>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <span class="label">ENTRADA</span>
                        <span class="horario">${registro.entrada ? formatTime(registro.entrada) : '-'}</span>
                    </div>
                    <div class="horario-item">
                        <span class="label">SAÍDA</span>
                        <span class="horario">${registro.saida ? formatTime(registro.saida) : '-'}</span>
                    </div>
                    <div class="horario-item">
                        <span class="label">HORAS</span>
                        <span class="horario">${registro.horas_trabalhadas ? registro.horas_trabalhadas + 'h' : '-'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// === FUNÇÕES ADMINISTRATIVAS ===

// Mostrar seção administrativa
async function showAdminSection(section) {
    // Atualizar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Mostrar seção
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}`).style.display = 'block';
    
    // Carregar dados
    if (section === 'pendentes') {
        await loadPontosPendentes();
    } else if (section === 'todos') {
        await loadTodosRegistros();
    } else if (section === 'usuarios') {
        await loadUsuarios();
    } else if (section === 'relatorios') {
        setupRelatorios();
    }
}

// Carregar pontos pendentes
async function loadPontosPendentes() {
    try {
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users:funcionario_id (
                    nome,
                    username
                ),
                editado_por:users!registros_ponto_editado_por_fkey(nome)
            `)
            .eq('status', 'pendente')
            .order('data', { ascending: false });
            
        if (error) throw error;
        
        displayPontosPendentes(registros || []);
        
        // Atualizar contador
        document.getElementById('pendentesCount').textContent = (registros || []).length;
        
    } catch (error) {
        console.error('Erro ao carregar pontos pendentes:', error);
        document.getElementById('pontosPendentes').innerHTML = '<p class="no-data">Erro ao carregar pontos pendentes</p>';
    }
}

// Exibir pontos pendentes
function displayPontosPendentes(registros) {
    const container = document.getElementById('pontosPendentes');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhum ponto pendente de aprovação</p>';
        return;
    }
    
    const html = registros.map(registro => {
        const editadoInfo = registro.editado_em ? 
            `<div class="registro-info">
                <i class="fas fa-edit"></i> 
                Editado por ${registro.editado_por?.nome || 'Admin'} em ${formatDateTime(registro.editado_em)}
                ${registro.motivo_edicao ? `<br>Motivo: ${registro.motivo_edicao}` : ''}
            </div>` : '';
            
        return `
            <div class="registro-card ${registro.editado_em ? 'editado' : ''}">
                ${registro.editado_em ? '<div class="edit-indicator">Editado</div>' : ''}
                <div class="registro-header">
                    <div>
                        <span class="registro-data">${registro.users.nome} - ${formatDate(registro.data)}</span>
                        <div class="registro-info">
                            <i class="fas fa-user"></i> Registrado por: ${registro.users.nome}
                            <br><i class="fas fa-globe"></i> IP: ${registro.ip_registro || 'N/A'}
                        </div>
                        ${editadoInfo}
                    </div>
                    <span class="status-badge status-${registro.status}">${registro.status.toUpperCase()}</span>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <span class="label">ENTRADA</span>
                        <span class="horario">${registro.entrada ? formatTime(registro.entrada) : '-'}</span>
                    </div>
                    <div class="horario-item">
                        <span class="label">SAÍDA</span>
                        <span class="horario">${registro.saida ? formatTime(registro.saida) : '-'}</span>
                    </div>
                    <div class="horario-item">
                        <span class="label">HORAS</span>
                        <span class="horario">${registro.horas_trabalhadas ? registro.horas_trabalhadas + 'h' : '-'}</span>
                    </div>
                </div>
                <div class="registro-actions">
                    <button class="btn btn-info btn-sm" onclick="editarRegistro(${registro.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-success btn-sm" onclick="aprovarPonto(${registro.id})">
                        <i class="fas fa-check"></i>
                        Aprovar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejeitarPonto(${registro.id})">
                        <i class="fas fa-times"></i>
                        Rejeitar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Carregar todos os registros
async function loadTodosRegistros(filtros = {}) {
    try {
        let query = supabase
            .from('registros_ponto')
            .select(`
                *,
                users:funcionario_id (
                    nome,
                    username
                ),
                editado_por:users!registros_ponto_editado_por_fkey(nome)
            `);
            
        // Aplicar filtros
        if (filtros.data) {
            query = query.eq('data', filtros.data);
        }
        
        if (filtros.usuario) {
            query = query.eq('funcionario_id', filtros.usuario);
        }
        
        const { data: registros, error } = await query
            .order('data', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        
        displayTodosRegistros(registros || []);
        
    } catch (error) {
        console.error('Erro ao carregar todos os registros:', error);
        document.getElementById('todosRegistros').innerHTML = '<p class="no-data">Erro ao carregar registros</p>';
    }
}

// Exibir todos os registros
function displayTodosRegistros(registros) {
    const container = document.getElementById('todosRegistros');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhum registro encontrado</p>';
        return;
    }
    
    const html = registros.map(registro => {
        const editadoInfo = registro.editado_em ? 
            `<div class="registro-info">
                <i class="fas fa-edit"></i> 
                Editado por ${registro.editado_por?.nome || 'Admin'} em ${formatDateTime(registro.editado_em)}
                ${registro.motivo_edicao ? `<br>Motivo: ${registro.motivo_edicao}` : ''}
            </div>` : '';
            
        return `
            <div class="registro-card ${registro.editado_em ? 'editado' : ''}">
                ${registro.editado_em ? '<div class="edit-indicator">Editado</div>' : ''}
                <div class="registro-header">
                    <div>
                        <span class="registro-data">${registro.users.nome} - ${formatDate(registro.data)}</span>
                        <div class="registro-info">
                            <i class="fas fa-user"></i> Registrado por: ${registro.users.nome}
                            <br><i class="fas fa-globe"></i> IP: ${registro.ip_registro || 'N/A'}
                        </div>
                        ${editadoInfo}
                    </div>
                    <span class="status-badge status-${registro.status}">${registro.status.toUpperCase()}</span>
                </div>
                <div class="registro-horarios">
                    <div class="horario-item">
                        <span class="label">ENTRADA</span>
                        <span class="horario">${registro.entrada ? formatTime(registro.entrada) : '-'}</span>
                    </div>
                    <div class="horario-item">
                        <span class="label">SAÍDA</span>
                        <span class="horario">${registro.saida ? formatTime(registro.saida) : '-'}</span>
                    </div>
                    <div class="horario-item">
                        <span class="label">HORAS</span>
                        <span class="horario">${registro.horas_trabalhadas ? registro.horas_trabalhadas + 'h' : '-'}</span>
                    </div>
                </div>
                <div class="registro-actions">
                    <button class="btn btn-info btn-sm" onclick="editarRegistro(${registro.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// === EDIÇÃO DE REGISTROS ===

// Editar registro
async function editarRegistro(registroId) {
    try {
        const { data: registro, error } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users:funcionario_id (nome, username)
            `)
            .eq('id', registroId)
            .single();
            
        if (error) throw error;
        
        // Preencher modal
        document.getElementById('editRegistroId').value = registro.id;
        document.getElementById('editData').value = registro.data;
        document.getElementById('editUsuario').value = registro.users.nome;
        document.getElementById('editEntrada').value = registro.entrada ? formatTimeForInput(registro.entrada) : '';
        document.getElementById('editSaida').value = registro.saida ? formatTimeForInput(registro.saida) : '';
        document.getElementById('editMotivo').value = '';
        
        showEditModal();
        
    } catch (error) {
        console.error('Erro ao carregar registro:', error);
        showError('Erro ao carregar registro');
    }
}

// Mostrar modal de edição
function showEditModal() {
    document.getElementById('editModal').style.display = 'flex';
}

// Ocultar modal de edição
function hideEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Salvar edição de registro
async function saveEditRegistro() {
    const registroId = document.getElementById('editRegistroId').value;
    const data = document.getElementById('editData').value;
    const entradaTime = document.getElementById('editEntrada').value;
    const saidaTime = document.getElementById('editSaida').value;
    const motivo = document.getElementById('editMotivo').value.trim();
    
    if (!motivo) {
        showError('Motivo da alteração é obrigatório');
        return;
    }
    
    try {
        // Converter horários para timestamp
        const entrada = entradaTime ? new Date(`${data}T${entradaTime}:00`).toISOString() : null;
        const saida = saidaTime ? new Date(`${data}T${saidaTime}:00`).toISOString() : null;
        
        // Calcular horas trabalhadas
        const horasTrabalhadas = entrada && saida ? calcularHoras(entrada, saida) : null;
        
        // Atualizar registro
        const { error } = await supabase
            .from('registros_ponto')
            .update({
                entrada: entrada,
                saida: saida,
                horas_trabalhadas: horasTrabalhadas,
                editado_por: currentUser.id,
                editado_em: new Date().toISOString(),
                motivo_edicao: motivo
            })
            .eq('id', registroId);
            
        if (error) throw error;
        
        hideEditModal();
        showSuccess('Registro editado com sucesso!');
        
        // Recarregar dados
        const currentSection = document.querySelector('.nav-btn.active').dataset.section;
        if (currentSection === 'pendentes') {
            loadPontosPendentes();
        } else if (currentSection === 'todos') {
            loadTodosRegistros();
        }
        
    } catch (error) {
        console.error('Erro ao editar registro:', error);
        showError('Erro ao editar registro');
    }
}

// === APROVAÇÃO/REJEIÇÃO ===

// Aprovar ponto
async function aprovarPonto(registroId) {
    if (!confirm('Tem certeza que deseja aprovar este ponto?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('registros_ponto')
            .update({ 
                status: 'aprovado',
                aprovado_por: currentUser.id,
                aprovado_em: new Date().toISOString()
            })
            .eq('id', registroId);
            
        if (error) throw error;
        
        showSuccess('Ponto aprovado com sucesso!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao aprovar ponto:', error);
        showError('Erro ao aprovar ponto');
    }
}

// Rejeitar ponto
async function rejeitarPonto(registroId) {
    const motivo = prompt('Motivo da rejeição (opcional):');
    
    if (!confirm('Tem certeza que deseja rejeitar este ponto?')) {
        return;
    }
    
    try {
        const updateData = { 
            status: 'rejeitado',
            aprovado_por: currentUser.id,
            aprovado_em: new Date().toISOString()
        };
        
        if (motivo) {
            updateData.observacoes = motivo;
        }
        
        const { error } = await supabase
            .from('registros_ponto')
            .update(updateData)
            .eq('id', registroId);
            
        if (error) throw error;
        
        showSuccess('Ponto rejeitado com sucesso!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao rejeitar ponto:', error);
        showError('Erro ao rejeitar ponto');
    }
}

// === GERENCIAMENTO DE USUÁRIOS ===

// Carregar usuários
async function loadUsuarios() {
    await Promise.all([
        loadUsuariosAtivos(),
        loadUsuariosPendentes(),
        loadUsuariosInativos()
    ]);
}

// Carregar usuários ativos
async function loadUsuariosAtivos() {
    try {
        const { data: usuarios, error } = await supabase
            .from('users')
            .select('*')
            .eq('ativo', true)
            .order('nome');
            
        if (error) throw error;
        
        displayUsuarios(usuarios || [], 'usuariosAtivos');
        
    } catch (error) {
        console.error('Erro ao carregar usuários ativos:', error);
    }
}

// Carregar usuários pendentes
async function loadUsuariosPendentes() {
    try {
        const { data: usuarios, error } = await supabase
            .from('users')
            .select('*')
            .eq('ativo', false)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        displayUsuarios(usuarios || [], 'usuariosPendentes');
        
        // Atualizar contador
        document.getElementById('usuariosPendentesCount').textContent = (usuarios || []).length;
        
    } catch (error) {
        console.error('Erro ao carregar usuários pendentes:', error);
    }
}

// Carregar usuários inativos
async function loadUsuariosInativos() {
    try {
        const { data: usuarios, error } = await supabase
            .from('users')
            .select('*')
            .eq('ativo', false)
            .order('nome');
            
        if (error) throw error;
        
        displayUsuarios(usuarios || [], 'usuariosInativos');
        
    } catch (error) {
        console.error('Erro ao carregar usuários inativos:', error);
    }
}

// Exibir usuários
function displayUsuarios(usuarios, containerId) {
    const container = document.getElementById(containerId);
    
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhum usuário encontrado</p>';
        return;
    }
    
    const html = usuarios.map(usuario => {
        const statusClass = usuario.ativo ? 'ativo' : 'pendente';
        const actions = getUsuarioActions(usuario);
        
        return `
            <div class="user-card ${statusClass}">
                <div class="user-header">
                    <div>
                        <div class="user-name">
                            <span class="status-indicator ${statusClass}"></span>
                            ${usuario.nome}
                        </div>
                        <div class="user-info">
                            <i class="fas fa-user"></i> ${usuario.username} | 
                            <i class="fas fa-envelope"></i> ${usuario.email} | 
                            <i class="fas fa-shield-alt"></i> ${usuario.tipo}
                        </div>
                        <div class="user-info">
                            <i class="fas fa-calendar"></i> Criado em: ${formatDateTime(usuario.created_at)}
                        </div>
                    </div>
                </div>
                <div class="user-actions">
                    ${actions}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Obter ações do usuário
function getUsuarioActions(usuario) {
    if (usuario.username === 'admin') {
        return '<span class="text-muted">Usuário administrador</span>';
    }
    
    let actions = [];
    
    if (!usuario.ativo) {
        actions.push(`
            <button class="btn btn-success btn-sm" onclick="aprovarUsuario(${usuario.id})">
                <i class="fas fa-check"></i>
                Aprovar
            </button>
        `);
        actions.push(`
            <button class="btn btn-danger btn-sm" onclick="rejeitarUsuario(${usuario.id})">
                <i class="fas fa-times"></i>
                Rejeitar
            </button>
        `);
    } else {
        actions.push(`
            <button class="btn btn-warning btn-sm" onclick="desativarUsuario(${usuario.id})">
                <i class="fas fa-ban"></i>
                Desativar
            </button>
        `);
    }
    
    return actions.join('');
}

// Mostrar tab de usuários
function showUsersTab(tab) {
    // Atualizar tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Mostrar container
    document.querySelectorAll('.users-container').forEach(container => container.style.display = 'none');
    document.getElementById(`usuarios${tab.charAt(0).toUpperCase() + tab.slice(1)}`).style.display = 'block';
}

// Aprovar usuário
async function aprovarUsuario(usuarioId) {
    if (!confirm('Tem certeza que deseja aprovar este usuário?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                ativo: true,
                aprovado_por: currentUser.id,
                aprovado_em: new Date().toISOString()
            })
            .eq('id', usuarioId);
            
        if (error) throw error;
        
        showSuccess('Usuário aprovado com sucesso!');
        await loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao aprovar usuário:', error);
        showError('Erro ao aprovar usuário');
    }
}

// Rejeitar usuário
async function rejeitarUsuario(usuarioId) {
    if (!confirm('Tem certeza que deseja rejeitar este usuário? Ele será removido do sistema.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', usuarioId);
            
        if (error) throw error;
        
        showSuccess('Usuário rejeitado e removido do sistema!');
        await loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao rejeitar usuário:', error);
        showError('Erro ao rejeitar usuário');
    }
}

// Desativar usuário
async function desativarUsuario(usuarioId) {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ ativo: false })
            .eq('id', usuarioId);
            
        if (error) throw error;
        
        showSuccess('Usuário desativado com sucesso!');
        await loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        showError('Erro ao desativar usuário');
    }
}

// === ADICIONAR USUÁRIO ===

// Mostrar modal de adicionar usuário
function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
    document.getElementById('addUserNome').focus();
}

// Ocultar modal de adicionar usuário
function hideAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}

// Salvar novo usuário
async function saveAddUser() {
    const nome = document.getElementById('addUserNome').value.trim();
    const email = document.getElementById('addUserEmail').value.trim();
    const username = document.getElementById('addUserUsername').value.trim();
    const password = document.getElementById('addUserPassword').value;
    const tipo = document.getElementById('addUserTipo').value;
    
    if (!nome || !email || !username || !password) {
        showError('Preencha todos os campos');
        return;
    }
    
    if (password.length < 3) {
        showError('Senha deve ter pelo menos 3 caracteres');
        return;
    }
    
    try {
        // Verificar se usuário já existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();
            
        if (existingUser) {
            showError('Nome de usuário já existe');
            return;
        }
        
        // Criar usuário
        const { data, error } = await supabase
            .from('users')
            .insert({
                username: username,
                password_hash: `temp_${password}`,
                nome: nome,
                email: email,
                tipo: tipo,
                ativo: true,
                criado_por: currentUser.id
            })
            .select()
            .single();
            
        if (error) throw error;
        
        // Adicionar à lista de senhas
        PASSWORDS[username] = password;
        
        hideAddUserModal();
        showSuccess('Usuário criado com sucesso!');
        await loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showError('Erro ao criar usuário');
    }
}

// === FILTROS E RELATÓRIOS ===

// Carregar usuários para filtro
async function loadUsuariosForFilter() {
    try {
        const { data: usuarios, error } = await supabase
            .from('users')
            .select('id, nome')
            .eq('ativo', true)
            .eq('tipo', 'funcionario')
            .order('nome');
            
        if (error) throw error;
        
        const select = document.getElementById('filtroUsuario');
        select.innerHTML = '<option value="">Todos os usuários</option>';
        
        usuarios.forEach(usuario => {
            select.innerHTML += `<option value="${usuario.id}">${usuario.nome}</option>`;
        });
        
    } catch (error) {
        console.error('Erro ao carregar usuários para filtro:', error);
    }
}

// Aplicar filtros
function aplicarFiltros() {
    const data = document.getElementById('filtroData').value;
    const usuario = document.getElementById('filtroUsuario').value;
    
    const filtros = {};
    if (data) filtros.data = data;
    if (usuario) filtros.usuario = parseInt(usuario);
    
    loadTodosRegistros(filtros);
}

// Setup relatórios
function setupRelatorios() {
    // Definir mês atual como padrão
    const hoje = new Date();
    const mesAtual = hoje.toISOString().slice(0, 7);
    document.getElementById('relatorioMes').value = mesAtual;
}

// Gerar relatório de horas
async function gerarRelatorioHoras() {
    const mes = document.getElementById('relatorioMes').value;
    
    if (!mes) {
        showError('Selecione um mês');
        return;
    }
    
    try {
        const inicioMes = `${mes}-01`;
        const fimMes = new Date(mes + '-01');
        fimMes.setMonth(fimMes.getMonth() + 1);
        fimMes.setDate(0);
        const fimMesStr = fimMes.toISOString().slice(0, 10);
        
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users:funcionario_id (nome)
            `)
            .gte('data', inicioMes)
            .lte('data', fimMesStr)
            .eq('status', 'aprovado')
            .order('funcionario_id');
            
        if (error) throw error;
        
        displayRelatorioHoras(registros || [], mes);
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showError('Erro ao gerar relatório');
    }
}

// Exibir relatório de horas
function displayRelatorioHoras(registros, mes) {
    const container = document.getElementById('relatorioHorasResult');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="no-data">Nenhum registro encontrado para este período</p>';
        return;
    }
    
    // Agrupar por usuário
    const usuariosHoras = {};
    
    registros.forEach(registro => {
        const userId = registro.funcionario_id;
        const userName = registro.users.nome;
        
        if (!usuariosHoras[userId]) {
            usuariosHoras[userId] = {
                nome: userName,
                totalHoras: 0,
                diasTrabalhados: 0,
                registros: []
            };
        }
        
        if (registro.horas_trabalhadas) {
            usuariosHoras[userId].totalHoras += parseFloat(registro.horas_trabalhadas);
            usuariosHoras[userId].diasTrabalhados++;
        }
        
        usuariosHoras[userId].registros.push(registro);
    });
    
    // Gerar HTML do relatório
    let html = `
        <h4>Relatório de Horas - ${formatMonth(mes)}</h4>
        <table class="relatorio-table">
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Total de Horas</th>
                    <th>Dias Trabalhados</th>
                    <th>Média Diária</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.values(usuariosHoras).forEach(usuario => {
        const mediaDiaria = usuario.diasTrabalhados > 0 ? 
            (usuario.totalHoras / usuario.diasTrabalhados).toFixed(2) : '0.00';
            
        html += `
            <tr>
                <td>${usuario.nome}</td>
                <td>${usuario.totalHoras.toFixed(2)}h</td>
                <td>${usuario.diasTrabalhados}</td>
                <td>${mediaDiaria}h</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

// === UTILITÁRIOS ===

// Verificar registro existente
async function checkExistingRecord(data) {
    try {
        const { data: registro, error } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', data)
            .single();
            
        return error ? null : registro;
    } catch (error) {
        return null;
    }
}

// Calcular horas trabalhadas
function calcularHoras(entrada, saida) {
    if (!entrada || !saida) return 0;
    
    const entradaDate = new Date(entrada);
    const saidaDate = new Date(saida);
    
    const diffMs = saidaDate - entradaDate;
    let horas = diffMs / (1000 * 60 * 60);
    
    // Desconto de almoço se trabalhou mais de 6 horas
    if (horas > CONFIG.horasParaDesconto) {
        horas -= 1;
    }
    
    return Math.max(0, Math.round(horas * 100) / 100);
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Formatar hora
function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('pt-BR', {
        timeZone: CONFIG.timezone,
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatar data e hora
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
        timeZone: CONFIG.timezone
    });
}

// Formatar hora para input
function formatTimeForInput(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('pt-BR', {
        timeZone: CONFIG.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Formatar mês
function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long'
    });
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'success-message';
    alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Mostrar mensagem de erro
function showError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        const alert = document.createElement('div');
        alert.className = 'error-message';
        alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Mostrar erro de cadastro
function showRegisterError(message) {
    const errorElement = document.getElementById('registerError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

