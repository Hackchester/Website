/* =========================================================================
   boot.js — the "Linux boot" splash on the home page.
   Plays once per browser session; any key / click / tap skips it.
   ?noboot in the URL skips it, ?boot forces a replay (handy when developing).

   Edit the SEQUENCE array to change what it prints. Each entry is
     [kind, text, delayAfterMs]
   kind: 'raw' (plain), 'k' (kernel line, gets a [ 0.xxxxxx] timestamp),
         'ok' / 'fail' (systemd status), 'start' / 'info' (indented),
         'type' (text after the last ': ' is typed slowly)
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

  // An Arch Linux boot with `quiet` removed: GRUB → kernel → mkinitcpio hooks → systemd → tty1
  const SEQUENCE = [
    ['raw',  'Loading Linux linux ...', 45],
    ['raw',  'Loading initial ramdisk ...', 130],
    ['k',    'Linux version 6.12.9-arch1-1 (linux@archlinux) (gcc (GCC) 14.2.1 20240910, GNU ld (GNU Binutils) 2.43.0) #1 SMP PREEMPT_DYNAMIC', 4],
    ['k',    'Command line: BOOT_IMAGE=/vmlinuz-linux root=/dev/mapper/cryptroot rw cryptdevice=UUID=3b1e2f0a-8c4d-4e2f-9a6b-1d2c3e4f5a6b:cryptroot', 4],
    ['k',    'x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'', 3],
    ['k',    'x86/fpu: xstate_offset[2]:  576, xstate_sizes[2]:  256', 3],
    ['k',    'BIOS-provided physical RAM map:', 3],
    ['k',    'BIOS-e820: [mem 0x0000000000000000-0x000000000009efff] usable', 3],
    ['k',    'BIOS-e820: [mem 0x0000000100000000-0x000000083f7fffff] usable', 3],
    ['k',    'DMI: LENOVO 21CB0064UK/21CB0064UK, BIOS N3AET76W (1.41 ) 06/12/2024', 3],
    ['k',    'tsc: Detected 2688.000 MHz processor', 3],
    ['k',    'smpboot: Allowing 12 CPUs, 0 hotplug CPUs', 3],
    ['k',    'Memory: 32245604K/33324236K available (20480K kernel code, 3266K rwdata, 15196K rodata)', 3],
    ['k',    'Kernel/User page tables isolation: enabled', 3],
    ['k',    'random: crng init done', 3],
    ['k',    'ACPI: Core revision 20240827', 3],
    ['k',    'pci 0000:00:00.0: [8086:4621] type 00 class 0x060000 conventional PCI endpoint', 3],
    ['k',    'usbcore: registered new interface driver usbfs', 3],
    ['k',    'nvme nvme0: pci function 0000:02:00.0', 3],
    ['k',    'nvme nvme0: 12/0/0 default/read/poll queues', 3],
    ['k',    ' nvme0n1: p1 p2', 3],
    ['k',    'i8042: PNP: PS/2 Controller [PNP0303:PS2K,PNP0f13:PS2M] at 0x60,0x64 irq 1,12', 3],
    ['k',    'Freeing unused kernel image (initmem) memory: 3480K', 3],
    ['k',    'Write protecting the kernel read-only data: 26624k', 3],
    ['k',    'Run /init as init process', 70],
    ['raw',  ':: running early hook [udev]', 30],
    ['raw',  'Starting systemd-udevd version 257.2-1-arch', 40],
    ['raw',  ':: running hook [udev]', 15],
    ['raw',  ':: Triggering uevents...', 80],
    ['raw',  ':: running hook [keymap]', 15],
    ['raw',  ':: Loading keymap...done.', 20],
    ['raw',  ':: running hook [encrypt]', 30],
    ['raw',  'A password is required to access the cryptroot volume:', 20],
    ['type', 'Enter passphrase for /dev/nvme0n1p2: ', 450],
    ['raw',  ':: performing fsck on \'/dev/mapper/cryptroot\'', 60],
    ['raw',  '/dev/mapper/cryptroot: clean, 512394/31170560 files, 41205831/124661248 blocks', 30],
    ['raw',  ':: mounting \'/dev/mapper/cryptroot\' on real root', 30],
    ['raw',  ':: running cleanup hook [udev]', 80],
    ['raw',  '', 10],
    ['raw',  'Welcome to Arch Linux!', 80],
    ['raw',  '', 10],
    ['ok',   'Created slice Slice /system/getty.', 5],
    ['ok',   'Created slice Slice /system/modprobe.', 5],
    ['ok',   'Created slice User and Session Slice.', 5],
    ['ok',   'Started Dispatch Password Requests to Console Directory Watch.', 5],
    ['ok',   'Reached target Local Encrypted Volumes.', 5],
    ['ok',   'Reached target Path Units.', 5],
    ['ok',   'Reached target Remote File Systems.', 5],
    ['ok',   'Reached target Slice Units.', 5],
    ['ok',   'Reached target Swaps.', 5],
    ['ok',   'Listening on Process Core Dump Socket.', 5],
    ['ok',   'Listening on Journal Socket (/dev/log).', 5],
    ['ok',   'Listening on Journal Socket.', 5],
    ['ok',   'Listening on udev Control Socket.', 5],
    ['ok',   'Listening on udev Kernel Socket.', 10],
    ['start','Mounting Huge Pages File System...', 5],
    ['start','Mounting POSIX Message Queue File System...', 5],
    ['start','Mounting Kernel Debug File System...', 5],
    ['start','Starting Journal Service...', 5],
    ['start','Starting Load Kernel Modules...', 5],
    ['start','Starting Remount Root and Kernel File Systems...', 5],
    ['start','Starting Coldplug All udev Devices...', 20],
    ['ok',   'Mounted Huge Pages File System.', 5],
    ['ok',   'Mounted POSIX Message Queue File System.', 5],
    ['ok',   'Mounted Kernel Debug File System.', 5],
    ['ok',   'Finished Load Kernel Modules.', 5],
    ['ok',   'Finished Remount Root and Kernel File Systems.', 10],
    ['ok',   'Started Journal Service.', 10],
    ['start','Starting Flush Journal to Persistent Storage...', 15],
    ['ok',   'Finished Coldplug All udev Devices.', 10],
    ['ok',   'Finished Flush Journal to Persistent Storage.', 10],
    ['start','Starting Rule-based Manager for Device Events and Files...', 30],
    ['ok',   'Started Rule-based Manager for Device Events and Files.', 20],
    ['ok',   'Found device /dev/nvme0n1p1.', 10],
    ['start','Mounting /boot...', 15],
    ['ok',   'Mounted /boot.', 5],
    ['ok',   'Reached target Local File Systems.', 10],
    ['start','Starting Create System Users...', 15],
    ['ok',   'Finished Create System Users.', 5],
    ['ok',   'Reached target System Initialization.', 5],
    ['ok',   'Started Daily Cleanup of Temporary Directories.', 5],
    ['ok',   'Reached target Timer Units.', 5],
    ['ok',   'Listening on D-Bus System Message Bus Socket.', 5],
    ['ok',   'Reached target Socket Units.', 5],
    ['ok',   'Reached target Basic System.', 10],
    ['start','Starting Network Manager...', 5],
    ['start','Starting D-Bus System Message Bus...', 5],
    ['start','Starting User Login Management...', 30],
    ['ok',   'Started D-Bus System Message Bus.', 10],
    ['ok',   'Started User Login Management.', 15],
    ['ok',   'Started Network Manager.', 5],
    ['ok',   'Reached target Network.', 5],
    ['start','Starting OpenSSH Daemon...', 5],
    ['ok',   'Started OpenSSH Daemon.', 10],
    ['ok',   'Started Getty on tty1.', 5],
    ['ok',   'Reached target Login Prompts.', 110],
    ['ok',   'Reached target Multi-User System.', 5],
    ['start','Starting Record Runlevel Change in UTMP...', 15],
    ['ok',   'Finished Record Runlevel Change in UTMP.', 100],
    ['raw',  '', 10],
    ['raw',  'Arch Linux 6.12.9-arch1-1 (tty1)', 20],
    ['raw',  '', 120],
    ['type', 'hackchester login: root', 150],
    ['type', 'Password: ', 350],
    ['raw',  'Last login: Wed Sep 17 17:00:03 on tty1', 130],
    ['raw',  '[root@hackchester ~]# startx', 180],
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
      await sleep(35 + Math.random() * 45);
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
        case 'info':
        case 'start': out.innerHTML += `         ${esc(text)}\n`; break;
        case 'type': await typeOut(text); break;
        default:     out.innerHTML += `${esc(text)}\n`;
      }
      el.scrollTop = el.scrollHeight;
      await sleep(delay);
    }
    finish();
  })();
})();
