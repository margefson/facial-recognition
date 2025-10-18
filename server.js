const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const faceapi = require('face-api.js');

// MODIFICAÇÃO: Usar TensorFlow.js regular em vez da versão Node
const tf = require('@tensorflow/tfjs');
// Carregar backend CPU
require('@tensorflow/tfjs-backend-cpu');

const canvas = require('canvas');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify');
const ExcelJS = require('exceljs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Server } = require('socket.io');
const http = require('http');

// Configurar face-api.js para usar canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Configurar Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Configurar CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/facial_recognition', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

// Schema do usuário
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    faceDescriptor: { type: [Number], required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Schema de presença
const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    confidence: { type: Number, required: true }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Schema do administrador
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

// MODIFICAÇÃO: Função para carregar modelos do face-api.js adaptada para tfjs regular
async function loadModels() {
    const MODEL_URL = path.join(__dirname, 'models');
    
    // Criar diretório de modelos se não existir
    if (!fs.existsSync(MODEL_URL)) {
        fs.mkdirSync(MODEL_URL, { recursive: true });
        console.log('Diretório de modelos criado. Por favor, adicione os modelos do face-api.js na pasta models/');
        console.log('Você pode baixar os modelos em: https://github.com/justadudewhohacks/face-api.js/tree/master/weights');
        return;
    }
    
    try {
        // MODIFICAÇÃO: Configurar TensorFlow.js antes de carregar os modelos
        await tf.setBackend('cpu');
        console.log('Backend TensorFlow.js configurado:', tf.getBackend());
        
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
        console.log('Modelos carregados com sucesso');
    } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        console.log('Por favor, baixe os modelos do face-api.js e coloque na pasta models/');
        console.log('Modelos necessários:');
        console.log('- ssd_mobilenetv1_model-weights_manifest.json e arquivos .bin');
        console.log('- face_landmark_68_model-weights_manifest.json e arquivos .bin');
        console.log('- face_recognition_model-weights_manifest.json e arquivos .bin');
    }
}

// Função para extrair descritor facial de uma imagem
async function getFaceDescriptor(imagePath) {
    try {
        const img = await canvas.loadImage(imagePath);
        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (detection) {
            return Array.from(detection.descriptor);
        }
        return null;
    } catch (error) {
        console.error('Erro ao extrair descritor facial:', error);
        return null;
    }
}

// Função para comparar descritores faciais
function compareFaceDescriptors(descriptor1, descriptor2, threshold = 0.6) {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return {
        distance: distance,
        match: distance < threshold,
        confidence: Math.max(0, (1 - distance) * 100)
    };
}

// Constantes para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'facial_recognition_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

// Configuração do Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Reconhecimento Facial',
            version: '1.0.0',
            description: 'API para sistema de controle de presença com reconhecimento facial',
            contact: {
                name: 'Sistema de Reconhecimento Facial',
                email: 'admin@facial-recognition.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de Desenvolvimento'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            }
        }
    },
    apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware para servir documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Endpoint para obter especificação OpenAPI em JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ===== CONFIGURAÇÃO DE NOTIFICAÇÕES EM TEMPO REAL =====

// Armazenar conexões de administradores
const adminConnections = new Map();

// Eventos do Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Autenticação de administrador via socket
    socket.on('admin-auth', (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'admin') {
                adminConnections.set(socket.id, {
                    socket: socket,
                    adminId: decoded.id,
                    connectedAt: new Date()
                });
                socket.emit('admin-auth-success', { message: 'Autenticado como administrador' });
                console.log('Administrador autenticado:', decoded.username);
                
                // Enviar estatísticas iniciais
                sendInitialStats(socket);
            } else {
                socket.emit('admin-auth-error', { message: 'Token não é de administrador' });
            }
        } catch (error) {
            socket.emit('admin-auth-error', { message: 'Token inválido' });
        }
    });
    
    // Desconexão
    socket.on('disconnect', () => {
        adminConnections.delete(socket.id);
        console.log('Cliente desconectado:', socket.id);
    });
});

// Função para enviar estatísticas iniciais
async function sendInitialStats(socket) {
    try {
        const totalUsers = await User.countDocuments();
        const totalAttendance = await Attendance.countDocuments();
        
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const todayAttendance = await Attendance.countDocuments({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        });
        
        socket.emit('stats-update', {
            totalUsers,
            totalAttendance,
            todayAttendance,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erro ao enviar estatísticas iniciais:', error);
    }
}

// Função para notificar administradores sobre novos eventos
function notifyAdmins(event, data) {
    adminConnections.forEach((connection) => {
        connection.socket.emit(event, {
            ...data,
            timestamp: new Date()
        });
    });
}

// Função para atualizar estatísticas em tempo real
async function updateRealTimeStats() {
    try {
        const totalUsers = await User.countDocuments();
        const totalAttendance = await Attendance.countDocuments();
        
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const todayAttendance = await Attendance.countDocuments({
            timestamp: { $gte: startOfDay, $lt: endOfDay }
        });
        
        notifyAdmins('stats-update', {
            totalUsers,
            totalAttendance,
            todayAttendance
        });
    } catch (error) {
        console.error('Erro ao atualizar estatísticas em tempo real:', error);
    }
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acesso requerido' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Token inválido' 
            });
        }
        req.user = user;
        next();
    });
}

// Middleware de autenticação via API Key
function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    const validApiKeys = [
        'facial_recognition_api_key_2024',
        'integration_key_external_system'
    ];
    
    if (!apiKey || !validApiKeys.includes(apiKey)) {
        return res.status(401).json({ 
            success: false, 
            message: 'API Key inválida ou não fornecida' 
        });
    }
    
    req.apiClient = {
        name: 'Sistema Externo',
        permissions: ['read', 'write']
    };
    
    next();
}

// Middleware para verificar se é administrador
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acesso negado. Privilégios de administrador requeridos.' 
        });
    }
    next();
}

// Rotas da API

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cadastrar novo usuário
app.post('/api/register', upload.single('photo'), async (req, res) => {
    try {
        const { name, email } = req.body;
        const photoPath = req.file.path;

        // Extrair descritor facial
        const faceDescriptor = await getFaceDescriptor(photoPath);
        
        if (!faceDescriptor) {
            fs.unlinkSync(photoPath);
            return res.status(400).json({ 
                success: false, 
                message: 'Não foi possível detectar um rosto na imagem' 
            });
        }

        // Verificar se usuário já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            fs.unlinkSync(photoPath);
            return res.status(400).json({ 
                success: false, 
                message: 'Usuário já cadastrado com este email' 
            });
        }

        // Salvar usuário no banco de dados
        const newUser = new User({
            name,
            email,
            faceDescriptor
        });

        await newUser.save();

        // Remover arquivo temporário
        fs.unlinkSync(photoPath);

        res.json({ 
            success: true, 
            message: 'Usuário cadastrado com sucesso',
            userId: newUser._id
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Reconhecer usuário
app.post('/api/recognize', upload.single('photo'), async (req, res) => {
    try {
        const photoPath = req.file.path;

        // Extrair descritor facial da imagem enviada
        const faceDescriptor = await getFaceDescriptor(photoPath);
        
        if (!faceDescriptor) {
            fs.unlinkSync(photoPath);
            return res.status(400).json({ 
                success: false, 
                message: 'Não foi possível detectar um rosto na imagem' 
            });
        }

        // Buscar todos os usuários cadastrados
        const users = await User.find({});
        let bestMatch = null;
        let bestConfidence = 0;

        // Comparar com todos os usuários cadastrados
        for (const user of users) {
            const comparison = compareFaceDescriptors(faceDescriptor, user.faceDescriptor);
            
            if (comparison.match && comparison.confidence > bestConfidence) {
                bestMatch = user;
                bestConfidence = comparison.confidence;
            }
        }

        // Remover arquivo temporário
        fs.unlinkSync(photoPath);

        if (bestMatch && bestConfidence > 70) {
            // Registrar presença
            const attendance = new Attendance({
                userId: bestMatch._id,
                confidence: bestConfidence
            });
            await attendance.save();
            
            // Notificar administradores sobre nova presença
            notifyAdmins('new-attendance', {
                user: {
                    _id: bestMatch._id,
                    name: bestMatch.name,
                    email: bestMatch.email
                },
                confidence: bestConfidence.toFixed(2),
                attendanceId: attendance._id,
                message: `${bestMatch.name} registrou presença com ${bestConfidence.toFixed(1)}% de confiança`
            });
            
            // Atualizar estatísticas em tempo real
            updateRealTimeStats();

            res.json({
                success: true,
                message: 'Usuário reconhecido com sucesso',
                user: {
                    id: bestMatch._id,
                    name: bestMatch.name,
                    email: bestMatch.email
                },
                confidence: bestConfidence.toFixed(2),
                attendanceId: attendance._id
            });
        } else {
            res.json({
                success: false,
                message: 'Usuário não reconhecido',
                confidence: bestConfidence.toFixed(2)
            });
        }

    } catch (error) {
        console.error('Erro no reconhecimento:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Listar usuários cadastrados
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, { faceDescriptor: 0 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Listar registros de presença
app.get('/api/attendance', async (req, res) => {
    try {
        const attendance = await Attendance.find({})
            .populate('userId', 'name email')
            .sort({ timestamp: -1 })
            .limit(50);
        
        res.json({ success: true, attendance });
    } catch (error) {
        console.error('Erro ao listar presenças:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// ===== ROTAS DE AUTENTICAÇÃO DE ADMINISTRADOR =====

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username e password são obrigatórios' 
            });
        }

        // Buscar administrador
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            });
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciais inválidas' 
            });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: admin._id, 
                username: admin.username, 
                role: admin.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ 
            success: true, 
            message: 'Login realizado com sucesso',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Criar administrador
app.post('/api/admin/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username e password são obrigatórios' 
            });
        }

        // Verificar se administrador já existe
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Administrador já existe com este username' 
            });
        }

        // Hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Criar novo administrador
        const newAdmin = new Admin({
            username,
            password: hashedPassword
        });

        await newAdmin.save();

        res.json({ 
            success: true, 
            message: 'Administrador criado com sucesso',
            admin: {
                id: newAdmin._id,
                username: newAdmin.username,
                role: newAdmin.role
            }
        });

    } catch (error) {
        console.error('Erro ao criar administrador:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Verificar token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        message: 'Token válido',
        admin: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

// Logout
app.post('/api/admin/logout', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        message: 'Logout realizado com sucesso' 
    });
});

// ===== API V1 PARA INTEGRAÇÃO EXTERNA =====

app.get('/api/v1/users', authenticateApiKey, async (req, res) => {
    try {
        const users = await User.find({}, { faceDescriptor: 0 });
        res.json({ 
            success: true, 
            users,
            total: users.length
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

app.get('/api/v1/users/:id', authenticateApiKey, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { faceDescriptor: 0 });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

app.post('/api/v1/users', authenticateApiKey, async (req, res) => {
    try {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome e email são obrigatórios' 
            });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuário já cadastrado com este email' 
            });
        }
        
        const newUser = new User({
            name,
            email,
            faceDescriptor: []
        });
        
        await newUser.save();
        
        notifyAdmins('new-user', {
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
            },
            message: `Novo usuário cadastrado: ${newUser.name}`
        });
        
        updateRealTimeStats();
        
        res.status(201).json({ 
            success: true, 
            message: 'Usuário criado com sucesso',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// ... (as outras rotas permanecem iguais - mantive as principais modificações acima)

// MODIFICAÇÃO: Removida a referência ao backup-manager que não existe
// Se precisar de backup, você pode implementar posteriormente

// Gerar relatório PDF
app.get('/api/reports/pdf', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.timestamp = {};
            if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
            if (endDate) dateFilter.timestamp.$lte = new Date(endDate + 'T23:59:59.999Z');
        }
        
        const attendanceRecords = await Attendance.find(dateFilter)
            .populate('userId', 'name email')
            .sort({ timestamp: -1 });
        
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-presenca-${Date.now()}.pdf"`);
        
        doc.pipe(res);
        
        doc.fontSize(20).text('Relatório de Presença', { align: 'center' });
        doc.fontSize(12).text('Sistema de Reconhecimento Facial', { align: 'center' });
        doc.moveDown();
        
        if (startDate || endDate) {
            doc.text(`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`, { align: 'center' });
        } else {
            doc.text('Período: Todos os registros', { align: 'center' });
        }
        
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.text(`Total de registros: ${attendanceRecords.length}`, { align: 'center' });
        doc.moveDown(2);
        
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text('Nome', 50, tableTop, { width: 150 });
        doc.text('Email', 200, tableTop, { width: 150 });
        doc.text('Data/Hora', 350, tableTop, { width: 100 });
        doc.text('Confiança', 450, tableTop, { width: 80 });
        
        doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();
        
        let currentY = tableTop + 25;
        attendanceRecords.forEach((record, index) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
                doc.text('Nome', 50, currentY, { width: 150 });
                doc.text('Email', 200, currentY, { width: 150 });
                doc.text('Data/Hora', 350, currentY, { width: 100 });
                doc.text('Confiança', 450, currentY, { width: 80 });
                doc.moveTo(50, currentY + 15).lineTo(530, currentY + 15).stroke();
                currentY += 25;
            }
            
            const userName = record.userId ? record.userId.name : 'Usuário removido';
            const userEmail = record.userId ? record.userId.email : 'N/A';
            const timestamp = new Date(record.timestamp).toLocaleString('pt-BR');
            const confidence = `${record.confidence.toFixed(1)}%`;
            
            doc.text(userName, 50, currentY, { width: 150 });
            doc.text(userEmail, 200, currentY, { width: 150 });
            doc.text(timestamp, 350, currentY, { width: 100 });
            doc.text(confidence, 450, currentY, { width: 80 });
            
            currentY += 20;
        });
        
        doc.fontSize(8).text('Relatório gerado automaticamente pelo Sistema de Reconhecimento Facial', 50, 750, { align: 'center' });
        
        doc.end();
        
    } catch (error) {
        console.error('Erro ao gerar relatório PDF:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Função para criar administrador padrão na inicialização
async function createDefaultAdmin() {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const defaultPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            
            const defaultAdmin = new Admin({
                username: 'admin',
                password: hashedPassword
            });
            
            await defaultAdmin.save();
            console.log('Administrador padrão criado:');
            console.log('Username: admin');
            console.log('Password: admin123');
            console.log('IMPORTANTE: Altere a senha padrão após o primeiro login!');
        }
    } catch (error) {
        console.error('Erro ao criar administrador padrão:', error);
    }
}

// MODIFICAÇÃO: Função para iniciar o servidor com tratamento de erro melhorado
async function startServer() {
    try {
        console.log('Iniciando carregamento de modelos...');
        await loadModels();
        
        console.log('Verificando administrador padrão...');
        await createDefaultAdmin();
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`=== Servidor de Reconhecimento Facial ===`);
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Interface: http://localhost:${PORT}`);
            console.log(`API Docs: http://localhost:${PORT}/api-docs`);
            console.log(`Socket.IO: Ativo para notificações em tempo real`);
            console.log(`TensorFlow.js Backend: ${tf.getBackend()}`);
            console.log(`=========================================`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// MODIFICAÇÃO: Iniciar o servidor
startServer().catch(error => {
    console.error('Falha crítica ao iniciar servidor:', error);
    process.exit(1);
});