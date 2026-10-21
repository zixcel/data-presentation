import assert from 'node:assert/strict'
import {expect} from '@playwright/test'
import type {} from './fixtures/world-fixture-types.d.mts'
import {readPose,readFrames,attribute} from './world-browser-state.mts'
import type {BrowserCase} from './world-browser-state.mts'
export async function checkNavigation({page,context,width,height,reducedMotion}:BrowserCase){
  await expect(page.locator('.mind-world')).toHaveAttribute('data-objects','4')
  const pose=()=>readPose(page)
  const frames=()=>readFrames(page)
  await expect.poll(frames).toBeGreaterThan(0)
  assert.equal(await page.locator('.world-name').count(),4);assert.equal(await page.locator('[data-world-id="role:offline"]').isEnabled(),false)
  const pixels=Number(await page.locator('.mind-world').getAttribute('data-buffer-pixels'));assert(pixels<=1440000)
  // Inspect actual renderer draw calls without capturing or reading any image.
  const stats=JSON.parse(await attribute(page,'data-render-stats')) as {calls:number;triangles:number;geometries:number;textures:number}
  assert.equal(stats.calls,1);assert(stats.triangles>0);assert.equal(stats.geometries,1);assert.equal(stats.textures,0)
  await expect(page.locator('.mind-world')).toHaveAttribute('data-renderer','three')
  await expect(page.locator('.mind-world')).toHaveAttribute('data-navigation','overview')
  const overviewPose=await pose()
  await page.setViewportSize({width:width===1280?900:420,height})
  await expect(page.locator('.mind-world')).toHaveAttribute('data-buffer-pixels',String((width===1280?900:420)*height))
  const resizedPose=await pose()
  await page.evaluate(()=>window.world.change('in'));await expect.poll(async()=>(await pose()).z).toBeLessThan(resizedPose.z)
  await page.setViewportSize({width,height});await expect(page.locator('.mind-world')).toHaveAttribute('data-buffer-pixels',String(width*height))
  await page.evaluate(()=>window.world.change('in'));await expect.poll(async()=>(await pose()).z).toBeLessThan(overviewPose.z)
  await page.evaluate(()=>window.world.change('out'));await expect.poll(async()=>Math.abs((await pose()).z-overviewPose.z)).toBeLessThan(.001)
  if(width<600){
   const cdp=await context.newCDPSession(page),touches=(gap:number)=>[{x:width/2-gap,y:height*.6,id:1},{x:width/2+gap,y:height*.6,id:2}]
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(25)})
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(55)})
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
   await expect.poll(async()=>(await pose()).z).toBeLessThan(overviewPose.z)
   assert.deepEqual(await page.evaluate(()=>window.activations),[],'pinching never activates an object')
   await cdp.detach()
  }
  // Map is a second projection over exact source IDs, not a second entity store.
  const map=page.locator('.world-map');await map.locator('summary').click()
  await map.locator('[data-map-id="role:guide"]').click()
  await expect(page.locator('.mind-world')).toHaveAttribute('data-selected-id','role:guide')
  await expect(page.locator('[data-world-id="role:guide"]')).toHaveAttribute('data-selected','true')
  await map.getByRole('button',{name:'Mark selected',exact:true}).click()
  await expect(page.locator('.mind-world')).toHaveAttribute('data-marked-id','role:guide')
  await expect(map.locator('[data-map-id="role:guide"]')).toHaveAttribute('data-marked','true')
  await map.locator('summary').click();await page.getByRole('button',{name:'View all',exact:true}).click()
  const explore=async()=>{await page.locator('.world-nearby summary').click();await page.getByLabel('Navigation',{exact:true}).selectOption('explore');await page.locator('.world-nearby summary').click();await expect(page.locator('.mind-world')).toHaveAttribute('data-navigation','explore')}
  await explore()
  await expect(page.locator('.mind-world')).toHaveAttribute('data-camera-mode','third-person')
  await expect(page.locator('.mind-world')).toHaveAttribute('data-avatar','present')
  const hold=async(code:string,check:()=>Promise<void>)=>{await page.locator('canvas').focus();await page.keyboard.down(code);try{await check()}finally{await page.keyboard.up(code)}}
  const initial=await pose();await hold('KeyW',()=>expect.poll(async()=>(await pose()).z).toBeLessThan(initial.z))
  await hold('KeyR',()=>expect.poll(async()=>(await pose()).y).toBeGreaterThan(initial.y))
  const raised=await pose();await hold('KeyF',()=>expect.poll(async()=>(await pose()).y).toBeLessThan(raised.y))
  const beforeRise=await pose();await page.getByRole('button',{name:'Walk rise',exact:true}).focus();await page.keyboard.press('Enter');await expect.poll(async()=>(await pose()).y).toBeGreaterThan(beforeRise.y)
  const beforeLook=await pose();await page.mouse.move(width*.6,height*.6);await page.mouse.down();await page.mouse.move(width*.6+60,height*.6);await page.mouse.up();await expect.poll(async()=>(await pose()).yaw).not.toBe(beforeLook.yaw)
  await page.getByRole('button',{name:'View all',exact:true}).click();await expect(page.locator('.mind-world')).toHaveAttribute('data-navigation','overview');await explore()
  await page.getByText('In this space · 4',{exact:true}).click();await page.getByRole('button',{name:'Find Guide',exact:true}).click();await expect.poll(async()=>(await pose()).x).toBe(-5.1)
  await page.locator('[data-world-id="role:guide"]').click();const bubble=page.getByRole('dialog',{name:'Conversation with Guide',exact:true});await expect(bubble).toContainText('Published state for role:guide')
  assert.deepEqual(await page.evaluate(()=>window.activations),[],'looking at a conversation is not execution')
  const box=await bubble.boundingBox();assert.ok(box);assert(box.width<=320&&box.x>=0&&box.x+box.width<=width&&box.y+box.height<=height)
  await bubble.getByRole('button',{name:'Review role',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.activations),['role:guide'])
  const before=await pose()
  // Actual touch/pointer input on the mobile control, including release outside its bounds.
  await page.getByRole('button',{name:'Walk forward',exact:true}).hover();await page.mouse.down();await page.waitForTimeout(160);await page.mouse.move(width-5,10);await page.mouse.up()
  await page.waitForTimeout(150);const stopped=await pose(),stableFrames=await frames();await page.waitForTimeout(300);const ambientFrames=(await frames())-stableFrames;assert.deepEqual(await pose(),stopped);assert(ambientFrames<4,'ambient NPC motion is capped');if(reducedMotion==='reduce')assert.equal(ambientFrames,0,'reduced motion stops ambient frames');assert(stopped.z<before.z)
 return {pixels,stats,ambientFrames,stopped}
}
