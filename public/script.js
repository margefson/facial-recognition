// Elementos DOM
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const registerForm = document.getElementById('registerForm');
const recognizeForm = document.getElementById('recognizeForm');
const photoInput = document.getElementById('photo');
const recognizePhotoInput = document.getElementById('recognizePhoto');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removePreview = document.getElementById('removePreview');
const recognizePreviewContainer = document.getElementById('recognizePreviewContainer');
const recognizePreviewImage = document.getElementById('recognizePreviewImage');
const recognizeRemovePreview = document.getElementById('recognizeRemovePreview');
const recognitionResult = document.getElementById('recognitionResult');
const usersList = document.getElementById('usersList');
const attendanceList = document.getElementById('attendanceList');
const loadingModal = document.getElementById('loadingModal');
const resultModal = document.getElementById('resultModal');
const closeModal = document.getElementById('closeModal');

// Navegação entre abas
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Remover classe active de todos os botões e conteúdos
        navButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adicionar classe active ao botão e conteúdo selecionados
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // Carregar dados específicos da aba
        if (tabId === 'users') {
            loadUsers();
        } else if (tabId === 'attendance') {
            loadAttendance();
        }
    });
});

// Preview de imagem para cadastro
photoInput.addEventListener('change', function(e) {
    handleImagePreview(e.target, previewContainer, previewImage);
});

removePreview.addEventListener('click', function() {
    clearImagePreview(photoInput, previewContainer);
});

// Preview de imagem para reconhecimento
recognizePhotoInput.addEventListener('change', function(e) {
    handleImagePreview(e.target, recognizePreviewContainer, recognizePreviewImage);
});

recognizeRemovePreview.addEventListener('click', function() {
    clearImagePreview(recognizePhotoInput, recognizePreviewContainer);
});

// Função para lidar com preview de imagem
function handleImagePreview(input, container, imgElement) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
            container.style.display = 'block';
            container.previousElementSibling.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Função para limpar preview de imagem
function clearImagePreview(input, container) {
    input.value = '';
    container.style.display = 'none';
    container.previousElementSibling.style.display = 'block';
}

// Formulário de cadastro
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Verificar se há foto (upload ou webcam)
    const photoFile = getPhotoData('register');
    if (!photoFile) {
        showResultModal('Erro!', 'Por favor, selecione uma foto ou capture uma imagem da webcam', 'error');
        return;
    }
    
    const formData = new FormData(this);
    
    // Remover o arquivo original e adicionar o correto (upload ou webcam)
    formData.delete('photo');
    formData.append('photo', photoFile);
    
    showLoadingModal('Cadastrando usuário...');
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        hideLoadingModal();
        
        if (result.success) {
            showResultModal('Sucesso!', result.message, 'success');
            this.reset();
            clearImagePreview(photoInput, previewContainer);
            // Limpar webcam se estiver ativa
            if (currentMode === 'webcam' && currentForm === 'register') {
                stopWebcam('register');
                capturedImageData = null;
            }
        } else {
            showResultModal('Erro!', result.message, 'error');
        }
    } catch (error) {
        hideLoadingModal();
        showResultModal('Erro!', 'Erro de conexão com o servidor', 'error');
        console.error('Erro:', error);
    }
});

// Formulário de reconhecimento
recognizeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Verificar se há foto (upload ou webcam)
    const photoFile = getPhotoData('recognize');
    if (!photoFile) {
        showResultModal('Erro!', 'Por favor, selecione uma foto ou capture uma imagem da webcam', 'error');
        return;
    }
    
    const formData = new FormData(this);
    
    // Remover o arquivo original e adicionar o correto (upload ou webcam)
    formData.delete('photo');
    formData.append('photo', photoFile);
    
    showLoadingModal('Reconhecendo usuário...');
    
    try {
        const response = await fetch('/api/recognize', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        hideLoadingModal();
        
        if (result.success) {
            showRecognitionResult(result);
            showResultModal('Usuário Reconhecido!', 
                `${result.user.name} foi reconhecido com ${result.confidence}% de confiança`, 'success');
        } else {
            hideRecognitionResult();
            showResultModal('Usuário Não Reconhecido', result.message, 'error');
        }
        
        this.reset();
        clearImagePreview(recognizePhotoInput, recognizePreviewContainer);
        // Limpar webcam se estiver ativa
        if (currentMode === 'webcam' && currentForm === 'recognize') {
            stopWebcam('recognize');
            capturedImageData = null;
        }
    } catch (error) {
        hideLoadingModal();
        hideRecognitionResult();
        showResultModal('Erro!', 'Erro de conexão com o servidor', 'error');
        console.error('Erro:', error);
    }
});

// Mostrar resultado do reconhecimento
function showRecognitionResult(result) {
    document.getElementById('resultName').textContent = result.user.name;
    document.getElementById('resultEmail').textContent = result.user.email;
    document.getElementById('resultConfidence').textContent = result.confidence;
    recognitionResult.style.display = 'block';
}

// Esconder resultado do reconhecimento
function hideRecognitionResult() {
    recognitionResult.style.display = 'none';
}

// Carregar lista de usuários
async function loadUsers() {
    usersList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Carregando usuários...</div>';
    
    try {
        const response = await fetch('/api/users');
        const result = await response.json();
        
        if (result.success) {
            displayUsers(result.users);
        } else {
            usersList.innerHTML = '<div class="loading">Erro ao carregar usuários</div>';
        }
    } catch (error) {
        usersList.innerHTML = '<div class="loading">Erro de conexão</div>';
        console.error('Erro:', error);
    }
}

// Exibir lista de usuários
function displayUsers(users) {
    if (users.length === 0) {
        usersList.innerHTML = '<div class="loading">Nenhum usuário cadastrado</div>';
        return;
    }
    
    const usersHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
            </div>
            <div class="user-date">
                Cadastrado em: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </div>
        </div>
    `).join('');
    
    usersList.innerHTML = usersHTML;
}

// Carregar registros de presença
async function loadAttendance() {
    attendanceList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Carregando registros...</div>';
    
    try {
        const response = await fetch('/api/attendance');
        const result = await response.json();
        
        if (result.success) {
            displayAttendance(result.attendance);
        } else {
            attendanceList.innerHTML = '<div class="loading">Erro ao carregar registros</div>';
        }
    } catch (error) {
        attendanceList.innerHTML = '<div class="loading">Erro de conexão</div>';
        console.error('Erro:', error);
    }
}

// Exibir registros de presença
function displayAttendance(attendance) {
    if (attendance.length === 0) {
        attendanceList.innerHTML = '<div class="loading">Nenhum registro de presença</div>';
        return;
    }
    
    const attendanceHTML = attendance.map(record => `
        <div class="attendance-item">
            <div class="attendance-info">
                <h4>${record.userId.name}</h4>
                <p>${record.userId.email}</p>
                <p>Confiança: ${record.confidence.toFixed(2)}%</p>
            </div>
            <div class="attendance-date">
                ${new Date(record.timestamp).toLocaleString('pt-BR')}
            </div>
        </div>
    `).join('');
    
    attendanceList.innerHTML = attendanceHTML;
}

// Mostrar modal de loading
function showLoadingModal(text) {
    document.getElementById('loadingText').textContent = text;
    loadingModal.classList.add('active');
}

// Esconder modal de loading
function hideLoadingModal() {
    loadingModal.classList.remove('active');
}

// Mostrar modal de resultado
function showResultModal(title, message, type) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    
    const modalIcon = document.getElementById('modalIcon');
    modalIcon.className = 'modal-icon';
    
    if (type === 'error') {
        modalIcon.classList.add('error');
        modalIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    }
    
    resultModal.classList.add('active');
}

// Fechar modal de resultado
closeModal.addEventListener('click', function() {
    resultModal.classList.remove('active');
});

// Fechar modal clicando fora
resultModal.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// Drag and drop para upload de arquivos
function setupDragAndDrop(input, container) {
    const uploadDisplay = container.querySelector('.file-upload-display');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        uploadDisplay.style.borderColor = '#667eea';
        uploadDisplay.style.background = 'rgba(102, 126, 234, 0.1)';
    }
    
    function unhighlight(e) {
        uploadDisplay.style.borderColor = '#e0e0e0';
        uploadDisplay.style.background = 'rgba(255, 255, 255, 0.5)';
    }
    
    container.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            input.files = files;
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    }
}

// Configurar drag and drop para ambos os inputs
setupDragAndDrop(photoInput, photoInput.closest('.file-upload'));
setupDragAndDrop(recognizePhotoInput, recognizePhotoInput.closest('.file-upload'));

// Carregar usuários na inicialização se a aba estiver ativa
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há alguma aba ativa, senão ativar a primeira
    if (!document.querySelector('.nav-btn.active')) {
        navButtons[0].classList.add('active');
        tabContents[0].classList.add('active');
    }
});



// ===== FUNCIONALIDADE DE WEBCAM =====

// Variáveis globais para webcam
let currentStream = null;
let currentMode = 'upload'; // 'upload' ou 'webcam'
let currentForm = 'register'; // 'register' ou 'recognize'
let capturedImageData = null;

// Elementos da webcam para cadastro
const webcamElements = {
    register: {
        video: document.getElementById('webcamVideo'),
        canvas: document.getElementById('webcamCanvas'),
        preview: document.getElementById('webcamPreview'),
        capturedImage: document.getElementById('webcamCapturedImage'),
        placeholder: document.getElementById('webcamPlaceholder'),
        startBtn: document.getElementById('startWebcam'),
        captureBtn: document.getElementById('capturePhoto'),
        retakeBtn: document.getElementById('retakePhoto'),
        stopBtn: document.getElementById('stopWebcam')
    },
    recognize: {
        video: document.getElementById('recognizeWebcamVideo'),
        canvas: document.getElementById('recognizeWebcamCanvas'),
        preview: document.getElementById('recognizeWebcamPreview'),
        capturedImage: document.getElementById('recognizeWebcamCapturedImage'),
        placeholder: document.getElementById('recognizeWebcamPlaceholder'),
        startBtn: document.getElementById('recognizeStartWebcam'),
        captureBtn: document.getElementById('recognizeCapturePhoto'),
        retakeBtn: document.getElementById('recognizeRetakePhoto'),
        stopBtn: document.getElementById('recognizeStopWebcam')
    }
};

// Navegação entre modos de captura (Upload/Webcam)
document.querySelectorAll('.capture-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const mode = this.getAttribute('data-mode');
        const form = this.getAttribute('data-form') || 'register';
        
        // Atualizar abas ativas
        const parentTabs = this.parentElement;
        parentTabs.querySelectorAll('.capture-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar/esconder modos de captura
        const container = this.closest('.photo-capture-options');
        const uploadMode = container.querySelector(`#${form === 'recognize' ? 'recognize-' : ''}upload-mode`);
        const webcamMode = container.querySelector(`#${form === 'recognize' ? 'recognize-' : ''}webcam-mode`);
        
        if (mode === 'upload') {
            uploadMode.classList.add('active');
            webcamMode.classList.remove('active');
            stopWebcam(form);
        } else {
            uploadMode.classList.remove('active');
            webcamMode.classList.add('active');
        }
        
        currentMode = mode;
        currentForm = form;
    });
});

// Iniciar webcam
function startWebcam(formType) {
    const elements = webcamElements[formType];
    
    // Mostrar loading
    elements.placeholder.innerHTML = `
        <div class="webcam-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Iniciando câmera...</p>
        </div>
    `;
    
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user' // Câmera frontal
        } 
    })
    .then(stream => {
        currentStream = stream;
        elements.video.srcObject = stream;
        
        // Mostrar video e esconder placeholder
        elements.placeholder.style.display = 'none';
        elements.video.style.display = 'block';
        
        // Atualizar botões
        elements.startBtn.style.display = 'none';
        elements.captureBtn.style.display = 'inline-flex';
        elements.stopBtn.style.display = 'inline-flex';
        
        // Esconder preview se existir
        elements.preview.style.display = 'none';
        elements.retakeBtn.style.display = 'none';
    })
    .catch(error => {
        console.error('Erro ao acessar a webcam:', error);
        
        let errorMessage = 'Erro ao acessar a câmera';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Permissão negada para acessar a câmera';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'Nenhuma câmera encontrada';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'Câmera está sendo usada por outro aplicativo';
        }
        
        elements.placeholder.innerHTML = `
            <div class="camera-permission-denied">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${errorMessage}</p>
                <small>Verifique as permissões do navegador e tente novamente</small>
            </div>
        `;
    });
}

// Capturar foto da webcam
function capturePhoto(formType) {
    const elements = webcamElements[formType];
    const video = elements.video;
    const canvas = elements.canvas;
    const context = canvas.getContext('2d');
    
    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Desenhar frame atual do video no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Converter para base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    capturedImageData = imageData;
    
    // Mostrar preview da foto capturada
    elements.capturedImage.src = imageData;
    elements.preview.style.display = 'block';
    elements.video.style.display = 'none';
    
    // Atualizar botões
    elements.captureBtn.style.display = 'none';
    elements.retakeBtn.style.display = 'inline-flex';
}

// Tirar nova foto
function retakePhoto(formType) {
    const elements = webcamElements[formType];
    
    // Esconder preview e mostrar video
    elements.preview.style.display = 'none';
    elements.video.style.display = 'block';
    
    // Atualizar botões
    elements.retakeBtn.style.display = 'none';
    elements.captureBtn.style.display = 'inline-flex';
    
    // Limpar dados da imagem
    capturedImageData = null;
}

// Parar webcam
function stopWebcam(formType) {
    const elements = webcamElements[formType];
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    // Resetar interface
    elements.video.style.display = 'none';
    elements.preview.style.display = 'none';
    elements.placeholder.style.display = 'block';
    elements.placeholder.innerHTML = `
        <i class="fas fa-camera"></i>
        <p>Clique em "Ativar Câmera" para começar</p>
    `;
    
    // Resetar botões
    elements.startBtn.style.display = 'inline-flex';
    elements.captureBtn.style.display = 'none';
    elements.retakeBtn.style.display = 'none';
    elements.stopBtn.style.display = 'none';
    
    // Limpar dados da imagem
    capturedImageData = null;
}

// Event listeners para botões da webcam - Cadastro
webcamElements.register.startBtn.addEventListener('click', () => startWebcam('register'));
webcamElements.register.captureBtn.addEventListener('click', () => capturePhoto('register'));
webcamElements.register.retakeBtn.addEventListener('click', () => retakePhoto('register'));
webcamElements.register.stopBtn.addEventListener('click', () => stopWebcam('register'));

// Event listeners para botões da webcam - Reconhecimento
webcamElements.recognize.startBtn.addEventListener('click', () => startWebcam('recognize'));
webcamElements.recognize.captureBtn.addEventListener('click', () => capturePhoto('recognize'));
webcamElements.recognize.retakeBtn.addEventListener('click', () => retakePhoto('recognize'));
webcamElements.recognize.stopBtn.addEventListener('click', () => stopWebcam('recognize'));

// Função para converter base64 para File object
function base64ToFile(base64String, filename) {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
}

// Função para verificar se há foto capturada da webcam
function hasWebcamPhoto(formType) {
    return capturedImageData !== null && currentMode === 'webcam' && currentForm === formType;
}

// Função para obter dados da foto (upload ou webcam)
function getPhotoData(formType) {
    if (currentMode === 'webcam' && capturedImageData) {
        // Retornar arquivo criado a partir da imagem capturada
        return base64ToFile(capturedImageData, `webcam-photo-${Date.now()}.jpg`);
    } else {
        // Retornar arquivo do input de upload
        const input = formType === 'register' ? photoInput : recognizePhotoInput;
        return input.files[0];
    }
}

// Parar webcam quando mudar de aba
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        stopWebcam('register');
        stopWebcam('recognize');
    });
});

// Parar webcam quando a página for fechada
window.addEventListener('beforeunload', () => {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});


// ===== FUNCIONALIDADE DE ADMINISTRAÇÃO =====

// Variáveis globais para administração
let adminToken = localStorage.getItem('adminToken');
let adminUser = null;

// Elementos da interface de administração
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogin = document.getElementById('adminLogin');
const adminPanel = document.getElementById('adminPanel');
const adminUserInfo = document.getElementById('adminUserInfo');
const adminLogout = document.getElementById('adminLogout');
const refreshStatsBtn = document.getElementById('refreshStats');
const exportDataBtn = document.getElementById('exportData');
const manageUsersBtn = document.getElementById('manageUsers');

// Elementos de estatísticas
const totalUsersElement = document.getElementById('totalUsers');
const totalAttendanceElement = document.getElementById('totalAttendance');
const todayAttendanceElement = document.getElementById('todayAttendance');

// Verificar se admin está logado ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    if (adminToken) {
        verifyAdminToken();
    }
});

// Função para verificar token de administrador
async function verifyAdminToken() {
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            adminUser = result.admin;
            showAdminPanel();
            updateAdminNavigation();
        } else {
            clearAdminSession();
        }
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        clearAdminSession();
    }
}

// Função para mostrar painel administrativo
function showAdminPanel() {
    adminLogin.style.display = 'none';
    adminPanel.style.display = 'block';
    adminUserInfo.textContent = adminUser.username;
    loadAdminStats();
}

// Função para esconder painel administrativo
function hideAdminPanel() {
    adminLogin.style.display = 'block';
    adminPanel.style.display = 'none';
}

// Função para limpar sessão de administrador
function clearAdminSession() {
    adminToken = null;
    adminUser = null;
    localStorage.removeItem('adminToken');
    hideAdminPanel();
    updateAdminNavigation();
}

// Função para atualizar navegação (indicar se admin está logado)
function updateAdminNavigation() {
    const adminNavBtn = document.querySelector('.nav-btn[data-tab="admin"]');
    if (adminUser) {
        adminNavBtn.classList.add('admin-logged');
        adminNavBtn.title = `Logado como ${adminUser.username}`;
    } else {
        adminNavBtn.classList.remove('admin-logged');
        adminNavBtn.title = 'Login de Administrador';
    }
}

// Login de administrador
adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    showLoadingModal('Fazendo login...');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        hideLoadingModal();
        
        if (result.success) {
            adminToken = result.token;
            adminUser = result.admin;
            localStorage.setItem('adminToken', adminToken);
            
            showAdminPanel();
            updateAdminNavigation();
            showResultModal('Sucesso!', result.message, 'success');
            this.reset();
        } else {
            showResultModal('Erro!', result.message, 'error');
        }
    } catch (error) {
        hideLoadingModal();
        showResultModal('Erro!', 'Erro de conexão com o servidor', 'error');
        console.error('Erro:', error);
    }
});

// Logout de administrador
adminLogout.addEventListener('click', async function() {
    try {
        await fetch('/api/admin/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
    } catch (error) {
        console.error('Erro no logout:', error);
    }
    
    clearAdminSession();
    showResultModal('Logout', 'Logout realizado com sucesso', 'success');
});

// Carregar estatísticas administrativas
async function loadAdminStats() {
    if (!adminToken) return;
    
    // Adicionar estado de loading
    totalUsersElement.parentElement.parentElement.classList.add('stat-loading');
    totalAttendanceElement.parentElement.parentElement.classList.add('stat-loading');
    todayAttendanceElement.parentElement.parentElement.classList.add('stat-loading');
    
    try {
        // Carregar estatísticas gerais
        const statsResponse = await fetch('/api/admin/stats/overview', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            const stats = statsResult.stats;
            
            // Atualizar interface
            totalUsersElement.textContent = stats.totalUsers;
            totalAttendanceElement.textContent = stats.totalAttendance;
            todayAttendanceElement.textContent = stats.todayAttendance;
            document.getElementById('avgDailyAttendance').textContent = stats.avgDailyAttendance;
        }
        
        // Carregar e renderizar gráficos
        await loadDashboardCharts();
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showResultModal('Erro!', 'Erro ao carregar estatísticas', 'error');
    } finally {
        // Remover estado de loading
        totalUsersElement.parentElement.parentElement.classList.remove('stat-loading');
        totalAttendanceElement.parentElement.parentElement.classList.remove('stat-loading');
        todayAttendanceElement.parentElement.parentElement.classList.remove('stat-loading');
    }
}

// Atualizar estatísticas
refreshStatsBtn.addEventListener('click', function() {
    loadAdminStats();
    showResultModal('Atualizado!', 'Estatísticas atualizadas com sucesso', 'success');
});

// Exportar dados (agora mostra seção de relatórios)
exportDataBtn.addEventListener('click', function() {
    const reportsSection = document.getElementById('reportsSection');
    if (reportsSection.style.display === 'none') {
        reportsSection.style.display = 'block';
        this.innerHTML = '<i class="fas fa-times"></i> Fechar Relatórios';
    } else {
        reportsSection.style.display = 'none';
        this.innerHTML = '<i class="fas fa-download"></i> Gerar Relatórios';
    }
});

// Gerenciar usuários (placeholder - será implementado na próxima fase)
manageUsersBtn.addEventListener('click', function() {
    showResultModal('Em Desenvolvimento', 'Funcionalidade de gerenciamento será implementada em breve', 'info');
});

// Verificar se deve mostrar painel admin ao trocar de aba
const originalNavButtonHandler = navButtons[0].onclick;
navButtons.forEach(button => {
    const originalHandler = button.onclick;
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        if (tabId === 'admin') {
            if (adminToken && adminUser) {
                showAdminPanel();
            } else {
                hideAdminPanel();
            }
        }
    });
});

// Interceptar navegação para aba admin
document.querySelector('.nav-btn[data-tab="admin"]').addEventListener('click', function() {
    if (adminUser) {
        loadAdminStats();
    }
});


// ===== FUNCIONALIDADE DE RELATÓRIOS =====

// Elementos da interface de relatórios
const reportsSection = document.getElementById('reportsSection');
const hideReportsBtn = document.getElementById('hideReports');
const generatePDFBtn = document.getElementById('generatePDF');
const generateCSVBtn = document.getElementById('generateCSV');
const generateXLSXBtn = document.getElementById('generateXLSX');
const reportStartDate = document.getElementById('reportStartDate');
const reportEndDate = document.getElementById('reportEndDate');

// Fechar seção de relatórios
hideReportsBtn.addEventListener('click', function() {
    reportsSection.style.display = 'none';
    exportDataBtn.innerHTML = '<i class="fas fa-download"></i> Gerar Relatórios';
});

// Função genérica para gerar relatórios
async function generateReport(format) {
    if (!adminToken) {
        showResultModal('Erro!', 'Você precisa estar logado como administrador', 'error');
        return;
    }
    
    const startDate = reportStartDate.value;
    const endDate = reportEndDate.value;
    
    // Validar datas
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showResultModal('Erro!', 'A data de início deve ser anterior à data de fim', 'error');
        return;
    }
    
    // Construir URL com parâmetros
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `/api/reports/${format}?${params.toString()}`;
    
    try {
        // Mostrar loading no botão
        const button = document.getElementById(`generate${format.toUpperCase()}`);
        const originalHTML = button.innerHTML;
        button.classList.add('btn-loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        
        showLoadingModal(`Gerando relatório ${format.toUpperCase()}...`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        hideLoadingModal();
        
        if (response.ok) {
            // Criar blob e fazer download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            // Extrair nome do arquivo do header Content-Disposition
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `relatorio-presenca-${Date.now()}.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            // Animação de sucesso
            button.classList.add('download-success');
            setTimeout(() => button.classList.remove('download-success'), 600);
            
            showResultModal('Sucesso!', `Relatório ${format.toUpperCase()} gerado com sucesso`, 'success');
        } else {
            const errorData = await response.json();
            showResultModal('Erro!', errorData.message || 'Erro ao gerar relatório', 'error');
        }
    } catch (error) {
        hideLoadingModal();
        console.error('Erro ao gerar relatório:', error);
        showResultModal('Erro!', 'Erro de conexão com o servidor', 'error');
    } finally {
        // Restaurar botão
        const button = document.getElementById(`generate${format.toUpperCase()}`);
        button.classList.remove('btn-loading');
        button.innerHTML = originalHTML;
    }
}

// Event listeners para botões de relatório
generatePDFBtn.addEventListener('click', () => generateReport('pdf'));
generateCSVBtn.addEventListener('click', () => generateReport('csv'));
generateXLSXBtn.addEventListener('click', () => generateReport('xlsx'));

// Definir data padrão (último mês)
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    reportEndDate.value = today.toISOString().split('T')[0];
    reportStartDate.value = lastMonth.toISOString().split('T')[0];
});

// Adicionar tooltips aos botões de relatório
generatePDFBtn.setAttribute('data-tooltip', 'Relatório formatado para impressão');
generateCSVBtn.setAttribute('data-tooltip', 'Dados em formato de planilha simples');
generateXLSXBtn.setAttribute('data-tooltip', 'Planilha Excel com formatação avançada');


// ===== FUNCIONALIDADE DE DASHBOARD COM GRÁFICOS =====

// Variáveis globais para os gráficos
let attendanceChart = null;
let confidenceChart = null;
let topUsersChart = null;

// Função para carregar todos os gráficos do dashboard
async function loadDashboardCharts() {
    if (!adminToken) return;
    
    try {
        // Carregar dados em paralelo
        const [attendanceData, confidenceData, topUsersData] = await Promise.all([
            fetch('/api/admin/stats/attendance-by-day', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }).then(res => res.json()),
            
            fetch('/api/admin/stats/confidence-distribution', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }).then(res => res.json()),
            
            fetch('/api/admin/stats/top-users?limit=5', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }).then(res => res.json())
        ]);
        
        // Renderizar gráficos
        renderAttendanceChart(attendanceData.data);
        renderConfidenceChart(confidenceData.data);
        renderTopUsersChart(topUsersData.data);
        
    } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error);
        showChartError();
    }
}

// Gráfico de presenças por dia (linha)
function renderAttendanceChart(data) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (attendanceChart) {
        attendanceChart.destroy();
    }
    
    const labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const values = data.map(item => item.count);
    
    attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presenças',
                data: values,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const date = new Date(data[context[0].dataIndex].date);
                            return date.toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                day: '2-digit', 
                                month: 'long' 
                            });
                        },
                        label: function(context) {
                            return `${context.parsed.y} presença${context.parsed.y !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        stepSize: 1
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Gráfico de distribuição de confiança (pizza)
function renderConfidenceChart(data) {
    const ctx = document.getElementById('confidenceChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (confidenceChart) {
        confidenceChart.destroy();
    }
    
    const colors = [
        '#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#27ae60', '#1abc9c'
    ];
    
    confidenceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: '#666'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Gráfico de top usuários (barra horizontal)
function renderTopUsersChart(data) {
    const ctx = document.getElementById('topUsersChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (topUsersChart) {
        topUsersChart.destroy();
    }
    
    const labels = data.map(item => item.name);
    const values = data.map(item => item.count);
    
    // Gradiente de cores
    const gradient = ctx.createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    topUsersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presenças',
                data: values,
                backgroundColor: gradient,
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return data[context[0].dataIndex].name;
                        },
                        label: function(context) {
                            const user = data[context.dataIndex];
                            return [
                                `Presenças: ${context.parsed.x}`,
                                `Confiança média: ${user.avgConfidence}%`,
                                `Última presença: ${new Date(user.lastAttendance).toLocaleDateString('pt-BR')}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#666',
                        stepSize: 1
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            return label.length > 15 ? label.substring(0, 15) + '...' : label;
                        }
                    }
                }
            }
        }
    });
}

// Função para mostrar erro nos gráficos
function showChartError() {
    const chartContainers = document.querySelectorAll('.chart-container canvas');
    chartContainers.forEach(canvas => {
        const container = canvas.parentElement;
        container.innerHTML = `
            <div class="chart-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar gráfico</p>
            </div>
        `;
    });
}

// Função para redimensionar gráficos quando a janela muda de tamanho
window.addEventListener('resize', function() {
    if (attendanceChart) attendanceChart.resize();
    if (confidenceChart) confidenceChart.resize();
    if (topUsersChart) topUsersChart.resize();
});

// Atualizar gráficos quando as estatísticas são atualizadas
const originalRefreshStats = refreshStatsBtn.onclick;
refreshStatsBtn.addEventListener('click', async function() {
    await loadAdminStats();
    showResultModal('Atualizado!', 'Dashboard atualizado com sucesso', 'success');
});


// ===== FUNCIONALIDADE DE NOTIFICAÇÕES EM TEMPO REAL =====

// Variáveis globais para Socket.IO
let socket = null;
let isSocketConnected = false;
let notificationsContainer = null;
let connectionStatus = null;
let clearNotificationsBtn = null;

// Inicializar Socket.IO quando administrador faz login
function initializeSocket() {
    if (!adminToken) return;
    
    // Elementos da interface
    notificationsContainer = document.getElementById('notificationsContainer');
    connectionStatus = document.getElementById('connectionStatus');
    clearNotificationsBtn = document.getElementById('clearNotifications');
    
    // Configurar botão de limpar notificações
    clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    
    // Conectar ao Socket.IO
    socket = io();
    
    // Atualizar status de conexão
    updateConnectionStatus('connecting');
    
    // Eventos de conexão
    socket.on('connect', () => {
        console.log('Conectado ao servidor Socket.IO');
        isSocketConnected = true;
        updateConnectionStatus('connected');
        
        // Autenticar como administrador
        socket.emit('admin-auth', adminToken);
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado do servidor Socket.IO');
        isSocketConnected = false;
        updateConnectionStatus('disconnected');
    });
    
    // Eventos de autenticação
    socket.on('admin-auth-success', (data) => {
        console.log('Autenticado como administrador:', data.message);
        addNotification('system', 'Sistema', 'Conectado às notificações em tempo real', new Date());
    });
    
    socket.on('admin-auth-error', (data) => {
        console.error('Erro de autenticação:', data.message);
        addNotification('error', 'Erro', 'Falha na autenticação para notificações', new Date());
    });
    
    // Eventos de dados
    socket.on('stats-update', (data) => {
        // Atualizar estatísticas na interface
        if (document.getElementById('totalUsers')) {
            document.getElementById('totalUsers').textContent = data.totalUsers;
        }
        if (document.getElementById('totalAttendance')) {
            document.getElementById('totalAttendance').textContent = data.totalAttendance;
        }
        if (document.getElementById('todayAttendance')) {
            document.getElementById('todayAttendance').textContent = data.todayAttendance;
        }
    });
    
    // Eventos de notificações
    socket.on('new-user', (data) => {
        addNotification('user', 'Novo Usuário', data.message, data.timestamp, {
            email: data.user.email
        });
        
        // Recarregar gráficos se estiverem visíveis
        if (attendanceChart) {
            loadDashboardCharts();
        }
    });
    
    socket.on('new-attendance', (data) => {
        addNotification('attendance', 'Nova Presença', data.message, data.timestamp, {
            confidence: data.confidence,
            email: data.user.email
        });
        
        // Recarregar gráficos se estiverem visíveis
        if (attendanceChart) {
            loadDashboardCharts();
        }
    });
}

// Atualizar status de conexão
function updateConnectionStatus(status) {
    if (!connectionStatus) return;
    
    const statusIcon = connectionStatus.querySelector('i');
    const statusText = connectionStatus.querySelector('span') || connectionStatus;
    
    // Remover classes anteriores
    connectionStatus.classList.remove('connected', 'disconnected', 'connecting');
    
    switch (status) {
        case 'connected':
            connectionStatus.classList.add('connected');
            statusIcon.className = 'fas fa-circle';
            statusText.textContent = 'Conectado';
            break;
        case 'disconnected':
            connectionStatus.classList.add('disconnected');
            statusIcon.className = 'fas fa-circle';
            statusText.textContent = 'Desconectado';
            break;
        case 'connecting':
            connectionStatus.classList.add('connecting');
            statusIcon.className = 'fas fa-spinner';
            statusText.textContent = 'Conectando...';
            break;
    }
}

// Adicionar notificação à interface
function addNotification(type, title, message, timestamp, details = {}) {
    if (!notificationsContainer) return;
    
    // Remover mensagem "sem notificações" se existir
    const noNotifications = notificationsContainer.querySelector('.no-notifications');
    if (noNotifications) {
        noNotifications.remove();
    }
    
    // Criar elemento da notificação
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-item new';
    
    // Ícone baseado no tipo
    const iconClass = {
        'user': 'fas fa-user-plus',
        'attendance': 'fas fa-check-circle',
        'system': 'fas fa-cog',
        'error': 'fas fa-exclamation-triangle'
    }[type] || 'fas fa-bell';
    
    // Formatear timestamp
    const timeString = new Date(timestamp).toLocaleString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Criar detalhes adicionais
    let detailsHTML = '';
    if (details.email) {
        detailsHTML += `<span class="notification-tag email"><i class="fas fa-envelope"></i> ${details.email}</span>`;
    }
    if (details.confidence) {
        detailsHTML += `<span class="notification-tag confidence"><i class="fas fa-percentage"></i> ${details.confidence}</span>`;
    }
    
    notificationElement.innerHTML = `
        <div class="notification-icon ${type}">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <div class="notification-time">
                <i class="fas fa-clock"></i>
                ${timeString}
            </div>
            ${detailsHTML ? `<div class="notification-details">${detailsHTML}</div>` : ''}
        </div>
    `;
    
    // Adicionar ao topo da lista
    notificationsContainer.insertBefore(notificationElement, notificationsContainer.firstChild);
    
    // Remover classe "new" após animação
    setTimeout(() => {
        notificationElement.classList.remove('new');
    }, 1000);
    
    // Limitar número de notificações (máximo 50)
    const notifications = notificationsContainer.querySelectorAll('.notification-item');
    if (notifications.length > 50) {
        notifications[notifications.length - 1].remove();
    }
    
    // Scroll para o topo
    notificationsContainer.scrollTop = 0;
}

// Limpar todas as notificações
function clearAllNotifications() {
    if (!notificationsContainer) return;
    
    // Remover todas as notificações
    const notifications = notificationsContainer.querySelectorAll('.notification-item');
    notifications.forEach(notification => notification.remove());
    
    // Adicionar mensagem "sem notificações"
    const noNotifications = document.createElement('div');
    noNotifications.className = 'no-notifications';
    noNotifications.innerHTML = `
        <i class="fas fa-bell-slash"></i>
        <p>Nenhuma notificação recente</p>
    `;
    notificationsContainer.appendChild(noNotifications);
}

// Desconectar Socket.IO quando administrador faz logout
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        isSocketConnected = false;
        updateConnectionStatus('disconnected');
    }
}

// Modificar função de login do administrador para inicializar Socket.IO
const originalAdminLogin = adminLoginForm.onsubmit;
adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
        showResultModal('Erro!', 'Preencha todos os campos', 'error');
        return;
    }
    
    showLoadingModal('Fazendo login...');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        hideLoadingModal();
        
        if (result.success) {
            adminToken = result.token;
            localStorage.setItem('adminToken', adminToken);
            
            showAdminPanel();
            loadAdminStats();
            
            // Inicializar Socket.IO para notificações em tempo real
            initializeSocket();
            
            showResultModal('Sucesso!', 'Login realizado com sucesso', 'success');
        } else {
            showResultModal('Erro!', result.message, 'error');
        }
    } catch (error) {
        hideLoadingModal();
        console.error('Erro no login:', error);
        showResultModal('Erro!', 'Erro de conexão com o servidor', 'error');
    }
});

// Modificar função de logout para desconectar Socket.IO
const originalLogout = adminLogoutBtn.onclick;
adminLogoutBtn.addEventListener('click', function() {
    disconnectSocket();
    clearAdminSession();
    showResultModal('Logout', 'Logout realizado com sucesso', 'success');
});

// Verificar se já existe token de administrador ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
        adminToken = savedToken;
        
        // Verificar se token ainda é válido
        fetch('/api/admin/stats/overview', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        }).then(response => {
            if (response.ok) {
                showAdminPanel();
                loadAdminStats();
                initializeSocket();
            } else {
                localStorage.removeItem('adminToken');
                adminToken = null;
            }
        }).catch(error => {
            console.error('Erro ao verificar token:', error);
            localStorage.removeItem('adminToken');
            adminToken = null;
        });
    }
});

