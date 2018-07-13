import * as express from 'express'
import * as bodyParser from 'body-parser'
import { v4 as uuid } from 'node-uuid';

import checkSigned from './check-signed'

const publicKey = process.env.CTRL_PUBLIC_KEY
const data = {
  CTRL_PUBLIC_KEY: []
}

const checkSig = checkSigned(publicKey)

const app = express()

// make sure we can still get public ip address from connections
app.enable('trust proxy')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.all('*', (req, res, next) => {
  if (req.hostname.startsWith('localhost')) {
    return next()
  }

  if (req.headers['x-forwarded-proto'] === 'https') {
    return next()
  }

  return res.redirect(`https://${req.hostname}${req.url}`)
})

const getPublicKey = (req: any) => {
  return req.headers['x-ctrl-key'].toString();
}

app.use('/get', checkSig)
app.use('/clean', checkSig)

app.get('/get', (req, res) => {
  const key = getPublicKey(req)

  if (!(key in data)) return res.status(404).send('bench not found')

  res.send(data[key])
})

app.post('/', (req, res) => {
  if (typeof req.body === 'object' && req.body.data && req.body.key) {
    const d = { id: uuid(), received: new Date(), data: req.body.data }
    data[req.body.key].push(d)
    return res.send(d)
  }

  res.status(500).send('no data submitted')
})

app.post('/clean', (req, res) => {
  const key = getPublicKey(req)

  if (!(key in data)) return res.status(404).send('bench not found')

  delete data[key]
  data[key] = []

  return res.send('bench emptied')
});

app.post('create', (req, res) => {
  if (!(typeof req.body === 'object' && req.body.key)) return res.status(400).send('missing valid public key')

  const key = req.body.key
  if (key in data) return res.status(409).send('bench already exists')

  data[key] = []
  return res.send('bench created')
})

module.exports = app
