window.UI={
  current:"loading", toastTimer:null,
  qs(s){return document.querySelector(s)}, qsa(s){return [...document.querySelectorAll(s)]},
  show(id){
    this.qsa(".screen").forEach(x=>x.classList.add("hidden"));
    const el=this.qs("#"+id);if(el)el.classList.remove("hidden");
    this.current=id;
    this.qsa(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));
    if(id==="menu")this.refreshMenu();
    if(id==="levels")this.renderLevels();
    if(id==="shop")this.renderShop();
    if(id==="inventory")this.renderInventory();
    if(id==="achievements")this.renderAchievements();
    if(id==="settings")this.renderSettings();
  },
  toast(msg){
    const t=this.qs("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>t.classList.remove("show"),1700)
  },
  vibrate(){AudioFX.vibration();AudioFX.tap()},
  refreshHUD(){
    Save.regenEnergy();
    this.qs("#energyText").textContent=`${Save.data.energy}/${Save.data.energyMax}`;
    this.qs("#coinText").textContent=Save.data.coins;
    this.qs("#shopCoins").textContent=Save.data.coins;
    const done=Object.keys(Save.data.completedLevels).length;
    this.qs("#levelProgress").textContent=`${done} / ${LEVELS.length}`;
    this.qs("#levelStarsTotal").textContent=`${Object.values(Save.data.stars).reduce((a,b)=>a+b,0)} ★`;
    this.qs("#levelCoinsTotal").textContent=`${Save.data.coins} coins`;
  },
  refreshMenu(){this.refreshHUD()},
  renderLevels(){
    this.refreshHUD();
    const grid=this.qs("#levelGrid");grid.innerHTML="";
    LEVELS.forEach(l=>{
      const open=l.id<=Save.data.unlockedLevels, done=!!Save.data.completedLevels[l.id], stars=Save.data.stars[l.id]||0;
      const b=document.createElement("button");b.className=`level-card ${open?"open":"locked"} ${done?"done":""}`;
      b.innerHTML=`<div class="level-no">${l.id}</div><div class="level-lock">${open?(done?"✓":""):"🔒"}</div><div class="stars">${"★".repeat(stars)}${"☆".repeat(3-stars)}</div><div class="level-reward">Reward · ${l.reward} coins</div>`;
      b.disabled=!open;b.addEventListener("click",()=>Game.startLevel(l.id));grid.appendChild(b)
    })
  },
  renderShop(){
    this.refreshHUD();
    const items=[
      {type:"snake",id:"mint",name:"Mint Coil",icon:"🐍",cost:0,desc:"Your starter garden friend."},
      {type:"snake",id:"sunset",name:"Sunset Coil",icon:"🟠",cost:80,desc:"Warm orange cosmetic skin."},
      {type:"snake",id:"berry",name:"Berry Coil",icon:"🟣",cost:120,desc:"A rich berry-colored trail."},
      {type:"snake",id:"leaf",name:"Leaf Coil",icon:"🌿",cost:160,desc:"A fresh woodland look."},
      {type:"grove",id:"meadow",name:"Meadow",icon:"🌱",cost:0,desc:"The classic green grove."},
      {type:"grove",id:"sunny",name:"Sunny Glade",icon:"☀",cost:110,desc:"A bright golden garden."},
      {type:"trail",id:"plain",name:"Soft Trail",icon:"✦",cost:0,desc:"A gentle movement sparkle."},
      {type:"trail",id:"stars",name:"Star Trail",icon:"✧",cost:140,desc:"Leaves tiny stars behind."}
    ];
    const grid=this.qs("#shopGrid");grid.innerHTML="";
    items.forEach(x=>{
      const owned=Save.owns(x.type,x.id), eq=Save.data.equipped[x.type]===x.id;
      const b=document.createElement("div");b.className="shop-item";
      b.innerHTML=`<div class="cosmetic-art">${x.icon}</div><h3>${x.name}</h3><p>${x.desc}</p><button class="buy-btn ${owned?"owned":""}">${eq?"EQUIPPED":owned?"OWNED":"● "+x.cost}</button>`;
      b.querySelector("button").addEventListener("click",()=>{
        if(owned){Save.equip(x.type,x.id);UI.toast("Equipped "+x.name);UI.renderShop();return}
        if(Save.buy(x.type,x.id,x.cost)){AudioFX.reward();UI.toast("Unlocked "+x.name);UI.renderShop()}else UI.toast("Not enough coins");
      });grid.appendChild(b)
    })
  },
  renderInventory(){
    const all=[
      {type:"snake",id:"mint",name:"Mint Coil",icon:"🐍"},{type:"snake",id:"sunset",name:"Sunset Coil",icon:"🟠"},{type:"snake",id:"berry",name:"Berry Coil",icon:"🟣"},{type:"snake",id:"leaf",name:"Leaf Coil",icon:"🌿"},
      {type:"grove",id:"meadow",name:"Meadow",icon:"🌱"},{type:"grove",id:"sunny",name:"Sunny Glade",icon:"☀"},{type:"trail",id:"plain",name:"Soft Trail",icon:"✦"},{type:"trail",id:"stars",name:"Star Trail",icon:"✧"}
    ];
    const grid=this.qs("#inventoryGrid");grid.innerHTML="";
    all.forEach(x=>{const owned=Save.owns(x.type,x.id),eq=Save.data.equipped[x.type]===x.id;const b=document.createElement("div");b.className="inventory-item "+(eq?"selected":"");
      b.innerHTML=`<div class="cosmetic-art">${owned?x.icon:"🔒"}</div><b>${x.name}</b><button class="equip-btn ${eq?"active":""}" ${owned?"":"disabled"}>${eq?"EQUIPPED":owned?"EQUIP":"LOCKED"}</button>`;
      if(owned)b.querySelector("button").onclick=()=>{Save.equip(x.type,x.id);UI.renderInventory();UI.toast("Equipped "+x.name)};
      grid.appendChild(b)
    })
  },
  renderAchievements(){
    const doneCount=Object.keys(Save.data.completedLevels).length, stars=Object.values(Save.data.stars).reduce((a,b)=>a+b,0), coins=Save.data.coins;
    const list=[
      ["first","First Steps","Complete 1 level",doneCount,1,"★"],["ten","Garden Walker","Complete 10 levels",doneCount,10,"✦"],["twenty","Pathfinder","Complete 20 levels",doneCount,20,"◆"],
      ["stars10","Star Collector","Earn 10 stars",stars,10,"✦"],["stars30","Star Keeper","Earn 30 stars",stars,30,"★"],["coins100","Pocket Change","Earn 100 coins",coins,100,"●"],
      ["clean","Clean Run","Complete a level without undo",Save.data.achievements.clean?1:0,1,"✓"],["streak5","Five in a Row","Complete 5 levels",doneCount,5,"☘"]
    ];
    const el=this.qs("#achievementList");el.innerHTML="";
    list.forEach(a=>{const ok=a[3]>=a[4];const b=document.createElement("div");b.className="achievement "+(ok?"done":"");b.innerHTML=`<div class="badge">${ok?a[5]:"?"}</div><div><h3>${a[1]}</h3><p>${a[2]}</p></div><div class="progress-mini">${Math.min(a[3],a[4])}/${a[4]}</div>`;el.appendChild(b)})
  },
  renderSettings(){
    this.qs("#soundToggle").checked=Save.data.settings.sound;this.qs("#musicToggle").checked=Save.data.settings.music;this.qs("#vibrationToggle").checked=Save.data.settings.vibration;this.qs("#qualitySelect").value=Save.data.settings.quality
  },
  openDaily(){this.renderDaily();this.qs("#dailyModal").classList.remove("hidden")},
  renderDaily(){
    const d=Save.data.daily, today=new Date().toISOString().slice(0,10), claimed=d.lastClaim===today;
    const rewards=[["●","25 coins"],["✦","+1 energy"],["●","40 coins"],["?","+3 hints"],["◇","Leaf skin"],["●","60 coins"],["★","100 coins"]];
    const grid=this.qs("#dailyGrid");grid.innerHTML="";
    rewards.forEach((r,i)=>{const day=((d.streak||0)%7)+1;const claimedDay=claimed&&i===day-1;const div=document.createElement("div");div.className="daily-item "+(i===day-1&&!claimed?"current ":"")+(claimedDay?"claimed":"");div.innerHTML=`<b>DAY ${i+1}</b><span>${r[0]}</span><small>${r[1]}</small>`;grid.appendChild(div)});
    this.qs("#claimDaily").disabled=claimed;this.qs("#claimDaily").textContent=claimed?"CLAIMED TODAY":"CLAIM TODAY";
  },
  claimDaily(){
    const d=Save.data.daily,today=new Date().toISOString().slice(0,10);
    if(d.lastClaim===today){this.toast("Already claimed today");return}
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    d.streak=d.lastClaim===yesterday?((d.streak||0)+1)%7:0;d.lastClaim=today;
    const day=d.streak, rewards=[25,1,40,3,0,60,100];
    if(day===4&&!Save.owns("snake","leaf"))Save.data.inventory.snake.push("leaf");
    if(rewards[day]){if([0,2,5,6].includes(day))Save.addCoins(rewards[day]);else Save.data.energy=Math.min(Save.data.energyMax,Save.data.energy+rewards[day]);}
    Save.save();AudioFX.reward();AudioFX.vibration(25);this.renderDaily();this.refreshHUD();this.toast("Daily reward claimed!");
  }
};