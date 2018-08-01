"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const uuid_1 = require("uuid");
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
    if (!(key in data)) {
        return res.status(404).send('bench not found');
    }
    res.send(data[key]);
});
// Delete everythin in bench || requires headers x-ctrl-signature and x-ctrl-key
app.post('/clean', (req, res) => {
    const key = req.publicKey;
    if (!(key in data)) {
        return res.status(404).send('bench not found');
    }
    data[key] = [];
    return res.send('bench emptied');
});
// Post to a bench must provide public key + data blob
app.post('/', (req, res) => {
    if (typeof req.body === 'object' && req.body.data && req.body.key) {
        const key = req.body.key;
        if (!(key in data)) {
            data[key] = [];
        }
        const d = { id: uuid_1.v4(), received: new Date(), data: req.body.data };
        data[key].push(d);
        return res.send(d);
    }
    res.status(500).send('no data submitted');
});
module.exports = app;
