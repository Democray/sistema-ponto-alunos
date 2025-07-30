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
    clearInterval(timeInterval);
}

// Mostrar tela de registro
function showRegisterScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
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
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Buscar usuário no banco
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('ativo', true)
            .single();
        
        if (error || !user) {
            showError('loginError', 'Usuário não encontrado ou inativo');
            return;
        }
        
        // Verificar senha
        if (PASSWORDS[username] !== password) {
            showError('loginError', 'Senha incorreta');
            return;
        }
        
        // Login bem-sucedido
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        showMainSystem();
        
    } catch (error) {
        console.error('Erro no login:', error);
        showError('loginError', 'Erro interno do sistema');
    }
}

// Registro
async function handleRegister(e) {
    e.preventDefault();
    
    const nome = document.getElementById('regNome').value;
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        // Verificar se usuário já existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            showError('registerError', 'Nome de usuário já existe');
            return;
        }
        
        // Criar novo usuário (inativo, aguardando aprovação)
        const { error } = await supabase
            .from('users')
            .insert({
                username: username,
                password_hash: `temp_${password}`, // Placeholder
                nome: nome,
                email: email,
                tipo: 'funcionario',
                ativo: false
            });
        
        if (error) throw error;
        
        // Adicionar senha ao objeto local
        PASSWORDS[username] = password;
        
        showSuccess('registerError', 'Conta criada! Aguarde aprovação do administrador.');
        
        // Limpar formulário
        document.getElementById('registerForm').reset();
        
        // Voltar para login após 2 segundos
        setTimeout(() => {
            showLoginScreen();
        }, 2000);
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showError('registerError', 'Erro ao criar conta');
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
        
        const { data: registros } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .order('entrada', { ascending: false });
        
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
        console.error('Erro ao carregar status do ponto:', error);
        document.getElementById('pontoStatus').innerHTML = '<p>Erro ao carregar status</p>';
    }
}

async function loadMeusRegistros() {
    try {
        const { data: registros } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
            .eq('funcionario_id', currentUser.id)
            .order('data', { ascending: false })
            .limit(10);
        
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
        console.error('Erro ao carregar registros:', error);
        document.getElementById('meusRegistros').innerHTML = '<p>Erro ao carregar registros</p>';
    }
}

// === BATER PONTO ===

function showConfirmModal() {
    document.getElementById('confirmModal').style.display = 'flex';
    
    // Atualizar mensagem baseada no status atual
    loadPontoStatus().then(() => {
        const hoje = new Date().toISOString().split('T')[0];
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
        const { data: registros } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .order('entrada', { ascending: false })
            .limit(1);
        
        const ultimoRegistro = registros?.[0];
        const isEntrada = !ultimoRegistro || ultimoRegistro.saida;
        
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
        
        hideConfirmModal();
        await loadPontoStatus();
        await loadMeusRegistros();
        
        showSuccessMessage(`✅ ${isEntrada ? 'Entrada' : 'Saída'} registrada com sucesso!`);
        
    } catch (error) {
        console.error('Erro ao bater ponto:', error);
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
            // Rela
(Content truncated due to size limit. Use line ranges to read in chunks)
