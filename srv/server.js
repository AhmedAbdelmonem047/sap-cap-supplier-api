const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const express = require('express');

const SECRET_KEY = 'super-secret-key';

cds.on('bootstrap', async (app) => {
    app.use(express.json());

    app.use((req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                req.user = new cds.User({
                    id: decoded.username,
                    roles: decoded.roles || []
                });
            } catch (err) {
                return res.status(401).json({ error: 'Invalid or expired JWT' });
            }
        }
        next();
    });

    app.post('/api/login', (req, res) => {
        const { username, password } = req.body;

        if (username && password === 'admin') {
            const token = jwt.sign(
                { username, roles: ['admin'] },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            res.status(200).json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials. Use password "admin"' });
        }
    });
});