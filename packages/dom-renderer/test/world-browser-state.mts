import assert from 'node:assert/strict'
import type {Page,BrowserContext} from '@playwright/test'
import type {Pose} from '../src/world-types.mjs'
export interface BrowserCase {page:Page;context:BrowserContext;width:number;height:number;reducedMotion:'reduce'|'no-preference'}
export async function attribute(page:Page,name:string):Promise<string>{const value=await page.locator('.mind-world').getAttribute(name);assert.notEqual(value,null);return value!}
export async function readPose(page:Page):Promise<Pose>{
 const value:unknown=JSON.parse(await attribute(page,'data-pose'));assert.ok(value&&typeof value==='object')
 for(const key of ['x','y','z','yaw','pitch'])assert.ok(key in value&&typeof value[key as keyof typeof value]==='number'&&Number.isFinite(value[key as keyof typeof value]))
 return value as Pose
}
export const readFrames=async(page:Page)=>Number(await attribute(page,'data-frames'))
