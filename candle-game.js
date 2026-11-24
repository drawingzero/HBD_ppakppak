(function () {
  'use strict';

  const STAGES = [
    { centers: [.50], width: .16, speed: .74 },
    { centers: [.28, .72], width: .14, speed: .80 },
    { centers: [.10, .30, .50, .70, .90], width: .06, speed: .95 }
  ];
  const INPUT_GAP = 140;
  const CHALLENGE_MS = 30000;
  let current = null;

  function indexOf(value) {
    const index = Number(value);
    return Number.isInteger(index) && index >= 0 && index < STAGES.length ? index : -1;
  }

  function challengeState(value) {
    value = value || {};
    const unlimited = value.unlimited === true;
    const supplied = Number(value.remainingMs);
    const remaining = Number.isFinite(supplied)
      ? Math.max(0, Math.min(CHALLENGE_MS, supplied)) : CHALLENGE_MS;
    const expired = !unlimited && (value.expired === true || remaining === 0);
    return { remainingMs: unlimited || expired ? 0 : remaining, unlimited: unlimited, expired: expired };
  }

  function clockText(challenge) {
    if (challenge.unlimited) return '시간 제한 없음';
    const seconds = Math.ceil(challenge.remainingMs / 1000);
    return '00:' + String(seconds).padStart(2, '0');
  }

  function markup(stageIndex, challenge) {
    const index = indexOf(stageIndex);
    if (index < 0) return '';
    const config = STAGES[index];
    const timed = index === 2 ? challengeState(challenge) : null;
    const candles = [0, 1, 2].map(function (number) {
      const off = number < index;
      const flame = index === 2 && number === 2
        ? '<button type="button" class="candle-secret-flame" data-act="secret-candle" aria-label="마지막 촛불"></button>'
        : '';
      return '<div class="candle' + (off ? ' off' : '') + '" aria-label="' + (off ? '꺼진' : '켜진') + ' 촛불">' + flame + '</div>';
    }).join('');
    const zones = config.centers.map(function (center, number) {
      return '<div class="target-zone" data-zone="' + number + '" style="left:' + center * 100 + '%;width:' + config.width * 100 + '%" aria-label="' + (number + 1) + '번 목표"><span>' + (number + 1) + '</span></div>';
    }).join('');
    const checks = config.centers.map(function (_, number) {
      return '<span data-check="' + number + '">' + (number + 1) + '</span>';
    }).join('');
    return '<div class="candle-game" data-candle-stage="' + index + '">' +
      '<p class="modal-copy">밝은 막대가 초록 구간에 들어오면 후~!<br><strong>' + config.centers.length + '곳을 모두 한 번씩</strong> 맞히면 촛불이 꺼져요.</p>' +
      (timed ? '<div class="candle-challenge-clock" id="candle-challenge-clock" role="timer" aria-live="off"><span id="candle-clock-label">' + (timed.unlimited ? '마지막 촛불' : '남은 시간') + '</span><strong id="candle-time-left">' + clockText(timed) + '</strong></div>' : '') +
      '<div class="candle-picture">' + candles + '</div>' +
      '<div class="candle-checks" id="candle-checks">' + checks + '</div>' +
      '<div class="meter" id="candle-meter">' + zones + '<div id="moving-bar" class="moving-bar"></div></div>' +
      '<div class="meter-caption"><span id="zone-progress">0 / ' + config.centers.length + '곳 성공</span><span id="candle-remaining">남은 촛불 ' + (3 - index) + '개</span></div>' +
      '<button type="button" class="primary blow" id="blow-button" data-act="blow"' + (timed && timed.expired ? ' hidden disabled' : '') + '>후~ 불기 <span class="key-tag">SPACE</span></button>' +
      '<p class="candle-result" id="candle-result" aria-live="polite"' + (timed && timed.expired ? ' hidden' : '') + '>빗나가면 지금 단계의 표시만 초기화돼요.</p>' +
      (timed ? '<section class="candle-timeout" id="candle-timeout" aria-labelledby="candle-timeout-question"' + (timed.expired ? '' : ' hidden') + '><h3 id="candle-timeout-question" tabindex="-1">혹시 짜증났나요?^___^ 그냥 다음으로 넘어갈 기회를 줄까?</h3><div class="candle-timeout-actions"><button type="button" data-act="candle-give-up">웅ㅠㅠ 규석곤듀 못하겠오</button><button type="button" class="primary" data-act="candle-retry">죽어도 해낸다</button></div></section>' : '') +
      '</div>';
  }

  function stopRun(run) {
    if (!run || run.stopped) return;
    run.stopped = true;
    refreshChallenge(run, performance.now(), false, false);
    if (run.raf) cancelAnimationFrame(run.raf);
    run.raf = 0;
    run.modal.removeEventListener('close', run.onClose);
    run.modal.removeEventListener('cancel', run.onCancel);
    if (current === run) current = null;
    publishChallenge(run, true);
  }

  function stop() { stopRun(current); }

  function active(run) {
    if (!run || current !== run || run.completed || run.stopped) return false;
    if (!run.modal.open || !run.root.isConnected || !run.modal.contains(run.root)) {
      stopRun(run);
      return false;
    }
    return true;
  }

  function positionAt(run, now) {
    const phase = (Math.max(0, now - run.startedAt) / 1000 * run.config.speed) % 2;
    return phase <= 1 ? phase : 2 - phase;
  }

  function publishChallenge(run, force) {
    if (!run.challenge) return;
    const value = run.challenge;
    const key = [Math.ceil(value.remainingMs / 1000), value.unlimited, value.expired].join(':');
    if (!force && key === run.publishedKey) return;
    run.publishedKey = key;
    if (typeof run.onChallengeChange === 'function') {
      run.onChallengeChange({ remainingMs: value.remainingMs, unlimited: value.unlimited, expired: value.expired });
    }
  }

  function renderClock(run) {
    if (!run.challenge) return;
    const value = run.challenge;
    run.clockLabel.textContent = value.unlimited ? '마지막 촛불' : '남은 시간';
    run.timeLeft.textContent = clockText(value);
    run.clock.setAttribute('aria-label', value.unlimited ? '시간 제한 없음' : '남은 시간 ' + Math.ceil(value.remainingMs / 1000) + '초');
    run.clock.classList.toggle('is-urgent', !value.unlimited && !value.expired && value.remainingMs <= 10000);
    run.clock.classList.toggle('is-expired', value.expired);
  }

  function showTimeout(run) {
    if (run.promptShown) return;
    run.promptShown = true;
    if (run.raf) cancelAnimationFrame(run.raf);
    run.raf = 0;
    run.bar.style.left = positionAt(run, run.deadline) * 100 + '%';
    run.button.disabled = true;
    run.button.hidden = true;
    run.result.hidden = true;
    run.prompt.hidden = false;
    // Focus text, never a choice: a held Space key must not give up for the user.
    run.question.focus({ preventScroll: true });
  }

  function refreshChallenge(run, now, show, publish) {
    if (!run.challenge) return false;
    if (!run.challenge.unlimited && !run.challenge.expired) {
      run.challenge.remainingMs = Math.max(0, run.deadline - now);
      if (run.challenge.remainingMs === 0) run.challenge.expired = true;
    }
    if (show) {
      renderClock(run);
      if (run.challenge.expired) showTimeout(run);
    }
    if (publish !== false) publishChallenge(run, false);
    return run.challenge.expired;
  }

  function animate(run) {
    if (!active(run) || run.raf || (run.challenge && run.challenge.expired)) return;
    function frame(now) {
      run.raf = 0;
      if (!active(run)) return;
      if (refreshChallenge(run, now, true, true) || !active(run)) return;
      run.bar.style.left = positionAt(run, now) * 100 + '%';
      run.raf = requestAnimationFrame(frame);
    }
    run.raf = requestAnimationFrame(frame);
  }

  function updateMarks(run) {
    run.root.querySelectorAll('[data-zone]').forEach(function (element) {
      const number = Number(element.dataset.zone);
      const hit = run.hits.has(number);
      element.classList.toggle('hit', hit);
      element.querySelector('span').textContent = hit ? '✓' : number + 1;
      element.setAttribute('aria-label', (number + 1) + '번 목표' + (hit ? ' 성공' : ''));
    });
    run.root.querySelectorAll('[data-check]').forEach(function (element) {
      const number = Number(element.dataset.check);
      const hit = run.hits.has(number);
      element.classList.toggle('hit', hit);
      element.textContent = hit ? '✓' : number + 1;
    });
    run.progress.textContent = run.hits.size + ' / ' + run.config.centers.length + '곳 성공';
  }

  function result(run, message, success) {
    run.result.textContent = message;
    run.result.classList.toggle('success', Boolean(success));
  }

  function playTone(run) {
    if (typeof run.playTone !== 'function') return;
    try { run.playTone(true); } catch (_) {}
  }

  function complete(run, secret, skipped) {
    if (!active(run)) return false;
    // Lock before changing the DOM or invoking callbacks, including audio.
    run.completed = true;
    stopRun(run);
    run.root.querySelectorAll('.candle').forEach(function (candle, index) {
      const off = index <= run.stageIndex;
      candle.classList.toggle('off', off);
      candle.setAttribute('aria-label', (off ? '꺼진' : '켜진') + ' 촛불');
    });
    const flame = run.root.querySelector('[data-act="secret-candle"]');
    if (flame) { flame.disabled = true; flame.tabIndex = -1; }
    run.root.querySelector('#candle-remaining').textContent = '남은 촛불 ' + (2 - run.stageIndex) + '개';
    run.meter.classList.remove('miss');
    if (run.prompt) run.prompt.hidden = true;
    run.result.hidden = false;
    run.button.hidden = run.stageIndex === 2;
    run.button.disabled = run.stageIndex === 2;
    if (secret || skipped) run.progress.textContent = '마지막 촛불 꺼짐';
    if (run.clock) {
      run.clockLabel.textContent = '마지막 촛불';
      run.timeLeft.textContent = '완료';
      run.clock.setAttribute('aria-label', '마지막 촛불 완료');
      run.clock.classList.remove('is-urgent', 'is-expired');
    }
    const messages = [
      '첫 번째 촛불이 꺼졌다! 다음은 서로 다른 2곳이야.',
      '두 번째 촛불도 꺼졌다! 마지막은 5곳, 조금 더 빨라져.',
      '후~ 촛불을 모두 껐다! 소원이 이루어지길!'
    ];
    result(run, skipped ? '마지막 촛불이 꺼졌다!' : secret ? '생일 주인공은 반칙해도 되지!' : messages[run.stageIndex], true);
    if (run.stageIndex < 2) {
      run.button.textContent = '다음 촛불 준비';
      run.button.dataset.act = 'candles';
      run.button.focus({ preventScroll: true });
      playTone(run);
    }
    if (typeof run.onComplete === 'function') {
      run.onComplete({ stageIndex: run.stageIndex, secret: Boolean(secret), skipped: Boolean(skipped) });
    }
    return true;
  }

  function start(options) {
    stop();
    options = options || {};
    const index = indexOf(options.stageIndex);
    const modal = document.getElementById('modal');
    if (index < 0 || !modal || !modal.open) return false;
    const root = modal.querySelector('.candle-game[data-candle-stage="' + index + '"]');
    if (!root) return false;
    const now = performance.now();
    const challenge = index === 2 ? challengeState(options.challenge) : null;
    const run = {
      stageIndex: index, config: STAGES[index], modal: modal, root: root,
      bar: root.querySelector('#moving-bar'), meter: root.querySelector('#candle-meter'),
      progress: root.querySelector('#zone-progress'), result: root.querySelector('#candle-result'),
      button: root.querySelector('#blow-button'),
      clock: root.querySelector('#candle-challenge-clock'), clockLabel: root.querySelector('#candle-clock-label'),
      timeLeft: root.querySelector('#candle-time-left'), prompt: root.querySelector('#candle-timeout'),
      question: root.querySelector('#candle-timeout-question'),
      challenge: challenge, deadline: challenge ? now + challenge.remainingMs : Infinity,
      startedAt: now, lastBlow: -Infinity, promptShown: false,
      hits: new Set(), completed: false, stopped: false, raf: 0, publishedKey: '',
      onComplete: options.onComplete, playTone: options.playTone, onChallengeChange: options.onChallengeChange
    };
    if (!run.bar || !run.meter || !run.progress || !run.result || !run.button) return false;
    if (challenge && (!run.clock || !run.clockLabel || !run.timeLeft || !run.prompt || !run.question)) return false;
    run.onClose = function () { if (!modal.open && current === run) stopRun(run); };
    run.onCancel = function (event) { if (!event.defaultPrevented && current === run) stopRun(run); };
    current = run;
    modal.addEventListener('close', run.onClose);
    modal.addEventListener('cancel', run.onCancel);
    run.root.querySelectorAll('.candle').forEach(function (candle, number) {
      const off = number < index;
      candle.classList.toggle('off', off);
      candle.setAttribute('aria-label', (off ? '꺼진' : '켜진') + ' 촛불');
    });
    const flame = run.root.querySelector('[data-act="secret-candle"]');
    if (flame) { flame.disabled = false; flame.tabIndex = 0; }
    run.root.querySelector('#candle-remaining').textContent = '남은 촛불 ' + (3 - index) + '개';
    run.button.innerHTML = '후~ 불기 <span class="key-tag">SPACE</span>';
    run.button.dataset.act = 'blow';
    run.button.disabled = false;
    run.button.hidden = false;
    run.result.hidden = false;
    if (run.prompt) run.prompt.hidden = true;
    run.meter.classList.remove('miss');
    result(run, '빗나가면 지금 단계의 표시만 초기화돼요.', false);
    run.bar.style.left = '0%';
    updateMarks(run);
    renderClock(run);
    publishChallenge(run, true);
    if (!active(run)) return false;
    if (challenge && challenge.expired) showTimeout(run);
    else { run.button.focus({ preventScroll: true }); animate(run); }
    return true;
  }

  function blow() {
    const run = current;
    if (!active(run)) return false;
    const now = performance.now();
    if (refreshChallenge(run, now, true, true) || !active(run)) return false;
    if (now - run.lastBlow < INPUT_GAP) return false;
    run.lastBlow = now;
    const position = positionAt(run, now);
    run.bar.style.left = position * 100 + '%';
    const target = run.config.centers.findIndex(function (center) {
      return Math.abs(position - center) <= run.config.width / 2;
    });
    if (target < 0) {
      run.hits.clear();
      updateMarks(run);
      result(run, '앗, 빗나갔다! 이번 촛불의 ' + run.config.centers.length + '곳을 다시 맞혀 보자.', false);
      run.meter.classList.remove('miss');
      void run.meter.offsetWidth;
      run.meter.classList.add('miss');
      return false;
    }
    if (run.hits.has(target)) {
      result(run, '여기는 이미 성공! 아직 남아 있는 초록 구간을 노려보자.', false);
      return false;
    }
    run.hits.add(target);
    updateMarks(run);
    if (run.hits.size === run.config.centers.length) return complete(run, false);
    result(run, (target + 1) + '번 성공! ' + (run.config.centers.length - run.hits.size) + '곳 남았어.', true);
    playTone(run);
    return true;
  }

  function secret() {
    const run = current;
    if (!active(run) || run.stageIndex !== 2) return false;
    refreshChallenge(run, performance.now(), true, true);
    return complete(run, true);
  }

  function giveUp() {
    const run = current;
    if (!active(run) || run.stageIndex !== 2) return false;
    refreshChallenge(run, performance.now(), true, true);
    if (!run.challenge.expired) return false;
    return complete(run, false, true);
  }

  function retry() {
    const run = current;
    if (!active(run) || run.stageIndex !== 2) return false;
    refreshChallenge(run, performance.now(), true, true);
    if (!run.challenge.expired) return false;
    run.challenge = { remainingMs: 0, unlimited: true, expired: false };
    run.deadline = Infinity;
    run.startedAt = performance.now();
    run.lastBlow = -Infinity;
    run.promptShown = false;
    run.hits.clear();
    updateMarks(run);
    run.bar.style.left = '0%';
    run.meter.classList.remove('miss');
    run.prompt.hidden = true;
    run.button.disabled = false;
    run.button.hidden = false;
    run.result.hidden = false;
    result(run, '좋아, 시간 제한 없이 다시 해보자.', false);
    renderClock(run);
    publishChallenge(run, true);
    if (!active(run)) return false;
    run.button.focus({ preventScroll: true });
    animate(run);
    return true;
  }

  window.CandleGame = { markup: markup, start: start, blow: blow, secret: secret, giveUp: giveUp, retry: retry, stop: stop };
})();
