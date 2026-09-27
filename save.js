window.DEFAULT_SAVE={
  version:1, energy:5, energyMax:5, energyUpdated:Date.now(), coins:0, hints:30,
  unlockedLevels:1, completedLevels:{}, stars:{}, bestMoves:{},
  inventory:{snake:["mint"],grove:["meadow"],trail:["plain"]},
  equipped:{snake:"mint",grove:"meadow",trail:"plain"},
  settings:{sound:true,music:true,vibration:true,quality:"high"},
  achievements:{}, daily:{lastClaim:"",streak:0}, firstLaunch:true
};
window.Save={
  key:"gardenCoilSave",
  data:null,
  clone(o){return JSON.parse(JSON.stringify(o))},
  load(){
    try{const raw=localStorage.getItem(this.key);this.data=raw?this.migrate(JSON.parse(raw)):this.clone(DEFAULT_SAVE)}
    catch(e){this.data=this.clone(DEFAULT_SAVE)}
    this.regenEnergy(); this.save(); return this.data;
  },
  migrate(d){
    const base=this.clone(DEFAULT_SAVE), merged={...base,...d};
    merged.settings={...base.settings,...(d.settings||{})};
    merged.inventory={...base.inventory,...(d.inventory||{})};
    merged.equipped={...base.equipped,...(d.equipped||{})};
    merged.version=1; return merged;
  },
  save(){try{localStorage.setItem(this.key,JSON.stringify(this.data))}catch(e){}},
  reset(){this.data=this.clone(DEFAULT_SAVE);this.save()},
  regenEnergy(){
    const d=this.data, now=Date.now(), max=d.energyMax;
    if(d.energy>=max){d.energyUpdated=now;return}
    const elapsed=Math.floor((now-d.energyUpdated)/60000);
    if(elapsed>0){d.energy=Math.min(max,d.energy+elapsed);d.energyUpdated+=elapsed*60000}
  },
  spendEnergy(){
    this.regenEnergy(); if(this.data.energy<=0)return false;
    this.data.energy--; this.data.energyUpdated=Date.now(); this.save(); return true;
  },
  addCoins(n){this.data.coins+=n;this.save()},
  addHints(n){this.data.hints=Math.max(0,this.data.hints+n);this.save()},
  setCompleted(id,stars,moves){
    this.data.completedLevels[id]=true;
    this.data.stars[id]=Math.max(this.data.stars[id]||0,stars);
    this.data.bestMoves[id]=Math.min(this.data.bestMoves[id]||Infinity,moves);
    this.data.unlockedLevels=Math.max(this.data.unlockedLevels,Math.min(LEVELS.length,id+1));
    this.save();
  },
  owns(type,id){return (this.data.inventory[type]||[]).includes(id)},
  buy(type,id,cost){
    if(this.owns(type,id))return true;
    if(this.data.coins<cost)return false;
    this.data.coins-=cost;(this.data.inventory[type]||(this.data.inventory[type]=[])).push(id);this.save();return true;
  },
  equip(type,id){if(this.owns(type,id)){this.data.equipped[type]=id;this.save();return true}return false}
};