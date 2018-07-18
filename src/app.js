"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const uuid_1 = require("uuid");
const cors = require('cors');
const check_signed_1 = require("./check-signed");
const defaultPublicKey = process.env.CTRL_PUBLIC_KEY;
const data = {};
data[defaultPublicKey] = [];
const app = express();
app.use(cors());
// make sure we can still get public ip address from connections
app.enable('trust proxy');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.all('*', (req, res, next) => {
    if (req.hostname.startsWith('localhost')) {
        return next();
    }
    if (req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }
    return res.redirect(`https://${req.hostname}${req.url}`);
});
app.use('/get', check_signed_1.checkSigned);
app.use('/clean', check_signed_1.checkSigned);
// Get everything from a bench bench || requires headers x-ctrl-signature and x-ctrl-key
app.get('/get', (req, res) => {
    const key = req.publicKey;
    if (!(key in data))
        return res.status(404).send('bench not found');
    res.send(data[key]);
});
// Delete everythin in bench || requires headers x-ctrl-signature and x-ctrl-key
app.post('/clean', (req, res) => {
    const key = req.publicKey;
    if (!(key in data))
        return res.status(404).send('bench not found');
    data[key] = [];
    return res.send('bench emptied');
});
// Create new bench from public key
app.post('/create', (req, res) => {
    if (!(typeof req.body === 'object' && req.body.key))
        return res.status(400).send('missing valid public key');
    const key = req.body.key;
    if (key in data)
        return res.status(409).send('bench already exists');
    data[key] = [];
    return res.send('bench created');
});
// Post to a bench must provide public key + data blob
app.post('/', (req, res) => {
    if (typeof req.body === 'object' && req.body.data && req.body.key) {
        const d = { id: uuid_1.v4(), received: new Date(), data: req.body.data };
        data[req.body.key].push(d);
        return res.send(d);
    }
    res.status(500).send('no data submitted');
});
module.exports = app;
