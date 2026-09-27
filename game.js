window.Game={
  level:null,state:null,history:[],won:false,cleanRun:true,swipeStart:null,
  init(){
    Save.load();this.bind();this.showLoading();
    setInterval(()=>{Save.regenEnergy();UI.refreshHUD()},30000);
  },
  showLoading(){
    let p=0;const bar=document.querySelector("#loadBar"),txt=document.querySelector("#loadText");
    const timer=setInterval(()=>{p=Math.min(100,p+Math.floor(8+Math.random()*18));bar.style.width=p+"%";txt.textContent=p+"%";if(p>=100){clearInterval(timer);setTimeout(()=>UI.show("menu"),220)}},70)
  },
  bind(){
    document.addEventListener("click",e=>{
      const b=e.target.closest("button");if(!b)return;
      if(b.dataset.screen){AudioFX.tap();UI.show(b.dataset.screen);return}
      if(b.dataset.action)this.action(b.dataset.action);
      if(b.dataset.dir)this.move(b.dataset.dir);
    });
    ["sound","music","vibration"].forEach(k=>{const el=document.querySelector("#"+k+"Toggle");el.addEventListener("change",()=>{Save.data.settings[k]=el.checked;Save.save();AudioFX.tap()})});
    document.querySelector("#qualitySelect").addEventListener("change",e=>{Save.data.settings.quality=e.target.value;Save.save()});
    document.addEventListener("keydown",e=>{if(UI.current!=="game")return;const map={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right"};if(map[e.key]){e.preventDefault();this.move(map[e.key])}});
    const board=document.querySelector("#board");
    board.addEventListener("touchstart",e=>{const t=e.changedTouches[0];this.swipeStart=[t.clientX,t.clientY]},{passive:true});
    board.addEventListener("touchend",e=>{if(!this.swipeStart)return;const t=e.changedTouches[0],dx=t.clientX-this.swipeStart[0],dy=t.clientY-this.swipeStart[1];this.swipeStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;this.move(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"))},{passive:true});
    window.addEventListener("visibilitychange",()=>{if(document.hidden&&UI.current==="game")this.pause()});
  },
  action(a){
    switch(a){
      case"continue":this.startLevel(Math.min(Save.data.unlockedLevels,LEVELS.length));break;
      case"gameHome":this.exitToLevels();break;
      case"pause":this.pause();break;case"resume":this.resume();break;case"undo":this.undo();break;case"retry":this.retry();break;case"hint":this.hint();break;
      case"next":this.next();break;case"share":this.share();break;case"daily":UI.openDaily();break;case"claimDaily":UI.claimDaily();break;case"closeModal":document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));break;
      case"reset":document.querySelector("#confirmModal").classList.remove("hidden");break;case"confirmReset":Save.reset();document.querySelector("#confirmModal").classList.add("hidden");UI.show("menu");UI.toast("Progress reset");break;
      case"about":UI.toast("Garden Coil · Offline puzzle game");break;case"energy":UI.toast("Energy restores over time");break;case"shop":UI.show("shop");break;
    }
  },
  startLevel(id){
    if(id>Save.data.unlockedLevels){UI.toast("Level locked");return}
    if(!Save.data.completedLevels[id] && Save.data.energy<=0){UI.toast("No energy. Come back after regeneration.");return}
    if(!Save.data.completedLevels[id])Save.spendEnergy();
    this.level=LEVELS[id-1];this.state={snake:[...this.level.start],collected:[],moves:0,dir:null};this.history=[];this.won=false;this.cleanRun=true;
    this.renderGame();UI.show("game");AudioFX.start();
  },
  renderGame(){
    const l=this.level,s=this.state,board=document.querySelector("#board");board.style.gridTemplateColumns=`repeat(${l.w},1fr)`;board.style.gridTemplateRows=`repeat(${l.h},1fr)`;board.innerHTML="";
    const obs=new Set(l.obstacles.map(p=>p.join(","))), items=new Map(l.collectibles.map(p=>[p.join(","),"collect"]));items.set(l.goal.join(","),"goal");
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      const c=document.createElement("div");c.className="cell ground";const k=x+","+y;
      if(x===0||y===0||x===l.w-1||y===l.h-1)c.className="cell wall";
      if(obs.has(k))c.classList.add("obstacle");
      if(items.has(k)){const it=document.createElement("div");it.className="item "+items.get(k);it.textContent=items.get(k)==="goal"?"◉":"●";c.appendChild(it)}
      const idx=s.snake.findIndex(p=>p[0]===x&&p[1]===y);if(idx>=0){const seg=document.createElement("div");seg.className="snake-seg "+(idx===0?"head":"");if(idx===0)seg.innerHTML='<span class="pupil"></span><span class="mouth"></span>';c.appendChild(seg)}
      board.appendChild(c);
    }
    document.querySelector("#gameLevel").textContent=l.id;document.querySelector("#moves").textContent=s.moves;document.querySelector("#bestMoves").textContent=Save.data.bestMoves[l.id]||l.par;document.querySelector("#hintText").textContent=Save.data.hints;
  },
  saveSnapshot(){this.history.push(JSON.stringify(this.state));if(this.history.length>40)this.history.shift()},
  move(dir){
    if(this.won||UI.current!=="game")return;
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(!d)return;
    this.saveSnapshot();const head=this.state.snake[0],next=[head[0]+d[0],head[1]+d[1]],l=this.level;
    const hitWall=next[0]<=0||next[0]>=l.w-1||next[1]<=0||next[1]>=l.h-1;
    const hitObs=l.obstacles.some(p=>p[0]===next[0]&&p[1]===next[1]);
    const hitBody=this.state.snake.slice(0,-1).some(p=>p[0]===next[0]&&p[1]===next[1]);
    if(hitWall||hitObs||hitBody){this.history.pop();AudioFX.bad();AudioFX.vibration(25);UI.toast("Ouch! Try another direction");return}
    const old=this.state.snake.map(p=>[...p]);this.state.dir=dir;this.state.snake=[next,...this.state.snake.slice(0,-1)];
    // Grow when a collectible is collected.
    const ci=l.collectibles.findIndex(p=>p[0]===next[0]&&p[1]===next[1]);
    if(ci>=0&&!this.state.collected.includes(ci)){this.state.collected.push(ci);this.state.snake.push([...old[old.length-1]]);AudioFX.collect();AudioFX.vibration(12)}
    else AudioFX.move();
    this.state.moves++;
    if(this.state.collected.length===l.collectibles.length&&next[0]===l.goal[0]&&next[1]===l.goal[1])this.win();
    else this.renderGame();
  },
  undo(){
    if(!this.history.length||this.won){UI.toast("Nothing to undo");return}
    this.state=JSON.parse(this.history.pop());this.cleanRun=false;this.renderGame();AudioFX.tap()
  },
  retry(){
    if(!this.level)return;this.state={snake:[...this.level.start],collected:[],moves:0,dir:null};this.history=[];this.cleanRun=false;this.won=false;this.renderGame();AudioFX.tap()
  },
  hint(){
    if(this.won)return;if(Save.data.hints<=0){UI.toast("No hints left");return}
    const path=this.findPath();if(!path||path.length<2){UI.toast("No hint available");return}
    Save.data.hints--;Save.save();document.querySelector("#hintText").textContent=Save.data.hints;
    const a=path[1],h=this.state.snake[0],dx=a[0]-h[0],dy=a[1]-h[1],arrow=dx>0?"›":dx<0?"‹":dy>0?"⌄":"⌃";
    const cells=[...document.querySelectorAll(".cell")];const idx=a[1]*this.level.w+a[0],cell=cells[idx];if(cell){const el=document.createElement("div");el.className="hint-arrow";el.textContent=arrow;cell.appendChild(el);setTimeout(()=>el.remove(),900)}
    AudioFX.tap();UI.toast("Follow the golden arrow");
  },
  findPath(){
    const l=this.level,start=this.state.snake[0],targets=[];
    const remaining=l.collectibles.map((p,i)=>({p,i})).filter(x=>!this.state.collected.includes(x.i));
    remaining.forEach(x=>targets.push(x.p));targets.push(l.goal);
    let current=start,full=[start];
    for(const target of targets){
      const q=[current],prev=new Map([[current.join(","),null]]),obs=new Set(l.obstacles.map(p=>p.join(",")));
      while(q.length){const p=q.shift();if(p[0]===target[0]&&p[1]===target[1])break;for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+d[0],p[1]+d[1]],k=n.join(",");if(n[0]<=0||n[0]>=l.w-1||n[1]<=0||n[1]>=l.h-1||obs.has(k)||prev.has(k))continue;prev.set(k,p);q.push(n)}}
      const tk=target.join(",");if(!prev.has(tk))return null;let path=[],p=target;while(p){path.push(p);p=prev.get(p.join(","))}path.reverse();full=full.concat(path.slice(1));current=target
    }return full;
  },
  win(){
    this.won=true;const l=this.level,m=this.state.moves;let stars=m<=l.star3?3:m<=l.star2?2:1;
    const old=Save.data.stars[l.id]||0;Save.setCompleted(l.id,stars,m);const reward=l.reward+stars*5;Save.addCoins(reward);
    if(this.cleanRun)Save.data.achievements.clean=1;Save.save();AudioFX.win();AudioFX.vibration(50);
    document.querySelector("#victoryStars").textContent="★".repeat(stars)+"☆".repeat(3-stars);
    document.querySelector("#victoryMoves").textContent=m;document.querySelector("#victoryBest").textContent=Save.data.bestMoves[l.id];document.querySelector("#victoryReward").textContent="+"+reward;document.querySelector("#victoryCoins").textContent=reward;
    document.querySelector("#victoryModal").classList.remove("hidden");UI.refreshHUD();
  },
  next(){document.querySelector("#victoryModal").classList.add("hidden");if(this.level.id<LEVELS.length)this.startLevel(this.level.id+1);else UI.show("levels")},
  pause(){if(UI.current!=="game"||this.won)return;document.querySelector("#pauseModal").classList.remove("hidden")},
  resume(){document.querySelector("#pauseModal").classList.add("hidden")},
  exitToLevels(){document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));UI.show("levels")},
  share(){
    const text=`I cleared Garden Coil Level ${this.level.id} in ${this.state.moves} moves!`;
    if(navigator.share)navigator.share({title:"Garden Coil",text}).catch(()=>{});else UI.toast("Sharing is not available in this app");
  }
};
window.addEventListener("load",()=>Game.init());
