"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const node_uuid_1 = require("node-uuid");
const check_signed_1 = require("./check-signed");
const publicKey = process.env.CTRL_PUBLIC_KEY;
const data = {
    received: []
};
const checkSig = check_signed_1.default(publicKey);
const app = express();
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
app.use('/list', checkSig);
app.use('/deleteAll', checkSig);
app.get('/list', (req, res) => {
    res.send(data);
});
app.post('/', (req, res) => {
    if (typeof req.body === 'object' && req.body.data) {
        const d = { id: node_uuid_1.v4(), received: new Date(), data: req.body.data };
        data.received.push(d);
        return res.send(d);
    }
    res.send('no data submitted');
});
app.post('/deleteAll', (req, res) => {
    delete data.received;
    data.received = [];
});
module.exports = app;
