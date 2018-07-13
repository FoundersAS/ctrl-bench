import { NextFunction, Response, Request } from "express";

const EllipticCurve = require('elliptic').ec
const ecurve = new EllipticCurve('secp256k1')

export interface BenchRequest extends Request {
  publicKey: string
}

export function checkSigned (req: BenchRequest, res: Response, next: NextFunction) {
  if (req.headers['x-ctrl-key'] && req.headers['x-ctrl-signature']) {
    req.publicKey = req.headers['x-ctrl-key'].toString()
    const derSig = JSON.parse(req.headers['x-ctrl-signature'].toString())
    const keyFromPublic = ecurve.keyFromPublic(req.publicKey, 'hex')
    if (keyFromPublic.verify(req.originalUrl, derSig)) return next()
    return res.status(400).send('could not verify signature')
  }
  res.status(400).send('no-access')
}
