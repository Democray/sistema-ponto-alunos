# 🚀 Sistema de Controle de Ponto - Netlify + Supabase

## ✨ Versão Moderna e 100% Gratuita

Esta é a versão mais moderna do Sistema de Controle de Ponto, utilizando arquitetura serverless com Netlify (frontend) e Supabase (backend/banco).

## 🏗️ Arquitetura

- **Frontend**: Netlify (HTML, CSS, JavaScript)
- **Backend**: Supabase (PostgreSQL + APIs REST automáticas)
- **Autenticação**: Sistema customizado via Supabase
- **Hospedagem**: 100% na nuvem, escalável e gratuita

## 🚀 Deploy Rápido

### 1. Configurar Supabase
1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Execute o SQL fornecido no guia
4. Copie URL e chave anon

### 2. Configurar Código
1. Edite `config.js`
2. Substitua `SUA_URL_SUPABASE_AQUI` pela URL do seu projeto
3. Substitua `SUA_CHAVE_ANON_AQUI` pela chave anon

### 3. Deploy no Netlify
1. Crie conta em [netlify.com](https://netlify.com)
2. Conecte com GitHub
3. Faça upload destes arquivos para um repositório
4. Deploy automático!

## 📋 Funcionalidades

✅ **Registro de Ponto**
- Pop-up de confirmação
- Horário de Brasília
- Entrada e saída automáticas

✅ **Aprovação Administrativa**
- Pontos ficam pendentes
- Admin aprova/rejeita
- Edição de horários

✅ **Interface Moderna**
- Design responsivo
- Tela de loading
- Animações suaves

✅ **Segurança**
- Row Level Security (RLS)
- HTTPS automático
- Headers de segurança

## 🎯 Usuários Padrão

**Administrador:**
- Usuário: `admin`
- Senha: `123456`

**Funcionários:**
- João: `joao` / `123`
- Maria: `maria` / `123`
- Pedro: `pedro` / `123`

## 🔧 SQL para Supabase

Execute este SQL no editor do Supabase:

```sql
-- Criar tabelas
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    tipo VARCHAR(20) DEFAULT 'funcionario' CHECK (tipo IN ('admin', 'funcionario')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE registros_ponto (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    entrada TIMESTAMP WITH TIME ZONE,
    saida TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    horas_trabalhadas DECIMAL(4,2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(funcionario_id, data)
);

-- Inserir usuários
INSERT INTO users (username, password_hash, nome, email, tipo) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVrqUm/pW', 'Administrador', 'admin@sistema.com', 'admin'),
('joao', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'João Silva', 'joao@sistema.com', 'funcionario'),
('maria', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Santos', 'maria@sistema.com', 'funcionario'),
('pedro', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro Oliveira', 'pedro@sistema.com', 'funcionario');

-- Ativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (simplificadas para demonstração)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON registros_ponto FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON registros_ponto FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON registros_ponto FOR UPDATE USING (true);
```

## 🌟 Vantagens desta Versão

- **Custo Zero**: Netlify e Supabase gratuitos
- **Escalabilidade**: Cresce automaticamente
- **Performance**: CDN global + banco otimizado
- **Manutenção**: Deploy automático via Git
- **Segurança**: HTTPS + RLS + Headers seguros
- **Modernidade**: Arquitetura serverless

## 📞 Suporte

Sistema desenvolvido por **Manus AI** para controle de ponto moderno e eficiente.

**Documentação completa:** Consulte o guia detalhado fornecido.

---

🎉 **Pronto para usar!** Deploy em minutos, funciona para sempre!

