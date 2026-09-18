/* =========================================================================
   terminal.js — easter egg. Press ` (backtick) to open a fake shell.
   Add commands to the CMDS object.
   ========================================================================= */
(function () {
  let shell, out, input, open = false;
  const history = [];
  let hIdx = 0;

  const NEOFETCH = `
        ◆          root@hackchester
       ◆ ◆         ---------------
      ◆   ◆        OS: Hackchester OS 4.0.4
     ◆     ◆       Host: University of Manchester
      ◆   ◆        Kernel: 6.x-hardened
       ◆ ◆         Uptime: since 2019
        ◆          Shell: hcsh 0.1
                   Packages: web pwn rev crypto forensics osint hardware blockchain
                   Theme: phosphor
`;

  const CMDS = {
    help: () => `available commands:
  help        this
  ls          list files
  cat <file>  read a file
  whoami      who are you?
  neofetch    system info
  writeups    latest writeups
  join        discord invite
  flag        hmm
  clear       clear screen
  exit        close shell
also try: sudo, rm -rf /, the konami code`,

    ls: () => `about.md   events.log   flag.txt   socials   writeups/   .secret`,

    cat: (args) => {
      const f = args[0];
      if (!f) return 'cat: missing operand';
      const site = HC.site || {};
      const files = {
        'about.md': `# ${site.name}\n${site.tagline}\n\n${site.description}`,
        'events.log': site.meeting?.day ? `every ${site.meeting.day} ${site.meeting.time} @ ${site.meeting.location}` : 'see the events section on the home page',
        'flag.txt': 'Permission denied. (did you check the page source?)',
        '.secret': 'flag{y0u_f0und_th3_h1dd3n_sh3ll}',
        'socials': (site.socials || []).map(s => `${s.name.padEnd(10)} ${s.url}`).join('\n'),
      };
      return files[f] ?? `cat: ${f}: No such file or directory`;
    },

    whoami: () => 'root (nice.)',
    id: () => 'uid=0(root) gid=0(root) groups=0(root),1337(hackchester)',
    pwd: () => '/home/hackchester',
    neofetch: () => NEOFETCH,
    date: () => new Date().toString(),
    echo: (args) => args.join(' '),
    join: () => { window.open(HC.site?.socials?.find(s => /discord/i.test(s.name))?.url, '_blank'); return 'opening discord…'; },
    flag: () => 'flag{n0t_th4t_34sy}',
    sudo: () => 'root is not in the sudoers file. This incident will be reported.',
    rm: (args) => args.join(' ').includes('-rf') ? 'nice try.' : 'rm: refusing to remove anything, this is a website',
    exit: () => { toggle(false); return ''; },
    clear: () => { out.textContent = ''; return ''; },

    writeups: async () => {
      try {
        const idx = await HC.json(HC.site.writeups.base + 'index.json');
        return idx.writeups.slice(0, 8).map(w =>
          `${(w.date || '').padEnd(11)} ${(w.category || 'misc').toLowerCase().padEnd(10)} ${w.title}  → writeups.html?id=${encodeURIComponent(w.id)}`
        ).join('\n') || 'no writeups yet';
      } catch (e) { return `curl: (7) Failed to connect: ${e.message}`; }
    },
  };

  function print(s) {
    if (s === '') return;
    out.textContent += s + '\n';
    out.scrollTop = out.scrollHeight;
  }

  async function run(line) {
    print(`root@hackchester:~$ ${line}`);
    const [cmd, ...args] = line.trim().split(/\s+/);
    if (!cmd) return;
    history.push(line); hIdx = history.length;
    const fn = CMDS[cmd];
    if (!fn) return print(`hcsh: ${cmd}: command not found (try 'help')`);
    try { print(await fn(args)); } catch (e) { print(`error: ${e.message}`); }
  }

  function build() {
    shell = document.createElement('div');
    shell.className = 'shell';
    shell.setAttribute('role', 'dialog');
    shell.setAttribute('aria-label', 'hidden shell');
    shell.innerHTML = `
      <pre class="shell__out"></pre>
      <div class="shell__line">
        <span class="ps1">root@hackchester:~$</span>
        <input type="text" autocomplete="off" spellcheck="false" aria-label="command">
      </div>`;
    document.body.append(shell);
    out = shell.querySelector('.shell__out');
    input = shell.querySelector('input');
    print(`hcsh 0.1 — type 'help'. press \` or esc to close.`);

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const v = input.value; input.value = ''; run(v); }
      else if (e.key === 'ArrowUp')   { if (hIdx > 0) input.value = history[--hIdx] || ''; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hIdx < history.length) input.value = history[++hIdx] || ''; e.preventDefault(); }
      else if (e.key === 'Escape' || e.key === '`') { e.preventDefault(); toggle(false); }
    });
  }

  function toggle(force) {
    if (!shell) build();
    open = force ?? !open;
    shell.classList.toggle('is-open', open);
    if (open) setTimeout(() => input.focus(), 50);
    else input.blur();
  }

  window.addEventListener('keydown', e => {
    if (e.key !== '`' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (!open && t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    toggle();
  });
})();
