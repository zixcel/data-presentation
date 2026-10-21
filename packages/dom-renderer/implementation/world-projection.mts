import {record} from './world-api.mjs'
import type {WorldObject,WorldRelation,ActorRange} from './world-types.mjs'
import {layoutWorld} from './world-model.mjs'
import {worldGeometry} from './world-gpu.mjs'
import {spatialPattern} from './spatial-patterns.mjs'
import {objectForms} from './object-presentation.mjs'
import type {WorldContext} from './world-context.mjs'
export function filterDirectoryWorld(ctx:WorldContext):void{let count=0;const term=ctx.query.value.trim().toLocaleLowerCase();for(const row of ctx.directoryNodes.values()){row.hidden=!(row.textContent??'').toLocaleLowerCase().includes(term);if(!row.hidden)count++}ctx.noMatches.hidden=!term||count>0}
export function renderUpdatesWorld(ctx:WorldContext):void{
  const latest=[...ctx.recent.values()].at(-1)
  ctx.updatesTitle.textContent=latest?'Observed changes · '+ctx.recent.size+' · '+latest.title+' · '+latest.kind:'No changes observed in this view'
  ctx.updateList.replaceChildren()
  for(const [id,change]of [...ctx.recent].reverse()){
   const button=ctx.make('button','',change.title+' · '+change.kind);button.type='button';button.dataset.changeId=id
   button.disabled=!ctx.sourceObjects.some(item=>item.id===id);ctx.updateList.append(button)
  }
  for(const [id,node]of ctx.labelNodes)node.dataset.updated=String(ctx.recent.has(id))
 }
export function updateWorld(ctx:WorldContext,objects:WorldObject[],relations:WorldRelation[]=[]):void{
  if(ctx.closed)throw Error('WorldDisposed')
  ctx.engine.update(ctx.workActivity)
  const nextProjection=spatialPattern(objects,relations,ctx.view),next=layoutWorld(nextProjection.objects,nextProjection.relations,nextProjection.state.pattern,ctx.spacing)
  // Keep remembered positions for unchanged membership, even if producer ordering changes.
  if(ctx.placedSpacing===ctx.spacing&&(ctx.model.pattern??'ground')===(next.pattern??'ground')&&ctx.model.items.length===next.items.length&&ctx.model.items.every(item=>next.items.some(n=>n.id===item.id&&n.anchor===item.anchor&&n.plot===item.plot&&n.member===item.member))){
   const previous=new Map(ctx.model.items.map(item=>[item.id,item]))
   for(const item of next.items){const before=previous.get(item.id)!;item.x=before.x;item.y=before.y;item.z=before.z}
  }
  ctx.placedSpacing=ctx.spacing
  const key=JSON.stringify([next.pattern,next.items.map(i=>[i.id,i.kind,i.form,i.needsReview,i.x,i.y,i.z,i.selected,i.disabled,i.memberIds?.length]),next.relations.map(r=>[r.from,r.to,r.active])])
  const changedGeometry=key!==ctx.geometryKey,nextActors:ActorRange[]=changedGeometry?[]:ctx.actorRanges,nextGeometry=changedGeometry?worldGeometry(next,nextActors):ctx.geometry
  const before=new Map(ctx.sourceObjects.map(item=>[item.id,item]));let changed=false
  if(before.size){
   for(const item of objects){const previous=before.get(item.id)
    const kind=!previous?'Added to this view':previous.disabled!==item.disabled?'Availability changed':previous.title!==item.title||previous.summary!==item.summary||previous.changeKey!==item.changeKey?'Content changed':null
    if(kind){ctx.recent.delete(item.id);ctx.recent.set(item.id,{title:item.title??item.id,kind});changed=true}
   }
   const ids=new Set(objects.map(item=>item.id));for(const item of before.values())if(!ids.has(item.id)){ctx.recent.delete(item.id);ctx.recent.set(item.id,{title:item.title??item.id,kind:'No longer in this view'});changed=true}
   while(ctx.recent.size>5)ctx.recent.delete(ctx.recent.keys().next().value!)
  }
  ctx.sourceObjects=objects.map(item=>({...item}));ctx.sourceRelations=relations;ctx.projection=nextProjection;ctx.view=ctx.projection.state
  if(ctx.conversationId&&(changed||!objects.some(i=>i.id===ctx.conversationId)))ctx.closeConversation()
  ctx.model=next;ctx.geometry=nextGeometry;ctx.actorRanges=nextActors;ctx.geometryKey=key
  if(!ctx.fittedPopulation&&ctx.model.items.length){ctx.fittedPopulation=true;if(ctx.navigation==='overview')ctx.needsFit=true}
  const ids=new Set(ctx.model.items.map(item=>item.id))
  for(const [id,node]of ctx.labelNodes)if(!ids.has(id)){node.remove();ctx.labelNodes.delete(id);ctx.directoryNodes.get(id)?.remove();ctx.directoryNodes.delete(id)}
  ctx.patternSelect.value=ctx.view.pattern;ctx.groupSelect.value=ctx.view.groupBy;ctx.groupSelect.parentElement!.hidden=ctx.view.pattern==='ground'||ctx.view.pattern==='garden'
  ctx.patternSelect.parentElement!.hidden=ctx.pattern==='garden'
  ctx.breadcrumb.hidden=ctx.view.pattern==='ground'||ctx.view.pattern==='garden';ctx.back.hidden=!ctx.view.group;ctx.location.textContent=ctx.projection.label+' · '+ctx.projection.total+' objects'
  ctx.pagination.hidden=ctx.projection.pages===1;ctx.previous.disabled=ctx.view.page===0;ctx.nextPage.disabled=ctx.view.page===ctx.projection.pages-1;ctx.pageCount.textContent=(ctx.view.page+1)+' / '+ctx.projection.pages
  ctx.wrap.dataset.pattern=ctx.view.pattern;ctx.wrap.dataset.groupBy=ctx.view.groupBy;ctx.wrap.dataset.group=ctx.view.group??'';ctx.wrap.dataset.sourceObjects=String(objects.length)
  for(const [index,item]of ctx.model.items.entries()){
   let b=ctx.labelNodes.get(item.id),row=ctx.directoryNodes.get(item.id)
   if(!b){
    b=ctx.make('button','world-name');b.type='button';b.dataset.worldId=item.id;b.append(ctx.make('strong',''),ctx.make('span',''));ctx.labelNodes.set(item.id,b)
    row=ctx.make('div','');row.dataset.directoryId=item.id
    const focus=ctx.make('button',''),open=ctx.make('button','');focus.type=open.type='button';focus.dataset.focus='true';row.append(focus,open);ctx.directoryNodes.set(item.id,row)
   }
   if(!row)throw Error('WorldDirectoryUnavailable')
   const review=item.kind==='character'?ctx.roleStatus(ctx.workActivity,item.id):null,state=review?.state??null
   const detail=item.disabled?'Unavailable':review?review.label:objectForms[item.form]+' · '+(item.summary||'Inspect information')
   ctx.setText(b.children[0],item.title);ctx.setText(b.children[1],detail);b.dataset.worldKind=item.kind??'record';b.disabled=Boolean(item.disabled);b.setAttribute('aria-label',item.title+'. '+detail)
   b.dataset.position=JSON.stringify([item.x,item.y,item.z])
   b.dataset.objectForm=item.form;b.dataset.activity=state??'';b.dataset.supportRef=item.supportRef??'';b.dataset.selected=String(item.id===ctx.selectedId);b.dataset.marked=String(item.id===ctx.markedId)
   if(ctx.labels.children[index]!==b)ctx.labels.insertBefore(b,ctx.labels.children[index]??null)
   const [focus,open]=row.querySelectorAll('button');ctx.setText(focus,item.title);focus.setAttribute('aria-label','Find '+item.title);open.disabled=Boolean(item.disabled)
   const action=item.kind==='group'?'Browse shelf':ctx.view.pattern==='garden'&&item.kind==='character'?'Talk to':'Inspect'
   ctx.setText(open,action);open.setAttribute('aria-label',action+' '+item.title)
   if(item.kind==='group')row.dataset.members=JSON.stringify(item.memberIds);else delete row.dataset.members
   if(ctx.list.children[index]!==row)ctx.list.insertBefore(row,ctx.list.children[index]??null)
  }
  ctx.summary.textContent=(ctx.view.pattern==='garden'?'People':'In this space')+' · '+ctx.model.items.length
  ctx.renderMap()
  ctx.filterDirectory()
  ctx.renderUpdates()
  if(ctx.needsFit){ctx.overview();ctx.needsFit=false}
  try{ctx.gpu?.pattern(ctx.view.pattern);if(changedGeometry&&ctx.gpu&&ctx.geometry){ctx.gpu.upload(ctx.geometry,ctx.actorRanges);ctx.uploads++}ctx.gpu?.motionStates(new Map(ctx.model.items.filter(i=>i.kind==='character').map(i=>[i.id,ctx.roleStatus(ctx.workActivity,i.id)?.state??'Idle'])));ctx.invalidate()}catch(error){ctx.fail(error)}
 }
