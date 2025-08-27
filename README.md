# WA Divulgações Bot - Sistema Baileys

Sistema completo de bot WhatsApp para múltiplos usuários com interface web, autoresponder inteligente e agendamento de mensagens.

## 🚀 Características Principais

- **Múltiplos Usuários**: Cada usuário tem sua própria sessão WhatsApp
- **QR Code Individual**: Conexão independente para cada usuário
- **Autoresponder Inteligente**: Respostas baseadas em palavras-chave
- **Agendamento de Mensagens**: Envio automático por dias/horários
- **Gerenciamento de Grupos**: Seleção e controle de grupos
- **Interface Web Moderna**: Dashboard completo e responsivo
- **Compatível com Termux**: Funciona perfeitamente no Android

## 📋 Pré-requisitos

### Para Termux (Android)
```bash
pkg update && pkg upgrade
pkg install nodejs git
```

### Para Ubuntu/Debian
```bash
sudo apt update
sudo apt install nodejs npm git
```

### Para CentOS/RHEL
```bash
sudo yum install nodejs npm git
```

## 🛠️ Instalação

1. **Clone ou baixe os arquivos**:
   - `index.js` - Servidor principal
   - `package.json` - Dependências
   - `public/index.html` - Interface web
   - `install.sh` - Script de instalação

2. **Execute o script de instalação**:
```bash
chmod +x install.sh
./install.sh
```

3. **Ou instale manualmente**:
```bash
npm install
```

## 🎯 Como Usar

### Iniciar o Sistema
```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev

# No Termux
npm run termux
```

### Acessar a Interface
Abra o navegador e acesse: `http://localhost:3000`

### Configuração Inicial

1. **Cadastro de Usuário**:
   - Acesse a interface web
   - Clique em "Cadastrar"
   - Preencha nome, email e senha

2. **Conectar WhatsApp**:
   - Faça login no sistema
   - Clique em "Conectar WhatsApp"
   - Escaneie o QR Code com seu WhatsApp
   - Aguarde a confirmação de conexão

3. **Criar Anúncios**:
   - Vá em "Criar Anúncio"
   - Digite título e mensagem
   - Adicione palavras-chave (opcional)
   - Defina status (ativo/inativo)

4. **Configurar Agendamentos**:
   - Acesse "Agendamentos"
   - Defina título e mensagem
   - Selecione dias da semana
   - Adicione horários
   - Escolha grupos para envio

## 📁 Estrutura de Arquivos

```
├── index.js                 # Servidor principal
├── package.json            # Dependências do projeto
├── install.sh              # Script de instalação
├── README.md               # Documentação
├── public/
│   └── index.html          # Interface web
├── data/                   # Dados persistidos
│   ├── users.json          # Usuários cadastrados
│   ├── ads.json            # Anúncios criados
│   └── scheduledAds.json   # Agendamentos
└── sessions/               # Sessões WhatsApp
    └── session_[userID]/   # Dados de autenticação por usuário
```

## 🤖 Funcionalidades Detalhadas

### Autoresponder
- **Palavras-chave**: Responde baseado em palavras específicas
- **Resposta Padrão**: Anúncio sem palavras-chave para qualquer mensagem
- **Múltiplos Anúncios**: Prioriza respostas com palavras-chave

### Agendamento
- **Dias da Semana**: Selecione quais dias enviar
- **Múltiplos Horários**: Configure vários horários por dia
- **Seleção de Grupos**: Escolha grupos específicos
- **Ativação/Desativação**: Controle individual de cada agendamento

### Gerenciamento de Grupos
- **Lista Automática**: Carrega todos os grupos do usuário
- **Informações Detalhadas**: Nome e quantidade de participantes
- **Mensagens Teste**: Envie mensagens para testar
- **Seleção para Agendamento**: Use grupos em campanhas programadas

## 🔧 Configurações Avançadas

### Variáveis de Ambiente
```bash
# Porta do servidor (padrão: 3000)
PORT=3000

# Modo de desenvolvimento
NODE_ENV=development
```

### Personalização de Intervalos
No arquivo `index.js`, você pode modificar:
- Intervalo entre envios: `setTimeout(resolve, 2000)` (linha ~200)
- Frequência do cron: `'* * * * *'` (a cada minuto, linha ~300)

## 📱 Uso no Termux

O sistema é totalmente compatível com Termux no Android:

1. **Instale o Termux** na Play Store ou F-Droid
2. **Configure o ambiente**:
```bash
pkg update && pkg upgrade
pkg install nodejs git
termux-setup-storage
```
3. **Execute o sistema** normalmente
4. **Acesse via navegador** do celular ou computador na mesma rede

## 🔒 Segurança

- **Sessões Isoladas**: Cada usuário tem dados separados
- **Autenticação Local**: Senhas armazenadas localmente
- **Tokens de Sessão**: Verificação de autenticidade
- **Cleanup Automático**: Remove sessões deslogadas

## 🛠️ Resolução de Problemas

### Erro de Conexão WhatsApp
- Verifique se o WhatsApp Web está funcionando
- Limpe a pasta `sessions/session_[userID]`
- Reconecte gerando novo QR Code

### Mensagens Não Enviando
- Confirme se o bot está conectado
- Verifique se os grupos existem
- Valide as permissões do bot nos grupos

### Erro de Instalação
- Execute `npm install --force`
- Verifique se Node.js >= 16.0.0
- Confirme conexão com internet

### Problemas no Termux
- Execute `pkg update && pkg upgrade`
- Reinstale Node.js: `pkg install nodejs-lts`
- Verifique permissões de armazenamento

## 📊 Monitoramento

O sistema fornece logs detalhados:
- Conexões WhatsApp
- Mensagens enviadas/recebidas
- Agendamentos executados
- Erros e avisos

## 🔄 Backup e Restauração

### Fazer Backup
```bash
cp -r data/ backup_data_$(date +%Y%m%d)/
cp -r sessions/ backup_sessions_$(date +%Y%m%d)/
```

### Restaurar Backup
```bash
cp -r backup_data_YYYYMMDD/ data/
cp -r backup_sessions_YYYYMMDD/ sessions/
```

## 📈 Performance

### Otimizações Implementadas
- **Conexões Persistentes**: Mantém sessões ativas
- **Cache de Grupos**: Evita requisições desnecessárias
- **Delay Anti-Spam**: Intervalo entre envios
- **Cleanup Automático**: Remove dados desnecessários

### Limites Recomendados
- **Usuários Simultâneos**: Até 10 para estabilidade ótima
- **Mensagens por Hora**: Máximo 100 por usuário
- **Grupos por Usuário**: Sem limite específico
- **Agendamentos**: Até 50 por usuário

## 📞 Suporte

Para questões técnicas ou dúvidas:
- Verifique os logs do console
- Consulte a documentação do Baileys
- Analise os arquivos de dados JSON

## 📄 Licença

Este projeto é distribuído sob licença MIT. Você pode usá-lo livremente para fins pessoais e comerciais.

---

**Desenvolvido por Wallysson Studio Dv**

Sistema profissional para automação de WhatsApp com foco em múltiplos usuários e facilidade de uso.
