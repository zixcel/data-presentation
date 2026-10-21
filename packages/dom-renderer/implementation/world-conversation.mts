import type {WorldContext} from './world-context.mjs'
export function closeConversationWorld(ctx:WorldContext):void{ctx.conversationId=null;ctx.bubble.hidden=true;ctx.bubble.replaceChildren();if(ctx.returnFocus?.isConnected)ctx.returnFocus.focus({preventScroll:true});ctx.returnFocus=null;ctx.invalidate()}
export function activateWorld(ctx:WorldContext,id:string | null | undefined):void{if(!id)return;const item=ctx.model.items.find(item=>item.id===id);if(!item||item.disabled)return;ctx.selectedId=id;ctx.wrap.dataset.selectedId=id;for(const [ref,node]of ctx.labelNodes)node.dataset.selected=String(ref===id);ctx.renderMap();ctx.stopInput();ctx.nearby.open=false;ctx.map.open=false
  if(item.kind==='group'){ctx.view={...ctx.view,group:ctx.view.pattern==='garden'&&ctx.view.group===item.id?null:item.id,page:0};ctx.needsFit=ctx.view.pattern!=='garden';ctx.update(ctx.sourceObjects,ctx.sourceRelations);if(ctx.view.pattern==='garden')ctx.focusObject(item.id);return}
  ctx.recent.delete(id);ctx.renderUpdates()
  const body=ctx.conversation?.(item,()=>{ctx.closeConversation();ctx.onActivate(id)})
  if(!body){ctx.onActivate(id);return}
  ctx.returnFocus=ctx.document.activeElement instanceof ctx.window.HTMLElement?ctx.document.activeElement:null;ctx.conversationId=id;ctx.bubble.setAttribute('aria-label','Conversation with '+item.title)
  const title=ctx.make('strong','',item.title),dismiss=ctx.make('button','','×');dismiss.type='button';dismiss.setAttribute('aria-label','Close conversation');dismiss.addEventListener('click',ctx.closeConversation,{once:true})
  const head=ctx.make('header','');head.append(title,dismiss);ctx.bubble.replaceChildren(head,body);ctx.bubble.hidden=false;ctx.bubble.focus({preventScroll:true});ctx.positionBubble();ctx.invalidate()
 }
