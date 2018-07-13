import * as express from 'express'
import * as bodyParser from 'body-parser'
import { v4 as uuid } from 'node-uuid';

import checkSigned from './check-signed'

const publicKey = process.env.CTRL_PUBLIC_KEY
const data = {
  received: []
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

app.use('/list', checkSig)
app.use('/deleteAll', checkSig)

app.get('/list', (req, res) => {
  res.send(data)
})

app.post('/', (req, res) => {
  if (typeof req.body === 'object' && req.body.data) {
    const d = { id: uuid(), received: new Date(), data: req.body.data }
    data.received.push(d)
    return res.send(d)
  }
  res.send('no data submitted')
})

app.post('/deleteAll', (req, res) => {
  delete data.received;
  data.received = [];
});

module.exports = app
