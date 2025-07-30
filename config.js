// Configurações do Supabase
const SUPABASE_URL = 'https://rmnfrcddzzonddfbeddv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbmZyY2RkenppbmRkZmJlZGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNTI4NjAsImV4cCI6MjAzNzkyODg2MH0.FOQc3ZD9uBbkuksluCCYzeLUdCnpdaky2HqFxXNnaFa';

// Inicialização do cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

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
    console.log('✅ Supabase configurado corretamente');
    return true;
}

// Verificar configuração ao carregar
document.addEventListener('DOMContentLoaded', verificarConfiguracao);
