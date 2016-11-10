var term,
    protocol,
    socketURL,
    socket,
    pid,
    checked = {}

const hosts = 10

var terminalContainer = document.getElementById('terminal-container')
var hostsContainer = document.getElementById('hosts-container');

(() => {
  for (var i = 5; i < hosts; i++) {
    hostsContainer.innerHTML += `<div id='host-${i}'>10.1.10.${i} </div><div id='docker-${i}'></div>`
    fetch(`/check?address=${i}`)
      .then((res) => {
        if(res.status !== 200) {
          console.log('error')
        } else {
          res.json().then((data) => {
            checked[data.address] = data.docker
            if (data.docker) {
              document.getElementById(`host-${data.address}`).addEventListener('click', () => {
                createTerminal(data.address)
              })
            }
            document.getElementById(`host-${data.address}`).innerText +=
              data.docker === 0 ? '无效' : '可连'
          })
        }
      })
  }
})();


createTerminal()
function createTerminal(ip, id) {
  // Clean terminal
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0])
  }

  term = new Terminal({ cursorBlink: 1 })

  protocol  = (location.protocol === 'https:') ? 'wss://' : 'ws://'
  socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/'

  term.open(terminalContainer)
  term.fit()

  var initialGeometry = term.proposeGeometry()

  fetch(`/terminals?cols=${initialGeometry.cols}&rows=${initialGeometry.rows}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ip, id })
    }).then((res) => {
      res.text().then((data) => {
        if (ip && !id) {
          var data = data.split('\\r\\n')
          document.getElementById(`docker-${ip}`).innerHTML = ''
          for (var i = 1; i < data.length - 1; i++) {
            if (data[i].substring(0, 12) === 'CONTAINER ID' || data[i] === '' || data[i][0] ==='\\') {
              console.log(i, data[i])
            } else {
              document.getElementById(`docker-${ip}`).innerHTML +=
              `<li id='docker-${ip}-${i}'>${data[i].substring(0, 12)}</li>`
            }
          }
          for (var i = 1; i < data.length - 1; i++) {
            if (!(data[i].substring(0, 12) === 'CONTAINER ID' || data[i] === '' || data[i][0] ==='\\')) {
              document.getElementById(`docker-${ip}-${i}`).addEventListener('click', (e) => {
                createTerminal(ip, e.target.innerText)
              })
            }
          }
        } else {
          data = JSON.parse(data)
          window.pid = data.pid
          socketURL += data.pid
          console.log('socketURL:', socketURL)

          // webSocket connect
          socket = new WebSocket(socketURL)
          socket.onopen = runRealTerminal
          socket.onclose = errorTerminal
          socket.onerror = errorTerminal
        }
      })
    })

  function runRealTerminal() {
    term.attach(socket)
    term._initialized = true
  }

  function errorTerminal() {
    term.writeln('Error happen, plz fresh page.')
    term.writeln('')

    term.on('key', function (key, ev) {
      var printable = (
        !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
      )

      if (ev.keyCode == 13) {
        term.writeln('Error happen, plz fresh page.')
        term.writeln('\n')
      } else if (ev.keyCode == 8) {
        term.write('\b \b') // ?
      } else if (printable) {
        term.write(key)
      }
    })

    term.on('paste', function (data, ev) {
      term.write(data)
    })
  }
}
