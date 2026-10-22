let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright'));}
const assert=require('node:assert/strict');
const BASE=process.env.NEON_TEST_URL||'http://127.0.0.1:3100';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const go=async name=>{await page.locator(`nav [data-page="${name}"]`).click();await page.waitForFunction(n=>document.body.dataset.page===n,name);};
  const frame=()=>page.evaluate(()=>{const main=document.querySelector('#main'),top=document.querySelector('.topbar').getBoundingClientRect(),nav=document.querySelector('.sidebar').getBoundingClientRect();return{x:scrollX,y:scrollY,mainX:main.scrollLeft,mainY:main.scrollTop,top:top.top,nav:nav.top,rootWidth:document.documentElement.scrollWidth,rootHeight:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight};});
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:1000}]){
   await page.setViewportSize(viewport);
   for(const name of ['home','summon','collection','raid','arcade','missions']){
    await go(name);const before=await frame();
    const box=await page.locator('#main').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+Math.min(150,box.height/2));
    await page.mouse.wheel(500,2000);await page.waitForTimeout(70);
    const after=await frame();assert.equal(after.x,0);assert.equal(after.y,0);assert.equal(after.mainX,0);
    assert.equal(after.top,before.top);assert.equal(after.nav,before.nav);
    assert(after.rootWidth<=after.width+1);assert(after.rootHeight<=after.height+1);
    if(name==='home')assert.equal(after.mainY,0);
   }
  }
  console.log('PASS every screen keeps the outer frame fixed in portrait, landscape and desktop sizes');
  await page.setViewportSize({width:390,height:844});await go('collection');
  await page.mouse.move(180,400);await page.mouse.wheel(0,2200);await page.waitForTimeout(150);
  assert((await frame()).mainY>0);
  const last=page.locator('.unit-grid .unit-card').last();await last.scrollIntoViewIfNeeded();await last.click();
  assert(await page.locator('#modal').isVisible());await page.locator('.modal-close').click();
  assert((await frame()).mainY>0);await go('missions');assert.equal((await frame()).mainY,0);
  console.log('PASS long lists scroll internally, the last character is reachable, and navigation resets only content');
  await go('collection');await page.locator('.unit-grid [data-id="r-01"]').click();await page.locator('[data-tab="growth"]').click();
  const mainBefore=(await frame()).mainY;await page.mouse.move(180,680);await page.mouse.wheel(0,2000);await page.waitForTimeout(150);
  assert((await page.locator('#modal').evaluate(el=>el.scrollTop))>0);
  const close=await page.locator('.modal-close').boundingBox(),modal=await page.locator('#modal').boundingBox();
  assert(close.y>=modal.y&&close.y+close.height<modal.y+modal.height);
  await page.mouse.wheel(0,2000);await page.waitForTimeout(100);assert.equal((await frame()).mainY,mainBefore);
  await page.locator('.modal-close').click();
  console.log('PASS dialogs scroll without moving their background and keep the close control visible');
  const cdp=await context.newCDPSession(page);
  const swipe=async(x,y,endY)=>{
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(endY-y)*i/8}]});await page.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
  };
  await go('collection');await swipe(170,620,270);assert((await frame()).mainY>50);
  await page.evaluate(()=>{const main=document.querySelector('#main');main.scrollTop=main.scrollHeight;});
  await swipe(170,620,270);assert.equal((await frame()).y,0);
  await go('home');await swipe(180,400,650);assert.equal((await frame()).mainY,0);assert.equal((await frame()).y,0);
  await go('collection');
  const scale=await page.evaluate(()=>visualViewport.scale);
  await cdp.send('Input.synthesizePinchGesture',{x:195,y:440,scaleFactor:2,relativeSpeed:600,gestureSourceType:'touch'});
  await page.touchscreen.tap(25,340);await page.waitForTimeout(70);await page.touchscreen.tap(25,340);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>visualViewport.scale),scale);
  const events=await page.evaluate(()=>{
   const gesture=new Event('gesturechange',{bubbles:true,cancelable:true});document.dispatchEvent(gesture);
   const wheel=new WheelEvent('wheel',{ctrlKey:true,deltaY:-80,bubbles:true,cancelable:true});document.dispatchEvent(wheel);
   return {gesture:gesture.defaultPrevented,wheel:wheel.defaultPrevented};
  });assert(events.gesture&&events.wheel);
  await go('home');await page.locator('[data-action="pet"]').tap();await page.locator('[data-action="pet"]').tap();assert(await page.locator('.character-speech').isVisible());
  assert.equal(await page.evaluate(()=>visualViewport.scale),scale);
  assert.deepEqual(errors,[]);
  console.log('PASS touch scrolling remains usable; edge drags, pinch/double-tap zoom and trackpad zoom are suppressed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
