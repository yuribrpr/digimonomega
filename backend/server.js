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

dotenv.config();

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json());

console.log('Serving static files from:', path.join(__dirname, 'public/assets'));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

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

app.get('/', (req, res) => {
    res.send('Digimon API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
