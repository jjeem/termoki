import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import '../assets/styles.css';
import { FitAddon } from 'xterm-addon-fit';

const api = window.api;

const term = new Terminal({
  cursorBlink: true,
  allowTransparency: true,
  fontFamily: 'Consolas',
  fontSize: 14,
  theme: {
    background: '#ffffff00',
    cursor: '#0059ae',
    cursorAccent: '#ffffff99',
    selectionBackground: '#abdcaa',
    selectionForeground: '#000000'
  }
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

term.onResize((vals) => {
  api.resizePty(vals);
});

window.api?.onResize(() => {
  fitAddon.fit();
});

window.api?.onResponse((_event, data) => {
  if (data === prevCommand) {
    term.writeln('');
    return;
  }
  console.log('res: ', data);
  if (data && data.trim()) term.write(data);
});

const handleInput = async (command: string) => {
  const res = await window.api?.invoke(command);
  console.log(res);
  // term.writeln(res);
};

let line = '';
let prevCommand = '';

term.onKey(({ key, domEvent }) => {
  console.log(domEvent.key);

  switch (domEvent.key) {
    case 'Enter':
      console.log('enter');
      term.writeln('');
      // term.
      handleInput(line);
      prevCommand = line;
      line = '';
      break;
    case 'Backspace':
      console.log('backspace');
      if (!line) break;
      line = line.slice(0, -1);
      term.write('\b \b');
      break;
    default:
      line += key;
      console.log('key: ', key);
      term.write(key);
  }
});
// term.de
export function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('terminal-parent');
    if (el) {
      term.open(el);
      fitAddon.fit();
      // term.write(' $ ');
    } else console.log(el);
    setTimeout(initPty, 1000);
  });
}

async function initPty(): Promise<void> {
  const res = await window.api.initPtyProcess('hi give me new pty');
  console.log(res);
}

init();
