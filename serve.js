var os = require('os')
var app = require('./server/main.js')

const port = 3003
const host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0'

app.listen(port, host)
console.log(`Server is now running at http://${host}:${port}.`)
