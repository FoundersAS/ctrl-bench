import { ec as EllipticCurve } from 'elliptic'
import { NextFunction, Request, Response } from 'express'

const ecurve = new EllipticCurve('secp256k1')

export interface IBenchRequest extends Request {
  publicKey: string
}

export function checkSigned(req: IBenchRequest, res: Response, next: NextFunction) {
  if (req.headers['x-ctrl-key'] && req.headers['x-ctrl-signature']) {
    req.publicKey = req.headers['x-ctrl-key'].toString()
    const derSig = JSON.parse(req.headers['x-ctrl-signature'].toString())
    const keyFromPublic = ecurve.keyFromPublic(req.publicKey, 'hex')

    if (keyFromPublic.verify(req.originalUrl, derSig)) {
      return next()
    }

    return res.status(400).send('could not verify signature')
  }
  res.status(400).send('no-access')
}
