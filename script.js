// Sistema de Controle de Ponto - Versão Supabase
// Variáveis globais
let currentUser = null;
let timeInterval = null;

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando Sistema de Ponto - Versão Supabase');
    
    // Verificar configuração do Supabase
    if (!verificarConfiguracao()) {
        return;
    }
    
    // Simular loading por 2 segundos
    setTimeout(async () => {
        await initializeSystem();
    }, 2000);
});

// Inicializar sistema
async function initializeSystem() {
    try {
        // Verificar se há sessão ativa
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showMainSystem();
        } else {
            showLoginScreen();
        }
        
        // Ocultar tela de loading
        document.getElementById('loadingScreen').style.display = 'none';
        
    } catch (error) {
        console.error('Erro ao inicializar sistema:', error);
        showError(document.body, 'Erro ao inicializar sistema');
        document.getElementById('loadingScreen').style.display = 'none';
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
    updateCurrentTime();
    timeInterval = setInterval(updateCurrentTime, 1000);
}

// Atualizar horário atual
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', CONFIG.formatoHora);
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        currentTimeElement.textContent = timeString;
    }
}

// === AUTENTICAÇÃO ===

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError(document.querySelector('.login-form'), 'Preencha todos os campos');
        return;
    }
    
    const submitBtn = document.querySelector('.login-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    submitBtn.disabled = true;
    
    try {
        // Buscar usuário por username
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('ativo', true)
            .single();
            
        if (userError || !users) {
            showError(document.querySelector('.login-form'), 'Usuário não encontrado ou inativo');
            return;
        }
        
        // Verificar senha (implementação simplificada - em produção use hash)
        const isValidPassword = await verifyPassword(password, users.password_hash);
        
        if (!isValidPassword) {
            showError(document.querySelector('.login-form'), 'Senha incorreta');
            return;
        }
        
        // Salvar usuário na sessão
        currentUser = users;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Mostrar sistema principal
        showMainSystem();
        
        showSuccess('Login realizado com sucesso!');
        
    } catch (error) {
        console.error('Erro no login:', error);
        showError(document.querySelector('.login-form'), 'Erro de conexão com o servidor');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Verificar senha (implementação simplificada)
async function verifyPassword(password, hash) {
    // Para demonstração, usando senhas simples
    // Em produção, use bcrypt ou similar
    const senhasDemo = {
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVrqUm/pW': '123456', // admin
        '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi': '123'    // funcionários
    };
    
    return senhasDemo[hash] === password;
}

// Logout
async function handleLogout() {
    try {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        
        if (timeInterval) {
            clearInterval(timeInterval);
            timeInterval = null;
        }
        
        showLoginScreen();
        showSuccess('Logout realizado com sucesso!');
        
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// === REGISTRO DE PONTO ===

// Bater ponto - mostrar modal de confirmação
async function handleBaterPonto() {
    try {
        const hoje = new Date().toLocaleDateString('en-CA', {
            timeZone: CONFIG.timezone
        });
        
        // Verificar registro existente
        const { data: registroExistente } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .single();
            
        let tipoPonto = 'entrada';
        if (registroExistente && registroExistente.entrada && !registroExistente.saida) {
            tipoPonto = 'saída';
        }
        
        showConfirmPontoModal(tipoPonto);
        
    } catch (error) {
        console.error('Erro ao verificar ponto:', error);
        showConfirmPontoModal('entrada');
    }
}

// Mostrar modal de confirmação
function showConfirmPontoModal(tipoPonto) {
    const modal = document.getElementById('confirmPontoModal');
    const message = document.getElementById('confirmPontoMessage');
    
    if (tipoPonto === 'entrada') {
        message.textContent = 'Tem certeza que deseja registrar sua ENTRADA?';
    } else {
        message.textContent = 'Tem certeza que deseja registrar sua SAÍDA?';
    }
    
    updateConfirmTime();
    modal.style.display = 'flex';
    
    window.confirmTimeInterval = setInterval(updateConfirmTime, 1000);
}

// Atualizar horário no modal de confirmação
function updateConfirmTime() {
    const timeConfirm = document.getElementById('currentTimeConfirm');
    if (timeConfirm) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', CONFIG.formatoHora);
        timeConfirm.textContent = timeString;
    }
}

// Fechar modal de confirmação
function closeConfirmPontoModal() {
    const modal = document.getElementById('confirmPontoModal');
    modal.style.display = 'none';
    
    if (window.confirmTimeInterval) {
        clearInterval(window.confirmTimeInterval);
    }
}

// Confirmar e executar bater ponto
async function confirmBaterPonto() {
    closeConfirmPontoModal();
    
    const btn = document.getElementById('baterPontoBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    btn.disabled = true;
    
    try {
        const hoje = new Date().toLocaleDateString('en-CA', {
            timeZone: CONFIG.timezone
        });
        const agora = new Date().toISOString();
        
        // Verificar se já existe registro hoje
        const { data: registroExistente } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .single();
            
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
            showError(document.getElementById('pontoStatus'), 'Ponto já completo para hoje');
        }
        
        loadFuncionarioData();
        
    } catch (error) {
        console.error('Erro ao bater ponto:', error);
        showError(document.getElementById('pontoStatus'), 'Erro ao registrar ponto');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// === DADOS DO FUNCIONÁRIO ===

// Carregar dados do funcionário
async function loadFuncionarioData() {
    try {
        await Promise.all([
            loadMeusRegistros(),
            updatePontoStatus()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados do funcionário:', error);
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
            .limit(10);
            
        if (error) throw error;
        
        displayMeusRegistros(registros || []);
        
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
        document.getElementById('meusRegistros').innerHTML = '<p class="error">Erro ao carregar registros</p>';
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
            ${registro.observacoes ? `<div class="registro-obs"><i class="fas fa-comment"></i> ${registro.observacoes}</div>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Atualizar status do ponto
async function updatePontoStatus() {
    try {
        const hoje = new Date().toLocaleDateString('en-CA', {
            timeZone: CONFIG.timezone
        });
        
        const { data: registroHoje } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .single();
            
        const statusElement = document.getElementById('pontoStatus');
        
        if (!registroHoje) {
            statusElement.innerHTML = '<p>Você ainda não bateu ponto hoje. Clique no botão para registrar sua entrada.</p>';
        } else if (registroHoje.entrada && !registroHoje.saida) {
            statusElement.innerHTML = `<p>Entrada registrada às ${formatTime(registroHoje.entrada)}. Clique no botão para registrar sua saída.</p>`;
        } else if (registroHoje.entrada && registroHoje.saida) {
            const status = registroHoje.status === 'pendente' ? 'aguardando aprovação' : registroHoje.status;
            statusElement.innerHTML = `<p>Ponto completo para hoje (${status}). Entrada: ${formatTime(registroHoje.entrada)}, Saída: ${formatTime(registroHoje.saida)}</p>`;
        }
        
    } catch (error) {
        console.error('Erro ao atualizar status do ponto:', error);
    }
}

// === FUNÇÕES ADMINISTRATIVAS ===

// Mostrar seção administrativa
async function showAdminSection(section) {
    // Atualizar navegação
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.add('active');
    
    // Mostrar seção
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}`).style.display = 'block';
    
    // Carregar dados da seção
    switch(section) {
        case 'pendentes':
            await loadPontosPendentes();
            break;
        case 'todos':
            await loadTodosRegistros();
            break;
        case 'usuarios':
            await loadUsuarios();
            break;
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
        document.getElementById('pontosPendentes').innerHTML = '<p class="error">Erro ao carregar pontos pendentes</p>';
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
        <div class="registro-admin-card">
            <div class="registro-admin-header">
                <h4>${registro.users.nome} - ${formatDate(registro.data)}</h4>
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
                <button class="btn btn-warning btn-sm" onclick="editarRegistro(${registro.id})">
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
    `).join('');
    
    container.innerHTML = html;
}

// Aprovar ponto
async function aprovarPonto(registroId) {
    if (!confirm('Tem certeza que deseja aprovar este ponto?')) {
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('registros_ponto')
            .update({ status: 'aprovado' })
            .eq('id', registroId)
            .select()
            .single();
            
        if (error) throw error;
        
        showSuccess('Ponto aprovado com sucesso!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao aprovar ponto:', error);
        showError(document.body, 'Erro ao aprovar ponto');
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
        
        const { data, error } = await supabase
            .from('registros_ponto')
            .update(updateData)
            .eq('id', registroId)
            .select()
            .single();
            
        if (error) throw error;
        
        showSuccess('Ponto rejeitado com sucesso!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao rejeitar ponto:', error);
        showError(document.body, 'Erro ao rejeitar ponto');
    }
}

// === UTILITÁRIOS ===

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
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        timeZone: CONFIG.timezone
    });
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
    // Implementação simples - pode ser melhorada com toast/notification
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Mostrar mensagem de erro
function showError(container, message) {
    // Implementação simples - pode ser melhorada
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    alert.style.cssText = `
        background: #dc3545;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        margin: 10px 0;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Remover alertas anteriores
    container.querySelectorAll('.alert').forEach(el => el.remove());
    
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Placeholder para funcionalidades não implementadas nesta versão
async function loadTodosRegistros() {
    document.getElementById('todosRegistros').innerHTML = '<p class="info">Funcionalidade em desenvolvimento...</p>';
}

async function loadUsuarios() {
    document.getElementById('listaUsuarios').innerHTML = '<p class="info">Funcionalidade em desenvolvimento...</p>';
}

function editarRegistro(id) {
    alert('Funcionalidade de edição em desenvolvimento...');
}

function showAddUserModal() {
    alert('Funcionalidade de adicionar usuário em desenvolvimento...');
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
}

function filtrarRegistros() {
    console.log('Filtro aplicado - funcionalidade em desenvolvimento');
}

