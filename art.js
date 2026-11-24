/* Tiny, dependency-free pixel artwork. All artwork is drawn with SVG primitives. */
(function () {
  'use strict';
  const ink = '#29263f';
  const r = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const p = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
  const svg = (body, w = 64, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${body}</svg>`;
  const box = (x, y, w, h, fill, n = 3) => r(x, y, w, h, ink) + r(x + n, y + n, w - n * 2, h - n * 2, fill);
  const shadow = () => r(14, 58, 36, 4, '#29263f', 'opacity=".18"');
  const eyes = (y = 22) => r(23, y, 4, 5, ink) + r(37, y, 4, 5, ink);
  const cheeks = (y = 29) => r(20, y, 6, 3, '#f29aaa') + r(38, y, 6, 3, '#f29aaa');
  const head = (skin = '#ffdbb7') => p('M22 6h20v4h5v24h-5v5H22v-5h-5V10h5z', ink) + p('M23 10h18v4h3v18h-5v4H25v-4h-5V14h3z', skin);
  const body = (shirt = '#9ce3dd', pants = '#666185') => p('M23 37h18v4h8v13h-6v8H33v-8h-2v8H21v-8h-6V41h8z', ink) + r(24, 39, 16, 15, shirt) + r(18, 43, 6, 8, '#ffdbb7') + r(40, 43, 6, 8, '#ffdbb7') + r(24, 54, 7, 5, pants) + r(33, 54, 7, 5, pants);
  function person(kind) {
    let out = shadow() + body(kind === 'dj' ? '#e7a1db' : kind === 'sanji' ? '#44425e' : '#a6e3df');
    out += head() + eyes() + cheeks() + r(29, 31, 7, 2, ink);
    if (kind === 'dj') out += p('M21 4h22v4h5v11h-9v-5H25v6H16V9h5z', '#7361ab') + r(17, 13, 5, 15, '#b6a4ee') + r(42, 13, 5, 15, '#b6a4ee') + r(12, 18, 6, 13, ink) + r(46, 18, 6, 13, ink) + r(14, 19, 4, 9, '#a6e3df') + r(46, 19, 4, 9, '#a6e3df');
    if (kind === 'sanji') out += p('M20 5h24v5h4v13H34V13H20z', '#f8d46a') + r(35, 20, 9, 3, '#f8d46a') + r(28, 39, 8, 8, '#f9efdf') + r(30, 40, 4, 13, '#a88ebd');
    if (kind === 'luffy') out += r(19, 4, 26, 13, ink) + r(22, 6, 20, 10, '#e6c071') + r(15, 15, 34, 6, ink) + r(15, 16, 34, 3, '#f7d282') + r(22, 12, 20, 4, '#d66b70') + r(24, 39, 6, 15, '#d9676c') + r(34, 39, 6, 15, '#d9676c');
    if (kind === 'player') out += r(26, 11, 7, 2, '#fff0d3') + r(34, 13, 5, 2, '#fff0d3');
    return out;
  }
  // Anonymous, deliberately different guests. Names and puzzle clues live in game.js.
  function guestSprite(index, extra) {
    const guests = [
      {skin:'#e7b99d',hair:'#423c45',shine:'#60525a',coat:'#849a79',inner:'#f4e8d5',pants:'#4b5268',style:'crop'},
      {skin:'#f3ccb4',hair:'#333441',shine:'#515268',coat:'#829dbd',inner:'#e9e9eb',pants:'#45485f',style:'long'},
      {skin:'#eac1a2',hair:'#59483e',shine:'#796053',coat:'#c9b799',inner:'#f3e5cf',pants:'#6b6172',style:'part'},
      {skin:'#edc2a6',hair:'#55423e',shine:'#79564e',coat:'#bd8fa8',inner:'#f3d6cd',pants:'#5f5064',style:'bob'},
      {skin:'#e6c7b0',hair:'#393a40',shine:'#55555e',coat:'#e4d7bf',inner:'#a67178',pants:'#5c6377',style:'shag'},
      {skin:'#e4baa3',hair:'#32343c',shine:'#575966',coat:'#526179',inner:'#f2e5d5',pants:'#3f485e',style:'quiff'}
    ];
    const extras = [
      {skin:'#ecc6a7',hair:'#654d40',shine:'#88644a',coat:'#7caaa2',inner:'#fff0cf',pants:'#646a7a',style:'cap',hat:'#c28566'},
      {skin:'#efc4ad',hair:'#9c6149',shine:'#c58662',coat:'#a694bf',inner:'#e7d6db',pants:'#5f5475',style:'curly'},
      {skin:'#d6ac91',hair:'#3f3d47',shine:'#68616e',coat:'#ddc9a4',inner:'#87a4b8',pants:'#50677e',style:'beanie',glasses:true},
      {skin:'#b58066',hair:'#35343b',shine:'#554b49',coat:'#75aeb0',inner:'#f0dbb9',pants:'#65566e',style:'curly'},
      {skin:'#f1cdb0',hair:'#c3a36c',shine:'#ebcd89',coat:'#bc7d82',inner:'#f6e6d0',pants:'#62738b',style:'crop'},
      {skin:'#e9bc9d',hair:'#715747',shine:'#987056',coat:'#d6c0a7',inner:'#a58aaa',pants:'#776078',style:'pony'}
    ];
    const a = (extra ? extras : guests)[(index - 1) % 6];
    let out = shadow();
    if (['long','bob','pony','curly'].includes(a.style)) out += p('M19 8h26v6h5v30h-7v4H19v-5h-5V15h5z', ink) + r(17,16,30,28,a.hair);
    if (a.style === 'pony') out += p('M44 12h8v5h5v23h-6v-4h-5z', a.hair) + r(47,14,5,5,'#c398bd');
    out += p('M23 37h18v4h7v13h-6v8H33v-8h-2v8H21v-8h-5V41h7z', ink);
    out += r(24,38,16,17,a.coat) + r(18,43,6,9,a.coat) + r(40,43,6,9,a.coat);
    out += r(18,49,5,5,a.skin) + r(41,49,5,5,a.skin) + r(29,38,6,15,a.inner);
    out += r(23,54,8,5,a.pants) + r(33,54,8,5,a.pants) + r(22,59,9,3,ink) + r(33,59,10,3,ink);
    out += r(22,59,8,1,'#d4c5c3') + r(34,59,8,1,'#d4c5c3') + r(24,41,3,8,'#ffffff','opacity=".12"') + r(38,43,2,11,ink,'opacity=".16"');
    out += head(a.skin) + r(25,33,14,3,'#a0675c','opacity=".18"') + eyes(22) + r(21,29,5,2,'#d68a84','opacity=".6"') + r(39,29,5,2,'#d68a84','opacity=".6"') + r(29,31,7,2,ink);
    if (a.style === 'crop') out += p('M21 5h22v3h4v10h-6v-5H23v6h-6V10h4z',a.hair) + r(24,7,13,3,a.shine) + r(19,18,3,7,a.hair);
    if (a.style === 'part') out += p('M21 5h22v4h5v12h-5v-8h-8v4H21v5h-4V11h4z',a.hair) + r(23,7,10,3,a.shine) + r(36,8,5,3,a.shine);
    if (a.style === 'long') out += p('M21 5h22v5h5v24h-5V16H26v4h-5v17h-5V13h5z',a.hair) + r(23,8,13,3,a.shine) + r(17,22,3,17,a.shine) + r(44,24,2,16,a.shine) + r(43,29,3,4,'#e8d496');
    if (a.style === 'bob') out += p('M22 4h20v4h6v12h-5v-5H27v5h-6v17h-5V12h6z',a.hair) + r(45,19,4,18,a.hair) + r(18,12,5,3,a.shine) + r(25,7,12,3,a.shine) + r(43,30,3,4,'#ddc48e');
    if (a.style === 'shag') out += p('M21 4h21v4h6v18h-5v-9h-5v4h-5v-6h-5v7h-6v7h-5V10h4z',a.hair) + r(23,7,8,3,a.shine) + r(35,8,6,3,a.shine) + r(39,39,3,15,'#98646a');
    if (a.style === 'cap') {const cap=a.hat||'#9181a6';out += r(18,8,29,13,a.hair) + p('M22 3h21v4h4v11H18V8h4z',cap) + r(17,16,33,4,ink) + r(17,16,32,2,cap) + r(24,6,14,3,'#ffffff','opacity=".16"') + r(31,8,5,5,'#f0dec1');}
    if (a.style === 'quiff') out += p('M18 23V8h5V4h7V1h12v4h5v9h-5v-4H30v5H23v8z',a.hair) + r(25,6,14,3,a.shine) + r(31,3,8,2,'#787987') + r(43,13,4,10,a.hair);
    if (a.style === 'beanie') out += p('M22 3h21v4h5v15H16V8h6z','#738ba7') + r(16,16,32,6,'#a2b5c5') + r(24,6,3,9,'#a2b5c5') + r(32,5,3,10,'#a2b5c5') + r(40,8,3,7,'#a2b5c5');
    if (a.style === 'curly') {
      out += p('M21 4h22v4h6v12h-6v-5h-5v3h-7v-3h-7v7h-7V10h4z',a.hair);
      for (const [x,y] of [[19,8],[25,5],[32,7],[39,4],[44,10],[17,15]]) out += r(x,y,5,5,a.shine) + r(x+2,y+2,3,3,a.hair);
    }
    if (a.style === 'pony') out += p('M21 5h23v5h4v11h-5v-5H30v4H20v7h-4V12h5z',a.hair) + r(22,8,14,3,a.shine);
    if (a.glasses) out += r(20,21,10,8,ink) + r(22,23,6,4,a.skin) + r(34,21,10,8,ink) + r(36,23,6,4,a.skin) + r(30,23,4,2,ink) + r(24,23,2,4,ink) + r(38,23,2,4,ink);
    if (!extra && index === 6) out += r(21,18,8,3,'#39323b') + r(35,18,8,3,'#39323b') + p('M24 39h5l3 5-5 8-3-3z','#78899e') + p('M40 39h-5l-3 5 5 8 3-3z','#78899e') + r(30,40,4,3,'#9f7581') + r(31,43,2,10,'#9f7581') + r(36,52,2,2,'#b9bcc9');
    if (!extra && index === 3) out += r(30,39,4,13,'#8b6376') + r(29,39,6,3,'#b28b9e');
    if (extra && index === 1) out += r(24,40,4,14,'#5f8180') + r(37,40,4,14,'#5f8180') + r(24,47,17,7,'#5f8180') + r(25,42,2,2,'#d4bf81') + r(38,42,2,2,'#d4bf81');
    return out;
  }
  function icon(kind, color) {
    kind = String(kind || '').toLowerCase();
    const guest = /^(guest|extra)([1-6])$/.exec(kind);
    if (guest) return svg(guestSprite(Number(guest[2]), guest[1] === 'extra'));
    if (kind === 'guests-group' || kind === 'birthday-group') {
      let group = r(4,90,120,4,'#29263f','opacity=".16"');
      for (let i=1;i<=6;i++) {
        const x=3+((i-1)%3)*40, y=i<=3?0:46;
        group += `<g data-guest="guest${i}" transform="translate(${x} ${y}) scale(.69)">` + guestSprite(i,false) + '</g>';
      }
      if (kind === 'birthday-group') {
        group += '<g transform="translate(123 23) scale(.69)">' + person('dj') + '</g>';
      }
      return svg(group,kind === 'birthday-group' ? 168 : 128,96);
    }
    let s = '';
    switch (kind) {
      case 'player': case 'dj': case 'sanji': case 'luffy': s = person(kind); break;
      case 'bed':
        s = shadow() + box(11, 6, 42, 52, '#e4b38c') + r(15, 10, 34, 44, '#f5f2df') + box(18, 12, 28, 14, '#ffffff', 2) + box(15, 28, 34, 26, '#8dcec5', 2) + r(19, 32, 26, 3, '#bdeee5') + r(18, 49, 28, 3, '#66aaa9') + r(11, 58, 6, 5, ink) + r(47, 58, 6, 5, ink);
        break;
      case 'drawer':
        s = shadow() + box(9, 12, 46, 44, '#bd8da5') + r(12, 15, 40, 4, '#ecc7d5');
        for (let y = 21; y < 51; y += 10) s += box(14, y, 36, 9, '#e7bac4', 2) + r(28, y + 3, 8, 3, '#8b647f');
        s += r(12, 56, 6, 6, ink) + r(46, 56, 6, 6, ink) + box(16, 4, 12, 8, '#a5d4c5', 2);
        break;
      case 'desk':
        s = shadow() + box(5, 27, 54, 11, '#d7a17c') + r(9, 31, 46, 3, '#f4cf9b') + box(9, 38, 7, 23, '#b98671', 2) + box(48, 38, 7, 23, '#b98671', 2) + box(20, 10, 24, 16, '#ade2dc', 2) + r(29, 26, 6, 3, ink) + r(25, 28, 14, 2, ink) + r(24, 14, 12, 2, '#eafff8') + box(43, 19, 9, 9, '#f4e6c8', 2) + r(52, 21, 3, 5, ink);
        break;
      case 'door':
        s = box(12, 3, 40, 59, '#b98caf', 4) + box(18, 9, 28, 49, '#735f8b', 2) + box(23, 15, 18, 16, '#b3a4d5', 2) + r(40, 37, 5, 5, '#f3d87b') + r(12, 59, 40, 4, '#29263f');
        break;
      case 'bunny':
        // The supplied transparent PNG is used unchanged, fitted to the sprite box.
        return svg('<image href="assets/usagi.png" x="10.311111" y="0" width="43.377778" height="64" preserveAspectRatio="xMidYMid meet" style="image-rendering:auto"/>');
      case 'phone':
        s = shadow() + box(18, 3, 28, 58, '#b7a5d0', 3) + r(22, 10, 20, 41, '#3c4868') + r(28, 6, 8, 2, ink) + r(29, 54, 7, 3, '#f3e3e4') + r(26, 17, 12, 4, '#b7e4dc') + r(26, 26, 4, 5, '#e3b5dc') + r(34, 26, 4, 5, '#e9d589') + r(26, 35, 4, 5, '#e9d589') + r(34, 35, 4, 5, '#b7e4dc');
        break;
      case 'snail':
        s = '<ellipse cx="32" cy="58" rx="27" ry="4" fill="#29263f" opacity=".16"/>';
        s += '<g stroke="#424154" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">';
        s += '<path d="M8 48Q8 39 15 36Q20 34 25 42L35 46L54 47Q60 49 57 54Q54 58 42 57H17Q5 57 6 52Z" fill="#b4d6b1"/>';
        s += '<path d="M12 38L11 27" fill="none" stroke="#8bab91" stroke-width="4"/>';
        s += '<circle cx="11" cy="24" r="5" fill="#fff4d6"/>';
        s += '<ellipse cx="12" cy="24" rx="2" ry="2.8" fill="#383846" stroke="none"/>';
        s += '<path d="M13 45Q17 49 22 44" fill="none" stroke-width="1.5"/><ellipse cx="9" cy="43" rx="3" ry="2" fill="#d4a0a1" stroke="none"/>';
        s += '<path d="M26 48C20 43 22 30 27 25C32 19 43 18 51 24C58 29 61 42 53 49C47 54 33 55 26 48Z" fill="#c6add9"/>';
        s += '<path d="M43 48C30 49 26 39 30 31C34 23 47 25 51 32C55 41 47 46 40 43C34 41 35 33 41 32C46 31 49 36 46 39C44 41 40 39 41 36" fill="none" stroke="#866d9f" stroke-width="2.7"/>';
        s += '<path d="M29 29Q32 24 38 24" fill="none" stroke="#e7d4ed" stroke-width="2.5"/>';
        s += '<path d="M22 38L24 27" fill="none" stroke="#8bab91" stroke-width="4"/><circle cx="25" cy="24" r="5" fill="#fff4d6"/><ellipse cx="25" cy="24" rx="2" ry="2.8" fill="#383846" stroke="none"/>';
        s += '<path d="M26 13Q29 8 38 8H46Q54 9 56 14L54 21H46L44 16H36L34 21H26Z" fill="#78a8a2"/>';
        s += '<path d="M30 12Q37 10 48 12" fill="none" stroke="#b9dcd0" stroke-width="2"/><path d="M27 17H33M47 17H54" stroke="#4b7474"/>';
        s += '<path d="M54 21Q61 24 57 27Q53 29 58 32Q62 35 57 38" fill="none" stroke="#50777a" stroke-width="1.7"/>';
        s += '<path d="M13 53H31" fill="none" stroke="#d8e8c9" stroke-width="2"/></g>';
        break;
      case 'system': {
        let points = '';
        for (let i=0;i<32;i++) {const angle=-Math.PI/2+i*Math.PI/16, radius=[27,27,21,21][i%4];points+=(32+Math.cos(angle)*radius).toFixed(1)+','+(32+Math.sin(angle)*radius).toFixed(1)+' ';}
        s = '<polygon points="'+points+'" fill="#9cabc5" stroke="#34394f" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="32" r="13" fill="#58617d" stroke="#34394f" stroke-width="2"/><circle cx="32" cy="32" r="8" fill="#d5e2eb"/><path d="M19 20Q27 11 38 15" fill="none" stroke="#d4deea" stroke-width="2" stroke-linecap="round"/>';
        break;
      }
      case 'friedrice':
        s = '<ellipse cx="32" cy="54" rx="28" ry="5" fill="#29263f" opacity=".15"/><ellipse cx="32" cy="46" rx="29" ry="13" fill="#cad6df" stroke="#484254" stroke-width="2"/><ellipse cx="32" cy="43" rx="26" ry="10" fill="#fff1df"/>';
        s += '<path d="M11 41C12 30 17 22 28 21C40 18 50 25 54 41Q48 48 32 49Q18 48 11 41Z" fill="#e7bf6d" stroke="#9f7758" stroke-width="1.5"/>';
        for (const [x,y,c] of [[18,34,'#f5db8d'],[28,27,'#f7dfa1'],[37,26,'#dba15d'],[42,34,'#f7dfa1'],[26,38,'#f9dd8c'],[33,43,'#d6a358'],[16,41,'#d79d5b'],[44,41,'#f7dfa1'],[23,31,'#79a678'],[34,34,'#7ea87a'],[46,37,'#78a471'],[29,44,'#75a778'],[22,40,'#dd936b'],[38,40,'#dd936b'],[38,30,'#e09c70']]) s += r(x,y,3,2,c);
        s += '<path d="M23 29Q15 25 20 21Q25 18 29 22L27 25L23 24L22 26L26 28" fill="#efb39a" stroke="#ce8b7a" stroke-width="1.2"/><path d="M39 15Q35 11 39 7M26 15Q30 11 26 6M48 20Q51 15 48 11" fill="none" stroke="#e9e3d6" stroke-width="1.8" stroke-linecap="round"/>';
        break;
      case 'vip':
        s = shadow() + body('#575274', '#413b5d') + head('#575274') + p('M19 5h26v5h4v15h-5V14H20v11h-5V10h4z', '#3a3551') + r(23, 22, 4, 3, '#d4c7ee') + r(37, 22, 4, 3, '#d4c7ee') + r(29, 29, 7, 2, '#8d83b0') + r(29, 40, 7, 3, '#c7b6e4');
        break;
      case 'cake-unlit':
      case 'cake':
        s = shadow() + box(6, 51, 52, 7, '#b1cddc', 2) + box(11, 27, 42, 27, '#e99faf', 3) + r(14, 39, 36, 5, '#fff3d7') + p('M14 29h36v10h-6v-5h-6v7h-6v-7h-6v4h-6v-4h-6z', '#fff4df');
        for (const x of [20, 31, 42]) {
          s += r(x - 1, 15, 4, 15, ink) + r(x, 17, 2, 11, '#a5dbd1');
          if (kind === 'cake') s += p(`M${x} 5h2v4h2v5h-6V9h2z`, '#f6cb66') + r(x, 10, 2, 4, '#fff0b5');
        }
        break;
      case 'balloon': {
        const c = /^#[\da-f]{3,8}$/i.test(color || '') ? color : ({red:'#ec858d',yellow:'#f2d675',green:'#8fd3ae',blue:'#8cbaeb'}[color] || '#8cbaeb');
        s = p('M24 4h16v4h7v7h5v21h-5v7h-8v7H25v-7h-8v-7h-5V15h5V8h7z', ink) + p('M25 8h14v4h7v7h2v14h-5v7h-9v5h-5v-5h-8v-7h-5V19h5v-7h4z', c) + r(22, 15, 5, 13, '#ffffff', 'opacity=".55"') + r(27, 11, 7, 4, '#ffffff', 'opacity=".55"') + r(30, 48, 4, 5, ink) + p('M32 52h2v6h-3v6h-2v-8h3z', '#b3a1b8');
        break;
      }
      case 'mirror':
        s = box(11, 3, 42, 46, '#d1b8dc', 4) + box(18, 10, 28, 32, '#b9e0e7', 2) + p('M21 14h14l-14 14z', '#edfaff') + p('M42 22v15H27z', '#d9f4f4') + box(27, 49, 10, 12, '#d1b8dc', 2);
        break;
      case 'memo':
        s = box(12, 5, 40, 51, '#fff2d6', 3) + r(25, 3, 14, 7, '#a89dc7') + r(20, 18, 24, 3, '#85728e') + r(20, 27, 20, 3, '#85728e') + r(20, 36, 24, 3, '#85728e') + r(20, 45, 12, 3, '#b7a2b3');
        break;
      case 'chopper':
        s = shadow() + body('#dba67e', '#8ecac9') + head('#d4aa85') + eyes() + r(28, 29, 8, 5, '#6382a3') + r(13, 5, 6, 17, '#9e795c') + r(45, 5, 6, 17, '#9e795c') + r(9, 8, 10, 5, '#9e795c') + r(45, 8, 10, 5, '#9e795c') + box(20, 3, 24, 16, '#e2a0b9', 2) + r(15, 17, 34, 5, '#cc88a5') + r(29, 7, 6, 10, '#fff3e2') + r(27, 9, 10, 6, '#fff3e2');
        break;
      default: s = box(13, 13, 38, 38, '#bda7d9') + r(29, 21, 6, 15, '#fff1da') + r(29, 40, 6, 5, '#fff1da');
    }
    if (kind === 'player') s += r(24,40,3,11,'#d5f4eb') + r(37,43,3,11,'#71b6b0') + r(29,39,6,3,'#fff0d5') + r(25,46,13,2,'#d3eee5') + r(24,58,6,2,'#ebe5dd') + r(34,58,6,2,'#ebe5dd');
    if (kind === 'dj') s += r(25,42,3,10,'#f5c5e9') + r(36,43,3,10,'#b979b0') + r(28,40,8,3,'#eedfe6') + r(30,44,4,5,'#f6d88f');
    if (kind === 'bed') s += r(21,14,19,2,'#e9e9e4') + r(20,23,21,1,'#c3c8c5') + r(17,30,30,2,'#c8e9dc') + r(18,37,28,1,'#a7d4c6') + r(18,44,28,1,'#a7d4c6') + r(44,33,3,17,'#62a7a4') + r(12,10,1,43,'#eecba6') + r(50,10,1,43,'#946d69');
    if (kind === 'drawer') {for(const y of [23,33,43]) s += r(17,y,29,1,'#f0cbd2') + r(17,y+5,11,1,'#b88a9e') + r(30,y+1,4,2,'#e5c991');s += r(49,20,2,32,'#a67892') + r(19,6,6,1,'#d3eadb');}
    if (kind === 'desk') s += r(23,13,18,1,'#d4f3e9') + r(24,16,7,2,'#6baeb5') + r(24,20,12,2,'#e9f7e9') + r(22,31,17,3,'#685f76') + r(25,31,2,1,'#a5a9b8') + r(30,31,2,1,'#a5a9b8') + r(35,31,2,1,'#a5a9b8') + r(12,41,2,16,'#d7ad88') + r(46,21,4,2,'#8a7077');
    if (kind === 'door') s += r(21,34,15,19,'#6a577f') + r(23,36,11,1,'#9783aa') + r(24,18,7,2,'#d1c5e5') + r(19,10,1,47,'#ad9ac2');
    if (kind === 'cake') s += r(15,48,34,2,'#cf859c') + r(18,33,3,3,'#d7758e') + r(28,35,3,3,'#d7758e') + r(42,33,3,3,'#d7758e');
    return svg(s);
  }
  function floor(wood) {
    let out = r(24, 132, 912, 364, wood ? '#bb9aa2' : '#746b97');
    if (wood) {
      for (let y = 142, row = 0; y < 496; y += 38, row++) {
        out += r(24, y, 912, 3, '#9a7c91');
        for (let x = 24 + (row % 2 ? 72 : 0); x < 936; x += 180) out += r(x, y, 3, 38, '#a38698');
        for (let x = 42 + (row % 2 ? 66 : 0); x < 915; x += 150) out += r(x,y+11,35+(row%3)*12,2,'#d4b4b3','opacity=".35"') + r(x+16,y+25,43,2,'#95768d','opacity=".24"');
      }
    } else {
      for (let y = 132, row = 0; y < 496; y += 52, row++) for (let x = 24, col = 0; x < 936; x += 76, col++) if ((row + col) % 2) out += r(x, y, Math.min(76,936-x), Math.min(52,496-y), '#80749f');
      for (let y = 132; y < 496; y += 52) out += r(24, y, 912, 2, '#685e88');
      for (let x = 24; x < 936; x += 76) out += r(x,132,2,364,'#685e88');
      for(let y=144;y<496;y+=104) for(let x=36;x<926;x+=152) out += r(x,y,47,2,'#a394b8','opacity=".34"') + r(x,y,2,25,'#a394b8','opacity=".25"');
    }
    return out;
  }
  function plant(x,y,scale=1) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">` + r(-23,5,48,7,ink,'opacity=".16"') + box(-19,-29,38,35,'#b88c8b',3) + r(-15,-25,30,5,'#e1b7a6') + r(-14,-18,4,19,'#cfa294') + r(-4,-75,7,48,'#607e79') + p('M-3-62h-22v-6h-9v-12h17v5h14z','#85ab98') + p('M2-46h22v-5h10v-14H17v6H2z','#9cbe9f') + p('M-1-72h16v-7h9v-14H8v7H-1z','#75998b') + r(-24,-72,15,3,'#a9c7ab') + r(13,-57,14,3,'#c1d2ac') + '</g>';
  }
  function books(x,y,width=90) {
    let s='';
    const shades=['#ac829b','#e1bd91','#7fa4a5','#c7a9b9','#8c91b3','#d0a27f'];
    for(let i=0;i<Math.floor(width/12);i++) {const h=17+(i*7%15);s+=r(x+i*12,y-h,10,h,shades[i%shades.length])+r(x+i*12+2,y-h+3,2,h-7,'#fff5dd','opacity=".3"')+r(x+i*12+2,y-6,6,2,'#fff1dd','opacity=".5"');}
    return s;
  }
  function cup(x,y,color='#e8d8dd') {
    return r(x,y,12,3,'#f3e9df') + r(x+1,y+3,10,13,color) + r(x+3,y+4,2,9,'#fff5e5') + r(x+12,y+4,4,6,color) + r(x+3,y-7,2,6,'#d9d6dc','opacity=".35"');
  }
  function pixelText(text,x,y,scale,color) {
    const chars={D:['1110','1001','1001','1001','1001','1001','1110'],A:['0110','1001','1001','1111','1001','1001','1001'],P:['1110','1001','1001','1110','1000','1000','1000'],R:['1110','1001','1001','1110','1010','1001','1001'],T:['1111','0110','0110','0110','0110','0110','0110'],Y:['1001','1001','0110','0110','0110','0110','0110'],H:['1001','1001','1001','1111','1001','1001','1001'],B:['1110','1001','1001','1110','1001','1001','1110'],I:['1111','0110','0110','0110','0110','0110','1111']};
    let s='';
    [...text].forEach((letter,i)=>{const ch=chars[letter];if(ch)ch.forEach((row,j)=>[...row].forEach((v,k)=>{if(v==='1')s+=r(x+(i*6+k)*scale,y+j*scale,scale,scale,color);}));});
    return s;
  }
  function sceneDetails(kind) {
    let s = r(24,24,912,5,'#dfcce4','opacity=".38"') + r(24,29,912,3,'#4f415f','opacity=".25"') + r(24,132,912,9,'#29263f','opacity=".15"') + r(24,141,11,355,'#29263f','opacity=".08"') + r(924,141,12,355,'#29263f','opacity=".13"');
    if (kind === 'room') {
      // Wallpaper, small shelf, picture rail, and a view beyond the window.
      for(let x=218;x<915;x+=41) s += r(x,34,2,66,'#d3bfd9','opacity=".33"');
      s += r(80,46,48,19,'#8296b9') + r(134,46,48,19,'#8296b9') + r(85,52,2,2,'#f5e4be') + r(118,49,2,2,'#f5e4be') + r(154,54,2,2,'#f5e4be') + r(172,48,3,3,'#f5e4be');
      s += r(80,71,102,26,'#99bec8') + r(86,82,15,15,'#7b9eaf') + r(108,76,18,21,'#7b9eaf') + r(139,80,21,17,'#7b9eaf') + r(165,73,12,24,'#7b9eaf') + r(128,39,6,58,'#f1e6e6') + r(80,65,102,5,'#f1e6e6');
      s += r(67,35,3,64,'#edc9dd') + r(190,35,3,64,'#edc9dd') + r(57,105,148,7,'#796782') + r(62,105,139,3,'#d4bbcd');
      s += '<g opacity=".1">'+p('M73 139h135l90 124H95z','#fff0d6')+'</g>';
      s += box(250,81,132,8,'#9d8299',2) + r(259,89,6,13,'#6c607c') + r(365,89,6,13,'#6c607c') + books(259,81,72) + box(344,48,26,30,'#e3c99d',2) + r(348,52,18,20,'#b3cbb3') + r(353,57,8,10,'#829e8d');
      s += box(614,38,44,44,'#a08599',3) + box(620,44,32,32,'#f2dfc5',2) + r(635,49,3,16,'#68576f') + r(637,62,9,3,'#68576f') + r(635,46,3,3,'#af8a87') + r(635,71,3,3,'#af8a87') + r(622,59,3,3,'#af8a87') + r(647,59,3,3,'#af8a87');
      // A tidy narrow bookcase and boxes sit at the edges, outside the walking rug.
      s += r(849,175,70,124,ink,'opacity=".17"') + box(850,156,62,130,'#b18b95',4) + r(856,161,50,116,'#725f7e');
      for(const y of [192,231,270]) s += books(860,y,43) + r(855,y,52,6,'#d6acac') + r(857,y+5,48,3,'#8f6d86');
      s += r(851,286,7,8,ink) + r(904,286,7,8,ink);
      s += box(69,426,49,38,'#cda78b',3) + r(91,429,6,32,'#e7c7a1') + r(75,439,13,8,'#f0d8b6') + r(77,441,8,2,'#b78e79');
      s += box(108,443,40,29,'#b79283',3) + r(125,446,5,23,'#d8b690');
      s += p('M267 242h15v5h4v17h-22v-17h3z','#816e91') + r(268,247,14,10,'#bba1b8') + p('M295 250h15v5h4v17h-22v-17h3z','#816e91') + r(296,255,14,10,'#bba1b8');
      s += box(713,446,62,16,'#c2a2b7',2) + r(718,449,50,4,'#ead5df') + r(721,456,39,2,'#9d7a94');
      // Woven rug border: deliberately quiet through its center.
      for(let x=345;x<618;x+=24) s += r(x,216,9,3,'#d4c2df') + r(x,411,9,3,'#d4c2df');
      for(let y=236;y<404;y+=23) s += r(334,y,4,7,'#d4c2df') + r(622,y,4,7,'#d4c2df');
      s += r(350,225,262,2,'#bba8ce') + r(350,402,262,2,'#8d7eac') + r(450,285,6,26,'#bcaed2') + r(496,285,6,26,'#bcaed2');
      s += plant(885,449,.83);
    } else if (kind === 'entrance') {
      for(let x=44;x<920;x+=58) s += r(x,34,2,69,'#d9c7db','opacity=".24"');
      // Recessed door panels, bevels, brass hardware, and the actual keypad.
      for(const x of [375,491]) {s += box(x,80,94,91,'#7c6a96',3) + r(x+5,85,84,2,'#b3a0c5') + r(x+7,91,75,65,'#ad9fc3','opacity=".16"') + box(x,218,94,67,'#7f6b95',3) + r(x+5,223,84,2,'#a994bb');}
      s += r(358,61,3,233,'#e0cee4') + r(601,61,3,233,'#534563') + r(455,194,14,31,'#63536c') + r(491,194,14,31,'#63536c') + r(458,197,6,25,'#e8ce8e') + r(495,197,6,25,'#e8ce8e');
      s += box(614,170,24,44,'#454158',2) + r(618,174,16,9,'#9dbdb3');
      for(let y=187;y<206;y+=6) for(let x=618;x<633;x+=6) s+=r(x,y,3,3,'#c3b5cc');
      s += r(415,35,129,5,'#9d879f') + r(423,40,113,3,'#ead3cc');
      for(const x of [254,677]) s += r(x-20,48,60,70,'#f7dca5','opacity=".07"') + r(x+2,67,16,3,'#fff0c8') + r(x+4,109,11,6,'#6b5872');
      s += box(756,43,111,55,'#8b748e',3) + r(762,49,99,42,'#e1cdb4') + r(777,58,70,3,'#a98a87') + r(787,69,50,3,'#a98a87') + r(776,80,71,2,'#baa093');
      s += plant(138,429,.95) + plant(824,429,.95);
      s += r(398,350,164,3,'#e0b6c9') + r(398,439,164,3,'#774f74') + r(398,354,3,83,'#d6a8c0') + r(559,354,3,83,'#d6a8c0');
      for(let x=411;x<554;x+=20) s += r(x,361,8,3,'#d1a1b7') + r(x,429,8,3,'#d1a1b7');
      // Small steel floor inlays evoke an old party venue without creating clues.
      for(const [x,y] of [[279,349],[677,349],[279,435],[677,435]]) s += p(`M${x} ${y-7}l7 7-7 7-7-7z`,'#baa8c5');
    } else {
      // A continuous garland rather than additional balloon decorations.
      s += p('M29 35h150v5h150v5h300v-5h150v-5h150v3H780v5H630v5H330v-5H180v-5H29z','#c9accd');
      for(let x=53,i=0;x<932;x+=47,i++) {const y=x<180||x>780?39:x<330||x>630?44:49;s+=p(`M${x} ${y}h22v6h-4v5h-4v5h-6v-5h-4v-5h-4z`,['#d4abc6','#c3c6b2','#d8c29e'][i%3]);}
      // Intimate wall signage; no external font or image file is needed.
      s += box(67,67,151,49,'#3b3653',3) + r(73,73,139,37,'#6a537b') + pixelText('HAPPY',100,80,3,'#e5b9d6');
      s += box(735,67,168,49,'#3b3653',3) + r(741,73,156,37,'#536c7b') + pixelText('BIRTHDAY',750,80,3,'#c3e3dc');
      // Speaker cabinets: layered cones and warm hardware highlights.
      for(const x of [274,632]) {
        s += r(x+4,71,46,3,'#7f7390') + r(x+4,74,3,77,'#5f5474') + r(x+47,77,3,76,'#323047');
        for(const [y,size] of [[80,23],[113,31]]) s += p(`M${x+16} ${y}h22v4h5v${size-8}h-5v4h-22v-4h-5v-${size-8}h5z`,'#2a293e') + r(x+20,y+6,14,size-12,'#746b87') + r(x+24,y+10,6,Math.max(3,size-20),'#3b3751');
        for(const [dx,dy] of [[7,8],[44,8],[7,81],[44,81]]) s+=r(x+dx,67+dy,2,2,'#aa97b3');
      }
      // Mixer top with two turntables, tiny faders, and a lit console front.
      s += r(343,78,274,9,'#c5b2d1') + r(350,79,260,4,'#ead7df');
      for(const x of [365,554]) s+=box(x,88,43,34,'#5e526e',2)+p(`M${x+10} 93h22v5h5v14h-5v5h-22v-5h-5V98h5z`,'#28283b')+r(x+17,100,8,10,'#ad829f')+r(x+20,103,3,4,'#e9cbbc');
      for(let i=0;i<7;i++) {const x=424+i*15;s+=r(x,89,4,30,'#35344b')+r(x-2,96+(i%3)*6,8,4,'#d1bfd7')+r(x-1,124,6,3,['#b9d6c4','#d2adca','#e1c78b'][i%3]);}
      s += r(354,141,252,4,'#c9aacc') + r(359,147,242,4,'#6b567e') + r(270,159,420,3,'#ded0de') + r(258,172,443,3,'#a790b2');
      // Buffet consoles hug the upper walls, keeping the main floor clear.
      for(const [x,accent] of [[49,'#baa1b9'],[758,'#a0b9b7']]) {
        s += r(x+4,183,151,8,ink,'opacity=".2"') + box(x,147,150,14,'#c7a5af',3) + r(x+5,151,140,3,'#eed4cd') + r(x+7,161,137,21,accent) + r(x+7,176,137,6,'#82748f') + r(x+13,182,8,14,ink) + r(x+129,182,8,14,ink);
        s += cup(x+18,130,'#c5d5ce') + cup(x+42,130,'#dfb2bf') + r(x+79,142,42,4,'#eee2d3') + r(x+84,136,32,6,'#c4a480') + r(x+88,134,5,3,'#f0d4a0') + r(x+101,132,6,5,'#e9c895');
      }
      // Tile highlights and tiny streamers make the party feel occupied.
      for(let y=245,row=0;y<433;y+=44,row++) for(let x=343,col=0;x<620;x+=46,col++) s+=r(x,y,30,2,['#d8b4d3','#bfd4cc','#d6c69e'][(row+col)%3],'opacity=".38"') + r(x,y,2,25,'#d9bce3','opacity=".18"');
      for(const [x,y,c] of [[115,404,'#ddbfcc'],[160,455,'#c1d2c6'],[332,461,'#d3be9e'],[652,457,'#bfc3d8'],[849,423,'#d8b9d4'],[884,460,'#c6d0c5'],[316,213,'#d6c0a6'],[643,208,'#b8c9c9']]) s+=r(x,y,4,10,c)+r(x+4,y+6,6,3,c);
      s += box(55,421,68,39,'#86798f',3)+r(59,425,60,20,'#b4a0b4')+r(61,446,56,8,'#9c8a9f')+r(58,460,6,12,ink)+r(113,460,6,12,ink);
      s += box(839,421,68,39,'#7b8298',3)+r(843,425,60,20,'#a4aabc')+r(845,446,56,8,'#8c94aa')+r(842,460,6,12,ink)+r(897,460,6,12,ink);
      if(kind==='finale') {
        s += r(380,364,200,32,'#c8a0b7') + r(382,364,196,5,'#e3c3d0') + r(387,389,186,7,'#a17f9a');
        for(let x=389,i=0;x<574;x+=23,i++) s += p(`M${x} 369h18v5h-4v5h-4v4h-3v-4h-4v-5h-3z`,['#f1d9b3','#b6d4c7','#d7b8d5'][i%3]);
        s += cup(397,322,'#c3d6cc') + cup(550,322,'#e4b4c7') + r(410,338,140,2,'#fff1e4');
      }
    }
    return s;
  }
  function lightScene(markup) {
    // Recolor the SVG artwork itself: screenshots and the ending photo share this palette.
    const palette = {
      '#28243e':'#ac92b4', '#47405e':'#c6afcc', '#17182b':'#93789e',
      '#b6a5cb':'#e7d8ed', '#8c7aa6':'#bda8ce', '#5b5276':'#9e87b2',
      '#bb9aa2':'#ebcdc2', '#9a7c91':'#c8a7b4', '#a38698':'#d1afbb',
      '#d4b4b3':'#f5e2d4', '#95768d':'#bc96aa', '#dfcce4':'#fff0f2',
      '#746b97':'#d7c8e2', '#80749f':'#e6ddef', '#685e88':'#bca9cc',
      '#a394b8':'#f4e8f5', '#4f456c':'#c5afd5', '#b994cc':'#f0d1e9',
      '#8d7ea9':'#b19ac7', '#c0afd2':'#efe3f2', '#aa9ac6':'#d3c1e2',
      '#bba8ce':'#e5d2ec', '#8d7eac':'#a78fbb', '#bcaed2':'#e0cce9',
      '#3b3553':'#9c83b0', '#6f6689':'#b8a3cd', '#8d80a8':'#d2bedf',
      '#5d526f':'#a98cb7', '#7c6a96':'#b8a0ca', '#7f6b95':'#c2a8d1',
      '#534563':'#92769d', '#9d879f':'#c5a5c6', '#6b5872':'#9d80a7',
      '#63536c':'#94779c', '#8b748e':'#b796bd', '#796782':'#aa8aaf',
      '#8f6d86':'#b68da7', '#725f7e':'#a68ab4', '#6c607c':'#a08aae',
      '#9582b3':'#c9b2dc', '#453c62':'#6f5a8b', '#48425e':'#746780',
      '#504564':'#a28aae', '#5f5474':'#9781aa', '#323047':'#67566f',
      '#6a537b':'#9d77b0', '#536c7b':'#648e94', '#e5b9d6':'#fff0fa',
      '#c3e3dc':'#e7fff5', '#3b3653':'#7d648d', '#6b567e':'#a388b7',
      '#5e526e':'#8a779e', '#40374e':'#8d7597', '#9c87b6':'#c9afd9',
      '#82748f':'#b498bb', '#86798f':'#b6a1bc', '#7b8298':'#a5acc4'
    };
    return markup.replace(/#[0-9a-f]{6}/gi, color => palette[color.toLowerCase()] || color);
  }
  function scene(kind) {
    let s = r(0, 0, 960, 520, '#28243e') + r(12, 12, 936, 496, '#47405e') + r(24, 24, 912, 108, '#b6a5cb');
    s += floor(kind === 'room');
    s += r(24, 108, 912, 13, '#8c7aa6') + r(24, 121, 912, 11, '#5b5276');
    if (kind === 'room') {
      s += box(75, 34, 112, 68, '#a3d8dc', 5) + r(80, 39, 102, 7, '#dcf4ed') + r(128, 39, 6, 58, '#f1e6e6') + r(80, 65, 102, 5, '#f1e6e6') + r(64, 31, 11, 76, '#d5b0ce') + r(187, 31, 11, 76, '#d5b0ce');
      s += r(316, 197, 328, 236, '#8d7ea9') + r(326, 207, 308, 216, '#c0afd2') + r(338, 219, 284, 192, '#aa9ac6');
      for (let x=328; x<634; x+=18) s += r(x, 193, 8, 4, '#d5c5df') + r(x, 433, 8, 4, '#d5c5df');
      s += r(469, 284, 22, 10, '#d5c7e1') + r(459, 294, 42, 10, '#d5c7e1') + r(469, 304, 22, 10, '#d5c7e1');
      s += box(428, 35, 90, 54, '#e9d7d6', 4) + r(438, 45, 70, 34, '#b6d9c9') + r(453, 54, 14, 14, '#ead184') + p('M438 79l25-19 15 11 17-18 13 26z','#8bbab1');
      s += box(867, 407, 39, 40, '#d6b19e', 4) + r(880, 373, 12, 37, '#779f91') + r(860, 382, 22, 16, '#9dc4a3') + r(889, 364, 21, 18, '#9dc4a3');
    } else if (kind === 'entrance') {
      s += r(328, 32, 304, 280, '#3b3553') + r(340, 44, 280, 256, '#d1bbd4') + r(352, 56, 256, 244, '#6f6689') + r(365, 68, 230, 232, '#8d80a8') + r(477, 68, 6, 232, '#5b506f') + r(458, 197, 9, 27, '#ebd284') + r(493, 197, 9, 27, '#ebd284') + r(320, 300, 320, 14, '#c4b3d0') + r(311, 314, 338, 12, '#5d526f');
      s += box(89, 40, 96, 56, '#eddbad', 4) + r(102, 54, 70, 5, '#a68e91') + r(112, 69, 50, 5, '#a68e91');
      s += r(390, 343, 180, 105, '#c394b2') + r(401, 354, 158, 83, '#b17e9d');
      for(const x of [259,682]) s += box(x,61,20,43,'#f4e5b4',3) + r(x+4,48,12,13,'#40374e');
    } else {
      s += r(24, 24, 912, 84, '#4f456c') + r(24, 99, 912, 5, '#b994cc');
      for (let x = 85, i = 0; x < 930; x += 88, i++) {
        s += r(x, 24, 3, 23, '#d2bddf') + r(x-5, 44, 14, 7, ['#edbbd1','#a4dfd8','#e9d792'][i%3]);
      }
      s += box(348, 58, 264, 98, '#9582b3', 5) + r(356, 66, 248, 13, '#c4b1dd') + r(366, 87, 228, 51, '#453c62');
      for(let i=0;i<16;i++) {const h=12+(i*17%31);s+=r(376+i*13,132-h,7,h,['#a3dacf','#e3a9cb','#e7cf8e'][i%3]);}
      for (const x of [274,632]) s += box(x, 67, 54, 90, '#48425e', 4) + box(x+10,79,34,27,'#2e2c40',3) + box(x+10,113,34,33,'#2e2c40',3) + r(x+22,124,10,10,'#85769b');
      s += r(265,158,430,13,'#a295b9') + r(253,171,454,10,'#504564');
      s += r(328,233,304,208,'#9c87b6', 'opacity=".46"');
      for(let y=246;y<430;y+=44) for(let x=344;x<622;x+=46) s+=r(x,y,30,28,['#b4a0cb','#9dabc5','#c5a0b9'][((x-344)/46+(y-246)/44)%3],'opacity=".38"');
      if(kind==='finale') s += box(375,340,210,24,'#e4c8d6',4) + r(390,364,12,68,ink) + r(558,364,12,68,ink) + r(379,345,202,7,'#fff0df');
    }
    s += sceneDetails(kind) + r(12, 508, 936, 8, '#17182b');
    return svg(lightScene(s), 960, 520);
  }
  function avatar(kind) {
    const names = {'규석':'player','빡빡이 규석':'player','다다':'dj','dj 다다':'dj','우사기':'bunny','상디':'sanji','루피':'luffy','쵸파':'chopper','시스템':'system','전보벌레':'snail','초대가수 일동':'guests-group','l씨':'guest1','y씨':'guest2','j씨':'guest5','c씨':'guest6','빈지노':'guest1','카리나':'guest2','김진호':'guest3','슬기':'guest4','조휴일':'guest5','top':'guest6','t.o.p':'guest6','탑':'guest6'};
    const selected = names[String(kind).toLowerCase()] || String(kind || 'player').toLowerCase();
    if (['system','snail','guests-group','birthday-group','friedrice'].includes(selected)) return icon(selected);
    const character = ['player','dj','bunny','sanji','luffy','chopper','vip'].includes(selected) || /^(guest|extra)[1-6]$/.test(selected) ? selected : 'player';
    return icon(character).replace('viewBox="0 0 64 64"', character === 'bunny' ? 'viewBox="5 0 54 64"' : 'viewBox="10 0 44 43"');
  }
  window.GameArt = { scene, icon, avatar };
})();
