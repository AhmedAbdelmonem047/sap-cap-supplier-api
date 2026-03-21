const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const express = require('express');

const SECRET_KEY = 'super-secret-key';
const LOG = cds.log('server');

cds.on('bootstrap', async (app) => {
    app.use(express.json());

    app.use((req, res, next) => {
        const authHeader = req.headers.authorization;
        // Check for Bearer token first (API clients: Postman)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                req.user = new cds.User({
                    id: decoded.username,
                    roles: decoded.roles || []
                });
                LOG.debug('User authenticated', decoded.username);
            } catch (err) {
                LOG.warn('Invalid or expired JWT provided', err.message);
                return res.status(401).json({ error: 'Invalid or expired JWT' });
            }
            // For browser-based access
        } else if (authHeader && authHeader.startsWith('Basic ')) {
            // Check password for any basic auth challenge (browser popup)
            const [username, password] = Buffer.from(authHeader.substring(6), 'base64').toString().split(':');
            if (password === 'admin') {
                req.user = new cds.User({ id: username, roles: ['admin'] });
                delete req.headers.authorization; // Remove basic auth header to prevent interference with OData auth
                LOG.debug('User authenticated via Basic Auth', username);
            } else {
                res.setHeader('WWW-Authenticate', 'Basic realm="Users"');
                LOG.warn(`Failed Basic Auth attempt for user: ${username}`);
                return res.status(401).send('Password must be "admin"');
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
            LOG.info(`User ${username} logged in successfully.`);
            res.status(200).json({ token });
        } else {
            LOG.warn(`Failed login for username: ${username}`);
            res.status(401).json({ error: 'Invalid credentials. Use password "admin"' });
        }
    });
});