/* A small cartoon toy-hammer beat, anchored to the walking character's head. */
(function () {
  'use strict';
  const DURATION = 1080, IMPACT = 390;
  let current = null;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const safeCall = fn => { if(typeof fn==='function')try{fn();}catch(_){} };
  const HAMMER = '<svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g stroke="#56394d" stroke-width="3" stroke-linejoin="round"><rect x="33" y="28" width="14" height="79" rx="5" fill="#e8b76b"/><path d="M37 42v52" stroke="#ffe0a0" stroke-width="3"/><path d="M35 97h10" stroke="#be824f" stroke-width="3"/><rect x="15" y="8" width="50" height="28" rx="5" fill="#ed6b7b"/><rect x="5" y="6" width="16" height="32" rx="4" fill="#f7d66c"/><rect x="59" y="6" width="16" height="32" rx="4" fill="#f7d66c"/><path d="M9 13v17M63 13v17" stroke="#fff0ab" stroke-width="3"/><path d="M27 13v17M38 13v17M49 13v17" stroke="#ffb1aa" stroke-width="4"/><path d="M24 32h32" stroke="#cc4b65" stroke-width="2"/></g></svg>';
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 1 3.2 6.6 7.3 1.1-5.3 5.2 1.3 7.3-6.5-3.5-6.5 3.5 1.3-7.3L1.5 8.7l7.3-1.1Z" fill="#ffe482" stroke="#9c6e4c" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function after(run,delay,fn) {
    const timer=setTimeout(()=>{
      run.timers.delete(timer);
      if(current===run&&!run.closed)fn();
    },delay);
    run.timers.add(timer);
  }
  function animate(run,element,frames,options) {
    if(!element||typeof element.animate!=='function')return false;
    try {
      const animation=element.animate(frames,options);
      run.animations.add(animation);
      return true;
    } catch (_) {return false;}
  }
  function finish(run,notify) {
    if(!run||run.closed)return;
    run.closed=true;
    run.timers.forEach(clearTimeout);run.timers.clear();
    if(run.frame)cancelAnimationFrame(run.frame);
    run.frame=0;
    run.animations.forEach(animation=>{try{animation.cancel();}catch(_){}});
    run.animations.clear();
    if(run.walker&&run.walker.classList)run.walker.classList.remove('bonk-reacting');
    if(run.overlay)run.overlay.remove();
    if(current===run)current=null;
    if(notify&&!run.done){run.done=true;safeCall(run.onDone);}
  }
  function stop() {finish(current,false);}

  function position(run) {
    if(!run.board.isConnected||!run.walker.isConnected||!run.board.contains(run.walker))return false;
    const board=run.board.getBoundingClientRect(),walker=run.walker.getBoundingClientRect();
    if(!board.width||!board.height||!walker.width||!walker.height)return false;
    const sx=(run.board.offsetWidth||board.width)/board.width;
    const sy=(run.board.offsetHeight||board.height)/board.height;
    const headX=(walker.left+walker.width*.5-board.left)*sx-(run.board.clientLeft||0);
    const headY=(walker.top+walker.height*.14-board.top)*sy-(run.board.clientTop||0);
    const scale=clamp(walker.width*sx/64,.65,1.24);
    const side=headX>(run.board.clientWidth||board.width)*.72?-1:1;
    run.scale=scale;
    run.rig.style.left=headX+'px';run.rig.style.top=headY+'px';
    run.rig.style.transform='scaleX('+side+')';
    // At -55 degrees, the lower rubber cap lands exactly on the head anchor.
    run.hammer.style.width=80*scale+'px';run.hammer.style.height=112*scale+'px';
    run.hammer.style.left=32.53*scale+'px';run.hammer.style.top=-94.11*scale+'px';
    run.sparks.style.left=headX+'px';run.sparks.style.top=headY+'px';
    run.sparks.style.setProperty('--bonk-scale',scale);
    return true;
  }
  function follow(run) {
    if(current!==run||run.closed)return;
    if(!position(run)){finish(run,true);return;}
    run.frame=requestAnimationFrame(()=>follow(run));
  }
  function hit(run) {
    if(run.impacted||run.closed)return;
    run.impacted=true;
    run.overlay.classList.add('bonk-impact');
    if(!run.reduced) {
      const figure=run.walker.querySelector('.walker-figure');
      let facing=1;
      try{facing=Number(getComputedStyle(run.walker).getPropertyValue('--walk-direction'))<0?-1:1;}catch(_){}
      const squash=animate(run,figure,[
        {transform:'scaleX('+facing+') scaleY(1)',offset:0},
        {transform:'scaleX('+(facing*1.16)+') scaleY(.78)',offset:.2},
        {transform:'scaleX('+(facing*.95)+') scaleY(1.05)',offset:.56},
        {transform:'scaleX('+facing+') scaleY(1)',offset:1}
      ],{duration:390,easing:'ease-out',fill:'both'});
      if(!squash)run.walker.classList.add('bonk-reacting');
    }
    safeCall(run.onImpact);
  }
  function play(options={}) {
    stop();
    const board=options.board;
    const walker=options.walker||(board&&board.querySelector('#walker'));
    if(!board||!walker||typeof board.getBoundingClientRect!=='function'||typeof walker.getBoundingClientRect!=='function') {
      safeCall(options.onDone);return false;
    }
    let reduced=false;
    try{reduced=Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_){}
    const overlay=document.createElement('div');
    overlay.className='bonk-overlay'+(reduced?' bonk-reduced':'');
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="bonk-rig"><div class="bonk-hammer">'+HAMMER+'</div></div><div class="bonk-sparks"><span class="bonk-star bonk-star-one">'+STAR+'</span><span class="bonk-star bonk-star-two">'+STAR+'</span><span class="bonk-star bonk-star-three">'+STAR+'</span><span class="bonk-word">콩!</span></div>';
    board.appendChild(overlay);
    const run={board,walker,overlay,rig:overlay.querySelector('.bonk-rig'),hammer:overlay.querySelector('.bonk-hammer'),sparks:overlay.querySelector('.bonk-sparks'),onImpact:options.onImpact,onDone:options.onDone,reduced,timers:new Set(),animations:new Set(),frame:0,closed:false,done:false,impacted:false,scale:1};
    current=run;
    if(!position(run)){finish(run,true);return false;}
    if(reduced) {
      run.hammer.style.transform='rotate(-55deg)';run.hammer.style.opacity='1';
      after(run,65,()=>hit(run));
      after(run,650,()=>finish(run,true));
    } else {
      const animated=animate(run,run.hammer,[
        {transform:'rotate(8deg)',opacity:0,offset:0},
        {transform:'rotate(8deg)',opacity:1,offset:.08},
        {transform:'rotate(26deg)',opacity:1,offset:.21},
        {transform:'rotate(-55deg)',opacity:1,offset:IMPACT/DURATION},
        {transform:'rotate(-48deg)',opacity:1,offset:IMPACT/DURATION+.055},
        {transform:'rotate(8deg)',opacity:1,offset:.68},
        {transform:'rotate(18deg)',opacity:0,offset:1}
      ],{duration:DURATION,easing:'linear',fill:'both'});
      if(!animated)run.hammer.classList.add('bonk-swing');
      after(run,IMPACT,()=>hit(run));
      after(run,DURATION+20,()=>finish(run,true));
    }
    follow(run);
    return true;
  }
  window.BonkEffect={play,stop};
})();
