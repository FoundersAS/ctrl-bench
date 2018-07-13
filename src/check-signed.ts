const EllipticCurve = require('elliptic').ec
const ecurve = new EllipticCurve('secp256k1')

export default (publicKey: string) => {
  return (req, res, next) => {
    if (req.headers['x-ctrl-key'] && req.headers['x-ctrl-signature']) {
      req.publicKey = req.headers['x-ctrl-key'].toString()

      const derSig = JSON.parse(req.headers['x-ctrl-signature'])
      const keyFromPublic = ecurve.keyFromPublic(publicKey, 'hex')
      if (keyFromPublic.verify(req.originalUrl, derSig)) return next()
    }
    res.status(400).send('no-access')
  }
};
