window.AudioFX=(function(){
  let ctx=null, musicTimer=null;
  function get(){if(!ctx)try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){} return ctx}
  function beep(freq=440,dur=.06,type="sine",gain=.035){
    if(!Save.data?.settings.sound)return;
    const c=get();if(!c)return;
    try{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur)}catch(e){}
  }
  return {
    tap(){beep(520,.045,"square",.025)}, move(){beep(250,.035,"triangle",.02)}, collect(){beep(720,.09,"sine",.035)}, bad(){beep(120,.11,"sawtooth",.03)}, win(){beep(523,.08);setTimeout(()=>beep(659,.08),90);setTimeout(()=>beep(784,.14),180)}, reward(){beep(880,.08,"triangle",.035)},
    start(){const c=get();if(c&&c.state==="suspended")c.resume()},
    vibration(ms=12){if(Save.data?.settings.vibration&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}}
  }
})();