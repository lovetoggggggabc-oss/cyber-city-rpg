
(()=>{'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');let W=0,H=0,dpr=1;
const $=s=>document.querySelector(s), world={w:1500,h:1100};
const walls=[{x:90,y:110,w:240,h:110},{x:480,y:95,w:200,h:135},{x:860,y:90,w:290,h:105},{x:1190,y:175,w:170,h:220},{x:160,y:360,w:125,h:230},{x:375,y:410,w:235,h:110},{x:750,y:360,w:130,h:240},{x:1000,y:450,w:250,h:105},{x:90,y:780,w:290,h:145},{x:535,y:780,w:145,h:220},{x:815,y:805,w:270,h:130},{x:1210,y:730,w:150,h:245}];
const safe={x:680,y:655,r:125};
const defs={conduct:{name:'전도성 탄창',type:'mod',desc:'5번째 탄환이 감전 부여'},serrated:{name:'톱니 탄환',type:'mod',desc:'치명타 시 출혈 부여'},powder:{name:'불량 화약',type:'mod',desc:'총기 피해 +20%'},regen:{name:'재생 회로',type:'cyber',desc:'처치 시 체력 2 회복'},reflex:{name:'반사 신경제어기',type:'cyber',desc:'대시 후 1초간 연사 +30%'},overload:{name:'과부하 칩',type:'chip',desc:'해킹 시 감전 부여'},battery:{name:'폐기형 전력 코어',type:'core',desc:'감전된 적에게 피해 +15%'},ignite:{name:'점화 탄창',type:'mod',desc:'샷건 근접 사격 시 화상'},thruster:{name:'긴급 추진기',type:'cyber',desc:'대시 후 다음 공격 피해 +25%'},heat:{name:'열회수 코어',type:'core',desc:'화상 적 처치 시 대시 재사용 1초 단축'}};
const weapons={pistol:{name:'PX-0 권총',damage:12,rate:2,range:470,mag:12,reload:1.4,pellets:1,color:'#8defff'},shotgun:{name:'KRAK-12 샷건',damage:11,rate:.8,range:250,mag:5,reload:2.2,pellets:7,color:'#ffbe70'},sword:{name:'SCRAP-7 절단검',damage:34,rate:1.3,range:82,mag:0,reload:0,pellets:0,color:'#ff708d'}};
const p={x:safe.x,y:safe.y,r:17,hp:100,maxHp:100,face:0,weapon:'pistol',owned:['pistol'],ammo:{pistol:12,shotgun:5},reload:0,fire:0,melee:0,dash:0,dashTime:0,dashX:0,dashY:0,boost:0,shield:0,hack:0,shot:0,mods:[],cyber:[],chip:null,core:null,bag:[],scrap:0,kills:0,dead:false,deathTime:0};
let enemies=[],bullets=[],drops=[],particles=[],time=0,spawn=1,wave=1,noticeUntil=0,aim={x:1,y:0},aimPoint=null,move={x:0,y:0},heldShoot=false,inventoryOpen=false;
const keys=new Set();const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
function notice(s){$('#message').textContent=s;$('#message').classList.add('show');noticeUntil=time+2.6}
function wallHit(x,y,r){return walls.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h)}
function advance(o,dx,dy,r){const x=clamp(o.x+dx,r,world.w-r),y=clamp(o.y+dy,r,world.h-r);if(!wallHit(x,o.y,r))o.x=x;if(!wallHit(o.x,y,r))o.y=y}
function inSafe(x,y){return Math.hypot(x-safe.x,y-safe.y)<safe.r}
function spawnEnemy(){for(let n=0;n<24;n++){let x=rand(45,world.w-45),y=rand(45,world.h-45);if(!wallHit(x,y,23)&&!inSafe(x,y)&&Math.hypot(x-p.x,y-p.y)>250){let brute=Math.random()<.19;enemies.push({x,y,r:brute?22:16,hp:brute?80:45,max:brute?80:45,speed:brute?48:72,damage:brute?17:9,hit:0,stun:0,shock:0,bleed:0,burn:0,tick:0,brute});return}}}
function current(){return weapons[p.weapon]}
function has(id){return p.mods.includes(id)||p.cyber.includes(id)||p.chip===id||p.core===id}
function nearest(range,filter=()=>true){let best=null,d=range;for(const e of enemies){let v=dist(p,e);if(v<d&&filter(e)){d=v;best=e}}return best}
function shoot(){if(p.dead||inventoryOpen||p.fire>0||p.reload>0)return;let w=current();if(w===weapons.sword){melee();return}if(p.ammo[p.weapon]<=0){p.reload=w.reload;notice('재장전 중');return}p.ammo[p.weapon]--;p.fire=1/w.rate/(p.boost>0&&has('reflex')?1.3:1);p.shot++;let target=nearest(w.range,e=>!inSafe(e.x,e.y));let angle=aimPoint?Math.atan2(aimPoint.y-p.y,aimPoint.x-p.x):target?Math.atan2(target.y-p.y,target.x-p.x):p.face;p.face=angle;
for(let i=0;i<w.pellets;i++){let a=angle+(w.pellets>1?rand(-.26,.26):rand(-.025,.025));bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720,life:w.range/720,damage:w.damage*(has('powder')?1.2:1),kind:p.weapon,shock:has('conduct')&&p.shot%5===0,ignite:has('ignite')&&p.weapon==='shotgun',boost:p.shield>0&&has('thruster')?1.25:1})}p.shield=0;if(!p.ammo[p.weapon])p.reload=w.reload}
function melee(){if(p.dead||inventoryOpen||p.melee>0)return;p.melee=.6;p.face=aimPoint?Math.atan2(aimPoint.y-p.y,aimPoint.x-p.x):p.face;let hit=0;for(const e of [...enemies]){let a=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(a-p.face),Math.cos(a-p.face));if(dist(p,e)<90&&Math.abs(delta)<1.15){hurtEnemy(e,p.weapon==='sword'?34*(e.bleed>0?1.2:1):21,'melee');hit++}}burst(p.x+Math.cos(p.face)*40,p.y+Math.sin(p.face)*40,'#ff9cba',6);if(hit)notice(`근접 공격 ${hit}회 적중`)}
function hack(){if(p.dead||inventoryOpen||p.hack>0)return;let e=nearest(245,e=>!inSafe(e.x,e.y));if(!e){notice('해킹 범위에 적이 없어');return}p.hack=7;e.stun=3;e.shock=has('overload')?4:0;burst(e.x,e.y,'#68e8ff',18);notice(has('overload')?'해킹 성공 · 감전':'해킹 성공 · 3초 정지')}
function dash(){if(p.dead||inventoryOpen||p.dash>0)return;let d=movement();if(!d.x&&!d.y){d={x:Math.cos(p.face),y:Math.sin(p.face)}}p.dashX=d.x;p.dashY=d.y;p.dashTime=.19;p.dash=5;p.boost=1;p.shield=1;burst(p.x,p.y,'#8defff',8)}
function swap(){if(p.dead||inventoryOpen)return;let i=p.owned.indexOf(p.weapon);p.weapon=p.owned[(i+1)%p.owned.length];p.reload=0;p.fire=0;notice(current().name)}
function hurtEnemy(e,n,kind){if(!enemies.includes(e))return;let v=n*(e.shock>0&&has('battery')?1.15:1);e.hp-=v;e.hit=.12;if(kind==='bullet'&&has('serrated')&&Math.random()<.18)e.bleed=4;if(e.hp<=0)kill(e)}
function kill(e){let i=enemies.indexOf(e);if(i<0)return;enemies.splice(i,1);p.kills++;p.scrap+=e.brute?8:3;if(has('regen'))p.hp=Math.min(p.maxHp,p.hp+2);if(has('heat')&&e.burn>0)p.dash=Math.max(0,p.dash-1);burst(e.x,e.y,e.brute?'#fa916d':'#ec6289',13);if(Math.random()<.47||p.kills<=3){let pool=['conduct','serrated','powder','regen','reflex','overload','battery','ignite','thruster','heat'];let id=p.kills===1?'conduct':pool[Math.floor(Math.random()*pool.length)];drops.push({x:e.x,y:e.y,id,kind:'item',age:0})}if(p.kills===4&&!p.owned.includes('sword'))drops.push({x:e.x+22,y:e.y,id:'sword',kind:'weapon',age:0});if(p.kills===8&&!p.owned.includes('shotgun'))drops.push({x:e.x-22,y:e.y,id:'shotgun',kind:'weapon',age:0})}
function pickup(){if(p.dead||inventoryOpen)return;let found=drops.filter(d=>dist(p,d)<72);if(!found.length){notice('가까운 아이템이 없어');return}for(let d of found){drops.splice(drops.indexOf(d),1);if(d.kind==='weapon'){if(!p.owned.includes(d.id))p.owned.push(d.id);notice(`${weapons[d.id].name} 획득 · 무기 버튼으로 교체`)}else{p.bag.push(d.id);notice(`${defs[d.id].name} 획득 · 장비에서 장착`)}}renderInventory()}
function equip(index){let id=p.bag[index];if(!id)return;let type=defs[id].type;if(type==='mod'||type==='cyber'){let slot=p[type==='mod'?'mods':'cyber'];if(slot.length>=2)p.bag.push(slot.shift());slot.push(id)}else{let old=p[type];if(old)p.bag.push(old);p[type]=id}p.bag.splice(index,1);renderInventory();notice(`${defs[id].name} 장착`)}
function unequip(type,index){let id;if(type==='mod'||type==='cyber')id=p[type==='mod'?'mods':'cyber'].splice(index,1)[0];else{id=p[type];p[type]=null}if(id)p.bag.push(id);renderInventory()}
function renderInventory(){let rows=(ids,type)=>ids.map((id,i)=>`<div class="row"><div><b>${defs[id].name}</b><br><span>${defs[id].desc}</span></div><button data-off="${type}" data-index="${i}">해제</button></div>`).join('');let sections=[['무기',p.owned.map(id=>weapons[id].name).join(' / ')],['무기 모듈 (2칸)',rows(p.mods,'mod')],['사이버웨어 (2칸)',rows(p.cyber,'cyber')],['해킹 칩 (1칸)',rows(p.chip?[p.chip]:[],'chip')],['코어 (1칸)',rows(p.core?[p.core]:[],'core')]];$('#inventoryContent').innerHTML=sections.map(([name,body])=>`<h3>${name}</h3>${body||'<div class="sub">비어 있음</div>'}`).join('')+`<h3>가방 (${p.bag.length})</h3>`+p.bag.map((id,i)=>`<div class="row"><div><b>${defs[id].name}</b><br><span>${defs[id].desc}</span></div><button data-equip="${i}">장착</button></div>`).join('')};
$('#inventoryContent').addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.equip!==undefined)equip(+b.dataset.equip);if(b.dataset.off)unequip(b.dataset.off,+b.dataset.index)});
function inventory(){inventoryOpen=!inventoryOpen;$('#inventory').classList.toggle('open',inventoryOpen);if(inventoryOpen)renderInventory()};$('#inventoryButton').onclick=inventory;$('#closeInventory').onclick=inventory;$('#lootButton').onclick=pickup;
const actions={shoot,melee,hack,dash,swap,interact:pickup};for(let [id,fn] of Object.entries(actions)){let b=$('#'+id);b.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();b.setPointerCapture(ev.pointerId);if(id==='shoot')heldShoot=true;fn()});if(id==='shoot'){b.addEventListener('pointerup',()=>heldShoot=false);b.addEventListener('pointercancel',()=>heldShoot=false)}}
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyJ')melee();if(e.code==='KeyK')hack();if(e.code==='Space')dash();if(e.code==='KeyQ')swap();if(e.code==='KeyE')pickup();if(e.code==='KeyI')inventory()});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();heldShoot=false;move.x=move.y=0});
let stickId=null;const stick=$('#stick');function stickMove(e){let r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,m=Math.min(1,Math.hypot(dx,dy)/(r.width*.38)),a=Math.atan2(dy,dx);move.x=Math.cos(a)*m;move.y=Math.sin(a)*m;$('#knob').style.transform=`translate(${move.x*r.width*.28}px,${move.y*r.height*.28}px)`}stick.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(stickId);stickMove(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stickMove(e)});function stopStick(e){if(e.pointerId===stickId){stickId=null;move.x=move.y=0;$('#knob').style.transform=''}}stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')aimPoint=screenToGround(e.clientX,e.clientY)});canvas.addEventListener('pointerdown',e=>{e.preventDefault();aimPoint=screenToGround(e.clientX,e.clientY);heldShoot=true;shoot();canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',()=>heldShoot=false);canvas.addEventListener('pointercancel',()=>heldShoot=false);
function movement(){let x=move.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=move.y+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0),l=Math.hypot(x,y);return l?{x:x/l,y:y/l}:{x:0,y:0}}
function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-120,120),vy:rand(-120,120),life:rand(.2,.65),max:.65,color})}
function die(){p.dead=true;p.deathTime=3;$('#respawn').classList.add('open');$('#respawnButton').disabled=true;notice('신호 소실')}
$('#respawnButton').onclick=()=>{if(p.deathTime>0)return;p.dead=false;p.hp=p.maxHp;p.x=safe.x;p.y=safe.y;p.dash=p.hack=0;enemies=[];bullets=[];for(let i=0;i<5;i++)spawnEnemy();$('#respawn').classList.remove('open');notice('LOW-01 은신처로 복귀')};
function update(dt){time+=dt;if(time>noticeUntil)$('#message').classList.remove('show');for(let o of particles){o.x+=o.vx*dt;o.y+=o.vy*dt;o.life-=dt}particles=particles.filter(o=>o.life>0);for(let d of drops)d.age+=dt;
if(p.dead){p.deathTime=Math.max(0,p.deathTime-dt);$('#timer').textContent=p.deathTime>0?`${Math.ceil(p.deathTime)}초 후 리스폰 가능`:'복귀 준비 완료';$('#respawnButton').disabled=p.deathTime>0;return}if(inventoryOpen)return;
for(let k of ['fire','melee','dash','dashTime','boost','shield','hack'])p[k]=Math.max(0,p[k]-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0){p.reload=0;p.ammo[p.weapon]=current().mag}}let d=movement();if(d.x||d.y){p.face=Math.atan2(d.y,d.x);advance(p,d.x*185*dt,d.y*185*dt,p.r)}if(p.dashTime>0)advance(p,p.dashX*790*dt,p.dashY*790*dt,p.r);if(heldShoot||keys.has('KeyF'))shoot();
spawn-=dt;if(spawn<=0&&enemies.length<Math.min(6+Math.floor(p.kills/7),15)){spawnEnemy();spawn=Math.max(.65,2.4-p.kills*.018)}wave=1+Math.floor(p.kills/10);
for(let e of [...enemies]){e.hit=Math.max(0,e.hit-dt);e.stun=Math.max(0,e.stun-dt);e.shock=Math.max(0,e.shock-dt);e.bleed=Math.max(0,e.bleed-dt);e.burn=Math.max(0,e.burn-dt);e.tick+=dt;if(e.tick>=1){e.tick=0;if(e.burn>0||e.bleed>0){hurtEnemy(e,(e.burn>0?4:0)+(e.bleed>0?3:0),'dot');if(!enemies.includes(e))continue}}if(e.stun>0||inSafe(e.x,e.y))continue;let len=dist(e,p);if(len>e.r+p.r+4){let dx=(p.x-e.x)/len,dy=(p.y-e.y)/len;let nx=e.x+dx*e.speed*dt,ny=e.y+dy*e.speed*dt;if(!inSafe(nx,ny))advance(e,dx*e.speed*dt,dy*e.speed*dt,e.r)}else if(p.shield<=0&&!inSafe(p.x,p.y)){p.hp=Math.max(0,p.hp-e.damage*dt*.75);if(p.hp<=0)die()}}
for(let b of [...bullets]){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||wallHit(b.x,b.y,2)){bullets.splice(bullets.indexOf(b),1);continue}for(let e of [...enemies]){if(dist(b,e)<e.r+4){let close=dist(p,e)<105;hurtEnemy(e,b.damage*b.boost*(b.kind==='shotgun'&&close?1.3:1),'bullet');if(b.shock)e.shock=4;if(b.ignite&&close)e.burn=4;bullets.splice(bullets.indexOf(b),1);burst(b.x,b.y,'#8df2ff',3);break}}}
$('#hpText').textContent=`HP ${Math.ceil(p.hp)} / ${p.maxHp}`;$('#hpBar').style.width=`${p.hp}%`;$('#equipment').textContent=`${current().name} · ${current().mag?p.reload>0?'재장전':p.ammo[p.weapon]+'/'+current().mag:'근접'} · 모듈 ${p.mods.length}/2`;$('#scrap').textContent=p.scrap;$('#kills').textContent=`처치 ${p.kills} · 웨이브 ${wave}`;$('#dash').innerHTML=`대시<small>${p.dash?p.dash.toFixed(1)+'초':'Space'}</small>`;$('#hack').innerHTML=`해킹<small>${p.hack?p.hack.toFixed(1)+'초':'K'}</small>`;
}
// Perspective camera and cube-face renderer. Runs on Canvas 2D without WebGL.
const camOffset={x:560,y:820,z:950},camForward={x:0,y:0,z:0},camRight={x:0,y:0,z:0},camUp={x:0,y:0,z:0};
let eye={x:0,y:0,z:0},focal=1;
function camera3D(){eye={x:p.x+camOffset.x,y:camOffset.y,z:p.y+camOffset.z};
 let len=Math.hypot(camOffset.x,camOffset.y,camOffset.z);
 camForward.x=-camOffset.x/len;camForward.y=-camOffset.y/len;camForward.z=-camOffset.z/len;
 let rightLen=Math.hypot(camForward.z,camForward.x);camRight.x=-camForward.z/rightLen;camRight.y=0;camRight.z=camForward.x/rightLen;
 camUp.x=-camRight.z*camForward.y;camUp.y=camRight.z*camForward.x-camRight.x*camForward.z;camUp.z=camRight.x*camForward.y;
 // Up vector must point toward the sky.
 if(camUp.y<0){camUp.x*=-1;camUp.y*=-1;camUp.z*=-1}
 focal=Math.min(H*1.16,1040)}
function project(x,y,z){let dx=x-eye.x,dy=y-eye.y,dz=z-eye.z;
 let depth=dx*camForward.x+dy*camForward.y+dz*camForward.z;
 if(depth<50)return null;
 let sx=(dx*camRight.x+dy*camRight.y+dz*camRight.z)*focal/depth+W/2;
 let sy=H*.5-(dx*camUp.x+dy*camUp.y+dz*camUp.z)*focal/depth;
 return{x:sx,y:sy,depth}}
function screenToGround(sx,sy){camera3D();let a=(sx-W/2)/focal,b=(H*.5-sy)/focal;
 let dx=camForward.x+camRight.x*a+camUp.x*b,dy=camForward.y+camRight.y*a+camUp.y*b,dz=camForward.z+camRight.z*a+camUp.z*b;
 if(dy>=-.04)return null;let t=-eye.y/dy;return{x:eye.x+dx*t,y:eye.z+dz*t}}
function polygon(points,fill,stroke){let projected=points.map(v=>project(...v));if(projected.some(v=>!v))return;
 ctx.beginPath();ctx.moveTo(projected[0].x,projected[0].y);for(let i=1;i<projected.length;i++)ctx.lineTo(projected[i].x,projected[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
const surfaces=[];
function cube3(x,z,w,d,h,colors,base=0){let x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2,y0=base,y1=base+h;
 let faces=[[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],[[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]];
 for(let i=0;i<3;i++){let pts=faces[i],pr=pts.map(v=>project(...v));if(pr.some(v=>!v))continue;surfaces.push({pts,depth:pr.reduce((s,v)=>s+v.depth,0)/4,color:colors[i],stroke:i===0?'#83dcf451':'#121f30'})}}
function line3(a,b,color,width=1){let p1=project(...a),p2=project(...b);if(!p1||!p2)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke()}
function paintWorld(){let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#071120');bg.addColorStop(1,'#1a263c');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 polygon([[0,0,0],[world.w,0,0],[world.w,0,world.h],[0,0,world.h]],'#152336','#36576b');
 for(let x=0;x<=world.w;x+=50)line3([x,.5,0],[x,.5,world.h],x%200===0?'#306878':'#254054');
 for(let z=0;z<=world.h;z+=50)line3([0,.5,z],[world.w,.5,z],z%200===0?'#306878':'#254054');
 let lane=75;for(let i=0;i<world.h/120;i++){let z=i*120;line3([400,.7,z],[400,.7,z+lane],'#49cde6',2);line3([1050,.7,z],[1050,.7,z+lane],'#e36aaf',2)}
 for(let i=0;i<48;i++){let a=i*Math.PI*2/48,b=(i+1)*Math.PI*2/48;line3([safe.x+safe.r*Math.cos(a),2,safe.y+safe.r*Math.sin(a)],[safe.x+safe.r*Math.cos(b),2,safe.y+safe.r*Math.sin(b)],'#68edfd',2)}
}
function paintActors(){surfaces.length=0;
 cube3(safe.x,safe.y,110,92,12,['#326479','#255064','#184052']);
 for(let i=0;i<walls.length;i++){let w=walls[i],h=75+i%4*27;cube3(w.x+w.w/2,w.y+w.h/2,w.w,w.h,h,i%2?['#344b62','#182b42','#243852']:['#2b405b','#253952','#172b43']);
 cube3(w.x+w.w/2,w.y+w.h/2,w.w+3,w.h+3,5,i%2?['#ba62a1','#6e3b72','#753858']:['#53d9e9','#286f91','#258ca1'],h);
 for(let j=0;j<Math.min(6,Math.floor(w.w/45));j++)cube3(w.x+25+j*42,w.y+w.h+1,18,2,14,['#6be6ee','#3a7c99','#309cb5'],h*.52)}
 // Real height, side faces and depth occlusion for every character.
 for(let e of enemies){let c=e.hit?['#ffe1ec','#a8859b','#bd98ac']:e.stun?['#7af5ff','#35abc0','#2885a3']:e.brute?['#ca7085','#793b58','#a64d69']:['#ee729b','#8e345c','#b34873'];cube3(e.x,e.y,e.r*2,e.r*2,e.brute?75:55,c)}
 cube3(p.x,p.y,33,30,55,p.dashTime?['#e3ffff','#a1e4f3','#93cada']:['#81edfc','#347ca9','#246489']);
 cube3(p.x,p.y,24,26,19,['#e2f8ff','#50718d','#39485d'],55);
 for(let d of drops)cube3(d.x,d.y,18,18,18,d.kind==='weapon'?['#ffe29a','#b67a33','#c78b47']:['#9affef','#2f9c9c','#3cbbbc'],10+Math.sin(time*4+d.x)*5);
 for(let b of bullets)cube3(b.x,b.y,6,6,7,['#efffff','#9ce6ef','#84cadb'],20);
 surfaces.sort((a,b)=>b.depth-a.depth);for(let s of surfaces)polygon(s.pts,s.color,s.stroke);
 let nose=project(p.x+Math.cos(p.face)*43,46,p.y+Math.sin(p.face)*43),center=project(p.x,47,p.y);if(nose&&center){ctx.strokeStyle='#a4faff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(nose.x,nose.y);ctx.stroke()}
 for(let e of enemies){let v=project(e.x,e.brute?95:76,e.y);if(v){let w=e.brute?40:32;ctx.fillStyle='#07101b';ctx.fillRect(v.x-w/2,v.y,w,5);ctx.fillStyle=e.shock>0?'#7feeff':'#f07799';ctx.fillRect(v.x-w/2,v.y,w*Math.max(0,e.hp/e.max),5)}}
 for(let o of particles){let v=project(o.x,30+o.life*25,o.y);if(v){ctx.globalAlpha=Math.max(0,o.life/o.max);ctx.fillStyle=o.color;ctx.fillRect(v.x,v.y,4,4)}}ctx.globalAlpha=1}
function draw(){camera3D();paintWorld();paintActors();if(drops.some(d=>dist(p,d)<72)){ctx.fillStyle='#09243fe8';ctx.fillRect(W/2-55,H/2-99,110,25);ctx.fillStyle='#b3faff';ctx.textAlign='center';ctx.font='12px system-ui';ctx.fillText('E / 줍기',W/2,H/2-82);ctx.textAlign='left'}}

let prev=performance.now();function frame(now){let dt=Math.min(.034,(now-prev)/1000);prev=now;update(dt);draw();requestAnimationFrame(frame)}for(let i=0;i<5;i++)spawnEnemy();renderInventory();notice('LOW-01 · 적을 처치하고 부품을 수집해');requestAnimationFrame(frame);
})();

