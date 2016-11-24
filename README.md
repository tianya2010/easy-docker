# EasyDocker

This repo is a tool to handle docker by terminal in the browser.
It provides fully featured terminals to users and create great development experiences.

## Use libraries
- [Xterm.js](https://github.com/sourcelair/xterm.js) is a terminal front-end component written in JavaScript that works in the browser.
- [pty.js](pty.js) forkpty(3) bindings for node.js. This allows you to fork processes with pseudo terminal file descriptors. It returns a terminal object which allows reads and writes.

## Features
- **Text-based application support**: Use it to work with applications like `bash`, `git` etc.
- **Curses-based application support**: Use it to work with applications like `vim`, `tmux` etc.
- **Mouse events support**: Xterm.js captures mouse events like click and scroll and passes them to the terminal's back-end controlling process
- **CJK (Chinese, Japanese, Korean) character support**: Xterm.js renders CJK characters seamlessly
- **IME support**: Insert international (including CJK) characters using IME input with your keyboard
- **Self-contained library**: It works on its own. It does not require any external libraries like jQuery or React to work
- **Modular, event-based API**: Lets you build addons and themes with ease

## Real-world uses
It can be used in real developer situation to handle docker easier and more quickly,
- **ps**: Just like `docker ps` and list all daemons at location or remote.
- **restart**: like `docker restart **` location or remote daemon.
- **enter**: like `docker exec -it **` enter daemon.

Do you have any question in application? Please [open a Pull Request](https://github.com/lqs469/easy-docker/pulls) to include it here. Would love to have it.

## Browser Support

Just like xterm.js is typically implemented as a developer tool, only modern browsers are supported officially. Here is a list of the versions we aim to support:

- Chrome 48+
- Edge 13+
- Firefox 44+
- Internet Explorer 11+
- Opera 35+
- Safari 8+

Just like Xterm.js works seamlessly in Electron apps and may even work on earlier versions of the browsers but these are the browsers we strive to keep working.

## Demo

To launch the demo simply run:

```
npm install
npm start
```

Then open http://0.0.0.0:3003 in a web browser (use http://127.0.0.1:3003 if running under Windows).

## Thanks

Thanks a lot for [Xterm.js](https://github.com/sourcelair/xterm.js)(SourceLair Company ([www.sourcelair.com](https://www.sourcelair.com/home))).
And [pty.js](https://github.com/chjj/pty.js)(Christopher Jeffrey).

## License Agreement

MIT license. Have fun.

Copyright (c) 2014-2016, SourceLair, Private Company ([www.sourcelair.com](https://www.sourcelair.com/home)) (MIT License)
Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
