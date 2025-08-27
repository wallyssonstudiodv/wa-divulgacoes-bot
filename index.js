const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// Garantir que os diretórios existam
[DATA_DIR, SESSIONS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Armazenamento de dados
let users = loadData('users.json') || [];
let ads = loadData('ads.json') || [];
let scheduledAds = loadData('scheduledAds.json') || [];
let activeSessions = new Map(); // userID -> { socket, qrCode, groups, isConnected }

function loadData(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {
        console.error(`Erro ao carregar ${filename}:`, error);
    }
    return [];
}

function saveData(filename, data) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar ${filename}:`, error);
        return false;
    }
}

// Função para criar conexão WhatsApp
async function createWhatsAppConnection(userId, socket) {
    const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['WA Divulgações Bot', 'Desktop', '3.0'],
    });

    // Manipular eventos de conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            const qrCodeData = await qrcode.toDataURL(qr);
            socket.emit('qr-code', { qrCode: qrCodeData });
            
            if (activeSessions.has(userId)) {
                activeSessions.get(userId).qrCode = qrCodeData;
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            socket.emit('connection-status', { 
                status: 'disconnected', 
                shouldReconnect 
            });

            if (activeSessions.has(userId)) {
                activeSessions.get(userId).isConnected = false;
            }

            if (shouldReconnect) {
                setTimeout(() => createWhatsAppConnection(userId, socket), 5000);
            } else {
                // Limpar sessão se foi deslogado
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                activeSessions.delete(userId);
            }
        } else if (connection === 'open') {
            console.log(`WhatsApp conectado para usuário ${userId}`);
            socket.emit('connection-status', { status: 'connected' });
            
            // Buscar grupos
            const groups = await getGroups(sock);
            
            if (activeSessions.has(userId)) {
                activeSessions.set(userId, {
                    ...activeSessions.get(userId),
                    socket: sock,
                    groups: groups,
                    isConnected: true
                });
            }

            socket.emit('groups-list', { groups });
        }
    });

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', saveCreds);

    // Manipular mensagens recebidas (autoresponder)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages) {
            if (!message.key.fromMe && message.message) {
                await handleIncomingMessage(sock, message, userId);
            }
        }
    });

    return sock;
}

// Função para buscar grupos
async function getGroups(socket) {
    try {
        const groups = await socket.groupFetchAllParticipating();
        return Object.values(groups).map(group => ({
            id: group.id,
            name: group.subject,
            participantCount: group.participants.length,
            desc: group.desc || ''
        }));
    } catch (error) {
        console.error('Erro ao buscar grupos:', error);
        return [];
    }
}

// Manipular mensagens recebidas (autoresponder)
async function handleIncomingMessage(socket, message, userId) {
    try {
        const messageText = message.message.conversation || 
                          message.message.extendedTextMessage?.text || 
                          '';
        
        if (!messageText) return;

        const userAds = ads.filter(ad => ad.userId == userId && ad.status === 'active');
        
        let responseAd = null;

        // Buscar anúncio com palavras-chave correspondentes
        for (const ad of userAds) {
            if (ad.keywords && ad.keywords.length > 0) {
                const hasKeyword = ad.keywords.some(keyword => 
                    messageText.toLowerCase().includes(keyword.toLowerCase())
                );
                
                if (hasKeyword) {
                    responseAd = ad;
                    break;
                }
            }
        }

        // Se não encontrou por palavra-chave, usar anúncio padrão (sem palavras-chave)
        if (!responseAd) {
            responseAd = userAds.find(ad => !ad.keywords || ad.keywords.length === 0);
        }

        if (responseAd) {
            await socket.sendMessage(message.key.remoteJid, {
                text: responseAd.message
            });

            console.log(`Resposta automática enviada para ${message.key.remoteJid}`);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
}

// Função para enviar mensagem agendada
async function sendScheduledMessage(scheduledAd) {
    const session = activeSessions.get(scheduledAd.userId);
    
    if (!session || !session.isConnected) {
        console.log(`Usuário ${scheduledAd.userId} não está conectado. Pulando envio agendado.`);
        return false;
    }

    try {
        const { socket } = session;
        
        for (const groupId of scheduledAd.selectedGroups) {
            await socket.sendMessage(groupId, {
                text: scheduledAd.message
            });
            
            // Delay entre envios para evitar spam
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`Mensagem agendada enviada pelo usuário ${scheduledAd.userId}`);
        return true;
    } catch (error) {
        console.error('Erro ao enviar mensagem agendada:', error);
        return false;
    }
}

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('start-whatsapp', async ({ userId }) => {
        try {
            console.log(`Iniciando WhatsApp para usuário ${userId}`);
            
            if (activeSessions.has(userId)) {
                const session = activeSessions.get(userId);
                if (session.isConnected) {
                    socket.emit('connection-status', { status: 'already-connected' });
                    socket.emit('groups-list', { groups: session.groups });
                    return;
                }
            }

            activeSessions.set(userId, {
                socket: null,
                qrCode: null,
                groups: [],
                isConnected: false
            });

            await createWhatsAppConnection(userId, socket);
        } catch (error) {
            console.error('Erro ao iniciar WhatsApp:', error);
            socket.emit('error', { message: 'Erro ao conectar WhatsApp' });
        }
    });

    socket.on('disconnect-whatsapp', async ({ userId }) => {
        try {
            if (activeSessions.has(userId)) {
                const session = activeSessions.get(userId);
                if (session.socket) {
                    await session.socket.logout();
                }
                activeSessions.delete(userId);
            }
            
            // Remover sessão do disco
            const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
            
            socket.emit('connection-status', { status: 'disconnected' });
        } catch (error) {
            console.error('Erro ao desconectar:', error);
        }
    });

    socket.on('get-groups', ({ userId }) => {
        if (activeSessions.has(userId)) {
            const session = activeSessions.get(userId);
            socket.emit('groups-list', { groups: session.groups || [] });
        }
    });

    socket.on('send-test-message', async ({ userId, groupId, message }) => {
        try {
            const session = activeSessions.get(userId);
            if (!session || !session.isConnected) {
                socket.emit('error', { message: 'WhatsApp não conectado' });
                return;
            }

            await session.socket.sendMessage(groupId, { text: message });
            socket.emit('message-sent', { success: true });
        } catch (error) {
            console.error('Erro ao enviar mensagem teste:', error);
            socket.emit('error', { message: 'Erro ao enviar mensagem' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Configurar cron jobs para mensagens agendadas
function setupScheduledJobs() {
    // Executar a cada minuto para verificar agendamentos
    cron.schedule('* * * * *', () => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc.
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        for (const scheduledAd of scheduledAds) {
            if (!scheduledAd.isActive) continue;
            
            // Verificar se hoje é um dos dias selecionados
            if (!scheduledAd.daysOfWeek.includes(currentDay)) continue;
            
            // Verificar horários
            for (const timeSlot of scheduledAd.times) {
                const [hour, minute] = timeSlot.split(':').map(Number);
                
                if (hour === currentHour && minute === currentMinute) {
                    sendScheduledMessage(scheduledAd);
                }
            }
        }
    });
}

// APIs REST
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', (req, res) => {
    users = req.body;
    if (saveData('users.json', users)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Erro ao salvar usuários' });
    }
});

app.get('/api/ads', (req, res) => {
    res.json(ads);
});

app.post('/api/ads', (req, res) => {
    ads = req.body;
    if (saveData('ads.json', ads)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Erro ao salvar anúncios' });
    }
});

app.get('/api/scheduled-ads', (req, res) => {
    res.json(scheduledAds);
});

app.post('/api/scheduled-ads', (req, res) => {
    scheduledAds = req.body;
    if (saveData('scheduledAds.json', scheduledAds)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Erro ao salvar agendamentos' });
    }
});

// Endpoint para verificar status de conexão
app.get('/api/status/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const session = activeSessions.get(userId);
    
    res.json({
        connected: session ? session.isConnected : false,
        groups: session ? session.groups : []
    });
});

// Inicializar servidor
setupScheduledJobs();

server.listen(PORT, () => {
    console.log(`
========================================
WA DIVULGAÇÕES BOT - BAILEYS
========================================

🚀 Servidor rodando na porta ${PORT}
📱 Acesse: http://localhost:${PORT}
🤖 Bot WhatsApp com múltiplos usuários
⏰ Sistema de agendamento ativo
📊 Dashboard completo disponível

TERMUX: Para rodar no Termux, instale:
  pkg update && pkg upgrade
  pkg install nodejs git
  npm install

RECURSOS DISPONÍVEIS:
✅ Múltiplos usuários simultâneos
✅ QR Code para cada usuário
✅ Autoresponder por palavra-chave
✅ Agendamento de mensagens
✅ Seleção de grupos
✅ Dashboard web completo
✅ Compatível com Termux

========================================
    `);
});

module.exports = { app, server };