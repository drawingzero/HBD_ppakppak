(() => {
  'use strict';
  const A = window.GameArt;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'gyuseok-birthday-quest-v1';
  const freshChallenge = () => ({remainingMs:30000,unlimited:false,expired:false});
  const fresh = () => ({version:1,revision:6,started:false,stage:1,roomExitChecked:false,searched:[],snail:false,foodReceived:false,doorOpen:false,phoneDropped:false,phone:false,unlocked:false,torchOn:false,levels:[0,0,0,0],lights:false,lightsAnnounced:false,returned:false,djHintHeard:false,vipOrder:[],clues:[],revealed:false,candles:0,finished:false,letterReady:false,candleSecret:false,candleSkipped:false,candleChallenge:freshChallenge(),sound:true,soundPreferenceSet:false,endingMusicStarted:false,musicEnabled:true});
  let state = fresh();
  try {
    const old = JSON.parse(localStorage.getItem(KEY));
    if (old && old.version === 1 && Number.isInteger(old.stage) && old.stage >= 1 && old.stage <= 5) {
      state = Object.assign(fresh(),old);
      if(!Object.prototype.hasOwnProperty.call(old,'phoneDropped'))state.phoneDropped=old.stage>=3;
      if(!Object.prototype.hasOwnProperty.call(old,'foodReceived'))state.foodReceived=old.doorOpen||old.stage>1;
      const challenge=old.candleChallenge;
      if(challenge&&typeof challenge==='object') {
        const remaining=Number(challenge.remainingMs);
        state.candleChallenge={remainingMs:Number.isFinite(remaining)?Math.min(30000,Math.max(0,remaining)):30000,unlimited:Boolean(challenge.unlimited),expired:Boolean(challenge.expired)};
      } else state.candleChallenge=freshChallenge();
      if(!Object.prototype.hasOwnProperty.call(old,'torchOn'))state.torchOn=false;
      if(!Object.prototype.hasOwnProperty.call(old,'lightsAnnounced'))state.lightsAnnounced=old.stage>=4;
      if(!old.soundPreferenceSet&&(Number(old.revision)||0)<6)state.sound=true;
      if(!Object.prototype.hasOwnProperty.call(old,'letterReady'))state.letterReady=Boolean(old.finished);
      state.revision=6;
    }
  } catch (_) {}
  const titles = ['규석의 방','비밀 파티장 입구','불 꺼진 파티장','낯선 손님들의 파티','소원을 빌어 봐'];
  const people = {
    1:{name:'빈지노',label:'L씨',lyric:'대체 돈이 뭐지'},
    2:{name:'카리나',label:'Y씨',lyric:'다음 레벨로 가고싶어? 절대적 룰을 지켜'},
    3:{name:'김진호',label:'K씨',lyric:'아무도 내 말을 안 들어주네... 나 혼자 말하고 나 혼자 듣는 말...'},
    4:{name:'슬기',label:'K씨',lyric:'배고파요. 주세요. 달콤한 그 맛 아이스크림 케이크'},
    5:{name:'조휴일',label:'J씨',lyric:'으휴 이 91년생 어린 양들아'},
    6:{name:'TOP',label:'C씨',lyric:'아이 손 시려. 핫팩 주머니 속에 꼬깃 꼬깃'}
  };
  const extras = [
    ['파티 손님','오늘 주인공, 드디어 왔네! 기다리고 있었어.',10,59],
    ['파티 손님','음료는 내가 챙길게. 마음껏 즐겨.',90,59],
    ['사진 찍는 손님','다 같이 사진 찍을 때 불러 줘!',10,82],
    ['춤추는 손님','이 노래 끝나면 잠깐 쉴 거야. 아마도…',90,82],
    ['파티 손님','파티 준비하다가 컵케이크를 하나 먹어 버렸어. 비밀이야.',35,41],
    ['수다 떠는 손님','선물은… 마음으로 준비했어. 마음은 엄청 커.',66,41]
  ];
  const order = [3,6,5,1,4,2];
  const colors = ['#f7878b','#ffdc79','#86deae','#85bfff','#f4a9d2','#b38be8'];
  const balloons = [
    [8,41,0],[17,51,2],[8,66,3],[25,39,3],
    [74,39,1],[84,51,2],[93,39,3],[76,67,3],[92,67,3],
    [14,27,4],[29,65,5],[70,27,4],[85,32,5]
  ];
  let flow = [], afterFlow = null;
  let modalKind = '';
  let movement = null, movementReset = 0;
  let discoveryItem = '', bunnyMoving = false, bonking = false;
  let partyIntro = state.phoneDropped?'gone':'greeting', sceneBusy = false, sceneToken = 0;
  const sceneTimers = new Set();
  const btn = (label,act,value='',klass='') => '<button type="button" class="'+esc(klass)+'" data-act="'+esc(act)+'" data-value="'+esc(value)+'">'+esc(label)+'</button>';
  const top = (title,kicker='BIRTHDAY QUEST') => '<div class="modal-top"><div><p class="eyebrow">'+esc(kicker)+'</p><h2>'+esc(title)+'</h2></div>'+btn('×','close','','close')+'</div>';

  function save() {
    try { localStorage.setItem(KEY,JSON.stringify(state)); }
    catch (_) { $('saved').textContent = '이 브라우저에서는 저장이 제한돼요'; }
  }
  function sound(kind) {
    if(state.sound&&window.GameSound)window.GameSound.play(kind);
  }
  function tone(win=false) { sound(win?'success':'ui'); }
  function goal() {
    if (state.finished) return '케이크를 눌러 생일 편지를 읽어 보세요.';
    if (state.stage === 1) return state.doorOpen ? '우사기가 비켜줬다! 현관문을 열고 파티장으로 가자.' : state.snail ? '전보벌레로 우사기를 도와줄 사람에게 전화하자.' : '방 안을 살펴보고 밖으로 나갈 수 있는 방법을 찾아보자.';
    if (state.stage === 2) return '파티장 문이 굳게 닫혀 있다.';
    if (state.stage === 3) return !state.phoneDropped ? '어둠 속에서 다다의 목소리가 들린다.' : state.torchOn ? '손전등으로 방 안을 살펴보자.' : state.unlocked ? '휴대폰에 몇 가지 앱이 보인다.' : state.phone ? '작은 휴대폰 화면만 어둠 속에서 빛난다.' : '다다가 서 있던 자리에 무언가 반짝인다.';
    if (state.stage === 4) return state.revealed ? '특별 손님들의 인사를 받았다.' : !state.returned ? '다다가 무언가를 찾으며 두리번거린다.' : '낯선 손님들이 파티장에 와 있다. ('+state.vipOrder.length+'/6)';
    return '케이크 위에 작은 불꽃 세 개가 일렁인다. ('+state.candles+'/3)';
  }
  function say(who,text,choices=[],portraitKind='') {
    $('speaker').textContent = who==='규석'?'빡빡이 규석':who;
    $('dialogue-text').textContent = text;
    $('portrait').innerHTML = who ? A.avatar(portraitKind||who) : '';
    $('portrait').classList.toggle('group-portrait',who==='초대가수 일동'||who==='DJ 다다와 파티 손님들');
    $('dialogue-actions').innerHTML = choices.map(c=>btn(c[0],c[1],c[2]||'',c[3]||'')).join('');
  }
  function ambient() {
    if(state.stage===1&&!state.roomExitChecked&&!state.snail&&!state.doorOpen) say('','');
    else if(state.stage===4&&!state.returned&&!state.revealed) say('DJ 다다','내 핸드폰 어디있지...?');
    else if(state.stage===4&&!state.revealed) say('규석','낯선 손님들이 와 있네.');
    else say('규석',goal());
  }
  function talk(lines,done=null) {
    if(movement)movement.stop();
    flow = lines.slice(); afterFlow = done; drawFlow();
  }
  function drawFlow() {
    if (!flow.length) {
      const next = afterFlow; afterFlow = null;
      if (next) next(); else ambient();
      return;
    }
    const line=flow[0];
    if(typeof line[2]==='function'){const effect=line[2];line[2]=null;effect();}
    say(line[0],line[1],[[line[3]||(flow.length > 1 ? '다음' : '계속하기'),'next','','primary']],line[4]||'');
  }
  function later(fn,ms) {
    const token=sceneToken;
    const timer=setTimeout(()=>{sceneTimers.delete(timer);if(token===sceneToken)fn();},ms);
    sceneTimers.add(timer);return timer;
  }
  function cancelScene() {
    sceneToken++;sceneTimers.forEach(clearTimeout);sceneTimers.clear();
    if(window.BonkEffect)window.BonkEffect.stop();
    sceneBusy=false;bunnyMoving=false;bonking=false;discoveryItem='';
  }
  function acquired(kind) {
    const title=kind==='snail'?'전보벌레':'DJ 다다의 휴대폰';
    return '<div class="item-acquired" role="status"><div class="item-acquired-rays" aria-hidden="true"></div><span class="item-acquired-kicker">ITEM GET!</span><div class="item-acquired-art">'+A.icon(kind)+'</div><strong>'+title+' 획득!</strong><span class="item-acquired-caption">소지품에 담았다.</span></div>';
  }
  function object(kind,label,x,y,act='',value='',extra='',checked=false) {
    const hiddenLabel=state.stage===1&&act==='search';
    let walkY=Math.min(89,y+12);
    if(state.stage===1&&kind==='bed')walkY=49;
    if(state.stage===1&&kind==='door')walkY=41;
    if(state.stage===2)walkY=kind==='door'?66:63;
    if(kind==='dj')walkY=40;
    return '<button type="button" class="object '+esc(extra)+'" style="left:'+x+'%;top:'+y+'%;z-index:'+(10+Math.round((y+8)*10))+';--cheer-delay:'+((Number(value)||0)%4)*.09+'s" data-act="'+esc(act)+'" data-value="'+esc(value)+'" data-walk-x="'+x+'" data-walk-y="'+walkY+'" aria-label="'+esc(label)+'"'+(!act?' tabindex="-1"':'')+'>'+A.icon(kind)+(hiddenLabel?'':'<span class="label '+(checked?'checked':'')+'">'+esc(label)+'</span>')+'</button>';
  }
  function render() {
    save();
    $('stage-title').textContent = state.finished ? '생일 축하해, 규석!' : titles[state.stage-1];
    $('progress').innerHTML = [1,2,3,4,5].map(n=>'<li class="'+(n<state.stage?'done':n===state.stage?'active':'')+'"'+(n===state.stage?' aria-current="step"':'')+' aria-label="'+n+'단계">'+(n<state.stage?'✓':n)+'</li>').join('');
    $('sound').textContent = state.sound ? '효과음 켜짐' : '효과음 꺼짐';
    $('sound').setAttribute('aria-pressed',String(state.sound));
    updateMusicControls();
    const kind = state.stage===1?'room':state.stage===2?'entrance':state.stage===5?'finale':'party';
    $('background').innerHTML = A.scene(kind);
    const bg = $('background').querySelector('svg');
    if (bg) bg.setAttribute('preserveAspectRatio','none');
    let objects = '';
    if (state.stage === 1) {
      objects += object('bed','침대',19,30,'search','침대','',state.searched.includes('침대'));
      objects += object('drawer','서랍장',20,72,'search','서랍장','',state.searched.includes('서랍장'));
      objects += object('desk','책상',80,72,'search','책상','',state.searched.includes('책상'));
      objects += object('door','현관문',79,20,'door');
      objects += object('bunny','우사기',state.doorOpen?65:77,state.doorOpen?47:39,'bunny','','bunny'+(bunnyMoving?' bunny-leaving':''));
      if(state.foodReceived)objects+='<div class="rice-gift" aria-hidden="true">'+A.icon('friedrice')+'</div>';
    } else if (state.stage === 2) {
      objects += object('door','문 열기',50,38,'open-entrance','','entrance-door');
    } else {
      objects += balloons.map(b=>'<div class="balloon" style="left:'+b[0]+'%;top:'+b[1]+'%" aria-hidden="true">'+A.icon('balloon',colors[b[2]])+'</div>').join('');
      const searching = state.stage===4&&state.lightsAnnounced&&!state.returned&&!state.revealed;
      if(state.stage!==3)objects += object('dj','DJ 다다',50,22,'dj','',searching?'dj-searching':'');
      else if(partyIntro!=='gone')objects += object('dj','DJ 다다',50,54,'dj','',partyIntro==='running'?'dj-intro dj-running':'dj-intro');
      if(searching) objects += '<div class="dj-speech" aria-hidden="true">내 핸드폰 어디있지...?</div>';
      if (state.stage === 3) {
        if (state.phoneDropped&&!state.phone) objects += object('phone','반짝이는 물건',50,56,'pickup','','is-glowing phone-floor');
      }
      if(state.stage>=4) objects += extras.map((p,i)=>object('extra'+(i+1),p[0],p[2],p[3],'extra',i,'extra-guest extra-guest-'+i)).join('');
      if (state.stage === 4) {
        const positions = [[25,53],[50,53],[75,53],[25,78],[50,78],[75,78]];
        for (let i=1;i<=6;i++) {
          const checked = state.vipOrder.includes(i);
          objects += object('guest'+i,state.revealed?'✓ '+people[i].name:people[i].label,positions[i-1][0],positions[i-1][1],'vip',i,'guest-person',checked);
        }
      }
      if (state.stage === 5) {
        const partySeats=[[24,48],[76,48],[28,72],[73,72],[39,83],[62,83]];
        for(let i=1;i<=6;i++)objects+=object('guest'+i,people[i].name,partySeats[i-1][0],partySeats[i-1][1],'birthday-guest',i,'guest-person');
        if (!state.finished) objects += object('cake','촛불 끄기',50,58,'candles','','cake');
        else if (state.letterReady) objects += object('cake-unlit','편지 보기',50,58,'letter','','cake');
        else objects += object('cake-unlit','생일 케이크',50,58,'','','cake');
      }
    }
    if(discoveryItem)objects+=acquired(discoveryItem);
    $('objects').innerHTML = objects;
    $('party-confetti').hidden = !state.revealed || state.stage < 4;
    $('board').classList.toggle('dark',state.stage===3);
    $('board').classList.toggle('torch',state.stage===3&&state.torchOn);
    $('board').classList.toggle('celebrating',(state.stage===4&&state.revealed)||(state.stage===5&&state.finished&&!state.letterReady));
    let inv = '<span class="inventory-label">소지품</span>';
    if (state.snail && state.stage===1) inv += '<button data-act="call">'+A.icon('snail')+'전보벌레</button>';
    if (state.phone&&!state.returned) inv += '<button data-act="phone">'+A.icon('phone')+'다다의 폰</button>';
    if (!(state.snail&&state.stage===1)&&!(state.phone&&!state.returned)) inv += '<span class="empty-slot" aria-label="빈 소지품 칸">·</span>';
    $('inventory').innerHTML = inv;
    if(movement)movement.enter(roomConfig());
  }
  function roomConfig() {
    if(state.stage===1)return {roomKey:'bedroom-'+movementReset,spawn:{x:48,y:71},bounds:{minX:8,maxX:92,minY:38,maxY:91},obstacles:[{x:10,y:21,w:19,h:22},{x:12,y:62,w:16,h:15},{x:72,y:61,w:17,h:16}]};
    if(state.stage===2)return {roomKey:'entrance',spawn:{x:50,y:79},bounds:{minX:10,maxX:90,minY:60,maxY:90},obstacles:[]};
    return {roomKey:'party',spawn:{x:50,y:86},bounds:{minX:8,maxX:92,minY:37,maxY:92},obstacles:state.stage===5?[{x:44,y:48,w:12,h:15}]:[]};
  }
  function nearbyObject() {
    if(!movement)return;
    const p=movement.position();
    const nearest=Array.from($('objects').querySelectorAll('button[data-act]')).map(el=>({el,d:Math.hypot((Number(el.dataset.walkX)-p.x)*1.5,Number(el.dataset.walkY)-p.y)})).sort((a,b)=>a.d-b.d)[0];
    if(nearest&&nearest.d<19)handle(nearest.el.dataset.act,nearest.el.dataset.value||'');
    else say('규석','조금 더 가까이 가 볼까?');
  }
  function openModal(html,kind='menu') {
    stopCandle();
    if(movement)movement.stop();
    if(window.EndingPhoto)window.EndingPhoto.stop();
    modalKind = kind;
    $('modal').dataset.mode = ['phone','phone-home','equalizer'].includes(kind)?'phone':kind==='photo'?'photo':'';
    $('modal-content').innerHTML = html;
    if (!$('modal').open) $('modal').showModal();
    const input = $('modal').querySelector('[autofocus]');
    if (input) input.focus();
  }
  function closeModal() { stopCandle();if(window.EndingPhoto)window.EndingPhoto.stop(); $('modal').close(); modalKind=''; }
  function welcome() {
    openModal('<div class="welcome"><p class="eyebrow"></p><div class="welcome-art">'+A.icon('cake')+A.icon('player')+'</div><h2>규석의<br><span>생일파티</span></h2><p class="modal-copy">오늘의 주인공은 너야.<br>어서 파티장으로 가보자.</p>'+btn('시작','start','','primary')+'<p class="mini-note">바닥을 누르거나 방향키로 이동<br>물건과 인물을 누르면 다가가서 조사해요.</p></div>','welcome');
  }
  function enterStage(n) {
    cancelScene();
    state.stage=n;if(n===3){state.phoneDropped=false;partyIntro='greeting';}render();
    if (n===2) talk([['규석','드디어 파티장 입구에 도착했다!']]);
    if (n===3) partyGreeting();
    if (n===4) {if(state.lightsAnnounced)ambient();else announceLights();}
    if (n===5) talk([['DJ 다다','짠~ 우리가 다같이 케이크를 준비했어. 어서 소원 빌고 초를 꺼 봐!']]);
  }
  function announceLights() {
    talk([['시스템','조명이 켜졌다!']],()=>{
      state.lightsAnnounced=true;render();ambient();
    });
  }
  function partyGreeting() {
    partyIntro='greeting';render();
    talk([['DJ 다다','어서와! 파티장 불은 내가 껐어 우헤헤!',null,'다음']],runDada);
  }
  function runDada() {
    if(state.stage!==3||state.phoneDropped)return;
    sceneBusy=true;partyIntro='running';render();
    say('규석','어? 어디 가!');
    later(()=>{
      if(state.stage!==3)return;
      state.phoneDropped=true;save();
      $('objects').insertAdjacentHTML('beforeend',object('phone','반짝이는 물건',50,56,'pickup','','is-glowing phone-floor phone-dropping'));
    },400);
    later(()=>{
      partyIntro='gone';sceneBusy=false;render();
      talk([['규석','….왕다다가 디제이…?\n자세히 보니 방금 서 있던 자리에 무언가가 떨어져 있다...!']]);
    },1400);
  }
  function meetUsagi() {
    talk([['우사기','하아?'],['규석','뭐야 뚱뚱한 토끼가 현관문을 막고 있잖아?!']],()=>{
      state.roomExitChecked=true;save();ambient();
    });
  }
  function searchFurniture(name) {
    if (state.stage!==1) return;
    if (state.searched.length!==2||state.searched.includes(name))sound('inspect');
    if (state.snail) return say('규석',name+'은(는) 이미 샅샅이 뒤져봤다. 전보벌레로 전화를 걸어보자.',[['전보벌레 사용','call','','primary']]);
    if (state.searched.includes(name)) return say('규석','여기는 아까 뒤져봤어. 다른 곳을 찾아보자!');
    state.searched.push(name);
    if (state.searched.length===3) {
      state.snail=true;discoveryItem='snail'; render(); sound('item');
      say('규석',"찾았다!! "+name+" 구석에 숨어 있던 '전보벌레'를 발견했다!\n전화를 걸어보자.",[['전보벌레 사용','call','','primary']]);
    } else {
      render();
      say('규석',state.searched.length===1?name+' 구석을 뒤져보았다... 먼지 뿐이었다. 다른 곳도 뒤져볼까?':name+' 안쪽을 살펴보았다... 열지 않은 택배 박스가 쌓여있다. 더 뒤져보자!');
    }
  }
  function callSnail() {
    if (state.stage!==1||!state.snail) return;
    if (state.doorOpen) return say('규석','우사기가 배부르게 먹고 비켜줬다! 현관문으로 나가자.');
    if(discoveryItem){discoveryItem='';render();}
    say('전보벌레','뿌릅쁘릅뿌릅... 찰칵! 누구에게 전화를 걸까?',[['루피에게 전화한다','call-who','luffy'],['쵸파에게 전화한다','call-who','chopper'],['상디에게 전화한다','call-who','sanji']]);
  }
  function serveRice(withSanji=true) {
    const lines=[
      ['시스템','(잠시 후 상디가 나타나 김이 모락모락 나는 황금 볶음밥을 건넸다!)',()=>{state.foodReceived=true;render();sound('item');}],
      ['우사기','우라!! 야하~!! ✨',()=>{
        state.doorOpen=true;bunnyMoving=true;render();
        later(()=>{bunnyMoving=false;const bunny=$('objects').querySelector('.bunny-leaving');if(bunny)bunny.classList.remove('bunny-leaving');},800);
      }]
    ];
    if(withSanji)lines.unshift(['상디','레이디는 아니지만.. 배고픈 녀석이 있다면 당장 특제 해물 볶음밥을 만들어주지.']);
    talk(lines);
  }
  function openMirror() {
    say('규석','...암호가 있네ㅎ');
    openModal(top('거울 너머의 암호','STAGE 02 · MIRROR CODE')+'<div class="mirror-reaction">'+A.avatar('규석')+'<span><b>빡빡이 규석</b>...암호가 있네ㅎ</span></div><p class="modal-copy">거울 반대편에 오늘의 주인공이 있습니다.<br>네모칸 안에 들어갈 글자를 맞춰주세요.</p><img class="puzzle-image" src="assets/mirror-puzzle.png" alt="왼쪽 빈칸과 다섯 개의 거울 기호가 있는 문제 그림"><form id="mirror-form"><details class="mirror-hint"><summary>힌트 보기</summary><p>알파벳 1글자</p></details><div class="code-row"><input id="mirror-code" class="letters" name="answer" aria-label="거울 암호" type="text" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="mirror-error" autofocus><button type="submit" class="primary">확인</button></div></form><p class="error" id="mirror-error" role="alert"></p>','mirror');
  }
  function openPhone() {
    if (!state.phone||state.returned) return;
    if (state.unlocked) return openPhoneHome();
    openModal(window.PhoneUI.lock(),'phone');
  }
  function openPhoneHome() {
    if(!state.phone||state.returned||!state.unlocked)return;
    openModal(window.PhoneUI.home(state.torchOn),'phone-home');
  }
  function checkPhoneCode() {
    if(modalKind!=='phone'||state.unlocked||state.stage!==3||!$('phone-code'))return;
    const input=$('phone-code');
    input.value=input.value.replace(/\D/g,'').slice(0,4);
    if(window.PhoneUI.updatePin)window.PhoneUI.updatePin(input.value);
    if(input.value.length<4)return;
    if(input.value==='1112') {
      state.unlocked=true;render();tone(true);
      say('규석','열렸다. 다다의 휴대폰이다.');
      openPhoneHome();
    } else {
      sound('error');$('phone-error').textContent='❌ 땡!';
      input.value='';
      if(window.PhoneUI.updatePin)window.PhoneUI.updatePin('');
    }
  }
  function openEqualizer() {
    if(!state.phone||state.returned||!state.unlocked)return;
    openModal(window.PhoneUI.lights(state.levels,state.lights),'equalizer');
  }
  function visitDJ() {
    if (state.stage===3) return say('DJ 다다','어두워서 네가 어디 있는지 안 보이네~ 내 폰부터 찾아 봐!');
    if (state.stage===5) return state.finished ? guideToLetter() : say('DJ 다다','소원 빌었어? 케이크의 촛불을 꺼 봐!');
    if (state.stage!==4) return;
    if (state.revealed) return enterStage(5);
    if (!state.returned) return say('DJ 다다','내 핸드폰 어디있지...?\n(두리번 두리번)',[['핸드폰 돌려주기','return-phone','','primary'],['안 돌려주기','keep-phone']]);
    say('DJ 다다','왜애? 뭘 해야 할지 모르겠어? 힌트 줄까?',[['네!! 제가 뭘 하면 될깝쇼!!','dj-hint'],['네!! 힌트 좀 주십쇼 형님!!','dj-hint'],['네!! 납작 엎드립니다 알려주세요!!','dj-hint']]);
  }
  function openVIP(id) {
    if (state.stage!==4) return;
    if (state.revealed) return say(people[id].name,'한규석쒸 생일 축하해요!! 🎉',[],'guest'+id);
    if(!state.clues.includes(id)){state.clues.push(id);save();}
    const checked=state.vipOrder.includes(id);
    openModal(top(people[id].label,'PARTY GUEST')+'<div class="vip-avatar">'+A.icon('guest'+id)+'</div><div class="lyric">“'+esc(people[id].lyric)+'”</div>'+(checked?'<p class="status-label">'+(state.vipOrder.indexOf(id)+1)+'번째 인사 완료</p>':'')+'<div class="modal-actions">'+btn('인사하기','greet',id,'primary')+'</div>','vip');
  }
  function greet(id) {
    if (state.stage!==4||state.revealed||!people[id]) return;
    closeModal();
    if (!state.djHintHeard) {
      const guest=$('objects').querySelector('.guest-person[data-value="'+id+'"]');
      if(guest){guest.classList.remove('guest-grooving');void guest.offsetWidth;guest.classList.add('guest-grooving');later(()=>guest.classList.remove('guest-grooving'),2400);}
      sound('talk');
      return say(people[id].label,'고개를 끄덕이며 말없이 춤을 춘다.',[],'guest'+id);
    }
    if (!state.returned) return say('규석','다다한테 휴대폰부터 돌려주자.');
    if (state.vipOrder.includes(id)) return say(people[id].label,'조용히 웃으며 손을 흔든다.',[],'guest'+id);
    if (order[state.vipOrder.length]!==id) {
      const hadProgress=state.vipOrder.length>0;
      state.vipOrder=[]; render();sound('error');
      return say(people[id].label,hadProgress?'나한테 먼저 오면 어떡해. 처음부터 다시 해 봐.':'흠... 나보다 먼저 인사드려야 할 선배님이 계신 것 같은데?',[],'guest'+id);
    }
    state.vipOrder.push(id);
    if (!state.clues.includes(id)) state.clues.push(id);
    if (state.vipOrder.length===6) {
      state.revealed=true; startCelebration();
    } else {
      render(); tone(true);
      say(people[id].label,'“'+people[id].lyric+'”\n조용히 고개를 끄덕인다. ('+state.vipOrder.length+'/6)',[],'guest'+id);
    }
  }
  function startCelebration() {
    render();sound('cheer');
    talk([['초대가수 일동','한규석쒸 생일 축하해요!! 🎉']],()=>enterStage(5));
  }
  function stopCandle() { if(window.CandleGame)window.CandleGame.stop(); }
  function openCandles() {
    if(state.stage!==5)return;
    if(state.finished||state.candles>=3)return;
    stopCandle();
    const n=state.candles;
    openModal(top('소원을 빌고, 후~','CANDLE '+(n+1)+' / 3')+window.CandleGame.markup(n,state.candleChallenge),'candles');
    window.CandleGame.start({stageIndex:n,challenge:state.candleChallenge,playTone:()=>tone(true),onComplete:completeCandle,onChallengeChange:challenge=>{
      if(n===2&&state.stage===5&&state.candles===2&&!state.finished){if(challenge.expired&&!state.candleChallenge.expired)sound('talk');state.candleChallenge=Object.assign({},challenge);save();}
    }});
  }
  function blow() {
    if($('modal').open&&modalKind==='candles'&&!state.finished) {
      if(state.candles===2&&state.candleChallenge.expired&&!state.candleChallenge.unlimited)return;
      sound('blow');window.CandleGame.blow();
    }
  }
  function completeCandle(result) {
    if(state.stage!==5||state.finished||result.stageIndex!==state.candles)return;
    state.candles=result.stageIndex+1;state.finished=state.candles===3;
    if(result.secret)state.candleSecret=true;
    if(result.skipped)state.candleSkipped=true;
    if(state.finished) {
      closeModal();
      state.endingMusicStarted=true;
      startBirthdayCheer();
      sound('applause');
      if(state.musicEnabled&&window.BirthdayMusic)window.BirthdayMusic.play();
    } else {
      render();
      say('DJ 다다','잘했어! 남은 촛불도 꺼 보자.');
    }
  }
  function startBirthdayCheer() {
    render();
    talk([['DJ 다다와 파티 손님들','규석아, 생일 축하해!! 🎉',null,'다음','birthday-group']],()=>{
      state.letterReady=true;
      render();
      guideToLetter();
      $('objects').querySelector('.cake').focus({preventScroll:true});
    });
    $('dialogue-actions').querySelector('button').focus({preventScroll:true});
  }
  function guideToLetter() {
    say('DJ 다다','이제 편지도 읽어 봐! 가운데 생일 케이크를 누르면 열려.');
  }
  function openLetter() {
    if (!state.finished||!state.letterReady) return;
    state.endingMusicStarted=true;save();
    openModal(top('규석에게 도착한 편지','QUEST COMPLETE · HAPPY BIRTHDAY')+'<article class="letter"><h3>🎉 HAPPY BIRTHDAY 🎉</h3><p>빡빡아 안녕?</p> <p>휴 방금 전까지 내가 누나였는데 다시 동갑 됐네. 생일 축하해!</p><p>선물 없이 어떻게 생일을 축하 해줄 수 있을까, 난 받았지만 입을 싹 닫을까 고민하다가.. 나는 배운 사람이니까.. 그동안 쌓인 이야기들을 모아 짧은 게임을 만들어봤어. 잠깐이었지만 즐거운 시간 되었니? 이런 선물은 내가 1빠지?! 우하하</p><p>연락이 오는 건 싫지만 사실은 관종이라 축하 많이 받고 싶은 거 알아. 그러니 꼭 그런 하루가 되길 바랄게^___^ (나 잘 알지?) 장난이고, 오늘은 진짜로 누구보다 행복했으면 좋겠다! 생일 정말 정말 진심으로 축하해. 그럼 안뇽!</p><p class="signature">-2026년 11월 25일 다영이가-</p></article><div class="modal-actions">'+btn('단체사진 찍기','photo','','primary')+btn('파티장으로 돌아가기','close','','purple')+'</div><div class="letter-sound-controls"><button type="button" class="quiet" data-act="music-toggle" id="music-toggle" aria-pressed="false">음악 켜기</button></div>','letter');
    updateMusicControls();
    if(state.musicEnabled&&window.BirthdayMusic)window.BirthdayMusic.play();
  }
  function updateMusicControls() {
    const playing=Boolean(window.BirthdayMusic&&window.BirthdayMusic.isPlaying());
    const footer=$('music-footer-toggle');
    if(footer)footer.hidden=!state.endingMusicStarted;
    for(const id of ['music-toggle','music-footer-toggle']) {
      const control=$(id);if(!control)continue;
      control.textContent=playing?'BGM 끄기':'BGM 켜기';
      control.setAttribute('aria-pressed',String(playing));
    }
  }
  function openPhoto() {
    if(!state.finished||!window.EndingPhoto)return;
    openModal(top('26년 한규석 생파 기념사진','ONE MORE MEMORY · 11.25')+window.EndingPhoto.markup()+'<div class="modal-actions">'+btn('편지로 돌아가기','letter','','purple')+'</div><div class="letter-sound-controls"><button type="button" class="quiet" data-act="music-toggle" id="music-toggle" aria-pressed="false">BGM 켜기</button></div>','photo');
    updateMusicControls();
    window.EndingPhoto.start();
  }
  function bonkPlayer() {
    if(movement)movement.stop();sceneBusy=true;bonking=true;
    const token=sceneToken;
    say('DJ 다다','내 폰 안 돌려줄 거야...?');
    const onImpact=()=>{if(token!==sceneToken)return;sound('bonk');say('DJ 다다','콩! 내 폰 돌려줘~~');};
    const onDone=()=>{if(token!==sceneToken)return;sceneBusy=false;bonking=false;say('DJ 다다','콩! 내 폰 돌려줘~~',[['핸드폰 돌려주기','return-phone','','primary']]);};
    if(window.BonkEffect&&$('walker'))window.BonkEffect.play({board:$('board'),walker:$('walker'),onImpact,onDone});
    else {onImpact();onDone();}
  }
  function help() {
    openModal(top('이렇게 플레이해요','HOW TO PLAY')+'<ul class="help-list"><li>바닥을 누르면 그곳으로 걸어가요. 방향키나 WASD로도 움직일 수 있어요.</li><li>물건이나 사람을 누르면 다가가서 조사해요. 가까이에서 E키를 눌러도 돼요.</li><li>아래 대화창에 선택지가 나오면 원하는 답을 눌러 주세요.</li><li>휴대폰의 손전등 앱을 켠 뒤 마우스를 움직여 어두운 방을 살펴보세요.</li><li>촛불은 버튼이나 스페이스바로 꺼요. 촛불을 모두 끄면 생일 음악이 시작되고 사진 화면에서도 이어져요.</li><li>진행 상황은 이 기기의 브라우저에 자동으로 저장돼요.</li></ul><div class="modal-actions">'+btn('알겠어!','close','','primary')+'</div>');
  }
  function handle(act,value) {
    if (!act) return;
    if(sceneBusy)return;
    if (flow.length&&!['next','help','close','sound','music-toggle','reset','confirm-reset'].includes(act)) return;
    if(!['blow','search','pickup','sync','greet','sound','secret-candle','candle-give-up','candle-retry'].includes(act)) {
      const cue=['door','open-entrance','mirror'].includes(act)?'inspect':['call','call-who','bunny','dj','dj-hint','vip','extra','birthday-guest'].includes(act)?'talk':'ui';
      sound(cue);
    }
    switch(act) {
      case 'start':
        state.started=true; closeModal(); render();
        talk([['규석','빡빡이 준비 완료. 이제 생일 파티장에 가봐야지.']]); break;
      case 'next': flow.shift(); drawFlow(); break;
      case 'close': closeModal(); break;
      case 'sound': state.sound=!state.sound;state.soundPreferenceSet=true; render(); if(state.sound){if(window.GameSound)window.GameSound.unlock();sound('ui');}else if(window.GameSound)window.GameSound.stop();break;
      case 'help': help(); break;
      case 'reset': openModal(top('처음부터 다시 시작할까?')+'<p class="modal-copy">현재 진행 상황을 지우고 규석의 방부터 다시 시작해요.</p><div class="modal-actions">'+btn('계속 플레이하기','close')+btn('처음부터 시작','confirm-reset','','purple')+'</div>'); break;
      case 'confirm-reset': {
        const soundEnabled=state.sound,soundChosen=state.soundPreferenceSet,musicEnabled=state.musicEnabled;
        if(window.BirthdayMusic)window.BirthdayMusic.stop();
        closeModal();cancelScene();flow=[];afterFlow=null;state=fresh();state.sound=soundEnabled;state.soundPreferenceSet=soundChosen;state.musicEnabled=musicEnabled;movementReset++;partyIntro='greeting';render();say('규석','오늘은 내 생일. 파티장에 가볼까?');welcome();break;
      }
      case 'interact': nearbyObject();break;
      case 'search': searchFurniture(value); break;
      case 'bunny':
        if(state.doorOpen) say('우사기','우라!! 야하~!! ✨');
        else if(state.snail) say('규석','우사기가 뭔가 원하는 것 같아. 전보벌레로 도움을 요청하자.',[['전보벌레 사용','call','','primary']]);
        else meetUsagi();
        break;
      case 'door':
        if(state.doorOpen) enterStage(2);
        else if(!state.roomExitChecked&&!state.snail) meetUsagi();
        else ambient();
        break;
      case 'call': callSnail(); break;
      case 'call-who':
        if(!state.snail||state.doorOpen) break;
        if(value==='luffy') say('루피','우하하 걔 웃긴다. 우리 동료로 삼을까!',[['다른 사람에게 전화하기','call']]);
        else if(value==='chopper') say('쵸파','흠.. 어디가 아픈 건 아닌 것 같은데..',[['다른 사람에게 전화하기','call']]);
        else if(value==='sanji') serveRice();
        break;
      case 'open-entrance':
      case 'mirror': if(state.stage===2)openMirror(); break;
      case 'pickup':
        if(state.stage!==3||!state.phoneDropped||state.phone)break;
        state.phone=true;discoveryItem='phone';render();sound('item');
        talk([['규석','DJ 다다가 떨어뜨린 휴대폰을 주웠다!']],()=>{discoveryItem='';render();say('규석','다다의 휴대폰을 살펴보자.');});break;
      case 'phone': openPhone(); break;
      case 'phone-home': openPhoneHome(); break;
      case 'open-lights': openEqualizer(); break;
      case 'phone-torch':
        if(!state.phone||!state.unlocked||state.returned)break;
        if(state.stage!==3||state.lights){closeModal();say('규석','파티장이 환하게 밝혀져 있다.');break;}
        state.torchOn=!state.torchOn;closeModal();render();
        say('규석',state.torchOn?'손전등이 켜졌다. 마우스로 방 안을 비춰 보자.':'손전등을 껐다.');break;
      case 'phone-digit':
        if(modalKind==='phone'&&$('phone-code')){$('phone-error').textContent='';$('phone-code').value=($('phone-code').value+value).slice(0,4);checkPhoneCode();}break;
      case 'phone-backspace':
        if(modalKind==='phone'&&$('phone-code')){$('phone-code').value=$('phone-code').value.slice(0,-1);checkPhoneCode();}break;
      case 'phone-submit': checkPhoneCode();break;
      case 'set-level':
      case 'change-level': {
        if(modalKind!=='equalizer'||!state.unlocked||state.lights)break;
        const [i,n]=value.split(',').map(Number);
        if(!Number.isInteger(i)||i<0||i>3)break;
        state.levels[i]=Math.min(5,Math.max(0,act==='set-level'?n:state.levels[i]+n));
        save(); $('channels').innerHTML=window.PhoneUI.channels(state.levels); $('eq-error').textContent=''; break;
      }
      case 'sync':
        if(modalKind!=='equalizer'||!state.unlocked||state.lights)break;
        if(state.levels.join(',')==='1,1,2,5') {
          state.lights=true;state.lightsAnnounced=false;state.torchOn=false;closeModal();tone(true);
          enterStage(4);
        } else {sound('error');$('eq-error').textContent='❌ 레벨 불일치!';} break;
      case 'dj': visitDJ(); break;
      case 'return-phone':
        state.returned=true; render(); say('DJ 다다','고마워~ 내가 한규석 널 위해 특별 손님들을 모셔왔어! 가서 얘기해 봐!'); break;
      case 'keep-phone':
        if(state.stage===4&&!state.returned)bonkPlayer();break;
      case 'dj-hint':
        if(state.stage!==4||!state.returned||state.revealed)break;
        state.djHintHeard=true;save();
        say('DJ 다다','오늘은 너 생일이니까 내가 선심 쓴다. 선배님부터 찾아 뵙도록 해.'); break;
      case 'vip': openVIP(Number(value)); break;
      case 'extra': {
        if(state.stage<4||!extras[Number(value)])break;
        const guest=extras[Number(value)];say(guest[0],guest[1],[],'extra'+(Number(value)+1));break;
      }
      case 'birthday-guest':
        if(state.stage===5&&people[Number(value)])say(people[Number(value)].name,'한규석쒸 생일 축하해요!! 🎉',[],'guest'+value);break;
      case 'greet': greet(Number(value)); break;
      case 'candles': openCandles(); break;
      case 'blow': blow(); break;
      case 'secret-candle':
        if($('modal').open&&modalKind==='candles'&&state.stage===5&&state.candles===2&&!state.finished)window.CandleGame.secret();break;
      case 'candle-give-up':
        if($('modal').open&&modalKind==='candles'&&state.stage===5&&state.candles===2&&!state.finished)window.CandleGame.giveUp();break;
      case 'candle-retry':
        if($('modal').open&&modalKind==='candles'&&state.stage===5&&state.candles===2&&!state.finished)window.CandleGame.retry();break;
      case 'letter': openLetter(); break;
      case 'photo': openPhoto();break;
      case 'photo-retake': if(modalKind==='photo'&&state.finished)window.EndingPhoto.start();break;
      case 'photo-download': if(modalKind==='photo'&&state.finished)window.EndingPhoto.download();break;
      case 'music-toggle':
        if(state.endingMusicStarted&&window.BirthdayMusic) {
          state.musicEnabled=!window.BirthdayMusic.isPlaying();save();
          if(state.musicEnabled)window.BirthdayMusic.play();else window.BirthdayMusic.stop();
          updateMusicControls();
        }break;
    }
  }
  function unlockAudio(event){
    if(state.sound&&window.GameSound)window.GameSound.unlock();
    if(event&&event.target.closest&&event.target.closest('[data-act="music-toggle"]'))return;
    if(state.endingMusicStarted&&state.musicEnabled&&window.BirthdayMusic&&!window.BirthdayMusic.isPlaying())window.BirthdayMusic.play();
  }
  document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
  document.addEventListener('keydown',unlockAudio,{capture:true});
  document.addEventListener('click',unlockAudio,{capture:true});
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[data-act]');
    if(!button||button.disabled)return;
    const act=button.dataset.act,value=button.dataset.value||'';
    if(button.classList.contains('object')&&movement) {
      if(sceneBusy||flow.length||$('modal').open)return;
      const currentStage=state.stage;
      movement.moveTo(Number(button.dataset.walkX),Number(button.dataset.walkY),()=>{
        if(currentStage===state.stage&&!sceneBusy&&!$('modal').open&&!flow.length)handle(act,value);
      });
    } else handle(act,value);
  });
  document.addEventListener('submit',event=>{
    event.preventDefault();
    if(event.target.id==='mirror-form'&&state.stage===2) {
      if($('mirror-code').value.trim().toUpperCase()==='R') { closeModal(); tone(true); enterStage(3); }
      else { sound('error');$('mirror-error').textContent='❌ 틀렸쥬?'; $('mirror-code').focus(); }
    }
    if(event.target.id==='phone-form'&&state.stage===3) {
      checkPhoneCode();
    }
  });
  document.addEventListener('input',event=>{if(event.target.id==='phone-code')checkPhoneCode();});
  $('board').addEventListener('pointermove',event=>{
    if(state.stage!==3||!state.torchOn||$('modal').open)return;
    const r=$('board').getBoundingClientRect();
    $('board').style.setProperty('--torch-x',((event.clientX-r.left)/r.width*100)+'%');
    $('board').style.setProperty('--torch-y',((event.clientY-r.top)/r.height*100)+'%');
  });
  $('board').addEventListener('pointerdown',event=>{
    if(state.stage!==3||!state.torchOn)return;
    const r=$('board').getBoundingClientRect();
    $('board').style.setProperty('--torch-x',((event.clientX-r.left)/r.width*100)+'%');
    $('board').style.setProperty('--torch-y',((event.clientY-r.top)/r.height*100)+'%');
  });
  $('modal').addEventListener('cancel',event=>{
    if(modalKind==='welcome')event.preventDefault();
    else {stopCandle();if(window.EndingPhoto)window.EndingPhoto.stop();modalKind='';}
  });
  $('modal').addEventListener('close',()=>{if(!$('modal').open){stopCandle();if(window.EndingPhoto)window.EndingPhoto.stop();modalKind='';}});
  window.addEventListener('pagehide',()=>{
    stopCandle();if(window.GameSound)window.GameSound.stop();if(window.BirthdayMusic)window.BirthdayMusic.stop();if(window.BonkEffect)window.BonkEffect.stop();
    if(bonking){bonking=false;sceneBusy=false;say('DJ 다다','내 폰 돌려줘~~',[['핸드폰 돌려주기','return-phone','','primary']]);}
  });
  window.addEventListener('pageshow',event=>{
    if(!event.persisted)return;
    if($('modal').open&&modalKind==='candles')openCandles();
    if(state.endingMusicStarted&&state.musicEnabled&&window.BirthdayMusic)window.BirthdayMusic.play();
  });
  document.addEventListener('birthday-music-state',updateMusicControls);
  document.addEventListener('keydown',event=>{
    if(event.repeat)return;
    if((event.key===' '||event.key==='Enter')&&flow.length&&!$('modal').open&&!event.target.closest('button,input')) {
      event.preventDefault(); handle('next','');
    }
    if(event.code==='Space'&&$('modal').open&&modalKind==='candles') {
      if(event.target.closest('input'))return;
      if(event.target.closest('button')&&event.target.dataset.act!=='blow')return;
      event.preventDefault();blow();
    }
  });
  if(window.RoomMovement)movement=window.RoomMovement.create({
    board:$('board'),spriteHTML:A.icon('player'),
    isBlocked:()=>!state.started||sceneBusy||$('modal').open||flow.length>0,
    onInteract:nearbyObject
  });
  $('party-confetti').innerHTML = Array.from({length:18},(_,i)=>
    '<i style="--confetti-x:'+(5+(i*37)%90)+'%;--confetti-delay:'+(-i*.14)+'s;--confetti-color:'+colors[i%colors.length]+'"></i>'
  ).join('');
  render(); if(state.started)ambient(); else say('규석','오늘은 내 생일. 파티장에 가볼까?');
  if(!state.started)welcome();
  else if(state.stage===1&&state.foodReceived&&!state.doorOpen)serveRice(false);
  else if(state.stage===3&&!state.phoneDropped)partyGreeting();
  else if(state.stage===4&&state.revealed)startCelebration();
  else if(state.stage===4&&!state.lightsAnnounced)announceLights();
  else if(state.stage===5&&state.finished&&!state.letterReady)startBirthdayCheer();
})();
