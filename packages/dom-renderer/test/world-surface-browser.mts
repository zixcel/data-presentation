import {checkParkedView} from './world-resource-browser.mts'
import assert from 'node:assert/strict'
import {expect} from '@playwright/test'
import type {} from './fixtures/world-fixture-types.d.mts'
import {readPose,readFrames,attribute} from './world-browser-state.mts'
import type {BrowserCase} from './world-browser-state.mts'
export async function checkSurface(input:BrowserCase){
 const {page}=input
 const frames=()=>readFrames(page),pose=()=>readPose(page)
  // One app-owned GPU across target changes, stale releases and 100 content updates.
  await page.evaluate(()=>{
   window.world.close();window.surface=window.makeSurface();const host=document.getElementById('stage')!
   const options=(target:string)=>({target,objects:[{id:'record',kind:'record',title:'Initial value'}],onActivate:(id:string)=>window.activations.push(target+':'+id)})
   const old=window.surface.attach(host,options('old'));window.sharedCanvas=document.querySelector('canvas')
   window.lease=window.surface.attach(host,options('current'));old.release();window.world=window.lease.world
   window.sharedLabel=document.querySelector('.world-name')
  })
  await expect(page.locator('.mind-world')).toHaveAttribute('data-initializations','1')
  const uploads=await page.locator('.mind-world').getAttribute('data-uploads')
  await page.evaluate(()=>{for(let i=0;i<100;i++)window.world.update([{id:'record',kind:'record',title:'Value '+i}])})
  await expect(page.locator('.world-name strong')).toHaveText('Value 99')
  assert(await page.evaluate(()=>window.sharedCanvas===document.querySelector('canvas')&&window.sharedLabel===document.querySelector('.world-name')))
  assert.equal(await page.locator('.mind-world').getAttribute('data-uploads'),uploads)
  assert.equal(await page.locator('.world-updates [data-change-id]').count(),1)
  await page.locator('.world-name').click();assert.equal((await page.evaluate(()=>window.activations)).at(-1),'current:record')
  // Work state remains an owner observation. Bounded ambient NPC motion is not
  // token progress; a lost observation must remove the activity claim.
  assert.equal(await page.locator('.world-engine').count(),0,'generic renderer does not own work activity presentation')
  await page.evaluate(()=>{
   window.world.close();window.surface.close()
   // A host-owned fixture exercises the adapter contract, not delivery policy.
   window.surface=window.makeSurface({
    createView(document,host){
     const panel=document.createElement('details'),title=document.createElement('summary')
     panel.className='world-engine';panel.append(title);host.append(panel)
     return {panel,update(value){title.textContent=(value!==null&&typeof value==='object'&&'available' in value&&value.available)?'Host activity available':'Host activity unavailable'}}
    }
   })
   window.workActivity={available:true,counts:{Runnable:0,Blocked:0,Running:1,Completed:0,Failed:0,Cancelled:0},roles:[{roleRef:{id:'guide'},kind:'inference',state:'Running'}],driverPhase:'dispatching'}
   window.activityOptions={target:'activity',pattern:'garden',objects:[{id:'guide',kind:'character',title:'Guide'},{id:'text',kind:'record',title:'Note',scalars:['hello']}],onActivate:()=>{},activity:window.workActivity}
   window.lease=window.surface.attach(document.getElementById('stage')!,window.activityOptions);window.world=window.lease.world
  })
  await expect(page.locator('.world-engine summary')).toHaveText('Host activity available')
  await expect(page.locator('[data-world-id=guide]')).toHaveAttribute('data-activity','AwaitingResult')
  await page.waitForTimeout(100);const activeFrames=await frames();await page.waitForTimeout(180);assert((await frames())-activeFrames<3)
  assert.equal(await page.locator('[data-world-id=guide]').evaluate(n=>getComputedStyle(n,'::before').animationName),'none','a reservation never animates as proven model progress')
  await page.locator('.world-nearby summary').click();const oldPosition=await page.locator('[data-world-id=guide]').getAttribute('data-position')
  await page.getByLabel('Object spacing',{exact:true}).selectOption('spacious');assert.notEqual(await page.locator('[data-world-id=guide]').getAttribute('data-position'),oldPosition)
  await page.evaluate(()=>{window.lease=window.surface.attach(document.getElementById('stage')!,{...window.activityOptions,activity:{available:false}});window.world=window.lease.world})
  await expect(page.locator('.world-engine summary')).toHaveText('Host activity unavailable')
  await expect(page.locator('[data-world-id=guide]')).toHaveAttribute('data-activity','Unavailable')
  await checkParkedView(input)
  await page.evaluate(()=>{window.lease=window.surface.attach(document.getElementById('stage')!,{target:'late-arrival',pattern:'garden',objects:[]});window.world=window.lease.world})
  await expect(page.locator('.mind-world')).toHaveAttribute('data-objects','0')
  await page.evaluate(()=>window.world.update([{id:'arrived',kind:'character',title:'Arrived'}]))
  const arrivedX=JSON.parse((await page.locator('[data-world-id=arrived]').getAttribute('data-position'))!)[0]
  await expect.poll(async()=>(await pose()).x).toBe(arrivedX)
  await expect(page.locator('[data-world-id=arrived]')).toBeVisible()
  const arrivedPose=await pose()
  await page.evaluate(()=>{window.world.update([]);window.world.update([{id:'arrived',kind:'character',title:'Arrived'}])})
  await expect(page.locator('[data-world-id=arrived]')).toBeVisible();assert.deepEqual(await pose(),arrivedPose)
  await page.evaluate(()=>{window.lease.release();window.surface.close();window.surface.close();window.openWorld()})
  for(let i=0;i<20;i++)await page.evaluate(()=>{window.world.close();window.openWorld()})
  await expect(page.locator('canvas')).toHaveCount(1);await expect(page.locator('.mind-world')).toHaveAttribute('data-gpu','ready')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight))
  await page.evaluate(()=>window.world.close());assert.equal(await page.locator('canvas').count(),0)
}
