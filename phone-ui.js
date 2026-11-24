(function () {
  'use strict';
  const glyphs = {
    lock: '<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    bulb: '<path d="M8 15c-1-2-3-3-3-6a7 7 0 0 1 14 0c0 3-2 4-3 6l-1 3H9z"/><path d="M9 21h6M9 15h6M12 3v4"/>',
    torch: '<path d="M5 3h14v5l-4 4v9H9v-9L5 8zM5 8h14M10 15h4"/>',
    home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>',
    backspace: '<path d="M9 5h12v14H9L2 12zM12 9l6 6M18 9l-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    power: '<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
    signal: '<path d="M3 19v-3M8 19v-7M13 19V8M18 19V4"/>',
    wifi: '<path d="M2 8a16 16 0 0 1 20 0M6 12a10 10 0 0 1 12 0M10 16a4 4 0 0 1 4 0"/><circle cx="12" cy="20" r=".5"/>',
    battery: '<rect x="2" y="6" width="17" height="12" rx="3"/><path d="M22 10v4M5 9h11v6H5z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (glyphs[name] || glyphs.bulb) + '</svg>';
  const status = () => '<div class="phone-status"><span>19:91</span><span class="phone-island" aria-hidden="true"><i></i></span><span class="phone-status-icons">' + icon('signal') + icon('wifi') + icon('battery') + '</span></div>';
  const wrap = (body, cls) => '<div class="phone-screen ' + cls + '">' + status() + body + '<div class="phone-home-indicator" aria-hidden="true"></div></div>';
  const close = () => '<button type="button" class="phone-dismiss" data-act="close">폰 내려놓기</button>';
  const colors = ['#fa818e', '#f7d96d', '#73dfb2', '#80b8ff'];
  const names = ['R', 'Y', 'G', 'B'];
  function lock() {
    const letters = ['', '', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
    let keys = '';
    for (let n = 1; n <= 9; n++) keys += '<button type="button" class="phone-key" data-act="phone-digit" data-value="' + n + '" aria-label="' + n + '"><span>' + n + '</span><small aria-hidden="true">' + (letters[n] || '&nbsp;') + '</small></button>';
    keys += '<button type="button" class="phone-key phone-key-util" data-act="phone-backspace" aria-label="한 자리 지우기">' + icon('backspace') + '</button><button type="button" class="phone-key" data-act="phone-digit" data-value="0" aria-label="0"><span>0</span></button><button type="button" class="phone-key phone-key-util" data-act="phone-submit">확인</button>';
    return wrap('<div class="phone-lock-main"><div class="phone-lock-mark">' + icon('lock') + '</div><p class="phone-owner">DJ 다다의 폰</p><div class="phone-big-time" aria-label="십구 시 구십일 분">19:91</div><form id="phone-form" class="phone-pin-form"><label for="phone-code">비밀번호 입력</label><p class="phone-pin-help">숫자 네 자리로 잠금을 해제하세요</p><input id="phone-code" name="answer" class="phone-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="비밀번호 네 자리" aria-describedby="phone-error" placeholder="○○○○"><p id="phone-error" class="phone-error" role="alert"></p><div class="phone-keypad">' + keys + '</div></form>' + close() + '</div>', 'phone-lock-screen');
  }
  function home(torchOn=false) {
    return wrap('<div class="phone-desktop"><div class="phone-desktop-heading"><p class="phone-owner">DJ 다다의 폰</p><h2>난 ㄱr끔 눈물을<br>흘린ㄷr,,,☆</h2></div><div class="phone-music-widget"><div class="phone-record" aria-hidden="true"><i></i></div><div><small>NOW PLAYING</small><strong>DADA's Mixing</strong><span>재생 대기 중</span></div><span class="phone-music-wave" aria-hidden="true">▂ ▅ ▃ ▆ ▂</span></div><div class="phone-app-grid"><button type="button" class="phone-app" data-act="open-lights"><span class="phone-app-icon phone-app-lights">' + icon('bulb') + '</span><span>스마트 조명</span></button><button type="button" class="phone-app" data-act="phone-torch" aria-pressed="' + Boolean(torchOn) + '"><span class="phone-app-icon phone-app-torch">' + icon('torch') + '</span><span>손전등</span></button></div><div class="phone-desktop-space" aria-hidden="true"></div><div class="phone-dock">' + close() + '</div></div>', 'phone-home-screen');
  }
  function channels(levels) {
    return names.map((name, i) => {
      const level = Math.max(0, Math.min(5, Math.trunc(Number(levels && levels[i]) || 0)));
      return '<div class="channel phone-channel" style="--ch:' + colors[i] + '"><div class="phone-channel-led" aria-hidden="true"></div><div class="channel-name">CH ' + (i + 1) + '</div><div class="phone-channel-color">' + name + '</div><div class="level-stack">' + [1,2,3,4,5].map(n => '<button type="button" class="level-block' + (level >= n ? ' on' : '') + '" data-act="set-level" data-value="' + i + ',' + n + '" aria-label="' + name + ' ' + n + '단" aria-pressed="' + (level >= n) + '"></button>').join('') + '</div><div class="level-number" aria-label="' + name + ' 현재 ' + level + '단">' + level + '</div><div class="channel-controls"><button type="button" data-act="change-level" data-value="' + i + ',-1" aria-label="' + name + ' 한 단계 낮추기">−</button><button type="button" data-act="change-level" data-value="' + i + ',1" aria-label="' + name + ' 한 단계 높이기">+</button></div></div>';
    }).join('');
  }
  function lights(levels, completed) {
    const done = Boolean(completed);
    let channelHTML = channels(levels);
    if (done) channelHTML = channelHTML.replaceAll('<button ', '<button disabled ');
    return wrap('<div class="phone-light-app"><header class="phone-app-header"><button type="button" class="phone-nav-button" data-act="phone-home" aria-label="휴대폰 홈 화면">' + icon('home') + '</button><span>스마트 조명</span><button type="button" class="phone-nav-button" data-act="close" aria-label="폰 내려놓기">' + icon('close') + '</button></header><div class="phone-room-card"><div class="phone-room-icon">' + icon('bulb') + '</div><div><p>PARTY ROOM</p><h2>파티장 조명</h2><span class="phone-device-state ' + (done ? 'is-connected' : '') + '"><i></i>' + (done ? '조명 켜짐' : '조명 꺼짐 · 연결 대기') + '</span></div></div><div class="phone-control-heading"><span>채널 레벨</span><span>4 CHANNELS</span></div><div class="equalizer phone-equalizer" id="channels">' + channelHTML + '</div><p id="eq-error" class="phone-error" role="alert">' + (done ? '1125 SYNC COMPLETE!' : '') + '</p><button type="button" class="phone-sync' + (done ? ' is-complete' : '') + '" data-act="sync"' + (done ? ' disabled' : '') + '>' + icon(done ? 'check' : 'power') + (done ? '연결 완료' : '조명 연결') + '</button><p class="phone-controller-label">DADA HOME · LIGHT CONTROLLER</p><div class="phone-app-bottom"><button type="button" data-act="phone-home">홈 화면</button><button type="button" data-act="close">폰 내려놓기</button></div></div>', 'phone-lights-screen');
  }
  window.PhoneUI = { lock, home, lights, channels };
})();
