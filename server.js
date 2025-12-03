const bcrypt = require('bcrypt');
const saltRounds = 10;
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'game_mania',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no BD:', err);
        return;
    }
    console.log('Conectado ao banco de dados');
});

app.post('/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hash = await bcrypt.hash(senha, saltRounds);
        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        db.query(sql, [nome, email, hash], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
            }
            res.json({ message: 'Usuário cadastrado com sucesso!' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao criptografar a senha' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.senha);
            if (match) {
                return res.json({
                    success: true,
                    user: {
                        id: user.id,
                        nome: user.nome,
                        email: user.email,
                        is_admin: user.is_admin
                    }
                });
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
