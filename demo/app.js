var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var expressWs = require('express-ws')(app)
var os = require('os')
var pty = require('pty.js')
var fetch = require('node-fetch')

var terminals = {},
    logs = {}

app.use(bodyParser.json())

app.use('/build', express.static(__dirname + '/../build'))
app.use('/addons', express.static(__dirname + '/../addons'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

app.get('/style.css', (req, res) => {
  res.sendFile(__dirname + '/style.css')
})

app.get('/main.js', (req, res) => {
  res.sendFile(__dirname + '/main.js')
})

app.get('/check', (req, res) => {
  var portCheck = {}
  fetch(`http://10.1.10.${req.query.address}:4243`)
    .then((response) => {
      res.send({
        address : req.query.address,
        docker  : 1
      })
      res.end()
    }).catch((response) => {
      res.send({
        address : req.query.address,
        docker  : 0
      })
      res.end()
    })
})


app.post('/terminals', (req, res) => {
  var cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: process.env.PWD,
        env: process.env
      })

  console.log('Created terminal with PID: ' + term.pid)
  terminals[term.pid] = term
  logs[term.pid] = ''

  if (req.body.ip) {
    if (req.body.id) {
      term.write(`DOCKER_HOST=10.1.10.${req.body.ip}:4243 docker exec -ti ${req.body.id} bash\n`)
    } else {
      term.write(`DOCKER_HOST=10.1.10.${req.body.ip}:4243 docker ps\n\n`)
    }
  }



  term.on('data', (data) => {
    logs[term.pid] += data
  })

  setTimeout(() => {
    console.log(logs[term.pid])
    res.send({ feedback: logs[term.pid], pid: term.pid.toString()})
    res.end()
  }, 500)
})



app.ws('/terminals/:pid', (ws, req) => {
  var term = terminals[parseInt(req.params.pid)]
  console.log('Connected to terminal ' + term.pid, logs[term.pid])

  ws.send(logs[term.pid])

  term.on('data', function(data) {
    try {
      ws.send(data)
    } catch (ex) {
    }
  })
  ws.on('message', function(msg) {
    term.write(msg)
  })
  ws.on('close', function () {
    console.log('||| => Closed ' + term.pid)
    process.kill(term.pid)
    delete terminals[term.pid]
    delete logs[term.pid]
  })
})

var port = process.env.PORT || 3003,
    host = os.platform() === 'win32' ? '127.0.0.1' : '0.0.0.0'

console.log('App listening to http://' + host + ':' + port)
app.listen(port, host)
