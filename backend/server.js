const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const digimonRoutes = require('./routes/digimonRoutes');
const enemyRoutes = require('./routes/enemyRoutes');
const battleRoutes = require('./routes/battleRoutes');
const userRoutes = require('./routes/userRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const mapRoutes = require('./routes/mapRoutes');
const gameSettingsRoutes = require('./routes/gameSettingsRoutes');
const itemRoutes = require('./routes/itemRoutes');
const chatRoutes = require('./routes/chatRoutes');
const newsRoutes = require('./routes/newsRoutes');
const rolesRoutes = require('./routes/rolesRoutes');

const http = require('http');
const socketHandler = require('./socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketHandler(server);

const path = require('path');
const axios = require('axios'); // Import Axios for proxy

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('Serving static files from:', path.join(__dirname, 'public/assets'));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// --- SOLUÇÃO PARA DEV LOCAL ---
// Proxy reverso: O backend local baixa a imagem do servidor de produção e entrega para o navegador.
// Isso contorna bloqueios de navegador (CORS/Mixed Content) e não requer baixar arquivos manualmente.
app.use('/assets', async (req, res) => {
    try {
        const prodUrl = `http://76.13.69.121:3000/assets${req.path}`;
        const response = await axios({
            method: 'get',
            url: prodUrl,
            responseType: 'stream'
        });
        
        // Repassa os headers relevantes (Content-Type, etc)
        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        // console.error(`[DEV Proxy] Falha ao buscar ${req.path}:`, error.message);
        res.status(404).send('Image not found on production server');
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/digimons', digimonRoutes);
app.use('/api/enemies', enemyRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/adoption', adoptionRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/settings', gameSettingsRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/roles', rolesRoutes);

app.get('/', (req, res) => {
    res.send('Digimon API is running');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
