// const hosts = 100
const defaultAdress = [
  'localhost'
]
var term
var protocol
var socketURL
var socket

var terminalContainer = document.getElementById('terminal-container')
var hostsContainer = document.getElementById('hosts-container');

// Check Cookies if have ip data
(() => {


  document.getElementById('clearCookies').addEventListener('click', function () {
    console.log('clear')
    Cookies.remove('dockerChecked')
  })

  var cookie = Cookies.get('dockerChecked')
  var checked = {}

  if (cookie) {
    cookie = JSON.parse(cookie)
    for (var i in cookie) {
      hostsContainer.innerHTML += `
        <div class='host' id='host-${i}'>
          ${i} ${cookie[i] === 0 ? '[无效]': '[可连]'}
        </div>
        <div id='docker-${i}' />`
    }
    for (i in cookie) {
      if (cookie[i] === 1) {
        document.getElementById(`host-${i}`).addEventListener('click', (e) => {
          createTerminal(e.target.id.split('-')[1])
        })
      }
    }
  } else {
    defaultAdress.map((i) => {
      hostsContainer.innerHTML += `
        <div class='host' id='host-${i}'>
          ${i}
        </div>
        <div id='docker-${i}' />`
      fetch(`/check?address=${i}`)
        .then((res) => {
          if(res.status !== 200) {
            console.log('error')
          } else {
            res.json().then((data) => {
              if (data.docker) {
                document.getElementById(`host-${data.address}`).addEventListener('click', () => {
                  createTerminal(data.address)
                })
              }
              document.getElementById(`host-${data.address}`).innerText +=
                data.docker === 0 ? '[无效]' : '[可连]'
              checked[data.address] = data.docker
              Cookies.set('dockerChecked', checked)
            })
          }
        })
    })
  }
})()

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

  fetch(`/terminals?cols=${cols}&rows=${rows}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ip, id })
  }).then((res) => {
    res.json().then((data) => {
      if (ip && !data.id) {
        data = JSON.stringify(data.feedback).split('\\r\\n')
        var flag = false
        document.getElementById(`docker-${ip}`).innerHTML = ''
        for (var i = 1; i < data.length; i++) {
          console.log(i, data[i])
          if (data[i].substring(0, 12) === 'CONTAINER ID') {
            flag = true
          } else if (flag && data[i][0] !== '\\') {
            var id = data[i].substring(0, 12)
            document.getElementById(`docker-${ip}`).innerHTML +=
            `<li class='docker-li'>
              <small id='docker-${ip}-${id}' data='${data[i].substring(0, 12)}'>
                ${data[i].substring(20)}
              </small>
              <button class="btn btn-primary" id='restart-${ip}-${id}' data='${id}'>
                重启
              </button>
            </li>`
          }
        }
        if (document.getElementById(`docker-${ip}`).innerHTML === '') {
          document.getElementById(`docker-${ip}`).innerHTML +=
          `<li class='docker-li' id='docker-${ip}-${i}'>空</li>`
        }

        flag = false
        for (i = 1; i < data.length; i++) {
          if (data[i].substring(0, 12) === 'CONTAINER ID') {
            flag = true
          } else if (flag && data[i][0] !== '\\') {
            document.getElementById(`restart-${ip}-${data[i].substring(0, 12)}`)
              .addEventListener('click', (e) => {
                var did = e.target.getAttribute('data')
                document.getElementById('wait').style.display = 'flex'
                fetch(`/restart?ip=${ip}&id=${did}`, { method: 'POST' })
                .then((res) => {
                  if (res.statusCode >= 400) {
                    console.error('ERROR')
                  }
                  return res.json()
                }).then((data) => {
                  document.getElementById('wait').style.display = 'none'
                  document.getElementById(`docker-${ip}-${data.id}`).click()
                })
              })
            document.getElementById(`docker-${ip}-${data[i].substring(0, 12)}`)
              .addEventListener('click', (e) => {
                createTerminal(ip, e.target.getAttribute('data'))
              })
          }
        }
      } else {
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

    term.on('paste', function (data) {
      term.write(data)
    })
  }
}

document.getElementById('settings').addEventListener('click', () => {
  if (terminalContainer.style.right !== '-20%') {
    terminalContainer.style.right = '-20%'
    hostsContainer.style.left = '20%'
    document.getElementById('settingsContainer').style.left = '0'
  } else {
    terminalContainer.style.right = '0'
    hostsContainer.style.left = '0'
    document.getElementById('settingsContainer').style.left = '-20%'
  }
})

document.getElementById('extend').addEventListener('click', () => {
  if (terminalContainer.style.width !== '100%') {
    terminalContainer.style.width = '100%'
    terminalContainer.style.top = '60px'
    document.getElementById('extend').className = 'fui-arrow-right'
    document.getElementById('r').style.top = '15px'
    document.getElementById('r').bottom = 'auto'
  } else {
    terminalContainer.style.width = '79%'
    terminalContainer.style.top = '1%'
    document.getElementById('extend').className = 'fui-arrow-left'
    document.getElementById('r').style.top = 'auto'
    document.getElementById('r').style.bottom = '5px'
  }
})

function submitAddress (ip) {
  if (ip && ip.split('.').length === 4) {
    fetch(`/check?address=${ip}`)
    .then((res) => {
      if(res.status !== 200) {
        console.log('error')
      } else {
        res.json().then((data) => {
          var cookie = Cookies.getJSON('dockerChecked')
          if (!cookie[ip]) {
            cookie[ip] = data.docker
            hostsContainer.innerHTML += `
              <div class='host' id='host-${ip}'>
                ${ip}
              </div>
              <div id='docker-${ip}' />`
            if (data.docker) {
              document.getElementById(`host-${data.address}`)
              .addEventListener('click', () => {
                createTerminal(data.address)
              })
            }
            document.getElementById(`host-${data.address}`).innerText +=
              data.docker === 0 ? '[无效]' : '[可连]'
            Cookies.set('dockerChecked', cookie)
          }
        })
      }
    })
  }
}

document.getElementById('ip-input').addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    var ip = document.getElementById('ip-input').value
    submitAddress(ip)
    document.getElementById('ip-input').value = ''
  }
})

document.getElementById('ip-input').addEventListener('blur', () => {
  document.getElementById('addInput').style.left = '-100%'
  document.getElementById('ip-input').value = ''
})

document.getElementById('addHost').addEventListener('click', () => {
  document.getElementById('addInput').style.left = '100px'
  document.getElementById('ip-input').focus()
})
