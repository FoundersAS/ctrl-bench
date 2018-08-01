"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elliptic_1 = require("elliptic");
const ecurve = new elliptic_1.ec('secp256k1');
function checkSigned(req, res, next) {
    if (req.headers['x-ctrl-key'] && req.headers['x-ctrl-signature']) {
        req.publicKey = req.headers['x-ctrl-key'].toString();
        const derSig = JSON.parse(req.headers['x-ctrl-signature'].toString());
        const keyFromPublic = ecurve.keyFromPublic(req.publicKey, 'hex');
        if (keyFromPublic.verify(req.originalUrl, derSig)) {
            return next();
        }
        return res.status(400).send('could not verify signature');
    }
    res.status(400).send('no-access');
}
exports.checkSigned = checkSigned;
