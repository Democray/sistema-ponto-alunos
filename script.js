// Configuração do Supabase
const SUPABASE_URL = 'https://rmnfrcddzzonddfbeddv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbmZyY2RkenppbmRkZmJlZGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNTI4NjAsImV4cCI6MjAzNzkyODg2MH0.FOQc3ZD9uBbkuksluCCYzeLUdCnpdaky2HqFxXNnaFa';

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
    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('baterPontoBtn').addEventListener('click', showConfirmModal);
    document.getElementById('confirmBtn').addEventListener('click', confirmBaterPonto);
    document.getElementById('cancelBtn').addEventListener('click', hideConfirmModal);
    
    // Admin nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            showAdminSection(section);
        });
    });
    
    // Verificar sessão salva
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainSystem();
    } else {
        showLoginScreen();
    }
}

// Mostrar tela de login
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('username').focus();
}

// Mostrar sistema principal
function showMainSystem() {
    document.getElementById('loginScreen').style.display = 'none';
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
}

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
                    status: 'pendente'
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
            .select('*')
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
    
    const html = registros.map(registro => `
        <div class="registro-card">
            <div class="registro-header">
                <span class="registro-data">${formatDate(registro.data)}</span>
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
    `).join('');
    
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
                )
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
    
    const html = registros.map(registro => `
        <div class="registro-card">
            <div class="registro-header">
                <span class="registro-data">${registro.users.nome} - ${formatDate(registro.data)}</span>
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
    `).join('');
    
    container.innerHTML = html;
}

// Carregar todos os registros
async function loadTodosRegistros() {
    try {
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users:funcionario_id (
                    nome,
                    username
                )
            `)
            .order('data', { ascending: false })
            .limit(20);
            
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
    
    const html = registros.map(registro => `
        <div class="registro-card">
            <div class="registro-header">
                <span class="registro-data">${registro.users.nome} - ${formatDate(registro.data)}</span>
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
    `).join('');
    
    container.innerHTML = html;
}

// Aprovar ponto
async function aprovarPonto(registroId) {
    if (!confirm('Tem certeza que deseja aprovar este ponto?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('registros_ponto')
            .update({ status: 'aprovado' })
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
        const updateData = { status: 'rejeitado' };
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

