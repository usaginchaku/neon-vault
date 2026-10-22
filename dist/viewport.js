// Safari can ignore viewport scale limits. Keep gestures inside the active panel.
const cancel=event=>{if(event.cancelable)event.preventDefault();};
let lastTouch=null;
document.addEventListener('touchstart',event=>{
 if(event.touches.length!==1){lastTouch=null;cancel(event);return;}
 const touch=event.touches[0];
 lastTouch={x:touch.clientX,y:touch.clientY};
},{passive:false});
document.addEventListener('touchmove',event=>{
 if(event.touches.length!==1){lastTouch=null;cancel(event);return;}
 const touch=event.touches[0];
 if(!lastTouch){lastTouch={x:touch.clientX,y:touch.clientY};return;}
 const dx=touch.clientX-lastTouch.x,dy=touch.clientY-lastTouch.y;
 if(Math.max(Math.abs(dx),Math.abs(dy))<4)return;
 lastTouch={x:touch.clientX,y:touch.clientY};
 const panel=event.target.closest?.('#modal, #main');
 const modal=document.querySelector('#modal');
 const blocked=!panel||(modal?.open&&panel!==modal)||getComputedStyle(panel).overflowY!=='auto';
 if(blocked||Math.abs(dx)>Math.abs(dy)||panel.scrollHeight<=panel.clientHeight+1||
    (dy>0&&panel.scrollTop<=0)||(dy<0&&panel.scrollTop+panel.clientHeight>=panel.scrollHeight-1))cancel(event);
},{passive:false});
for(const name of ['touchend','touchcancel'])document.addEventListener(name,()=>{lastTouch=null;},{passive:true});
for(const name of ['gesturestart','gesturechange','gestureend'])document.addEventListener(name,cancel,{passive:false});
// Cancel only the zoom default; ordinary click handlers still receive both taps.
document.addEventListener('dblclick',cancel);
document.addEventListener('wheel',event=>{if(event.ctrlKey)cancel(event);},{passive:false});
