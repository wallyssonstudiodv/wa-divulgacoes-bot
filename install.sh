#!/bin/bash

echo "========================================="
echo "  WA DIVULGAÇÕES BOT - BAILEYS SETUP"
echo "========================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo ""
    echo "PARA TERMUX:"
    echo "pkg update && pkg upgrade"
    echo "pkg install nodejs git"
    echo ""
    echo "PARA UBUNTU/DEBIAN:"
    echo "sudo apt update"
    echo "sudo apt install nodejs npm git"
    echo ""
    echo "PARA CENTOS/RHEL:"
    echo "sudo yum install nodejs npm git"
    echo ""
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se o NPM está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado!"
    exit 1
fi

echo "✅ NPM encontrado: $(npm --version)"

# Criar diretórios necessários
echo ""
echo "📁 Criando estrutura de diretórios..."
mkdir -p data
mkdir -p sessions
mkdir -p public

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Verificar se a instalação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Instalação concluída com sucesso!"
    echo ""
    echo "========================================="
    echo "  COMO USAR O SISTEMA:"
    echo "========================================="
    echo ""
    echo "1. Para iniciar o servidor:"
    echo "   npm start"
    echo ""
    echo "2. Para desenvolvimento (com reinicialização automática):"
    echo "   npm run dev"
    echo ""
    echo "3. Para rodar no Termux:"
    echo "   npm run termux"
    echo ""
    echo "4. Acesse no navegador:"
    echo "   http://localhost:3000"
    echo ""
    echo "========================================="
    echo "  RECURSOS DO SISTEMA:"
    echo "========================================="
    echo ""
    echo "✅ Múltiplos usuários simultâneos"
    echo "✅ QR Code para conexão WhatsApp"
    echo "✅ Autoresponder inteligente"
    echo "✅ Agendamento de mensagens"
    echo "✅ Seleção de grupos"
    echo "✅ Interface web moderna"
    echo "✅ Compatível com Termux"
    echo ""
    echo "========================================="
else
    echo ""
    echo "❌ Erro durante a instalação!"
    echo "Tente executar: npm install --force"
fi