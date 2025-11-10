# Sistema de Controle de Presença - Reconhecimento Facial

Um aplicativo Node.js completo e avançado para controle de presença através de reconhecimento facial, utilizando vetores faciais para identificação precisa de usuários. O sistema inclui painel administrativo completo, geração de relatórios, API para integração, notificações em tempo real e backup automático.

## 🚀 Características Principais

### 🔍 Reconhecimento Facial Avançado
- **Tecnologia de Ponta**: Utiliza face-api.js com TensorFlow.js para extração de vetores faciais de 128 dimensões
- **Alta Precisão**: Algoritmo de distância euclidiana para comparação facial com precisão de ~99.38% no benchmark LFW
- **Processamento Local**: Todo o processamento facial é realizado localmente para máxima privacidade
- **Detecção Robusta**: Suporte a diferentes ângulos, iluminação e expressões faciais

### 📷 Captura Flexível de Imagens
- **Captura via Webcam**: Funcionalidade completa para capturar fotos diretamente da webcam do usuário
- **Upload de Arquivos**: Suporte tradicional para upload com drag-and-drop e preview
- **Dupla Opção**: Interface unificada permitindo escolha entre webcam e upload
- **Controles Intuitivos**: Botões para ativar câmera, capturar foto, tirar novamente e parar câmera
- **Compatibilidade**: Funciona em desktop e dispositivos móveis

### 🔐 Sistema de Autenticação Administrativo
- **Login Seguro**: Autenticação JWT com hash bcrypt para senhas
- **Controle de Acesso**: Middleware de autenticação para proteger rotas administrativas
- **Sessões Persistentes**: Tokens JWT com expiração configurável
- **Usuário Padrão**: Administrador criado automaticamente (admin/admin123)
- **Segurança**: Proteção contra ataques de força bruta e injeção

### 📊 Dashboard com Estatísticas Avançadas
- **Métricas em Tempo Real**: Estatísticas de usuários, presenças e reconhecimentos
- **Gráficos Interativos**: Visualizações com Chart.js para análise de dados
- **Análise Temporal**: Gráficos de presença por dia, semana e mês
- **Indicadores de Performance**: Taxa de sucesso de reconhecimento e tempo médio
- **Exportação de Dados**: Capacidade de exportar estatísticas em diferentes formatos

### 📄 Geração de Relatórios Profissionais
- **Múltiplos Formatos**: Geração de relatórios em PDF, CSV e XLSX
- **Relatórios Personalizados**: Filtros por data, usuário e tipo de evento
- **Design Profissional**: Relatórios PDF com cabeçalho, rodapé e formatação elegante
- **Dados Estruturados**: CSV e XLSX com colunas organizadas para análise
- **Download Automático**: Interface web para geração e download instantâneo

### 🔗 API RESTful para Integração
- **Documentação Swagger**: API totalmente documentada com Swagger UI
- **Autenticação por API Key**: Sistema seguro de chaves de API para integração
- **Endpoints Completos**: CRUD completo para usuários, presenças e estatísticas
- **Versionamento**: API versionada (v1) para compatibilidade futura
- **Rate Limiting**: Proteção contra abuso com limitação de requisições

### 🔔 Notificações em Tempo Real
- **WebSocket (Socket.io)**: Comunicação bidirecional em tempo real
- **Eventos Instantâneos**: Notificações para cadastros, reconhecimentos e presenças
- **Interface Responsiva**: Painel de notificações no dashboard administrativo
- **Histórico**: Armazenamento e exibição de notificações recentes
- **Filtros**: Categorização por tipo de evento e importância

### 💾 Backup Automático e Gerenciamento
- **Backup Automático**: Cron job configurado para backup diário às 2h da manhã
- **Múltiplas Estratégias**: Scripts para backup completo e incremental
- **Interface de Gerenciamento**: Painel web para criar, listar, restaurar e excluir backups
- **Logs Detalhados**: Sistema de logging para monitoramento de backups
- **Armazenamento Seguro**: Backups organizados por data com compressão

### 🌐 Interface Web Moderna
- **Design Responsivo**: Interface adaptável para desktop, tablet e mobile
- **UX/UI Avançada**: Animações suaves, transições elegantes e feedback visual
- **Navegação Intuitiva**: Sistema de abas para organização das funcionalidades
- **Acessibilidade**: Suporte a leitores de tela e navegação por teclado
- **Temas**: Interface com gradientes modernos e paleta de cores profissional

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript para servidor
- **Express.js** - Framework web minimalista e flexível
- **MongoDB** - Banco de dados NoSQL para armazenamento
- **Mongoose** - ODM elegante para MongoDB
- **face-api.js** - Biblioteca de reconhecimento facial com TensorFlow.js
- **TensorFlow.js** - Machine learning em JavaScript
- **Canvas** - Processamento e manipulação de imagens
- **Multer** - Middleware para upload de arquivos
- **bcryptjs** - Hash seguro de senhas
- **jsonwebtoken** - Implementação JWT para autenticação
- **Socket.io** - Comunicação em tempo real via WebSocket
- **PDFKit** - Geração de documentos PDF
- **ExcelJS** - Criação e manipulação de planilhas Excel
- **csv-writer** - Geração de arquivos CSV
- **swagger-jsdoc** - Documentação automática da API
- **swagger-ui-express** - Interface web para documentação Swagger
- **node-cron** - Agendamento de tarefas (cron jobs)

### Frontend
- **HTML5** - Estrutura semântica da página
- **CSS3** - Estilização moderna com Flexbox, Grid e animações
- **JavaScript ES6+** - Interatividade e comunicação com API
- **Chart.js** - Biblioteca para gráficos e visualizações
- **Socket.io Client** - Cliente WebSocket para notificações em tempo real
- **Font Awesome** - Biblioteca de ícones vetoriais
- **Fetch API** - Requisições HTTP modernas
- **Canvas API** - Manipulação de imagens no frontend

### Ferramentas de Desenvolvimento
- **npm** - Gerenciador de pacotes
- **nodemon** - Reinicialização automática durante desenvolvimento
- **ESLint** - Linting de código JavaScript
- **Prettier** - Formatação automática de código

## 📁 Estrutura do Projeto

```
facial-recognition-app/
├── server.js                    # Servidor principal com todas as rotas
├── package.json                 # Dependências e scripts do projeto
├── README.md                    # Documentação completa
├── .gitignore                   # Arquivos ignorados pelo Git
├── models/                      # Modelos pré-treinados do face-api.js
│   ├── ssd_mobilenetv1_model-*  # Modelo de detecção facial
│   ├── face_landmark_68_model-* # Modelo de pontos faciais
│   └── face_recognition_model-* # Modelo de reconhecimento facial
├── public/                      # Arquivos estáticos do frontend
│   ├── index.html              # Interface principal da aplicação
│   ├── styles.css              # Estilos CSS responsivos
│   └── script.js               # JavaScript do frontend
├── uploads/                     # Diretório para arquivos temporários
├── scripts/                     # Scripts de automação e backup
│   ├── backup.sh               # Script de backup do MongoDB
│   ├── restore.sh              # Script de restauração
│   └── backup-manager.js       # Gerenciador de backup em Node.js
├── backups/                     # Diretório de armazenamento de backups
└── logs/                        # Logs do sistema e backups
```

## 🔧 Instalação e Configuração

### Pré-requisitos

1. **Node.js** (versão 14 ou superior)
2. **MongoDB** (versão 4.4 ou superior)
3. **npm** (incluído com Node.js)
4. **Git** (para clonagem do repositório)

### Instalação Passo a Passo

1. **Clone o repositório**:
```bash
git clone <url-do-repositorio>
cd facial-recognition-app
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure o MongoDB**:
```bash
# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS (com Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB
```

4. **Configure as variáveis de ambiente** (opcional):
```bash
# Crie um arquivo .env na raiz do projeto
echo "JWT_SECRET=seu_jwt_secret_aqui" > .env
echo "MONGODB_URI=mongodb://localhost:27017/facial_recognition" >> .env
echo "PORT=3000" >> .env
```

5. **Inicie a aplicação**:
```bash
npm start
# ou para desenvolvimento
npm run dev
```

6. **Acesse a aplicação**:
   - Interface Web: http://localhost:3000
   - Documentação da API: http://localhost:3000/api-docs
   - Login Admin: admin / admin123

### Configuração de Backup Automático

1. **Configure o cron job** (Linux/macOS):
```bash
# Edite o crontab
crontab -e

# Adicione a linha para backup diário às 2h da manhã
0 2 * * * /caminho/para/facial-recognition-app/scripts/backup.sh
```

2. **Teste o backup manualmente**:
```bash
cd facial-recognition-app
./scripts/backup.sh
```

## 📖 Guia de Uso

### Para Usuários Finais

#### Cadastro de Usuário
1. Acesse a aba "Cadastro"
2. Preencha nome completo e email
3. Escolha entre "Upload" ou "Webcam" para a foto
4. Para webcam: clique em "Ativar Câmera", posicione o rosto e clique "Capturar Foto"
5. Para upload: arraste a imagem ou clique para selecionar
6. Clique em "Cadastrar Usuário"

#### Reconhecimento de Presença
1. Acesse a aba "Reconhecimento"
2. Escolha entre "Upload" ou "Webcam" para a foto
3. Capture ou faça upload da foto
4. O sistema identificará automaticamente o usuário e registrará a presença

#### Visualização de Dados
- **Usuários**: Lista todos os usuários cadastrados
- **Presenças**: Histórico completo de registros de presença

### Para Administradores

#### Acesso ao Painel Administrativo
1. Clique na aba "Admin"
2. Faça login com as credenciais (padrão: admin/admin123)
3. Acesse o dashboard completo com estatísticas e controles

#### Geração de Relatórios
1. No painel administrativo, vá para "Relatórios"
2. Selecione o período desejado
3. Escolha o formato (PDF, CSV ou XLSX)
4. Clique em "Gerar Relatório" para download

#### Gerenciamento de Backup
1. Acesse a seção "Gerenciamento de Backup"
2. Visualize estatísticas e lista de backups
3. Crie backups manuais ou configure automáticos
4. Restaure ou exclua backups conforme necessário

#### Monitoramento em Tempo Real
- Visualize notificações instantâneas de novos cadastros e reconhecimentos
- Acompanhe estatísticas em tempo real no dashboard
- Monitore logs de backup e sistema

## 🔌 API para Integração

### Autenticação

Todas as rotas da API requerem autenticação via API Key no header:
```
X-API-Key: sua_chave_api_aqui
```

### Endpoints Principais

#### Usuários
- `GET /api/v1/users` - Listar usuários
- `POST /api/v1/users` - Criar usuário
- `GET /api/v1/users/:id` - Obter usuário específico
- `PUT /api/v1/users/:id` - Atualizar usuário
- `DELETE /api/v1/users/:id` - Excluir usuário

#### Presenças
- `GET /api/v1/attendance` - Listar presenças
- `POST /api/v1/attendance` - Registrar presença
- `GET /api/v1/attendance/:id` - Obter presença específica

#### Estatísticas
- `GET /api/v1/stats/overview` - Estatísticas gerais
- `GET /api/v1/stats/daily` - Estatísticas diárias
- `GET /api/v1/stats/users` - Estatísticas de usuários

### Exemplo de Uso da API

```javascript
// Listar usuários
const response = await fetch('/api/v1/users', {
    headers: {
        'X-API-Key': 'sua_chave_api',
        'Content-Type': 'application/json'
    }
});
const users = await response.json();

// Registrar presença
const attendance = await fetch('/api/v1/attendance', {
    method: 'POST',
    headers: {
        'X-API-Key': 'sua_chave_api',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        userId: 'user_id_aqui',
        timestamp: new Date().toISOString()
    })
});
```

## 🔒 Segurança e Privacidade

### Proteção de Dados
- **Vetores Faciais**: Apenas vetores matemáticos são armazenados, não imagens
- **Criptografia**: Senhas protegidas com bcrypt (salt rounds: 10)
- **JWT**: Tokens com expiração configurável para sessões seguras
- **HTTPS**: Suporte completo para SSL/TLS em produção
- **Sanitização**: Validação e sanitização de todas as entradas

### Conformidade
- **LGPD/GDPR**: Armazenamento mínimo de dados pessoais
- **Anonimização**: Possibilidade de anonimizar dados históricos
- **Auditoria**: Logs completos de todas as operações
- **Backup Seguro**: Backups criptografados e com retenção configurável

### Boas Práticas Implementadas
- Rate limiting para prevenir ataques de força bruta
- Validação rigorosa de entrada de dados
- Escape de caracteres especiais
- Headers de segurança HTTP
- Monitoramento de tentativas de acesso não autorizado

## 🚀 Deploy em Produção

### Configuração do Servidor

1. **Servidor Linux** (Ubuntu 20.04+ recomendado):
```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instale MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Instale PM2 para gerenciamento de processos
sudo npm install -g pm2
```

2. **Configure o MongoDB**:
```bash
sudo systemctl start mongod
sudo systemctl enable mongod

# Configure autenticação (recomendado)
mongo
> use admin
> db.createUser({user: "admin", pwd: "senha_segura", roles: ["userAdminAnyDatabase"]})
> exit
```

3. **Configure a aplicação**:
```bash
# Clone e configure
git clone <repositorio>
cd facial-recognition-app
npm install --production

# Configure variáveis de ambiente
sudo nano /etc/environment
# Adicione:
# JWT_SECRET=jwt_secret_muito_seguro
# MONGODB_URI=mongodb://admin:senha@localhost:27017/facial_recognition?authSource=admin
# NODE_ENV=production
# PORT=3000
```

4. **Configure PM2**:
```bash
# Inicie com PM2
pm2 start server.js --name "facial-recognition"

# Configure para iniciar automaticamente
pm2 startup
pm2 save

# Monitore a aplicação
pm2 monit
```

### Configuração do Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS com Let's Encrypt

```bash
# Instale Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenha certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Configure renovação automática
sudo crontab -e
# Adicione: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento e Logs

### Logs do Sistema
- **Aplicação**: Logs detalhados em `/logs/app.log`
- **Backup**: Logs de backup em `/logs/backup.log`
- **Acesso**: Logs de acesso em `/logs/access.log`
- **Erro**: Logs de erro em `/logs/error.log`

### Métricas de Performance
- Tempo médio de reconhecimento facial
- Taxa de sucesso de identificação
- Número de usuários ativos
- Frequência de uso por período

### Alertas Configuráveis
- Falhas de backup
- Tentativas de acesso não autorizado
- Erros de reconhecimento facial
- Uso excessivo de recursos

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro de Conexão com MongoDB
```bash
# Verifique se o MongoDB está rodando
sudo systemctl status mongod

# Reinicie se necessário
sudo systemctl restart mongod

# Verifique logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### Problemas de Reconhecimento Facial
- Verifique se os modelos estão na pasta `/models/`
- Certifique-se de que as imagens têm boa qualidade
- Verifique se há faces detectáveis na imagem

#### Problemas de Performance
- Monitore uso de CPU e memória
- Configure cache para melhor performance
- Otimize consultas ao banco de dados

#### Problemas de Backup
```bash
# Verifique permissões
ls -la /caminho/para/backups/

# Teste backup manual
./scripts/backup.sh

# Verifique logs
tail -f /logs/backup.log
```

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use ESLint para linting
- Siga as convenções de nomenclatura JavaScript
- Documente funções complexas
- Escreva testes para novas funcionalidades

## 📝 Changelog

### Versão 2.0.0 (Atual)
- ✅ Adicionada autenticação de administrador com JWT
- ✅ Implementado sistema de relatórios (PDF, CSV, XLSX)
- ✅ Criada API RESTful com documentação Swagger
- ✅ Desenvolvido dashboard com estatísticas e gráficos
- ✅ Implementadas notificações em tempo real com Socket.io
- ✅ Configurado backup automático com interface de gerenciamento
- ✅ Melhorada interface com design responsivo
- ✅ Adicionado sistema de logs e monitoramento

### Versão 1.1.0
- ✅ Adicionada funcionalidade de captura via webcam
- ✅ Implementado sistema de abas na interface
- ✅ Melhorado design responsivo
- ✅ Adicionados controles avançados de webcam

### Versão 1.0.0
- ✅ Reconhecimento facial básico
- ✅ Cadastro e identificação de usuários
- ✅ Interface web simples
- ✅ Armazenamento em MongoDB

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- Margefson Barros

## 🙏 Agradecimentos

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Biblioteca de reconhecimento facial
- [TensorFlow.js](https://www.tensorflow.org/js) - Machine learning em JavaScript
- [MongoDB](https://www.mongodb.com/) - Banco de dados NoSQL
- [Express.js](https://expressjs.com/) - Framework web para Node.js
- [Chart.js](https://www.chartjs.org/) - Biblioteca de gráficos
- [Socket.io](https://socket.io/) - Comunicação em tempo real

## 📞 Suporte

Para suporte técnico, dúvidas ou sugestões:
- Abra uma issue no GitHub
- Consulte a documentação da API em `/api-docs`
- Verifique os logs do sistema para diagnóstico


