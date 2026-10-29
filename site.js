(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

  // ---------- Email address: never written out in the pages, so bots that collect addresses don't find it ----------
  const EMAIL = ['markjmathany', 'gmail.com'].join('@');
  document.querySelectorAll('[data-show-email]').forEach(btn => {
    btn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = 'mailto:' + EMAIL;
      link.textContent = EMAIL;
      link.className = btn.className.replace('show-email', '').trim();
      btn.replaceWith(link);
      link.focus();
    });
  });

  // ---------- Where form messages go ----------
  // Every form is sent to this Formspree form, which emails it to Mark. To change where messages go, paste another
  // Formspree link here. If it's left empty, sending a form opens the visitor's email app with everything filled in.
  const FORM_ENDPOINT = 'https://formspree.io/f/xbggynvl';
  const sendForm = async (form, subject) => {
    if (FORM_ENDPOINT) {
      const data = new FormData(form);
      data.append('_subject', subject);
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.statusText);
      return 'sent';
    }
    // Each field's label becomes a line in the email, with the long message last.
    const lines = [];
    let message = '';
    for (const field of form.querySelectorAll('input, select, textarea')) {
      if (!field.name || !field.value.trim()) continue;
      if (field.tagName === 'TEXTAREA') { message = field.value.trim(); continue; }
      const label = field.dataset.label || field.closest('label').firstChild.textContent.trim();
      lines.push(`${label}: ${field.value.trim()}`);
    }
    const body = lines.join('\n') + (message ? `\n\n${message}` : '');
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return 'email-app';
  };

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
    email: EMAIL,
    timeZone: 'Pacific/Honolulu',
    tzLabel: 'HST',
    slots: [[9, 0, 10, 0], [10, 30, 11, 30]], // start hour, start minute, end hour, end minute
    openDays: [1, 2, 4],  // Monday, Tuesday and Thursday can be booked. Other weekdays show as booked.
    weeksAhead: 4,
    minNoticeHours: 12,
    // Optional: a Google Calendar appointment schedule link. After sending a request, visitors get this link
    // instead of a Google Calendar event filled in with their time.
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
    const form = booker.querySelector('[data-booking-form]');
    const confirmTime = form.querySelector('.confirm-time');
    const timeInput = form.querySelector('[name="time"]');
    const topicEl = form.querySelector('[name="topic"]');
    const submitBtn = form.querySelector('[type="submit"]');
    const status = form.querySelector('.form-status');
    const sent = booker.querySelector('.booking-sent');
    const googleBtn = sent.querySelector('[data-book-google]');

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

    // A Google Calendar event with the chosen time, the visitor's answers and Mark as a guest.
    const calendarLink = () => {
      if (BOOKING.bookingPageUrl) return BOOKING.bookingPageUrl;
      const data = new FormData(form);
      const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const who = [data.get('name'), data.get('organization'), data.get('email')].filter(Boolean).join(', ');
      const details = `${data.get('topic')}\n\n${data.get('message')}\n\n${who}\nBooked from ${location.host || 'Mark Mathany’s website'}`;
      return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        + '&text=' + encodeURIComponent(`Meeting with ${BOOKING.name}: ${data.get('topic')}`)
        + '&dates=' + stamp(selected.s) + '/' + stamp(selected.e)
        + '&details=' + encodeURIComponent(details)
        + '&add=' + encodeURIComponent(BOOKING.email);
    };

    // Picking a time opens a short form with the same questions as the contact form.
    const choose = (btn, slot, cal) => {
      daysEl.querySelectorAll('[aria-pressed="true"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selected = slot;
      const local = sameAsHome(slot.s) ? '' : ` (${range(fmtLocal, slot.s, slot.e)} your time)`;
      confirmTime.textContent = `${fmtLong.format(cal)}, ${range(fmtHome, slot.s, slot.e)} ${BOOKING.tzLabel}${local}`;
      timeInput.value = confirmTime.textContent;
      sent.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      submitBtn.disabled = true;
      try {
        const how = await sendForm(form, `Meeting request: ${timeInput.value}, from ${new FormData(form).get('name')}`);
        sent.querySelector('.sent-title').textContent = how === 'sent'
          ? `Request sent for ${timeInput.value}.`
          : 'Almost done: press send in your email app.';
        sent.querySelector('.sent-note').textContent = how === 'sent'
          ? "I'll confirm by email within one business day. Want it on your calendar now?"
          : `It should have opened with your request for ${timeInput.value}. I'll confirm by email within one business day.`;
        googleBtn.href = calendarLink();
        googleBtn.textContent = BOOKING.bookingPageUrl ? 'Continue to booking' : 'Add it to Google Calendar';
        form.hidden = true;
        sent.hidden = false;
        sent.focus({ preventScroll: true });
      } catch {
        status.textContent = `Something went wrong. Please email me directly at ${EMAIL}.`;
      } finally {
        submitBtn.disabled = false;
      }
    });

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
    document.querySelectorAll('[data-topic]').forEach(link => {
      link.addEventListener('click', () => { topicEl.value = link.dataset.topic; });
    });
    // A link like index.html?topic=Free%20help%20hour#book picks the topic in advance.
    const askedTopic = new URLSearchParams(location.search).get('topic');
    if (askedTopic && [...topicEl.options].some(o => o.value === askedTopic)) topicEl.value = askedTopic;
    render();
  }

  // ---------- Speaking request form: hidden until its button is pressed ----------
  document.querySelectorAll('[data-open-form]').forEach(link => {
    const form = document.getElementById(link.getAttribute('aria-controls'));
    link.addEventListener('click', e => {
      e.preventDefault();
      form.classList.add('open');
      link.setAttribute('aria-expanded', 'true');
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      form.querySelector('h3').focus({ preventScroll: true });
    });
  });

  // ---------- Message forms (contact, speaking, free help) ----------
  document.querySelectorAll('form[data-subject]').forEach(form => {
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('[type="submit"]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      submitBtn.disabled = true;
      try {
        const how = await sendForm(form, `${form.dataset.subject} from ${new FormData(form).get('name')}`);
        if (how === 'sent') {
          form.reset();
          status.textContent = form.dataset.thanks || "Thanks! Your message is on its way. I'll be in touch within one business day.";
        }
      } catch {
        status.textContent = `Something went wrong. Please email me directly at ${EMAIL}.`;
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
})();
