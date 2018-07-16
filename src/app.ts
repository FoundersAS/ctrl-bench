import * as express from 'express'
import * as bodyParser from 'body-parser'
import { v4 as uuid } from 'node-uuid'
const cors = require('cors')

import {checkSigned, BenchRequest} from './check-signed'

const defaultPublicKey = process.env.CTRL_PUBLIC_KEY
const data = {}
data[defaultPublicKey] = []

const app = express()

app.use(cors())

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

app.use('/get', checkSigned)
app.use('/clean', checkSigned)

// Get everything from a bench bench || requires headers x-ctrl-signature and x-ctrl-key
app.get('/get', (req: BenchRequest, res) => {
  const key = req.publicKey
  console.log(key)

  if (!(key in data)) return res.status(404).send('bench not found')

  res.send(data[key])
})

// Delete everythin in bench || requires headers x-ctrl-signature and x-ctrl-key
app.post('/clean', (req: BenchRequest, res) => {
  const key = req.publicKey

  if (!(key in data)) return res.status(404).send('bench not found')

  delete data[key]
  data[key] = []

  return res.send('bench emptied')
});

// Create new bench from public key
app.post('/create', (req, res) => {
  if (!(typeof req.body === 'object' && req.body.key)) return res.status(400).send('missing valid public key')

  const key = req.body.key
  if (key in data) return res.status(409).send('bench already exists')

  data[key] = []
  return res.send('bench created')
})

// Post to a bench must provide public key + data blob
app.post('/', (req, res) => {
  if (typeof req.body === 'object' && req.body.data && req.body.key) {
    const d = { id: uuid(), received: new Date(), data: req.body.data }
    data[req.body.key].push(d)
    return res.send(d)
  }

  res.status(500).send('no data submitted')
})

module.exports = app
