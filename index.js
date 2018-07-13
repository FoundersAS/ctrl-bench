require('load-environment')

const app = require('./src/app')

const server = require('http').createServer(app)

const port = process.env.PORT || 8001;
server.listen(port, () => {
  console.log(`Listening at port: ${port}`)
})
