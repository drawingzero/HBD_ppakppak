/* One small souvenir, composed from the game's own SVG art. No camera access. */
(() => {
  'use strict';
  const WIDTH=1000,HEIGHT=720;
  let timers=[],generation=0,ready=false,photoSVG='',exporting=false;
  const $=id=>document.getElementById(id);
  const dataURL=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const placed=(svg,x,y,w,h=w)=>svg.replace('<svg','<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"');

  function compose() {
    const art=window.GameArt;
    let scene=art.scene('finale');
    scene=placed(scene,32,32,936,507);
    let group='';
    const person=(kind,x,feet,size)=>'<g data-photo-person="'+kind+'">'+placed(art.icon(kind),x-size/2,feet-size,size)+'</g>';
    // Two rows leave every face visible, with the birthday boy beside the DJ.
    for(let i=1;i<=6;i++)group+=person('extra'+i,230+(i-1)*100,278,94);
    const front=['guest3','guest6','guest5','player','dj','guest1','guest4','guest2'];
    front.forEach((kind,i)=>{group+=person(kind,130+i*100,428,kind==='player'||kind==='dj'?134:124);});
    group+=placed(art.icon('cake'),414,370,132);
    const palette=['#f7d68c','#a7ded0','#d5b4ec','#e9a8ba'];
    for(let i=0;i<26;i++) {
      const x=50+(i*137)%864,y=165+(i*71)%290;
      if(x>100&&x<870&&y>185&&y<432)continue;
      group+='<rect x="'+x+'" y="'+y+'" width="'+(i%2?5:8)+'" height="'+(i%2?9:4)+'" fill="'+palette[i%4]+'" transform="rotate('+(i%2?18:-15)+' '+x+' '+y+')"/>';
    }
    group+='<path d="M458 120h10v-5h10v5h10v10h-5v5h-5v5h-10v-5h-5v-5h-5z" fill="#e9a8ba"/>';
    group+='<path d="M519 137h6v-6h6v6h6v6h-6v6h-6v-6h-6z" fill="#f7d68c"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+WIDTH+'" height="'+HEIGHT+'" viewBox="0 0 '+WIDTH+' '+HEIGHT+'">'
      +'<title>26년 한규석 생파 기념사진</title>'
      +'<desc>규석과 DJ 다다, 초대가수 여섯 명과 파티 손님 여섯 명이 케이크 앞에 모인 픽셀 단체사진.</desc>'
      +'<rect width="1000" height="720" rx="5" fill="#f8f2e7"/>'
      +'<rect x="28" y="28" width="944" height="515" fill="#d9c9b4"/>'
      +scene+'<svg x="32" y="32" width="936" height="507" viewBox="0 0 960 520" shape-rendering="crispEdges">'+group+'</svg>'
      +'<path d="M32 552h936" stroke="#e5d6c3" stroke-width="2"/>'
      +'<text x="500" y="585" text-anchor="middle" fill="#8b658b" font-family="monospace" font-size="20" font-weight="700" letter-spacing="5">HAPPY BIRTHDAY</text>'
      +'<text x="500" y="628" text-anchor="middle" fill="#383246" font-family="system-ui, sans-serif" font-size="33" font-weight="800">규빡아 생일 축하해!</text>'
      +'<text x="500" y="665" text-anchor="middle" fill="#8a7486" font-family="monospace" font-size="22" letter-spacing="3"><tspan x="500" y="665">2026.11.25</tspan><tspan x="500" y="694">With DJ 다다</tspan></text>'
      +'</svg>';
  }
  function clearTimers() {timers.forEach(clearTimeout);timers=[];}
  function stop() {
    generation++;clearTimers();ready=false;
    const countdown=$('photo-countdown');if(countdown)countdown.hidden=true;
    const download=$('photo-download');if(download)download.disabled=true;
    const root=$('ending-photo');if(root)root.classList.remove('is-counting','shutter');
  }
  function markup() {
    stop();photoSVG=compose();
    return '<section class="ending-photo" id="ending-photo" aria-label="26년 한규석 생파 기념사진">'
      +'<div class="ending-photo-frame"><span class="photo-tape photo-tape-left" aria-hidden="true"></span><span class="photo-tape photo-tape-right" aria-hidden="true"></span>'
      +'<div class="ending-photo-window"><img id="ending-photo-image" src="'+dataURL(photoSVG)+'" alt="26년 한규석 생파 기념사진. 규석과 DJ 다다, 초대가수 여섯 명과 파티 손님 여섯 명이 함께한 사진. 2026년 11월 25일. With DJ 다다." width="1000" height="720">'
      +'<div class="photo-countdown" id="photo-countdown" aria-hidden="true" hidden>3</div><div class="photo-shutter" aria-hidden="true"></div></div></div>'
      +'<p class="photo-status" id="photo-status" role="status">다 같이 모여 봐. 사진 찍는다!</p>'
      +'<div class="ending-photo-actions"><button type="button" data-act="photo-retake" class="small">다시 찍기</button><button type="button" data-act="photo-download" class="primary" id="photo-download" disabled>사진 저장하기</button></div></section>';
  }
  function start() {
    stop();
    const root=$('ending-photo'),countdown=$('photo-countdown'),status=$('photo-status');
    if(!root||!countdown||!status)return false;
    const current=generation;
    root.classList.remove('is-captured');root.classList.add('is-counting');
    $('photo-download').textContent='사진 저장하기';
    countdown.hidden=false;countdown.textContent='3';
    status.textContent='다 같이 카메라 보고, 셋!';
    function later(delay,callback) {
      timers.push(setTimeout(()=>{if(current===generation&&root.isConnected)callback();},delay));
    }
    later(750,()=>{countdown.textContent='2';status.textContent='둘!';});
    later(1500,()=>{countdown.textContent='1';status.textContent='하나, 생일 축하해!';});
    later(2250,()=>{
      countdown.hidden=true;root.classList.remove('is-counting');root.classList.add('is-captured','shutter');
      ready=true;$('photo-download').disabled=false;
      status.textContent='찰칵! 오늘의 생일 파티를 사진으로 남겼어.';
    });
    later(2700,()=>root.classList.remove('shutter'));
    return true;
  }
  function saveBlob(blob,filename) {
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=filename;anchor.style.display='none';
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function asPNG(svg) {
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>{
        try {
          const canvas=document.createElement('canvas');canvas.width=WIDTH*2;canvas.height=HEIGHT*2;
          const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');
          context.imageSmoothingEnabled=false;context.drawImage(img,0,0,canvas.width,canvas.height);
          canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG unavailable')),'image/png');
        } catch(error){reject(error);}
      };
      img.onerror=()=>reject(new Error('Photo image unavailable'));
      img.src=dataURL(svg);
    });
  }
  async function download() {
    if(!ready||!photoSVG||exporting)return false;
    exporting=true;
    const current=generation,button=$('photo-download');
    if(button){button.disabled=true;button.textContent='사진을 준비하는 중…';}
    try {
      let format='PNG',blob;
      try {blob=await asPNG(photoSVG);}
      catch (_) {format='SVG';blob=new Blob([photoSVG],{type:'image/svg+xml;charset=utf-8'});}
      if(current!==generation||!ready)return false;
      saveBlob(blob,'gyuseok-birthday-2026-11-25.'+format.toLowerCase());
      if(current===generation&&$('photo-status'))$('photo-status').textContent=format==='PNG'?'사진을 저장했어. 오늘을 오래오래 기억해 줘!':'사진을 SVG 파일로 저장했어. 브라우저에서도 열어 볼 수 있어.';
      return true;
    } catch (_) {
      if(current===generation&&$('photo-status'))$('photo-status').textContent='사진을 저장하지 못했어. 한 번 더 눌러 줘.';
      return false;
    } finally {
      exporting=false;
      if(button&&button.isConnected&&current===generation){button.disabled=!ready;button.textContent='사진 저장하기';}
    }
  }
  window.EndingPhoto={markup,start,stop,download};
})();
