(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Header border once the page scrolls.
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Fade sections in as they come into view.
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ---------- Sliding banner: slides on its own and can be dragged ----------
  const marquee = document.querySelector('[data-marquee]');
  if (marquee) {
    const track = marquee.querySelector('.marquee-track');
    const group = track.querySelector('.marquee-group');
    const fill = () => {
      while (track.children.length < 2 || track.scrollWidth < innerWidth + group.offsetWidth) {
        track.appendChild(group.cloneNode(true));
      }
    };
    fill();
    addEventListener('resize', fill);

    const speed = reduceMotion ? 0 : 60; // pixels per second
    let x = 0, velocity = 0, dragging = false, lastX = 0, lastTime = 0, prev = performance.now();
    const tick = now => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (!dragging) {
        x += (velocity - speed) * dt;
        velocity *= Math.pow(0.05, dt);
      }
      const width = group.offsetWidth;
      if (x <= -width) x += width;
      if (x > 0) x -= width;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    marquee.addEventListener('pointerdown', e => {
      dragging = true; velocity = 0; lastX = e.clientX; lastTime = performance.now();
      marquee.setPointerCapture(e.pointerId);
      root.classList.add('is-dragging');
    });
    marquee.addEventListener('pointermove', e => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      x += dx;
      velocity = dx / Math.max((now - lastTime) / 1000, 0.008);
      lastX = e.clientX; lastTime = now;
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      velocity = Math.max(-2500, Math.min(2500, velocity));
      root.classList.remove('is-dragging');
    };
    marquee.addEventListener('pointerup', release);
    marquee.addEventListener('pointercancel', release);
  }

  // ---------- Custom cursor (mouse and trackpad only) ----------
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    ring.innerHTML = '<i></i><b>← Drag →</b>';
    document.body.append(dot, ring);
    root.classList.add('has-cursor');

    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      const t = e.target instanceof Element ? e.target : document.body;
      const onDrag = !!t.closest('[data-marquee]');
      root.classList.toggle('cursor-drag', onDrag);
      root.classList.toggle('cursor-link', !onDrag && !!t.closest('a, button, select, label, summary'));
      root.classList.toggle('cursor-text', !!t.closest('input, textarea'));
      root.classList.toggle('cursor-dark', !!t.closest('.on-dark'));
      root.classList.add('cursor-visible');
    });
    document.addEventListener('mouseleave', () => root.classList.remove('cursor-visible'));
    const follow = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }

  // ---------- Booking calendar ----------
  const BOOKING = {
    name: 'Mark Mathany',
    email: 'markjmathany@gmail.com',
    timeZone: 'Pacific/Honolulu',
    tzLabel: 'HST',
    slots: [[9, 0, 10, 0], [10, 30, 11, 30]], // start hour, start minute, end hour, end minute
    openDays: [1, 2, 4],  // Monday, Tuesday and Thursday can be booked. Other weekdays show as booked.
    weeksAhead: 4,
    minNoticeHours: 12,
    // Optional: paste a Google Calendar appointment schedule link here to send visitors there instead.
    bookingPageUrl: ''
  };

  const tzParts = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).formatToParts(date);
    const p = {};
    for (const { type, value } of parts) p[type] = value;
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second, wd: p.weekday };
  };
  // The moment a wall-clock time happens in the given time zone.
  const zoned = (y, m, d, h, min, timeZone) => {
    const guess = Date.UTC(y, m - 1, d, h, min);
    const offset = t => { const p = tzParts(new Date(t), timeZone); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - t; };
    let t = guess - offset(guess);
    t = guess - offset(t);
    return new Date(t);
  };

  const booker = document.querySelector('[data-booker]');
  if (booker) {
    const DAY = 864e5;
    const WEEKDAY = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    const label = booker.querySelector('.week-label');
    const daysEl = booker.querySelector('.days');
    const [prevBtn, nextBtn] = booker.querySelectorAll('.week-nav');
    const confirmEl = booker.querySelector('.confirm');
    const confirmTime = booker.querySelector('.confirm-time');
    const topicEl = booker.querySelector('[name="topic"]');
    const noteEl = booker.querySelector('[name="note"]');
    const googleBtn = booker.querySelector('[data-book-google]');
    const emailBtn = booker.querySelector('[data-book-email]');

    const fmtDow = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' });
    const fmtDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
    const fmtLong = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
    const fmtHome = new Intl.DateTimeFormat('en-US', { timeZone: BOOKING.timeZone, hour: 'numeric', minute: '2-digit' });
    const fmtLocal = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
    const range = (fmt, s, e) => {
      const a = fmt.format(s), b = fmt.format(e);
      return (a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a) + '–' + b;
    };
    const sameAsHome = d => fmtLocal.format(d) === fmtHome.format(d);

    // Monday of the current week in Hawaiʻi (on weekends, the coming Monday).
    const weekStart = offset => {
      const now = tzParts(new Date(), BOOKING.timeZone);
      const wd = WEEKDAY[now.wd];
      const shift = wd >= 6 ? 8 - wd : 1 - wd;
      return new Date(Date.UTC(now.y, now.m - 1, now.d + shift + offset * 7));
    };
    const slotsFor = offset => {
      const start = weekStart(offset);
      const cutoff = Date.now() + BOOKING.minNoticeHours * 36e5;
      return [0, 1, 2, 3, 4].map(k => {
        const cal = new Date(start.getTime() + k * DAY);
        const y = cal.getUTCFullYear(), m = cal.getUTCMonth() + 1, d = cal.getUTCDate();
        const open = BOOKING.openDays.includes(k + 1);
        return {
          cal,
          slots: BOOKING.slots.map(([h1, m1, h2, m2]) => {
            const s = zoned(y, m, d, h1, m1, BOOKING.timeZone);
            const e = zoned(y, m, d, h2, m2, BOOKING.timeZone);
            return { s, e, state: !open ? 'booked' : s.getTime() < cutoff ? 'past' : 'open' };
          })
        };
      });
    };

    let week = slotsFor(0).some(day => day.slots.some(slot => slot.state === 'open')) ? 0 : 1;
    let selected = null;

    const updateLinks = () => {
      if (!selected) return;
      const topic = topicEl.value;
      const note = noteEl.value.trim();
      const when = confirmTime.textContent;
      if (BOOKING.bookingPageUrl) {
        googleBtn.href = BOOKING.bookingPageUrl;
        googleBtn.firstChild.textContent = 'Continue to booking ';
        emailBtn.hidden = true;
        return;
      }
      const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const details = `${topic}${note ? '\n\n' + note : ''}\n\nBooked from ${location.host || 'Mark Mathany’s website'}`;
      googleBtn.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        + '&text=' + encodeURIComponent(`Meeting with ${BOOKING.name}: ${topic}`)
        + '&dates=' + stamp(selected.s) + '/' + stamp(selected.e)
        + '&details=' + encodeURIComponent(details)
        + '&add=' + encodeURIComponent(BOOKING.email);
      const body = `Hi Mark,\n\nI'd like to book a meeting: ${when}\nTopic: ${topic}\n${note ? '\n' + note + '\n' : ''}\nThanks!`;
      emailBtn.href = `mailto:${BOOKING.email}?subject=${encodeURIComponent('Meeting request: ' + when)}&body=${encodeURIComponent(body)}`;
    };

    const choose = (btn, slot, cal) => {
      daysEl.querySelectorAll('[aria-pressed="true"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selected = slot;
      const local = sameAsHome(slot.s) ? '' : ` (${range(fmtLocal, slot.s, slot.e)} your time)`;
      confirmTime.textContent = `${fmtLong.format(cal)}, ${range(fmtHome, slot.s, slot.e)} ${BOOKING.tzLabel}${local}`;
      confirmEl.hidden = false;
      updateLinks();
      confirmEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    };

    const render = () => {
      const days = slotsFor(week);
      label.textContent = `${fmtDate.format(days[0].cal)} – ${fmtDate.format(days[4].cal)}`;
      prevBtn.disabled = week === 0;
      nextBtn.disabled = week === BOOKING.weeksAhead - 1;
      daysEl.innerHTML = '';
      for (const day of days) {
        const col = document.createElement('div');
        col.className = 'day';
        col.setAttribute('role', 'listitem');
        col.innerHTML = `<h4>${fmtDow.format(day.cal)}<strong>${fmtDate.format(day.cal)}</strong></h4>`;
        for (const slot of day.slots) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'slot';
          const time = `<span class="time">${range(fmtHome, slot.s, slot.e)}</span>`;
          if (slot.state === 'open') {
            const hint = sameAsHome(slot.s) ? 'Open' : `${range(fmtLocal, slot.s, slot.e)} your time`;
            btn.innerHTML = `${time}<small>${hint}</small>`;
            const isSelected = selected && selected.s.getTime() === slot.s.getTime();
            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            btn.addEventListener('click', () => choose(btn, slot, day.cal));
          } else {
            btn.disabled = true;
            btn.classList.add(slot.state);
            btn.innerHTML = `${time}<small>${slot.state === 'booked' ? 'Booked' : 'Unavailable'}</small>`;
          }
          col.appendChild(btn);
        }
        daysEl.appendChild(col);
      }
    };

    prevBtn.addEventListener('click', () => { week = Math.max(0, week - 1); render(); });
    nextBtn.addEventListener('click', () => { week = Math.min(BOOKING.weeksAhead - 1, week + 1); render(); });
    topicEl.addEventListener('change', updateLinks);
    noteEl.addEventListener('input', updateLinks);
    document.querySelectorAll('[data-topic]').forEach(link => {
      link.addEventListener('click', () => { topicEl.value = link.dataset.topic; updateLinks(); });
    });
    // A link like index.html?topic=Free%20help%20hour#book picks the topic in advance.
    const askedTopic = new URLSearchParams(location.search).get('topic');
    if (askedTopic && [...topicEl.options].some(o => o.value === askedTopic)) topicEl.value = askedTopic;
    render();
  }

  // ---------- Message forms: send to a form service if one is set, otherwise open the visitor's email app ----------
  document.querySelectorAll('form[data-email]').forEach(form => {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(form);
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(res.statusText);
          form.reset();
          status.textContent = "Thanks! Your message is on its way. I'll be in touch within one business day.";
        } catch {
          status.textContent = `Something went wrong. Please email me directly at ${form.dataset.email}.`;
        }
        return;
      }
      // Each field's label becomes a line in the email, with the long message last.
      const lines = [];
      let message = '';
      for (const field of form.querySelectorAll('input, select, textarea')) {
        if (!field.name || !field.value.trim()) continue;
        if (field.tagName === 'TEXTAREA') { message = field.value.trim(); continue; }
        const label = field.closest('label').firstChild.textContent.trim();
        lines.push(`${label}: ${field.value.trim()}`);
      }
      const body = lines.join('\n') + (message ? `\n\n${message}` : '');
      const subject = `${form.dataset.subject || 'New inquiry'} from ${data.get('name')}`;
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
})();
