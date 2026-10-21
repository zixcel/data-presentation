import assert from 'node:assert/strict'
import {expect} from '@playwright/test'
import type {} from './fixtures/world-fixture-types.d.mts'
import type {BrowserCase} from './world-browser-state.mts'
export async function checkResourceBoundaries({page}:BrowserCase){
 const result=await page.evaluate(()=>{
  const host=document.getElementById('stage')!,before=document.querySelectorAll('canvas').length,failures:string[]=[]
  for(const options of [{objects:Array.from({length:513},(_,i)=>({id:String(i)}))},{activityPresentation:{createView(){throw Error('Synthetic presentation setup failure')}}}]){
   try{window.makeWorld(host,options)}catch(error){failures.push(error instanceof Error?error.message:String(error))}
   if(document.querySelectorAll('canvas').length!==before)throw Error('Failed setup retained a canvas')
  }
  const activity:{cycle?:unknown}={};activity.cycle=activity;window.world.activity(activity)
  return {failures,privateStateEscaped:'gpu' in window.world||'host' in window.world||'model' in window.world,frozen:Object.isFrozen(window.world)}
 })
 assert.deepEqual(result.failures,['WorldCapacityExceeded','Synthetic presentation setup failure']);assert.equal(result.privateStateEscaped,false);assert.equal(result.frozen,true)
 await expect(page.locator('.mind-world')).toHaveAttribute('data-gpu','ready')
}
export async function checkParkedView({page}:BrowserCase){
 const before=await page.evaluate(()=>{
  const wrapper=document.querySelector<HTMLElement>('.mind-world');if(!wrapper)throw Error('Missing active world')
  window.parkedWrap=wrapper;const frames=wrapper.dataset.frames
  window.lease.release();window.dispatchEvent(new PageTransitionEvent('pageshow'));return frames
 })
 await page.waitForTimeout(350)
 assert.equal(await page.evaluate(()=>window.parkedWrap.dataset.frames),before,'parked views cannot resume their render loop on page restore')
 await page.evaluate(()=>{window.lease=window.surface.attach(document.getElementById('stage')!,window.activityOptions);window.world=window.lease.world})
 await expect(page.locator('.mind-world')).toHaveAttribute('data-gpu','ready')
}
