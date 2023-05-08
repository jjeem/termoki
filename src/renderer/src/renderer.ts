import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import '../assets/styles.css';
import { FitAddon } from 'xterm-addon-fit';

const api = window.api;

let uid: string | undefined = undefined;

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
  api.resizePty({
    uid,
    ...vals
  });
  console.log('🧨 resized: ', vals);
  fitAddon.fit();
});

api?.onResize(() => {
  fitAddon.fit();
  api.resizePty({
    uid,
    cols: term.cols,
    rows: term.rows
  });
});

api?.onResponse((_event, data) => {
  console.log('res: ', data);
  term.write(data);
});

term.onKey(({ key }) => {
  console.log(key);
  api?.invoke(uid, key);
});

export function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('terminal-parent');
    if (el) {
      term.open(el);
      fitAddon.fit();
    } else console.log(el);
    setTimeout(initPty, 1000);
  });
}

async function initPty(): Promise<void> {
  const res = (await window.api.initPtyProcess(uid)) as string;
  console.log(res);
  uid = res;
}

init();
