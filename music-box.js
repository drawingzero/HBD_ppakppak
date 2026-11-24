(function () {
  'use strict';

  // A small mechanical birthday card: 96 quarter-note pulses per minute,
  // a lilting 3/4 melody with dotted pickups, looping until explicitly stopped.
  // All sound is synthesized locally; no recordings, requests or audio files.
  const TEMPO = 96;
  const BEAT = 60 / TEMPO;
  const MELODY = [
    [79, .75], [79, .25], [81, 1], [79, 1], [84, 1], [83, 2],
    [79, .75], [79, .25], [81, 1], [79, 1], [86, 1], [84, 2],
    [79, .75], [79, .25], [91, 1], [88, 1], [84, 1], [83, 1], [81, 1],
    [89, .75], [89, .25], [88, 1], [84, 1], [86, 1], [84, 2]
  ];
  const ACCOMPANIMENT = [
    [1, [60, 67]], [7, [55, 62]], [13, [60, 64]],
    [18, [53, 60]], [21, [55, 62]], [22, [60, 64, 67]]
  ];

  let context = null;
  let current = null;
  let pending = null;
  let generation = 0;
  let wanted = false;
  let waiting = null;
  let lastError = '';

  function getStatus() {
    return {
      playing: Boolean(current && !current.closed && current.context.state === 'running'),
      wanted: wanted, pending: Boolean(pending),
      contextState: context ? context.state : 'not-created',
      activeSources: current ? current.sources.size : 0, lastError: lastError
    };
  }

  function announce(playing, blocked) {
    // Bubbles to window as well, so either document or window may listen.
    document.dispatchEvent(new CustomEvent('birthday-music-state', {
      bubbles: true,
      detail: Object.assign(getStatus(), { playing: Boolean(playing), blocked: Boolean(blocked), reason: lastError })
    }));
  }

  function audioContext() {
    if (context && context.state !== 'closed') return context;
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) throw new Error('Web Audio is unavailable');
    context = new Constructor();
    const ownContext = context;
    ownContext.addEventListener('statechange', function () {
      if (current && current.context === ownContext && ownContext.state !== 'running') {
        lastError = 'context-' + ownContext.state;
        finish(current, true);
      }
      if (ownContext.state === 'running') {
        lastError = '';
        if (waiting && waiting.context === ownContext) waiting.settle(true);
        // Defer recovery until the current play()/resume() call has registered
        // its promise, so a synchronous statechange cannot start a second song.
        Promise.resolve().then(function () {
          if (wanted && !document.hidden && !current && !pending) play();
        });
      }
    });
    return context;
  }

  function ready(ctx) {
    if (ctx.state === 'running') return Promise.resolve(true);
    // Some browsers leave resume() pending when autoplay is disallowed.
    // Return false instead of leaving the letter's play control stuck waiting.
    return new Promise(function (resolve) {
      let settled = false;
      const timer = setTimeout(function () { settle(ctx.state === 'running'); }, 2200);
      const request = {context:ctx,settle:settle};
      waiting=request;
      function settle(value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if(waiting===request)waiting=null;
        resolve(value);
      }
      try {
        Promise.resolve(ctx.resume()).then(function () {
          settle(ctx.state === 'running');
        }, function () { settle(false); });
      } catch (_) { settle(false); }
    });
  }

  function makeRun(ctx) {
    const run = {
      context: ctx, nodes: new Set(), sources: new Set(), closed: false,
      start: ctx.currentTime + .04, end: ctx.currentTime + .04
    };
    const bus = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const master = ctx.createGain();
    run.bus = bus;
    run.master = master;
    [bus, filter, master].forEach(function (node) { run.nodes.add(node); });
    filter.type = 'lowpass';
    filter.frequency.value = 6500;
    filter.Q.value = .45;
    // Deliberately quiet, even when several tines ring at the same time.
    master.gain.value = .48;
    bus.connect(filter);
    filter.connect(master);
    master.connect(ctx.destination);

    // Two quiet, non-feedback reflections suggest a small wooden music box.
    [[.085, .11], [.17, .055]].forEach(function (tap) {
      const delay = ctx.createDelay(.25);
      const wet = ctx.createGain();
      delay.delayTime.value = tap[0];
      wet.gain.value = tap[1];
      filter.connect(delay);
      delay.connect(wet);
      wet.connect(master);
      run.nodes.add(delay);
      run.nodes.add(wet);
    });
    return run;
  }

  function trackSource(run, source, gain) {
    run.sources.add(source);
    run.nodes.add(source);
    run.nodes.add(gain);
    source.onended = function () {
      run.sources.delete(source);
      run.nodes.delete(source);
      run.nodes.delete(gain);
      try { source.disconnect(); gain.disconnect(); } catch (_) {}
    };
  }

  function strike(run, midi, beat, length, velocity, finalNote, soft) {
    const ctx = run.context;
    const start = run.start + beat * BEAT;
    const hz = 440 * Math.pow(2, (midi - 69) / 12);
    const ring = finalNote ? 2.6 : Math.max(1.25, length * BEAT + .75);
    const partials = soft ? [[1, 1, 1], [2, .1, .5]] : [
      [1, 1, 1], [2.006, .18, .56], [3.99, .055, .34], [5.98, .018, .22]
    ];
    partials.forEach(function (partial) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const peak = .14 * velocity * partial[1];
      const end = start + ring * partial[2];
      oscillator.type = 'sine';
      oscillator.frequency.value = hz * partial[0];
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + .005);
      gain.gain.exponentialRampToValueAtTime(.00001, end);
      gain.gain.linearRampToValueAtTime(0, end + .025);
      oscillator.connect(gain);
      gain.connect(run.bus);
      trackSource(run, oscillator, gain);
      oscillator.start(start);
      oscillator.stop(end + .03);
      run.end = Math.max(run.end, end + .03);
    });
  }

  function schedule(run) {
    let beat = 0;
    MELODY.forEach(function (note, index) {
      strike(run, note[0], beat, note[1], 1, index === MELODY.length - 1, false);
      beat += note[1];
    });
    ACCOMPANIMENT.forEach(function (chord) {
      chord[1].forEach(function (midi) {
        strike(run, midi, chord[0], 2, .19, chord[0] === 22, true);
      });
    });

    // The audio clock, including the last note's ring and reflections, starts
    // the next pass. Reuse the bus and discard every ended voice between loops.
    // A silent source avoids wall-clock drift when the tab is in the background.
    const clock = run.context.createOscillator();
    const silence = run.context.createGain();
    silence.gain.value = 0;
    clock.frequency.value = 0;
    clock.connect(silence);
    silence.connect(run.bus);
    trackSource(run, clock, silence);
    const releaseClock = clock.onended;
    const nextPass = run.end + .22;
    clock.onended = function () {
      releaseClock();
      if (run.closed || current !== run) return;
      if (run.context.state !== 'running') { finish(run, true); return; }
      // If a background tab delivered this callback late, resume from now
      // instead of scheduling a backlog of overlapping, overdue melodies.
      run.start = Math.max(nextPass, run.context.currentTime) + .04;
      run.end = run.start;
      try { schedule(run); } catch (_) { finish(run, true); }
    };
    clock.start(run.start);
    clock.stop(nextPass);
  }

  function finish(run, blocked) {
    if (!run || run.closed) return;
    run.closed = true;
    const wasCurrent = current === run;
    if (wasCurrent) current = null;
    const now = run.context.currentTime;
    try {
      run.master.gain.cancelScheduledValues(now);
      run.master.gain.setValueAtTime(run.master.gain.value, now);
      run.master.gain.linearRampToValueAtTime(0, now + .025);
    } catch (_) {}
    run.sources.forEach(function (source) {
      try { source.stop(now + .03); } catch (_) {}
    });
    setTimeout(function () {
      run.nodes.forEach(function (node) { try { node.disconnect(); } catch (_) {} });
      run.nodes.clear();
      run.sources.clear();
    }, 60);
    if (wasCurrent) announce(false, blocked);
  }

  async function begin(token) {
    let run = null;
    try {
      const ctx = audioContext();
      const canPlay = await ready(ctx);
      if (token !== generation || !wanted || document.hidden) return false;
      if (!canPlay) {lastError='resume-blocked';announce(false, true);return false;}
      run = makeRun(ctx);
      current = run;
      schedule(run);
      lastError='';
      announce(true, false);
      return true;
    } catch (error) {
      lastError='music-start-failed'+(error&&error.name?':'+error.name:'');
      if (run) finish(run, true);
      else if (token === generation) announce(false, true);
      return false;
    }
  }

  function play() {
    wanted=true;
    if(document.hidden)return Promise.resolve(false);
    if (current && !current.closed) {
      if (current.context.state === 'running') return Promise.resolve(true);
      finish(current, true);
    }
    if (pending) {
      // A new user gesture must be able to retry a resume that was previously
      // waiting for activation, rather than remaining attached to that wait.
      if(context&&context.state!=='running'&&context.state!=='closed') {
        try {Promise.resolve(context.resume()).catch(function () {});} catch (_) {}
      }
      return pending;
    }
    const request = begin(++generation);
    pending = request;
    request.then(function () { if (pending === request) pending = null; });
    return request;
  }

  function stop() {
    wanted=false;
    generation++;
    pending = null;
    if(waiting)waiting.settle(false);
    if (current) finish(current, false);
    else announce(false, false);
  }

  function pauseForPage() {
    generation++;pending=null;
    if(waiting)waiting.settle(false);
    if(current)finish(current,false);
  }
  window.addEventListener('pagehide',pauseForPage);
  window.addEventListener('pageshow',function () {if(wanted&&!document.hidden)play();});
  document.addEventListener('visibilitychange',function () {
    if(document.hidden)pauseForPage();
    else if(wanted)play();
  });

  window.BirthdayMusic = {
    play: play,
    stop: stop,
    isPlaying: function () { return Boolean(current && !current.closed && current.context.state === 'running'); },
    getStatus: getStatus
  };
})();
