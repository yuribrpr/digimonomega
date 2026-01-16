const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper to find the correct table name for user digimons
async function getUserDigimonTable() {
    const [rows] = await db.execute("SHOW TABLES LIKE '%user%digimon%'");
    if (rows.length > 0) {
        return Object.values(rows[0])[0];
    }
    return 'user_digimons'; // Fallback
}

exports.register = async (req, res) => {
  try {
    const { username, email, password, starterId, nickname } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }
    
    // Validate starterId
    if (!starterId || ![1, 5, 13].includes(Number(starterId))) {
         return res.status(400).json({ message: 'Please select a valid starter Digimon (Agumon, Gaomon, or Lalamon)' });
    }

    // Check if user exists
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    const userId = result.insertId;

    // Create Starter Digimon
    try {
        const table = await getUserDigimonTable();
        
        // Get base stats
        const [digiRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [starterId]);
        if (digiRows.length > 0) {
             const baseHp = digiRows[0].base_hp || 100;
             const baseAttack = digiRows[0].base_attack || 10;
             const baseDefense = digiRows[0].base_defense || 10;
             
             const digimonNickname = nickname || digiRows[0].name;

             // Insert with is_main = 1
             const sql = `INSERT INTO ${table} (user_id, digidex_id, nickname, level, exp, current_hp, max_hp, attack, defense, is_main) VALUES (?, ?, ?, 1, 0, ?, ?, ?, ?, 1)`;
             
             await db.execute(sql, [userId, starterId, digimonNickname, baseHp, baseHp, baseAttack, baseDefense]);
        }
    } catch (digiError) {
        console.error('Error creating starter digimon:', digiError);
    }

    // Give Starter Items (10x Basic Attack Chip, 10x Basic Defense Chip)
    try {
        const starterItems = [
            { itemId: 1, quantity: 10 }, // Chip de Ataque Básico
            { itemId: 4, quantity: 10 }  // Chip de Defesa Básico
        ];

        for (const item of starterItems) {
            await db.execute(
                'INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
                [userId, item.itemId, item.quantity]
            );
        }
    } catch (itemError) {
        console.error('Error giving starter items:', itemError);
    }

    // Auto-login logic
    const token = jwt.sign({ id: userId, username: username }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });
    
    // Fetch fresh user data
    const [freshUser] = await db.execute('SELECT id, username, email, bits, role, profile_image, exp, exp_m, level FROM users WHERE id = ?', [userId]);
    const userObj = freshUser[0] || { 
        id: userId, 
        username, 
        email, 
        bits: 0, 
        role: 'user', 
        profile_image: null,
        exp: 0,
        exp_m: 1000,
        level: 1
    };

    res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: userObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Check user
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('User found:', user.username);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful for:', username);

    // Fetch permissions
    let permissions = [];
    try {
        const [permRows] = await db.execute(`
            SELECT p.permission_key
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = ?
        `, [user.role || 'user']);
        
        permissions = permRows.map(row => row.permission_key);
    } catch (permError) {
        console.error('Error fetching permissions:', permError);
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, permissions }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            bits: user.bits || 0,
            role: user.role || 'user',
            profile_image: user.profile_image,
            permissions
        }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};
