import assert from 'node:assert/strict'
import {expect} from '@playwright/test'
import type {} from './fixtures/world-fixture-types.d.mts'
import {readPose,readFrames,attribute} from './world-browser-state.mts'
import type {BrowserCase} from './world-browser-state.mts'
import type {Pose} from '../src/world-types.mjs'
export async function checkSources({page}:BrowserCase,stopped:Pose){
 const pose=()=>readPose(page)
  // Input updates retain camera, exact identity, no executable markup, and a bounded visible label set.
  await page.evaluate(()=>{window.savedCanvas=document.querySelector('canvas');window.savedLabel=document.querySelector('.world-name');window.savedUploads=document.querySelector<HTMLElement>('.mind-world')!.dataset.uploads})
  await page.evaluate(()=>{window.objects[0].title='<img src=x onerror=alert(1)>';window.world.update(window.objects)})
  await expect(page.locator('.world-name').first()).toContainText('<img src=x onerror=alert(1)>');assert.equal(await page.locator('.mind-world img').count(),0);assert.deepEqual(await pose(),stopped)
  assert(await page.evaluate(()=>window.savedCanvas===document.querySelector('canvas')&&window.savedLabel===document.querySelector('.world-name')&&window.savedUploads===document.querySelector<HTMLElement>('.mind-world')!.dataset.uploads),'text-only updates retain DOM/GPU geometry')
  await expect(page.locator('.world-updates summary')).toContainText('1')
  await page.evaluate(()=>{for(let i=0;i<30;i++)window.world.update(window.objects)})
  assert.equal(await page.locator('.world-updates [data-change-id]').count(),1)
  await page.evaluate(()=>window.world.update(Array.from({length:512},(_,i)=>({id:'item:'+i,title:'Record '+i,kind:'record'}))))
  await expect(page.locator('.mind-world')).toHaveAttribute('data-objects','512');assert((await page.locator('.world-name:visible').count())<=8)
  await expect(page.locator('.mind-world')).toHaveAttribute('data-animated-npcs','0')
  const rejection=await page.evaluate(()=>{try{window.world.update(Array.from({length:513},(_,i)=>({id:''+i,title:'Record'})))}catch(error){return error instanceof Error?error.message:String(error)}});assert.equal(rejection,'WorldCapacityExceeded');assert.equal(await page.locator('.world-name').count(),512)
  await page.evaluate(()=>window.world.update(window.objects));await page.getByRole('button',{name:'View all',exact:true}).click()
  // Loss/restore must keep the exact source data and expose a typed failure.
  await page.evaluate(()=>{const canvas=document.querySelector('canvas');if(!canvas)throw Error('Missing canvas');const loss=canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');if(!loss)throw Error('Missing loss extension');window.gpuLoss=loss;window.gpuLoss.loseContext()})
  await expect(page.getByRole('alert')).toContainText('WorldGraphicsContextLost')
  await page.evaluate(()=>window.gpuLoss.restoreContext());await expect(page.locator('.mind-world')).toHaveAttribute('data-gpu','ready');await expect(page.getByRole('alert')).toBeHidden()
  // Same source, different local pattern: grouping never invokes a product operation.
  await page.evaluate(()=>window.world.update([{id:'person',title:'Person',kind:'character'},...Array.from({length:30},(_,i)=>({id:'record:'+i,title:'Record '+i,kind:'record',group:{kind:'structural',ref:'group:declared'},semanticRef:'meaning:'+i%2,sourceRefs:[{owner:'owner:'+i%3}]}))]))
  const activations=await page.evaluate(()=>window.activations.slice())
  await page.locator('.world-nearby summary').click();await page.getByLabel('Spatial layout',{exact:true}).selectOption('constellation')
  await expect(page.locator('.mind-world')).toHaveAttribute('data-pattern','constellation');await expect(page.locator('.world-name')).toHaveCount(2)
  await expect(page.locator('.mind-world')).toHaveAttribute('data-source-objects','31')
  await page.getByRole('button',{name:'Browse shelf group:declared',exact:true}).click()
  await expect(page.locator('.world-name')).toHaveCount(24)
  await page.locator('.world-nearby summary').click();await page.getByRole('button',{name:'Next objects',exact:true}).click()
  await expect(page.locator('.world-name')).toHaveCount(7)
  assert.deepEqual(await page.locator('.world-name').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.worldId)),Array.from({length:7},(_,i)=>'record:'+(i+23)))
  await page.getByRole('button',{name:'Find Record 29',exact:true}).click();await expect.poll(async()=>(await pose()).y).toBeGreaterThan(1.85)
  await page.locator('[data-world-id="record:29"]').click();assert.deepEqual(await page.evaluate(()=>window.activations),[...activations,'record:29'])
  await page.getByRole('button',{name:'Return to all shelves',exact:true}).click()
  await page.locator('.world-nearby summary').click();await page.getByLabel('Group by',{exact:true}).selectOption('meaning');await expect(page.locator('.world-name')).toHaveCount(3)
  await page.getByLabel('Group by',{exact:true}).selectOption('source');await expect(page.locator('.world-name')).toHaveCount(4)
  await page.getByLabel('Spatial layout',{exact:true}).selectOption('ground');await expect(page.locator('.world-name')).toHaveCount(31)
  assert.deepEqual(await page.evaluate(()=>window.activations),[...activations,'record:29'])
}
