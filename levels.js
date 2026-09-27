/* Deterministic, solvable level catalogue.
   Every level is generated from a safe route first, then obstacles are placed away from it. */
(function(){
  const W=9,H=10;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  const key=(x,y)=>x+","+y;
  function routeFor(n){
    let x=1,y=H-2, route=[[x,y]];
    const targetX=W-2,targetY=1;
    const turnCount=2+(n%4);
    let horizontalFirst=n%2===0;
    while(x!==targetX || y!==targetY){
      const choices=[];
      if(horizontalFirst && x!==targetX) choices.push([Math.sign(targetX-x),0]);
      if(!horizontalFirst && y!==targetY) choices.push([0,Math.sign(targetY-y)]);
      if(x!==targetX) choices.push([Math.sign(targetX-x),0]);
      if(y!==targetY) choices.push([0,Math.sign(targetY-y)]);
      const [dx,dy]=choices[(route.length+n)%Math.min(choices.length,turnCount)];
      x+=dx;y+=dy;
      if(x<1)x=1;if(x>W-2)x=W-2;if(y<1)y=1;if(y>H-2)y=H-2;
      route.push([x,y]);
    }
    // Add deterministic side-to-side detours on some levels while preserving a valid path.
    if(n>=5){
      const base=route.slice();
      const out=[];
      for(let i=0;i<base.length;i++){
        out.push(base[i]);
        if(i>1 && i<base.length-2 && i%(3+(n%3))===0){
          const [cx,cy]=base[i], next=base[i+1];
          const perp=next[0]!==cx?[0,1]:[1,0];
          const a=[cx+perp[0],cy+perp[1]], b=[cx-perp[0],cy-perp[1]];
          const candidate=(n+i)%2===0?a:b;
          if(candidate[0]>0&&candidate[0]<W-1&&candidate[1]>0&&candidate[1]<H-1){
            out.push(candidate);out.push(base[i]);
          }
        }
      }
      return out.filter((p,i,a)=>i===0||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
    }
    return route;
  }
  function makeLevel(n){
    const route=routeFor(n), routeSet=new Set(route.map(p=>key(...p)));
    const start=route[0], goal=route[route.length-1];
    const obstacles=[];
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
      const k=key(x,y);
      if(routeSet.has(k)) continue;
      if(((x*13+y*7+n*11)%17)<Math.min(2+(n%5),8)) obstacles.push([x,y]);
    }
    const collectibles=[];
    const count=n<4?0:Math.min(3,Math.floor((n+1)/6)+1);
    for(let i=1;i<=count;i++){
      const idx=Math.min(route.length-2,Math.max(1,Math.floor(route.length*i/(count+1))));
      const p=route[idx];
      if(!collectibles.some(q=>key(...q)===key(...p))) collectibles.push(p);
    }
    const par=route.length-1;
    const stars=par<=6?6:par<=9?8:par<=12?11:14;
    return {id:n,w:W,h:H,start,goal,obstacles,collectibles,par,star3:stars,star2:stars+3,reward:10+Math.floor(n/5)*5};
  }
  window.LEVELS=Array.from({length:36},(_,i)=>makeLevel(i+1));
})();