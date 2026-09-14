const $=id=>document.getElementById(id);
let threat=100, auto=true, locked=false, running=false, thermal=false, audioCtx=null, osc=null, gain=null;

function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active')}

function statusFor(v){if(v>=999)return['SEVERE','#ff3b3b'];if(v>=799)return['DANGEROUS','#ff784d'];if(v>=600)return['HIGH','#ffad3d'];if(v>=300)return['ELEVATED','#64cfff'];return['LOW','#58cfff']}

function setThreat(v){
  threat=Math.max(100,Math.min(1200,Math.round(v)));
  $('threatSlider').value=threat;
  const [st,col]=statusFor(threat);
  $('threatValue').textContent=threat;
  $('status').textContent=st;
  document.documentElement.style.setProperty('--threat',col);
  $('threatValue').style.color=col;$('status').style.color=col;$('meterFill').style.color=col;
  $('meterFill').style.width=((threat-100)/1100*100)+'%';
  $('signal').textContent=Math.round(12+(threat-100)/1100*88)+'%';
  $('field').textContent=Math.round(8+(threat-100)/1100*92)+'%';
  $('thermalThreat').textContent=threat;
  $('thermalAnomaly').textContent=threat>=999?'SEVERE':threat>=600?'DETECTED':threat>=300?'VARIATION':'NONE';
  updateAudio();
}

function boot(){
  show('boot');$('bootLog').textContent='';$('bootProgress').style.width='0%';
  const lines=['PKE FIELD SCANNER','POWER SYSTEM ........ OK','SENSOR ARRAY ........ OK','FIELD ANALYSER ...... OK','SIGNAL PROCESSOR .... OK','AUDIO SYSTEM ........ OK','CALIBRATING SENSOR...','SYSTEM READY'];
  let i=0;const timer=setInterval(()=>{if(i<lines.length){$('bootLog').textContent+=lines[i++]+'\\n';$('bootProgress').style.width=Math.round(i/lines.length*100)+'%'}else{clearInterval(timer);running=true;show('main');setThreat(100);startAudio()}},350)
}
$('activateBtn').onclick=boot;
$('deactivateBtn').onclick=shutdown;
$('thermalDeactivateBtn').onclick=shutdown;
$('returnBtn').onclick=()=>{thermal=false;show('main');$('modeLabel').textContent=auto?'FIELD SCAN':'SIMULATION';updateAudio()};

$('threatSlider').oninput=e=>{auto=false;$('modeBtn').textContent='SIM';setThreat(e.target.value)};
$('modeBtn').onclick=()=>{auto=!auto;$('modeBtn').textContent=auto?'AUTO':'SIM';if(auto&&!locked) setThreat(100)};
$('lockBtn').onclick=()=>{locked=!locked;$('lockBtn').textContent=locked?'UNLOCK':'LOCK';$('lockBtn').classList.toggle('active',locked)};
$('thermalBtn').onclick=()=>{thermal=true;show('thermal');$('modeLabel').textContent='THERMAL';updateAudio()};

function shutdown(){running=false;stopAudio();show('activation');$('lockBtn').textContent='LOCK';locked=false;auto=true;$('modeBtn').textContent='AUTO'}

setInterval(()=>{if(running&&auto&&!locked&&!thermal){let drift=(Math.random()-.5)*70;setThreat(threat+drift)}},650);

const canvas=$('wave'),ctx=canvas.getContext('2d');let t=0;
function draw(){
  const dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==w*dpr){canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr)}
  ctx.clearRect(0,0,w,h);
  const [st,col]=statusFor(threat); const intensity=(threat-100)/1100;
  ctx.strokeStyle=col;ctx.lineWidth=2+intensity*2;ctx.shadowColor=col;ctx.shadowBlur=6+intensity*20;
  ctx.beginPath();
  const cycles=2.2+intensity*9, amp=h*(.10+intensity*.28), base=h*.52;
  for(let x=0;x<=w;x++){let n=x/w*cycles*Math.PI*2;let noise=Math.sin(n*3.7+t*1.7)*.18+Math.sin(n*8.1-t*2.2)*.08;let spike=intensity>.55&&Math.random()<0.006? (Math.random()-.5)*h*.7:0;let y=base+Math.sin(n+t*(1+intensity*5))*amp*(1+noise*(.3+intensity)) + spike;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
  ctx.stroke();ctx.shadowBlur=0;
  requestAnimationFrame(()=>{t+=.035+intensity*.08;draw()})
}draw();

function startAudio(){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='sine';osc.connect(gain);gain.connect(audioCtx.destination);gain.gain.value=.018;osc.start();updateAudio()}catch(e){}}
function updateAudio(){if(!osc||!audioCtx)return;const i=(threat-100)/1100;osc.frequency.setTargetAtTime(90+i*650,audioCtx.currentTime,.08);gain.gain.setTargetAtTime(.012+i*.028,audioCtx.currentTime,.08)}
function stopAudio(){if(osc){try{osc.stop()}catch(e){}osc=null}if(audioCtx){audioCtx.close();audioCtx=null}}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audioCtx)audioCtx.suspend();else if(audioCtx)audioCtx.resume()});
setThreat(100);