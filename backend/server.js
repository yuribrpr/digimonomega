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
const marketRoutes = require('./routes/marketRoutes');
const questRoutes = require('./routes/questRoutes');

const http = require('http');
const socketHandler = require('./socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketHandler(server);

const path = require('path');
const axios = require('axios');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('Serving static files from:', path.join(__dirname, 'public/assets'));
const localAssetsDir = path.join(__dirname, 'public/assets');
const enableAssetProxy = process.env.ENABLE_ASSET_PROXY === 'true';
const assetProxyBaseUrl = (process.env.ASSET_PROXY_BASE_URL || 'http://76.13.69.121:3000').replace(/\/$/, '');

app.use('/assets', express.static(localAssetsDir, {
    fallthrough: enableAssetProxy,
    etag: true,
    lastModified: true,
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '1h'
}));

if (enableAssetProxy) {
    console.log(`[assets] Production proxy enabled -> ${assetProxyBaseUrl}`);
    app.use('/assets', async (req, res) => {
        try {
            const prodUrl = `${assetProxyBaseUrl}/assets${req.path}`;
            const response = await axios({
                method: 'get',
                url: prodUrl,
                responseType: 'stream',
                timeout: 2500,
                validateStatus: (status) => status >= 200 && status < 500
            });

            if (response.status >= 400) {
                return res.status(response.status).send('Image not found on production server');
            }

            if (response.headers['content-type']) {
                res.set('Content-Type', response.headers['content-type']);
            }
            if (response.headers['cache-control']) {
                res.set('Cache-Control', response.headers['cache-control']);
            }

            response.data.pipe(res);
        } catch (error) {
            return res.status(404).send('Image not found on production server');
        }
    });
} else {
    console.log('[assets] Production proxy disabled. Serving local assets only.');
}

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
app.use('/api/market', marketRoutes);
app.use('/api/quests', questRoutes);

app.get('/', (req, res) => {
    res.send('Digimon API is running');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
