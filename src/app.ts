import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import { v4 as uuid } from 'uuid'

import { checkSigned, IBenchRequest } from './check-signed'

interface IDataBucket {
  [key: string]: IBenchFile[]
}

interface IBenchFile {
  id: string
  received: Date
  data: any
}

const defaultPublicKey = process.env.CTRL_PUBLIC_KEY
const data = {} as IDataBucket
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
app.get('/get', (req: IBenchRequest, res) => {
  const key = req.publicKey

  if (!(key in data)) {
    return res.status(404).send('bench not found')
  }

  res.send(data[key])
})

// Delete everythin in bench || requires headers x-ctrl-signature and x-ctrl-key
app.post('/clean', (req: IBenchRequest, res) => {
  const key = req.publicKey

  if (!(key in data)) {
    return res.status(404).send('bench not found')
  }

  data[key] = []

  return res.send('bench emptied')
})

// Post to a bench must provide public key + data blob
app.post('/', (req, res) => {
  if (typeof req.body === 'object' && req.body.data && req.body.key) {
    const key = req.body.key
    if (!(key in data)) {
      data[key] = []
    }

    const d = { id: uuid(), received: new Date(), data: req.body.data } as IBenchFile

    data[key].push(d)
    return res.send(d)
  }

  res.status(500).send('no data submitted')
})

module.exports = app
