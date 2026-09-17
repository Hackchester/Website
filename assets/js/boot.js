/* =========================================================================
   boot.js — the "Linux boot" splash on the home page.
   Plays once per browser session; any key / click / tap skips it.
   ?noboot in the URL skips it, ?boot forces a replay (handy when developing).

   Edit the SEQUENCE array to change what it prints. Each entry is
     [kind, text, delayAfterMs]
   kind: 'raw' (plain), 'k' (kernel line, gets a [ 0.xxxxxx] timestamp),
         'ok' / 'fail' / 'info' (systemd status), 'type' (typed slowly)
   ========================================================================= */
(function () {
  const el = document.getElementById('boot');
  const out = document.getElementById('boot-text');
  if (!el || !out) return;

  // ?noboot skips the splash, ?boot forces it to replay (both handy when developing)
  const q = new URLSearchParams(location.search);
  const KEY = 'hc-booted';
  let played = false;
  try { played = sessionStorage.getItem(KEY) === '1'; } catch (_) {}
  if (q.has('noboot') || (!q.has('boot') && (played || HC.reducedMotion))) return;

  const SEQUENCE = [
    ['raw',  'GRUB loading...',                                                              120],
    ['raw',  'Loading Linux 6.12.9-hardened ...',                                           80],
    ['raw',  'Loading initial ramdisk ...',                                                 220],
    ['raw',  '',                                                                            60],
    ['k',    'Linux version 6.12.9-hardened (root@hackchester) (gcc 14.2.1) #1 SMP PREEMPT_DYNAMIC', 10],
    ['k',    'Command line: BOOT_IMAGE=/vmlinuz-linux root=/dev/mapper/vg0-root rw quiet',    10],
    ['k',    'x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'',    5],
    ['k',    'BIOS-provided physical RAM map:',                                              5],
    ['k',    'BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',                5],
    ['k',    'BIOS-e820: [mem 0x0000000100000000-0x000000083fffffff] usable',                15],
    ['k',    'smpboot: Allowing 8 CPUs, 0 hotplug CPUs',                                     10],
    ['k',    'Memory: 32612340K/33554432K available (16384K kernel code, 2048K rwdata)',     10],
    ['k',    'Kernel/User page tables isolation: enabled',                                   5],
    ['k',    'random: crng init done',                                                       5],
    ['k',    'PCI: Using configuration type 1 for base access',                              5],
    ['k',    'ACPI: Added _OSI(Module Device)',                                              5],
    ['k',    'usbcore: registered new interface driver usbhid',                              5],
    ['k',    'nvme nvme0: pci function 0000:02:00.0',                                        5],
    ['k',    'nvme0n1: p1 p2',                                                               10],
    ['k',    'e1000e 0000:00:1f.6 eth0: (PCI Express:2.5GT/s:Width x1) 13:37:de:ad:be:ef',   10],
    ['k',    'device-mapper: uevent: version 1.0.3',                                         5],
    ['k',    'EXT4-fs (dm-0): mounted filesystem with ordered data mode. Quota mode: none.', 15],
    ['k',    'systemd[1]: systemd 257 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR)', 10],
    ['k',    'systemd[1]: Detected architecture x86-64.',                                    120],
    ['raw',  '',                                                                             40],
    ['raw',  'Welcome to Hackchester OS 4.0.4!',                                              120],
    ['raw',  '',                                                                             40],
    ['ok',   'Started Journal Service.',                                                     40],
    ['ok',   'Mounted /boot.',                                                               30],
    ['ok',   'Reached target Local File Systems.',                                           40],
    ['ok',   'Started Load/Save Random Seed.',                                               30],
    ['ok',   'Started Apply Kernel Variables.',                                              30],
    ['ok',   'Started Network Configuration.',                                               60],
    ['fail', 'Failed to start Network Manager Wait Online.',                                 40],
    ['info', 'See \'systemctl status NetworkManager-wait-online.service\' for details.',     140],
    ['ok',   'Started OpenSSH Daemon.',                                                      40],
    ['ok',   'Started Firewall (nftables).',                                                 40],
    ['ok',   'Started Docker Application Container Engine.',                                 50],
    ['ok',   'Started ctf-training.service.',                                                40],
    ['ok',   'Started hackchester-web.service.',                                             50],
    ['ok',   'Reached target Multi-User System.',                                            40],
    ['ok',   'Reached target Graphical Interface.',                                          200],
    ['raw',  '',                                                                             60],
    ['raw',  'Hackchester OS 4.0.4 hackchester tty1',                                        40],
    ['raw',  '',                                                                             120],
    ['type', 'hackchester login: root',                                                      260],
    ['type', 'Password: ',                                                                   500],
    ['raw',  '',                                                                             60],
    ['raw',  'Last login: Wed Sep 17 17:00:00 on tty1',                                      280],
    ['raw',  '[root@hackchester ~]# startx',                                                 320],
  ];

  el.hidden = false;
  document.body.style.overflow = 'hidden';
  let stopped = false;

  function finish() {
    if (stopped) return;
    stopped = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
    el.classList.add('is-done');
    document.body.style.overflow = '';
    window.removeEventListener('keydown', finish);
    setTimeout(() => el.remove(), 600);
  }
  window.addEventListener('keydown', finish);
  el.addEventListener('click', finish);
  el.addEventListener('touchstart', finish, { passive: true });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let uptime = 0; // fake kernel clock, seconds

  function stamp() {
    uptime += 0.01 + Math.random() * 0.12;
    return `[${uptime.toFixed(6).padStart(11)}] `;
  }

  async function typeOut(text) {
    // "hackchester login: " prints instantly, the part after the last ': ' is typed
    const i = text.lastIndexOf(': ');
    const prompt = i >= 0 ? text.slice(0, i + 2) : '';
    const typed = i >= 0 ? text.slice(i + 2) : text;
    out.innerHTML += esc(prompt);
    for (const ch of typed) {
      if (stopped) return;
      out.innerHTML += esc(ch);
      await sleep(70 + Math.random() * 90);
    }
    out.innerHTML += '\n';
  }

  (async () => {
    for (const [kind, text, delay] of SEQUENCE) {
      if (stopped) return;
      switch (kind) {
        case 'k':    out.innerHTML += `<span class="k">${stamp()}</span>${esc(text)}\n`; break;
        case 'ok':   out.innerHTML += `<span class="ok">[  OK  ]</span> ${esc(text)}\n`; break;
        case 'fail': out.innerHTML += `<span class="failed">[FAILED]</span> ${esc(text)}\n`; break;
        case 'info': out.innerHTML += `         ${esc(text)}\n`; break;
        case 'type': await typeOut(text); break;
        default:     out.innerHTML += `${esc(text)}\n`;
      }
      el.scrollTop = el.scrollHeight;
      await sleep(delay);
    }
    finish();
  })();
})();
