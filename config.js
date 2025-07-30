// Configurações do Supabase
// IMPORTANTE: Substitua pelos valores do seu projeto Supabase
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

// Função para verificar se o Supabase está configurado
function verificarConfiguracao() {
    if (SUPABASE_URL === 'https://rnnfrcddzzonddfbeddv.supabase.co' || SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubmZyY2RkenpvbmRkZmJlZGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTU0ODUsImV4cCI6MjA2OTQ3MTQ4NX0.FOQcJ2D9uBbkuKs1utCYzeLUdCnpdaky2NqFxONnaF4') {
        console.error('❌ ERRO: Configure as chaves do Supabase no arquivo config.js');
        alert('Sistema não configurado! Verifique o arquivo config.js');
        return false;
    }
    console.log('✅ Supabase configurado corretamente');
    return true;
}

// Verificar configuração ao carregar
document.addEventListener('DOMContentLoaded', verificarConfiguracao);

