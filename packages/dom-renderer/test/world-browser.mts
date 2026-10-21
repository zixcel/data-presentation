// Real hosted WebGL/DOM acceptance; all fixture data is synthetic.
import assert from 'node:assert/strict'
import {expect} from '@playwright/test'
import {withWorldBrowser} from './world-browser-harness.mts'
import {checkNavigation} from './world-navigation-browser.mts'
import {checkSources} from './world-source-browser.mts'
import {checkResourceBoundaries} from './world-resource-browser.mts'
import {checkSurface} from './world-surface-browser.mts'
import type {BrowserCase} from './world-browser-state.mts'
await withWorldBrowser(async(browser,url)=>{
 const rows=[]
 for(const [width,height,reducedMotion]of [[1280,800,'no-preference'],[390,844,'reduce']] as const){
  const context=await browser.newContext({viewport:{width,height},reducedMotion,hasTouch:width<600})
  let failed=false,primary:unknown
  try{
   const page=await context.newPage(),errors:string[]=[];page.setDefaultTimeout(6000)
   page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(['error','warning'].includes(message.type()))errors.push(message.text())})
   await page.goto(url);await expect(page.locator('.mind-world')).toHaveAttribute('data-gpu','ready')
   const input:BrowserCase={page,context,width,height,reducedMotion},result=await checkNavigation(input)
   await checkSources(input,result.stopped);await checkResourceBoundaries(input);await checkSurface(input)
   assert.deepEqual(errors,[]);rows.push({width,height,reducedMotion,pixels:result.pixels,stats:result.stats,errors,ambientFrames:result.ambientFrames,exactActivation:true,verticalMovement:true,conversation:true,screenshots:0,maxObjects:512,contextRecovery:true,disposeCycles:20})
  }catch(error){failed=true;primary=error}
  try{await context.close()}catch(cleanup){if(failed)throw new AggregateError([primary,cleanup],'Browser case and cleanup failed');throw cleanup}
  if(failed)throw primary
 }
 console.log(JSON.stringify({status:'PASS',rows}))
})
