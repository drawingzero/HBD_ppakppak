/* Original, tiny Web Audio effects. No recordings, speech service, or downloads. */
(function () {
  'use strict';
  const MAX_VOICES = 16;
  const MASTER_GAIN = 0.58;
  const MIN_GAIN = 0.0001;
  const QUEUE_LIFETIME = 3000;
  const cooldown = { ui:70, inspect:125, talk:185, item:650, success:250, error:300, cheer:1350, applause:1000, blow:280, shutter:350, bonk:300 };
  const voices = new Set();
  const lastPlayed = new Map();
  let context = null, master = null, limiter = null, noiseBuffer = null;
  let resumeRequest = null, pendingCue = null, generation = 0, scheduledCount = 0;
  let lastError = '', lastKind = '';
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const clock = () => typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

  function getStatus() {
    return {
      supported: Boolean(window.AudioContext || window.webkitAudioContext),
      contextState: context ? context.state : 'not-created',
      ready: Boolean(context && context.state === 'running'),
      pending: Boolean(resumeRequest),
      queued: pendingCue && clock()-pendingCue.at <= QUEUE_LIFETIME ? pendingCue.kind : null,
      activeVoices: voices.size, lastKind, lastError
    };
  }
  function announce(reason='') {
    if(reason)lastError=reason;
    const status=getStatus();
    document.dispatchEvent(new CustomEvent('game-sound-state',{
      bubbles:true,detail:Object.assign(status,{blocked:!status.ready&&Boolean(lastError),reason:lastError})
    }));
  }
  function settleResume(request,ok,reason='') {
    if(!request||request.settled)return;
    request.settled=true;clearTimeout(request.timer);
    if(resumeRequest===request)resumeRequest=null;
    if(ok)lastError='';
    else if(reason)lastError=reason;
    request.resolve(ok);
    announce();
    if(ok)flushPending();
  }
  function flushPending() {
    if(!pendingCue||!context||context.state!=='running')return;
    const cue=pendingCue;pendingCue=null;
    if(cue.ticket===generation&&clock()-cue.at<=QUEUE_LIFETIME)playNow(cue.kind);
  }

  function createContext() {
    if (context && context.state !== 'closed') return true;
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) {announce('web-audio-unavailable');return false;}
    try {
      if(resumeRequest)settleResume(resumeRequest,false,'context-replaced');
      try {context = new Constructor({latencyHint:'interactive'});}
      catch (_) {context = new Constructor();}
      const ownContext=context;
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      master.connect(limiter);
      limiter.connect(context.destination);
      noiseBuffer = context.createBuffer(1,Math.ceil(context.sampleRate * 1.3),context.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let i=0;i<samples.length;i++) samples[i] = (Math.random()*2-1)*0.8;
      ownContext.addEventListener('statechange',()=>{
        if(context!==ownContext)return;
        if(ownContext.state==='running') {
          lastError='';
          if(resumeRequest&&resumeRequest.context===ownContext)settleResume(resumeRequest,true);
          else {announce();flushPending();}
        } else {
          for(const voice of Array.from(voices))silence(voice);
          if(ownContext.state==='closed'&&resumeRequest)settleResume(resumeRequest,false,'context-closed');
          else announce('context-'+ownContext.state);
        }
      });
      lastError='';
      return true;
    } catch (error) {
      try { if (master) master.disconnect(); } catch (_) {}
      try { if (limiter) limiter.disconnect(); } catch (_) {}
      try { if (context && context.close) { const task=context.close(); if(task&&task.catch) task.catch(()=>{}); } } catch (_) {}
      context = master = limiter = noiseBuffer = null;
      announce('context-create-failed'+(error&&error.name?':'+error.name:''));
      return false;
    }
  }

  // Call from a real pointer or keyboard gesture. Promise rejection never escapes.
  function unlock() {
    if (!createContext()) return Promise.resolve(false);
    if (context.state === 'running') {
      lastError='';
      if(resumeRequest)settleResume(resumeRequest,true);
      else flushPending();
      return Promise.resolve(true);
    }
    if(!resumeRequest) {
      const request={context,settled:false,resolve:null,timer:null,promise:null};
      request.promise=new Promise(resolve=>{request.resolve=resolve;});
      request.timer=setTimeout(()=>settleResume(request,context===request.context&&context.state==='running','resume-timeout'),2000);
      resumeRequest=request;
    }
    const request=resumeRequest;
    // Every call made from a fresh gesture retries resume(), even if an earlier
    // browser resume promise is still waiting for user activation.
    try {
      Promise.resolve(request.context.resume()).then(()=>{
        if(request.context===context&&context.state==='running')settleResume(request,true);
      },error=>settleResume(request,false,'resume-failed'+(error&&error.name?':'+error.name:'')));
    } catch (error) {
      settleResume(request,false,'resume-failed'+(error&&error.name?':'+error.name:''));
    }
    return request.promise;
  }

  function dispose(voice) {
    if (!voice || voice.disposed) return;
    voice.disposed = true;
    voices.delete(voice);
    if (voice.timer !== null) clearTimeout(voice.timer);
    voice.source.onended = null;
    for (const node of voice.nodes) { try { node.disconnect(); } catch (_) {} }
  }

  function silence(voice) {
    if (voice.disposed) return;
    try {
      const now = voice.context.currentTime;
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setValueAtTime(0,now);
      voice.source.stop(now);
    } catch (_) {}
    dispose(voice);
  }

  function roomFor(count) {
    for (const voice of voices) {
      if (voices.size <= MAX_VOICES-count) break;
      silence(voice);
    }
  }

  function envelope(start,duration,level,attack=0.005) {
    const node = context.createGain();
    const peak = clamp(level,0.001,0.32);
    const end = start + Math.max(0.025,duration);
    node.gain.setValueAtTime(MIN_GAIN,start);
    node.gain.linearRampToValueAtTime(peak,start + Math.min(attack,duration/3));
    node.gain.setValueAtTime(peak,start + Math.max(Math.min(attack,duration/3),Math.min(0.025,duration*.25)));
    node.gain.exponentialRampToValueAtTime(MIN_GAIN,end);
    node.gain.setValueAtTime(0,end+0.008);
    node.connect(master);
    return node;
  }

  function register(source,nodes,amp,start,end,offset) {
    const voice = {source,nodes,envelope:amp,context,timer:null,disposed:false};
    voices.add(voice);
    source.onended = () => dispose(voice);
    try {
      if (offset === undefined) source.start(start);
      else source.start(start,offset);
      source.stop(end+0.012);
      scheduledCount++;
      // Backstop for interrupted/suspended contexts whose ended event is delayed.
      voice.timer = setTimeout(() => {
        try { source.stop(); } catch (_) {}
        dispose(voice);
      }, Math.max(0,(end-context.currentTime)*1000)+350);
    } catch (error) {dispose(voice);announce('source-start-failed'+(error&&error.name?':'+error.name:''));}
  }

  function tone(frequency,delay,duration,level=0.13,type='triangle',toFrequency) {
    if (!context || context.state !== 'running' || voices.size >= MAX_VOICES) return;
    const start = context.currentTime + .012 + delay;
    const source = context.createOscillator();
    const amp = envelope(start,duration,level);
    source.type = type;
    source.frequency.setValueAtTime(clamp(frequency,80,2400),start);
    if (toFrequency) source.frequency.exponentialRampToValueAtTime(clamp(toFrequency,80,2400),start+duration);
    source.connect(amp);
    register(source,[source,amp],amp,start,start+duration);
  }

  function noise(delay,duration,level,frequency,q=0.6,attack=0.003) {
    if (!context || context.state !== 'running' || voices.size >= MAX_VOICES) return;
    const start = context.currentTime + .012 + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const amp = envelope(start,duration,level,attack);
    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(clamp(frequency,200,6000),start);
    filter.Q.value = clamp(q,0.1,5);
    source.connect(filter);
    filter.connect(amp);
    register(source,[source,filter,amp],amp,start,start+duration,0.1+Math.random()*0.25);
  }

  function cheerVoice(base,delay,length) {
    if (voices.size >= MAX_VOICES) return;
    const start = context.currentTime + .012 + delay;
    const source = context.createOscillator();
    const amp = context.createGain();
    const nodes = [source,amp];
    source.type = 'sawtooth';
    source.frequency.setValueAtTime(base,start);
    source.frequency.linearRampToValueAtTime(base*1.38,start+0.23);
    source.frequency.linearRampToValueAtTime(base*1.21,start+length);
    amp.gain.setValueAtTime(MIN_GAIN,start);
    amp.gain.linearRampToValueAtTime(0.11,start+0.09);
    amp.gain.linearRampToValueAtTime(0.085,start+length*0.58);
    amp.gain.exponentialRampToValueAtTime(MIN_GAIN,start+length);
    amp.connect(master);
    // Formants give a playful synthetic "waah", not a recording of a person.
    [[430,790,3.4,0.7],[1120,1240,5.5,0.42],[2450,2620,7,0.18]].forEach(([from,to,q,gain]) => {
      const filter = context.createBiquadFilter();
      const mix = context.createGain();
      filter.type = 'bandpass';
      filter.Q.value = q;
      filter.frequency.setValueAtTime(from,start);
      filter.frequency.linearRampToValueAtTime(to,start+0.2);
      mix.gain.value = gain;
      source.connect(filter);filter.connect(mix);mix.connect(amp);
      nodes.push(filter,mix);
    });
    register(source,nodes,amp,start,start+length);
  }

  function playNow(kind) {
    if (!context || context.state !== 'running') return false;
    const now = clock();
    if (now-(lastPlayed.get(kind) ?? -Infinity) < cooldown[kind]) return false;
    lastPlayed.set(kind,now);
    const before=scheduledCount;
    roomFor(kind==='cheer'?11:kind==='applause'?8:kind==='item'?5:3);
    try {
      switch (kind) {
        case 'ui':
          tone(740,0,0.115,0.19,'sine',560);
          break;
        case 'inspect':
          tone(310,0,0.11,0.20,'sine',260);
          tone(440,0.095,0.095,0.17,'triangle',360);
          break;
        case 'talk':
          [392,493.88,440].forEach((f,i)=>tone(f,i*0.065,0.09,0.145,'triangle'));
          break;
        case 'item':
          roomFor(5);
          [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,i*0.08,i===3?0.38:0.14,0.22,'triangle'));
          tone(523.25,0.24,0.34,0.12,'sine');
          break;
        case 'success':
          tone(659.25,0,0.15,0.20,'triangle');
          tone(987.77,0.12,0.25,0.22,'triangle');
          break;
        case 'error':
          tone(349.23,0,0.14,0.19,'sine',310);
          tone(261.63,0.13,0.20,0.18,'triangle',233.08);
          break;
        case 'cheer':
          roomFor(11);
          cheerVoice(164,0,0.81);
          cheerVoice(207,0.065,0.83);
          cheerVoice(261,0.13,0.78);
          [0.16,0.31,0.49,0.68,0.86].forEach((t,i)=>noise(t,0.085,0.22,1900+i*260,0.45,0.001));
          [783.99,987.77,1174.66].forEach((f,i)=>tone(f,0.18+i*0.08,0.23,0.10,'triangle'));
          break;
        case 'applause':
          [0,.11,.25,.37,.51,.62,.77,.89].forEach((t,i)=>noise(t,.09,.20,1750+(i%3)*440,.65,.002));
          break;
        case 'blow':
          noise(0,0.34,0.27,780,0.5,0.055);
          break;
        case 'shutter':
          noise(0,0.045,0.22,2600,0.5,0.001);
          noise(0.075,0.075,0.17,1700,0.8,0.001);
          tone(145,0.025,0.075,0.12,'sine');
          break;
        case 'bonk':
          tone(660,0,0.22,0.26,'sine',185);
          tone(1040,0.008,0.12,0.12,'triangle',390);
          tone(150,0.04,0.15,0.16,'sine',90);
          break;
      }
      if(scheduledCount===before){announce('no-voice-scheduled');return false;}
      lastKind=kind;lastError='';return true;
    } catch (error) {announce('effect-failed'+(error&&error.name?':'+error.name:''));return false;}
  }

  function play(kind) {
    if (!Object.prototype.hasOwnProperty.call(cooldown,kind))return false;
    if (context&&context.state==='running')return playNow(kind);
    // Keep only the newest cue: a late unlock must not burst through a backlog.
    pendingCue={kind,at:clock(),ticket:generation};
    unlock();
    return Boolean(context);
  }

  function stop() {
    generation++;
    pendingCue=null;
    for (const voice of Array.from(voices)) silence(voice);
    lastPlayed.clear();
  }

  window.GameSound = {unlock,play,stop,getStatus};
})();
