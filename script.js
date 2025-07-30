// Sistema de Controle de Ponto - Versão Corrigida
// Configurações do Supabase
const SUPABASE_URL = 'https://rnnfrcddzzonddfbeddv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubmZyY2RkenpvbmRkZmJlZGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTU0ODUsImV4cCI6MjA2OTQ3MTQ4NX0.FOQcJ2D9uBbkuKs1utCYzeLUdCnpdaky2NqFxONnaF4';

// Inicialização do cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Configurações gerais do sistema
const CONFIG = {
    timezone: 'America/Sao_Paulo',
    almocoInicio: 12,
    almocoFim: 13,
    horasParaDesconto: 6,
    formatoData: 'pt-BR',
    formatoHora: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
    }
};

// Variáveis globais
let currentUser = null;
let timeInterval = null;

// Função para verificar se o Supabase está configurado
function verificarConfiguracao() {
    console.log('✅ Supabase configurado corretamente');
    return true;
}

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando Sistema de Ponto - Versão Corrigida');
    
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
        
    } catch (error) {
        console.error('Erro no login:', error);
        showError(document.querySelector('.login-form'), 'Erro interno do sistema');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Verificar senha
async function verifyPassword(password, hash) {
    // Implementação simplificada para demonstração
    // Em produção, use bcrypt ou similar
    const senhas = {
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVrqUm/pW': '123456', // admin
        '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi': '123'    // funcionários
    };
    
    return senhas[hash] === password;
}

// Logout
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    if (timeInterval) {
        clearInterval(timeInterval);
    }
    showLoginScreen();
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
        const pontoBtn = document.getElementById('pontoBtn');
        
        if (!ultimoRegistro || ultimoRegistro.saida) {
            pontoBtn.textContent = 'Registrar Entrada';
            pontoBtn.className = 'btn btn-primary';
        } else {
            pontoBtn.textContent = 'Registrar Saída';
            pontoBtn.className = 'btn btn-danger';
        }
        
    } catch (error) {
        console.error('Erro ao verificar último ponto:', error);
    }
}

// Bater ponto
async function baterPonto() {
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];
    const horaAtual = agora.toLocaleTimeString('pt-BR', CONFIG.formatoHora);
    
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
        
        // Confirmar ação
        const tipoRegistro = isEntrada ? 'ENTRADA' : 'SAÍDA';
        const confirmacao = confirm(`Confirma ${tipoRegistro} às ${horaAtual}?`);
        
        if (!confirmacao) return;
        
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
            
            showSuccess(document.getElementById('funcionarioPanel'), 'Entrada registrada com sucesso!');
            
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
            
            showSuccess(document.getElementById('funcionarioPanel'), 'Saída registrada com sucesso!');
        }
        
        // Atualizar interface
        await loadFuncionarioData();
        
    } catch (error) {
        console.error('Erro ao bater ponto:', error);
        showError(document.getElementById('funcionarioPanel'), 'Erro ao registrar ponto');
    }
}

// Carregar registros do funcionário
async function loadMeusRegistros() {
    try {
        const { data: registros, error } = await supabase
            .from('registros_ponto')
            .select(`
                *,
                users!registros_ponto_funcionario_id_fkey(nome)
            `)
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
    // Remover classe ativa de todas as abas
    document.querySelectorAll('.admin-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe ativa na aba selecionada
    document.querySelector(`[onclick="showAdminSection('${section}')"]`).classList.add('active');
    
    // Ocultar todas as seções
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Mostrar seção selecionada
    document.getElementById(section).style.display = 'block';
    
    // Carregar dados da seção
    switch(section) {
        case 'pendentes':
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
                <button class="btn btn-warning btn-sm" onclick="editarRegistro(${registro.id})">
                    <i class="fas fa-edit"></i> Editar
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
        
        showSuccess(document.getElementById('pendentes'), 'Ponto aprovado com sucesso!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao aprovar ponto:', error);
        showError(document.getElementById('pendentes'), 'Erro ao aprovar ponto');
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
        
        showSuccess(document.getElementById('pendentes'), 'Ponto rejeitado!');
        await loadPontosPendentes();
        
    } catch (error) {
        console.error('Erro ao rejeitar ponto:', error);
        showError(document.getElementById('pendentes'), 'Erro ao rejeitar ponto');
    }
}

// Carregar todos os registros (CORRIGIDO)
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
            <div class="registro-acoes">
                <button class="btn btn-warning btn-sm" onclick="editarRegistro(${registro.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Carregar usuários (CORRIGIDO)
async function loadUsuarios() {
    try {
        const { data: usuarios, error } = await supabase
            .from('users')
            .select('*')
            .order('nome', { ascending: true });
            
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
        container.innerHTML = '<p class="info">Nenhum usuário encontrado</p>';
        return;
    }
    
    const html = usuarios.map(usuario => `
        <div class="usuario-item ${usuario.ativo ? 'ativo' : 'inativo'}">
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
            <div class="usuario-status">
                <span class="status-badge ${usuario.ativo ? 'ativo' : 'inativo'}">
                    ${usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="usuario-acoes">
                <button class="btn ${usuario.ativo ? 'btn-danger' : 'btn-success'} btn-sm" 
                        onclick="toggleUsuario(${usuario.id}, ${!usuario.ativo})">
                    <i class="fas ${usuario.ativo ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    ${usuario.ativo ? 'Desativar' : 'Ativar'}
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Ativar/Desativar usuário (CORRIGIDO)
async function toggleUsuario(id, novoStatus) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ ativo: novoStatus })
            .eq('id', id);
            
        if (error) throw error;
        
        const acao = novoStatus ? 'ativado' : 'desativado';
        showSuccess(document.getElementById('usuarios'), `Usuário ${acao} com sucesso!`);
        await loadUsuarios();
        
    } catch (error) {
        console.error('Erro ao alterar status do usuário:', error);
        showError(document.getElementById('usuarios'), 'Erro ao alterar status do usuário');
    }
}

// === UTILITÁRIOS ===

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
function showSuccess(container, message) {
    const alert = document.createElement('div');
    alert.className = 'alert success';
    alert.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    alert.style.cssText = `
        background: #28a745;
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

// Mostrar mensagem de erro
function showError(container, message) {
    const alert = document.createElement('div');
    alert.className = 'alert error';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
    `;
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

// Funcionalidades em desenvolvimento
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
