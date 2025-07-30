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
            const section = e.target.dataset.section;
            showAdminSection(section);
        });
    });
    
    // Iniciar relógio
    startClock();
}

// === AUTENTICAÇÃO ===

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('Preencha todos os campos');
        return;
    }
    
    try {
        // Buscar usuário no Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('ativo', true)
            .single();
            
        if (error || !user) {
            showError('Usuário não encontrado ou inativo');
            return;
        }
        
        // Verificar senha
        if (PASSWORDS[username] !== password) {
            showError('Senha incorreta');
            return;
        }
        
        // Login bem-sucedido
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        showSuccess('Login realizado com sucesso!');
        
        // Redirecionar baseado no tipo
        if (user.tipo === 'admin') {
            showAdminDashboard();
        } else {
            showFuncionarioDashboard();
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Erro interno do sistema');
    }
}

// Registro
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const nome = document.getElementById('registerNome').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    
    if (!username || !password || !nome || !email) {
        showError('Preencha todos os campos');
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
        
        // Criar novo usuário
        const { data: newUser, error } = await supabase
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
        console.error('Erro no registro:', error);
        showError('Erro ao criar conta');
    }
}

// Logout
function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLoginScreen();
}

// === NAVEGAÇÃO ===

// Mostrar tela de login
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('funcionarioScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    clearMessages();
}

// Mostrar tela de registro
function showRegisterScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
    document.getElementById('funcionarioScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'none';
    clearMessages();
}

// Mostrar dashboard do funcionário
function showFuncionarioDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('funcionarioScreen').style.display = 'block';
    document.getElementById('adminScreen').style.display = 'none';
    
    document.getElementById('funcionarioNome').textContent = currentUser.nome;
    loadFuncionarioData();
}

// Mostrar dashboard do admin
function showAdminDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('funcionarioScreen').style.display = 'none';
    document.getElementById('adminScreen').style.display = 'block';
    
    document.getElementById('adminNome').textContent = currentUser.nome;
    showAdminSection('pontos');
}

// === FUNCIONÁRIO ===

// Carregar dados do funcionário
async function loadFuncionarioData() {
    await loadMeusRegistros();
    await checkUltimoPonto();
}

// Verificar último ponto
async function checkUltimoPonto() {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .order('entrada', { ascending: false })
            .limit(1);
            
        if (error) throw error;
        
        const ultimoRegistro = registros?.[0];
        const pontoBtn = document.getElementById('baterPontoBtn');
        
        if (!ultimoRegistro || ultimoRegistro.saida) {
            pontoBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Registrar Entrada';
            pontoBtn.className = 'btn btn-success btn-lg';
        } else {
            pontoBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Registrar Saída';
            pontoBtn.className = 'btn btn-danger btn-lg';
        }
        
    } catch (error) {
        console.error('Erro ao verificar último ponto:', error);
    }
}

// Mostrar modal de confirmação
function showConfirmModal() {
    const agora = new Date();
    const horaAtual = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: CONFIG.timezone
    });
    
    document.getElementById('confirmTime').textContent = horaAtual;
    document.getElementById('confirmModal').style.display = 'flex';
}

// Esconder modal de confirmação
function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Confirmar bater ponto
async function confirmBaterPonto() {
    hideConfirmModal();
    
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    
    try {
        // Verificar último registro do dia
        const { data: registros, error: consultaError } = await supabase
            .from('registros_ponto')
            .select('*')
            .eq('funcionario_id', currentUser.id)
            .eq('data', hoje)
            .order('entrada', { ascending: false })
            .limit(1);
            
        if (consultaError) throw consultaError;
        
        const ultimoRegistro = registros?.[0];
        const isEntrada = !ultimoRegistro || ultimoRegistro.saida;
        
        if (isEntrada) {
            // Registrar entrada
            const { error: insertError } = await supabase
                .from('registros_ponto')
                .insert({
                    funcionario_id: currentUser.id,
                    data: hoje,
                    entrada: agora.toISOString(),
                    status: 'pendente'
                });
                
            if (insertError) throw insertError;
            showSuccess('Entrada registrada com sucesso!');
            
        } else {
            // Registrar saída
            const { error: updateError } = await supabase
                .from('registros_ponto')
                .update({
                    saida: agora.toISOString(),
                    status: 'pendente'
                })
                .eq('id', ultimoRegistro.id);
                
            if (updateError) throw updateError;
            showSuccess('Saída registrada com sucesso!');
        }
        
        // Atualizar interface
        await loadFuncionarioData();
        
    } catch (error) {
        console.error('Erro ao bater ponto:', error);
        showError('Erro ao registrar ponto');
    }
}

// Carregar meus registros
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

// Exibir meus registros
function displayMeusRegistros(registros) {
    const container = document.getElementById('meusRegistros');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="info">Nenhum registro encontrado</p>';
        return;
    }
    
    const html = registros.map(registro => `
        <div class="registro-item ${registro.status}">
            <div class="registro-data">
                <strong>${formatarData(registro.data)}</strong>
            </div>
            <div class="registro-horarios">
                <span class="entrada">
                    <i class="fas fa-sign-in-alt"></i>
                    Entrada: ${registro.entrada ? formatarHora(registro.entrada) : '--:--'}
                </span>
                <span class="saida">
                    <i class="fas fa-sign-out-alt"></i>
                    Saída: ${registro.saida ? formatarHora(registro.saida) : '--:--'}
                </span>
            </div>
            <div class="registro-status">
                <span class="status-badge ${registro.status}">
                    ${registro.status === 'aprovado' ? 'Aprovado' : 
                      registro.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                </span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// === ADMINISTRADOR ===

// Mostrar seção administrativa
async function showAdminSection(section) {
    // Remover classe ativa de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe ativa no botão selecionado
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Ocultar todas as seções
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Mostrar seção selecionada
    document.getElementById(section).style.display = 'block';
    
    // Carregar dados da seção
    switch(section) {
        case 'pontos':
            await loadPontosPendentes();
            break;
        case 'registros':
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
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
            .eq('status', 'pendente')
            .order('data', { ascending: false });
            
        if (error) throw error;
        
        displayPontosPendentes(registros || []);
        
        // Atualizar contador
        document.getElementById('pontosCount').textContent = (registros || []).length;
        
    } catch (error) {
        console.error('Erro ao carregar pontos pendentes:', error);
        document.getElementById('pontosPendentes').innerHTML = '<p class="error">Erro ao carregar pontos pendentes</p>';
    }
}

// Exibir pontos pendentes
function displayPontosPendentes(registros) {
    const container = document.getElementById('pontosPendentes');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="info">Nenhum ponto pendente</p>';
        return;
    }
    
    const html = registros.map(registro => `
        <div class="registro-item pendente">
            <div class="registro-funcionario">
                <strong>${registro.users?.nome || 'Funcionário'}</strong>
            </div>
            <div class="registro-data">
                ${formatarData(registro.data)}
            </div>
            <div class="registro-horarios">
                <span class="entrada">
                    <i class="fas fa-sign-in-alt"></i>
                    Entrada: ${registro.entrada ? formatarHora(registro.entrada) : '--:--'}
                </span>
                <span class="saida">
                    <i class="fas fa-sign-out-alt"></i>
                    Saída: ${registro.saida ? formatarHora(registro.saida) : '--:--'}
                </span>
            </div>
            <div class="registro-acoes">
                <button class="btn btn-success btn-sm" onclick="aprovarPonto(${registro.id})">
                    <i class="fas fa-check"></i> Aprovar
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejeitarPonto(${registro.id})">
                    <i class="fas fa-times"></i> Rejeitar
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Aprovar ponto
async function aprovarPonto(id) {
    try {
        const { error } = await supabase
            .from('registros_ponto')
            .update({ status: 'aprovado' })
            .eq('id', id);
            
        if (error) throw error;
        
        showSuccess('Ponto aprovado com sucesso!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao aprovar ponto:', error);
        showError('Erro ao aprovar ponto');
    }
}

// Rejeitar ponto
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
        
        showSuccess('Ponto rejeitado!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao rejeitar ponto:', error);
        showError('Erro ao rejeitar ponto');
    }
}

// Carregar todos os registros
async function loadTodosRegistros() {
    try {
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
            .order('data', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        
        displayTodosRegistros(registros || []);
        
    } catch (error) {
        console.error('Erro ao carregar todos os registros:', error);
        document.getElementById('todosRegistros').innerHTML = '<p class="error">Erro ao carregar registros</p>';
    }
}

// Exibir todos os registros
function displayTodosRegistros(registros) {
    const container = document.getElementById('todosRegistros');
    
    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="info">Nenhum registro encontrado</p>';
        return;
    }
    
    const html = registros.map(registro => `
        <div class="registro-item ${registro.status}">
            <div class="registro-funcionario">
                <strong>${registro.users?.nome || 'Funcionário'}</strong>
            </div>
            <div class="registro-data">
                ${formatarData(registro.data)}
            </div>
            <div class="registro-horarios">
                <span class="entrada">
                    <i class="fas fa-sign-in-alt"></i>
                    Entrada: ${registro.entrada ? formatarHora(registro.entrada) : '--:--'}
                </span>
                <span class="saida">
                    <i class="fas fa-sign-out-alt"></i>
                    Saída: ${registro.saida ? formatarHora(registro.saida) : '--:--'}
                </span>
            </div>
            <div class="registro-status">
                <span class="status-badge ${registro.status}">
                    ${registro.status === 'aprovado' ? 'Aprovado' : 
                      registro.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                </span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Carregar usuários (CORRIGIDO - só mostra usuários ativos)
async function loadUsuarios() {
    try {
        const { data: usuarios, error } = await supabase
            .from('users')
            .select('*')
            .eq('ativo', true) // SÓ USUÁRIOS ATIVOS
            .order('nome');
            
        if (error) throw error;
        
        displayUsuarios(usuarios || []);
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        document.getElementById('listaUsuarios').innerHTML = '<p class="error">Erro ao carregar usuários</p>';
    }
}

// Exibir usuários
function displayUsuarios(usuarios) {
    const container = document.getElementById('listaUsuarios');
    
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<p class="info">Nenhum usuário ativo encontrado</p>';
        return;
    }
    
    const html = usuarios.map(usuario => `
        <div class="usuario-item">
            <div class="usuario-info">
                <div class="usuario-nome">
                    <strong>${usuario.nome}</strong>
                    <span class="usuario-tipo">${usuario.tipo}</span>
                </div>
                <div class="usuario-detalhes">
                    <span>Usuário: ${usuario.username}</span>
                    <span>Email: ${usuario.email}</span>
                </div>
            </div>
            <div class="usuario-acoes">
                ${usuario.tipo !== 'admin' ? `
                    <button class="btn btn-danger btn-sm" onclick="removerUsuario(${usuario.id}, '${usuario.nome}')">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Remover usuário (CORRIGIDO - remove completamente)
async function removerUsuario(usuarioId, nomeUsuario) {
    if (!confirm(`Tem certeza que deseja REMOVER PERMANENTEMENTE o usuário "${nomeUsuario}"?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        // Primeiro, deletar todos os registros de ponto do usuário
        const { error: deleteRegistrosError } = await supabase
            .from('registros_ponto')
            .delete()
            .eq('funcionario_id', usuarioId);
            
        if (deleteRegistrosError) {
            console.error('Erro ao deletar registros:', deleteRegistrosError);
            // Continua mesmo se der erro nos registros
        }
        
        // Depois, deletar o usuário
        const { error: deleteUserError } = await supabase
            .from('users')
            .delete()
            .eq('id', usuarioId);
            
        if (deleteUserError) throw deleteUserError;
        
        showSuccess(`Usuário "${nomeUsuario}" removido permanentemente!`);
        await loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao remover usuário:', error);
        showError('Erro ao remover usuário');
    }
}

// === UTILITÁRIOS ===

// Iniciar relógio
function startClock() {
    updateClock();
    timeInterval = setInterval(updateClock, 1000);
}

// Atualizar relógio
function updateClock() {
    const agora = new Date();
    const horaAtual = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: CONFIG.timezone
    });
    
    const clockElements = document.querySelectorAll('.current-time');
    clockElements.forEach(el => {
        if (el) el.textContent = horaAtual;
    });
}

// Formatar data
function formatarData(data) {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
}

// Formatar hora
function formatarHora(datetime) {
    return new Date(datetime).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: CONFIG.timezone
    });
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    clearMessages();
    const alert = document.createElement('div');
    alert.className = 'alert success';
    alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const container = document.querySelector('.screen:not([style*="display: none"]) .container') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 5000);
}

// Mostrar mensagem de erro
function showError(message) {
    clearMessages();
    const alert = document.createElement('div');
    alert.className = 'alert error';
    alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const container = document.querySelector('.screen:not([style*="display: none"]) .container') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 5000);
}

// Limpar mensagens
function clearMessages() {
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
}
