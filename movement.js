/* Small room walker: feet-based collision, keyboard movement, and click-to-walk. */
(() => {
  'use strict';
  const STEP = 2, SIDE = 51, WORLD_X = 9.6, WORLD_Y = 5.2, SPEED = 330;
  const directions = {ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
  const distance = (a,b) => Math.hypot((b.x-a.x)*WORLD_X,(b.y-a.y)*WORLD_Y);
  const editable = target => target && target.closest && target.closest('input,textarea,select,[contenteditable="true"]');

  function create({board,spriteHTML,isBlocked=()=>false,onInteract=()=>{}}) {
    if (!board) throw new Error('RoomMovement needs a board.');
    let config = {roomKey:null,bounds:{minX:7,maxX:93,minY:34,maxY:91},obstacles:[]};
    let pos = {x:50,y:72}, path = [], arrival = null, raf = 0, lastTime = 0, facing = 1;
    const keys = new Set();
    const walker = document.createElement('div');
    walker.id = 'walker'; walker.className = 'walker'; walker.setAttribute('aria-hidden','true');
    walker.innerHTML = '<span class="walker-shadow"></span><div class="walker-figure">'+(typeof spriteHTML==='function'?spriteHTML():spriteHTML||'')+'</div><span class="walker-name">빡빡이 규석</span>';
    const marker = document.createElement('div');
    marker.className = 'walk-target'; marker.hidden = true; marker.setAttribute('aria-hidden','true');
    board.classList.add('has-walker');
    if (!board.hasAttribute('tabindex')) board.tabIndex = 0;

    function paint(moving=false) {
      walker.style.left = pos.x.toFixed(3)+'%'; walker.style.top = pos.y.toFixed(3)+'%';
      walker.style.zIndex = String(10+Math.round(pos.y*10));
      walker.style.setProperty('--walk-direction',facing);
      walker.classList.toggle('walking',moving);
      board.style.setProperty('--walker-x',pos.x+'%'); board.style.setProperty('--walker-y',pos.y+'%');
      if (moving && keys.size > 0 && board.classList.contains('torch')) {
        board.style.setProperty('--torch-x',pos.x+'%'); board.style.setProperty('--torch-y',(pos.y-6)+'%');
      }
    }
    function refresh() {
      if (!board.contains(marker)) board.appendChild(marker);
      if (!board.contains(walker)) board.appendChild(walker);
      paint(path.length>0||keys.size>0);
    }
    function clampPoint(point) {
      const b=config.bounds;
      return {x:Math.min(b.maxX,Math.max(b.minX,Number(point.x)||0)),y:Math.min(b.maxY,Math.max(b.minY,Number(point.y)||0))};
    }
    function paddedRect(rect) {
      return {left:rect.x-1.25,right:rect.x+rect.w+1.25,top:rect.y-1.7,bottom:rect.y+rect.h+1.7};
    }
    function walkable(point) {
      const b=config.bounds;
      if(point.x<b.minX||point.x>b.maxX||point.y<b.minY||point.y>b.maxY)return false;
      return !config.obstacles.some(rect=>{
        const r=paddedRect(rect);
        return point.x>r.left&&point.x<r.right&&point.y>r.top&&point.y<r.bottom;
      });
    }
    function clearLine(a,b) {
      if(!walkable(a)||!walkable(b))return false;
      // Sub-grid sampling also prevents diagonal corner-cutting on narrow furniture.
      const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.6));
      for(let i=1;i<steps;i++)if(!walkable({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps}))return false;
      return true;
    }
    function gridPoint(id) {return {x:(id%SIDE)*STEP,y:Math.floor(id/SIDE)*STEP};}
    function nearestGrid(point,requireLine=false) {
      let best=-1, bestDistance=Infinity;
      for(let id=0;id<SIDE*SIDE;id++) {
        const p=gridPoint(id),d=distance(point,p);
        if(d<bestDistance&&walkable(p)&&(!requireLine||clearLine(point,p))) {best=id;bestDistance=d;}
      }
      return best;
    }
    function route(from,requested) {
      let goal=clampPoint(requested);
      if(!walkable(goal)) {
        const near=nearestGrid(goal);
        if(near<0)return null;
        goal=gridPoint(near);
      }
      if(clearLine(from,goal))return [goal];
      const start=nearestGrid(from,true),end=nearestGrid(goal,true);
      if(start<0||end<0)return null;
      const count=SIDE*SIDE,g=new Float64Array(count),previous=new Int32Array(count),closed=new Uint8Array(count);
      g.fill(Infinity);previous.fill(-1);g[start]=0;
      const heap=[];
      function push(id,score) {
        let i=heap.length;heap.push({id,score});
        while(i>0) {const parent=(i-1)>>1;if(heap[parent].score<=score)break;heap[i]=heap[parent];i=parent;}
        heap[i]={id,score};
      }
      function pop() {
        const first=heap[0],last=heap.pop();
        if(heap.length) {
          let i=0;
          while(i*2+1<heap.length) {
            let child=i*2+1;
            if(child+1<heap.length&&heap[child+1].score<heap[child].score)child++;
            if(heap[child].score>=last.score)break;
            heap[i]=heap[child];i=child;
          }
          heap[i]=last;
        }
        return first.id;
      }
      push(start,distance(gridPoint(start),goal));
      let found=false;
      while(heap.length) {
        const current=pop();if(closed[current])continue;
        if(current===end){found=true;break;}
        closed[current]=1;
        const p=gridPoint(current),col=current%SIDE,row=Math.floor(current/SIDE);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
          if((!dx&&!dy)||col+dx<0||col+dx>=SIDE||row+dy<0||row+dy>=SIDE)continue;
          const next=(row+dy)*SIDE+col+dx,q=gridPoint(next);
          if(closed[next]||!clearLine(p,q))continue;
          const cost=g[current]+distance(p,q);
          if(cost<g[next]) {g[next]=cost;previous[next]=current;push(next,cost+distance(q,goal));}
        }
      }
      if(!found)return null;
      const raw=[goal];let cursor=end;
      while(cursor!==start){raw.push(gridPoint(cursor));cursor=previous[cursor];if(cursor<0)return null;}
      raw.push(gridPoint(start));raw.push(from);raw.reverse();
      const result=[];let anchor=0;
      while(anchor<raw.length-1) {
        let next=raw.length-1;
        while(next>anchor+1&&!clearLine(raw[anchor],raw[next]))next--;
        result.push(raw[next]);anchor=next;
      }
      return result;
    }
    function stop() {
      if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;
      keys.clear();path=[];arrival=null;marker.hidden=true;paint(false);
    }
    function schedule() {if(!raf)raf=requestAnimationFrame(frame);}
    function frame(time) {
      raf=0;
      if(isBlocked()){stop();return;}
      const dt=lastTime?Math.min(.045,(time-lastTime)/1000):1/60;lastTime=time;
      const before={...pos};
      if(keys.size) {
        let dx=0,dy=0;keys.forEach(key=>{dx+=directions[key][0];dy+=directions[key][1];});
        const length=Math.hypot(dx,dy)||1;
        dx=dx/length*SPEED*dt/WORLD_X;dy=dy/length*SPEED*dt/WORLD_Y;
        const next=clampPoint({x:pos.x+dx,y:pos.y+dy});
        if(clearLine(pos,next))pos=next;
        else {
          const horizontal={x:next.x,y:pos.y};if(clearLine(pos,horizontal))pos=horizontal;
          const vertical={x:pos.x,y:next.y};if(clearLine(pos,vertical))pos=vertical;
        }
      } else if(path.length) {
        let remaining=SPEED*dt;
        while(path.length&&remaining>0) {
          const target=path[0],length=distance(pos,target);
          if(length<=remaining) {pos={...target};path.shift();remaining-=length;}
          else {const ratio=remaining/length;pos={x:pos.x+(target.x-pos.x)*ratio,y:pos.y+(target.y-pos.y)*ratio};remaining=0;}
        }
      }
      if(Math.abs(pos.x-before.x)>.02)facing=pos.x<before.x?-1:1;
      paint(distance(before,pos)>.1);
      if(!keys.size&&!path.length) {
        marker.hidden=true;paint(false);lastTime=0;
        const callback=arrival;arrival=null;
        if(callback&&!isBlocked())callback();
      }
      if(keys.size||path.length)schedule();
    }
    function moveTo(x,y,onArrival) {
      if(isBlocked())return false;
      stop();
      const planned=route(pos,{x,y});
      if(!planned)return false;
      path=planned;arrival=typeof onArrival==='function'?onArrival:null;
      const last=path[path.length-1];marker.style.left=last.x+'%';marker.style.top=last.y+'%';marker.hidden=false;
      schedule();return true;
    }
    function enter(next) {
      const changed=next.roomKey!==config.roomKey;
      stop();
      config={roomKey:next.roomKey,bounds:Object.assign({minX:7,maxX:93,minY:34,maxY:91},next.bounds||{}),obstacles:(next.obstacles||[]).filter(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&r.w>0&&r.h>0)};
      if(changed)pos=clampPoint(next.spawn||{x:50,y:78});
      else pos=clampPoint(pos);
      if(!walkable(pos)){const nearby=nearestGrid(pos);if(nearby>=0)pos=gridPoint(nearby);}
      refresh();
    }
    board.addEventListener('click',event=>{
      if(isBlocked()||event.target.closest('button,a,input,select,textarea,label'))return;
      const rect=board.getBoundingClientRect();
      board.focus({preventScroll:true});
      moveTo((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);
    });
    document.addEventListener('keydown',event=>{
      const key=event.key.length===1?event.key.toLowerCase():event.key;
      if(event.defaultPrevented||editable(event.target)||event.altKey||event.ctrlKey||event.metaKey||isBlocked())return;
      if(directions[key]) {
        event.preventDefault();keys.add(key);path=[];arrival=null;marker.hidden=true;schedule();
      } else if(!event.repeat&&(key==='e'||(key==='Enter'&&!event.target.closest('button,a')))) {
        event.preventDefault();stop();onInteract({...pos});
      }
    });
    document.addEventListener('keyup',event=>{
      const key=event.key.length===1?event.key.toLowerCase():event.key;
      if(keys.has(key)){event.preventDefault();keys.delete(key);if(!keys.size&&!path.length)stop();}
    });
    window.addEventListener('blur',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    refresh();
    return {enter,moveTo,stop,position:()=>({...pos}),refresh};
  }
  window.RoomMovement={create};
})();
