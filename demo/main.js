const hosts = 100
var term,
    protocol,
    socketURL,
    socket,
    pid

var terminalContainer = document.getElementById('terminal-container')
var hostsContainer = document.getElementById('hosts-container');


(() => {
  document.getElementById('headTitle').addEventListener('click', function () {
    console.log('clear')
    Cookies.remove('dockerChecked')
  })

  var cookie = Cookies.get('dockerChecked')
  var checked = {}

  if (cookie) {
    cookie = JSON.parse(cookie)
    for (var i = 5; i < hosts; i++) {
      hostsContainer.innerHTML +=
        `<div class='host' id='host-${i}'> 10.1.10.${i} ${cookie[i] === 0 ? '无效': '可连'}</div>
        <div id='docker-${i}'></div>`
    }
    for (var i = 5; i < hosts; i++) {
      if (cookie[i] === 1) {
        document.getElementById(`host-${i}`).addEventListener('click', (e) => {
          document.getElementById('hosts-container').style.width = '90%'
          document.getElementById('hosts-container').style.zIndex = '1'
          document.getElementById('terminal-container').style.left = '90%'
          createTerminal(e.target.id.split('-')[1])
        })
      }
    }
  } else {
    for (var i = 5; i < hosts; i++) {
      hostsContainer.innerHTML +=
        `<div class='host' id='host-${i}'> 10.1.10.${i} </div><div id='docker-${i}'></div>`

      fetch(`/check?address=${i}`)
        .then((res) => {
          if(res.status !== 200) {
            console.log('error')
          } else {
            res.json().then((data) => {
              if (data.docker) {
                document.getElementById(`host-${data.address}`).addEventListener('click', () => {
                  document.getElementById('hosts-container').style.width = '90%'
                  document.getElementById('hosts-container').style.zIndex = '1'
                  document.getElementById('terminal-container').style.left = '90%'
                  createTerminal(data.address)
                })
              }
              document.getElementById(`host-${data.address}`).innerText +=
                data.docker === 0 ? '无效' : '可连'
              checked[data.address] = data.docker
              Cookies.set('dockerChecked', checked)
            })
          }
        })
    }
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
  var cols = initialGeometry.cols
  var rows = initialGeometry.rows

  fetch(`/terminals?cols=${cols}&rows=${rows}`,
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
          var flag = false
          document.getElementById(`docker-${ip}`).innerHTML = ''
          for (var i = 1; i < data.length; i++) {
            console.log(i, data[i])
            if (data[i].substring(0, 12) === 'CONTAINER ID') {
              flag = true
            } else if (flag && data[i][0] !== '\\') {
              document.getElementById(`docker-${ip}`).innerHTML +=
              `<li class='docker-li'>
                <button id='restart-${ip}-${i}' data='${data[i]}'>重启</button>
                <span id='docker-${ip}-${i}'>${data[i]}</span>
              </li>`
            }
          }
          if (document.getElementById(`docker-${ip}`).innerHTML === '') {
            document.getElementById(`docker-${ip}`).innerHTML +=
            `<li class='docker-li' id='docker-${ip}-${i}'>空</li>`
          }
          flag = false
          for (var i = 1; i < data.length; i++) {
            if (data[i].substring(0, 12) === 'CONTAINER ID') {
              flag = true
            } else if (flag && data[i][0] !== '\\') {
              enterDocker(ip, i)
            }
          }

          function enterDocker (ip, i) {
            document.getElementById(`restart-${ip}-${i}`).addEventListener('click', (e) => {
              var id = e.target.getAttribute('data').split(' ')[0]
              document.getElementById('wait').style.display = 'flex'
              fetch(`/restart?ip=${ip}&id=${id}`, { method: 'POST' })
              .then((res) => {
                if (res.statusCode >= 400) {
                  console.error('ERROR')
                }
                return res.json()
              }).then((data) => {
                console.log(data.feedback)
                document.getElementById(`docker-${ip}-${i}`).click()
                document.getElementById('wait').style.display = 'none'
              })
            })
            document.getElementById(`docker-${ip}-${i}`).addEventListener('click', (e) => {
              document.getElementById('hosts-container').style.width = '15%'
              document.getElementById('hosts-container').style.zIndex = '0'
              document.getElementById('terminal-container').style.left = '15%'
              createTerminal(ip, e.target.innerText.substr(0, 12))
            })
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
