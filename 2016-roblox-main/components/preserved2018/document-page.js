import React,{useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import pages from './pages.generated.json';
import AuthenticationStore from '../../stores/authentication';
import {getUserInfo} from '../../services/users';
import {getFriends,getFollowersCount,getFollowingsCount,sendFriendRequest} from '../../services/friends';
import {getItemDetails,getIsFavorited,createFavorite,deleteFavorite} from '../../services/catalog';
import {getUserGames,getGameUrl,multiGetPlaceDetails,multiGetUniverseDetails,getServers,launchGame,voteOnGame} from '../../services/games';
import {multiGetAssetThumbnails,multiGetUserHeadshots,multiGetUserThumbnails} from '../../services/thumbnails';
import {purchaseItem} from '../../services/economy';
const text=(root,selector,value)=>{const e=root.querySelector(selector);if(e)e.textContent=value??'';};
const number=n=>Number(n||0).toLocaleString('en-US');
const date=value=>value?new Date(value).toLocaleDateString('en-US'):'';
function template(html){const t=document.createElement('template');t.innerHTML=html;return t;}
function markup(kind,data,own){
 const t=template(pages[kind].html),root=t.content;
 root.querySelectorAll('script,iframe,noscript,img,input[type="hidden"]').forEach(e=>e.remove());
 root.querySelectorAll('[ng-if="appMeta.isI18nEnabled"]').forEach(e=>e.remove());
 if(kind==='profile'){
  const {user,counts,games}=data;
  root.querySelectorAll('.profile-header-more,.mobile-details-actions,.accoutrement-item,.badge-list li').forEach(e=>e.remove());
  text(root,'.header-title h2',user.name);root.querySelector('.header-title .icon-obc')?.remove();text(root,'.profile-about-content-text',user.description||'');root.querySelector('.profile-about-text')?.classList.remove('para-overflow-page-loading');
  root.querySelectorAll('.details-info li').forEach((e,i)=>{text(e,'h3',number(counts[i]));const a=e.querySelector('a');if(a)a.href='/users/'+user.id+'/friends#!/'+['friends','followers','following'][i];});
  const stats=root.querySelectorAll('.profile-stat .text-lead');if(stats[0])stats[0].textContent=date(user.created);if(stats[1])stats[1].textContent=number(games.reduce((total,g)=>total+Number(g.placeVisits||0),0));
  const creations=root.querySelector('#creations'),section=creations.querySelector('.profile-game').cloneNode(true),header=section.querySelector('.container-header').cloneNode(true);header.querySelector('.container-buttons')?.remove();const list=document.createElement('ul');list.className='hlist game-cards';section.replaceChildren(header,list);creations.replaceChildren(section);
  for(const game of games){const c=template(pages.gameCard).content.firstElementChild;c.dataset.assetId=game.rootPlace.id;c.querySelectorAll('img,.game-card-info').forEach(e=>e.remove());c.querySelector('a').href=getGameUrl({placeId:game.rootPlace.id,name:game.name});text(c,'.game-card-name',game.name);c.querySelector('.game-card-name').title=game.name;list.appendChild(c);}
  const actions=root.querySelector('.desktop-action');
  if(own)actions?.remove();else if(actions){const friend=actions.querySelector('.btn-friends'),button=friend.querySelector('button[ng-click="sendFriendRequest()"]');button.textContent='Add Friend';button.id='preserved-add-friend';friend.replaceChildren(button);const message=actions.querySelector('#profile-message-btn');text(message,'button','Message');actions.replaceChildren(friend,message);}
  root.querySelectorAll('.enable-three-dee,.header-details-error').forEach(e=>e.remove());
 }else if(kind==='game'){
  const {place,universe}=data;
  root.querySelectorAll('.ad,.abp,.game-badge,.PurchaseModal,#rbx-vip-servers,#my-recommended-games,.social-links,#toggle-game-follow,.game-follow-button-container,.carousel-inner .item:not(:first-child),.carousel-indicators,.carousel-control').forEach(e=>e.remove());
  root.querySelectorAll('#rbx-passes-container,#rbx-gear-container,#game-instances').forEach(e=>e.replaceChildren());
  text(root,'.game-name',universe.name);text(root,'.game-description',universe.description||'');const creator=root.querySelector('.game-creator .text-name');if(creator){creator.textContent=universe.creator.name;creator.href='/users/'+universe.creator.id+'/profile';}
  const values=[number(universe.playing),number(universe.favoritedCount),number(universe.visits),date(universe.created),date(universe.updated),universe.maxPlayers,universe.genre||'All'];root.querySelectorAll('.game-stat .text-lead').forEach((e,i)=>{if(i<values.length){e.textContent=values[i];e.removeAttribute('title');}});
  root.querySelectorAll('.vote-number').forEach(e=>{e.textContent='0';e.removeAttribute('title');});
  const play=root.querySelector('#MultiplayerVisitButton a');if(play){play.setAttribute('role','button');play.setAttribute('aria-label','Play');if(!place.isPlayable){play.classList.add('disabled');play.setAttribute('aria-disabled','true');}}
 }else{
  root.querySelectorAll('.enable-three-dee,.asset-restriction-icon,.equipped-marker,.item-note,.resale-pricechart-tabs,.recommendations-container,.comments-container').forEach(e=>e.remove());
  text(root,'.item-name-container h2',data.name);const creator=root.querySelector('.item-name-container .text-name');if(creator){creator.textContent=data.creatorName;creator.href='/users/'+data.creatorTargetId+'/profile';}
  root.querySelectorAll('.description-content').forEach(e=>{e.textContent=data.description||'';e.classList.remove('content-overflow-page-loading');});root.querySelector('#item-details')?.classList.remove('content-overflow-page-loading');
  text(root,'.price-label','Price');text(root,'.text-robux-lg',data.isForSale?data.price===0?'Free':number(data.price):'This item is not currently for sale.');if(!data.isForSale||data.price===0)root.querySelector('.icon-robux-price-container .icon-robux')?.remove();const buy=root.querySelector('.PurchaseButton');if(buy){buy.disabled=!data.isForSale;buy.textContent=data.price===0?'Get':'Buy';}
  text(root,'.item-type-field-container .field-content',({8:'Accessory | Hat',11:'Shirt',12:'Pants',18:'Face',19:'Gear',41:'Accessory | Hair'})[data.assetType]||'Asset');root.querySelectorAll('.item-genre').forEach(e=>{e.textContent=(data.genres||['All']).join(', ');e.href='/catalog';});text(root,'#result',number(data.favoriteCount));
 }
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walk.nextNode()))if(node.textContent.includes('{{'))node.textContent='';
 root.querySelectorAll('*').forEach(e=>{for(const a of Array.from(e.attributes))if(a.name.startsWith('ng-')||a.name==='thumbnail'||a.name.startsWith('data-'))e.removeAttribute(a.name);});
 return t.innerHTML;
}
function Confirmation({item,state,onConfirm,onClose}){
 const host=useRef(null);useEffect(()=>{const root=host.current,modal=root.querySelector('#modal-confirmation');modal.classList.add('modal','in');modal.style.display='block';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');root.querySelectorAll('.modal-image-container,.modal-checkbox,.modal-processing').forEach(e=>e.remove());text(root,'.modal-title',state==='success'?'Purchase Complete':'Buy Item');text(root,'.modal-message',state==='success'?'You have successfully bought '+item.name+'.':state==='error'?'Your purchase could not be completed.':'Would you like to buy '+item.name+' from '+item.creatorName+' for '+number(item.price)+' Robux?');const confirm=root.querySelector('#confirm-btn');confirm.className='btn-primary-md';confirm.textContent=state==='pending'?'Processing...':'Buy Now';confirm.hidden=state==='success'||state==='error';const close=root.querySelector('#decline-btn');close.className='btn-control-md';close.textContent=state==='success'?'Continue Shopping':'Cancel';},[item,state]);
 return <><div className='modal-backdrop in'/><div ref={host} onClick={e=>{if(e.target.closest('#confirm-btn')){e.preventDefault();if(state==='confirm')onConfirm();}if(e.target.closest('#decline-btn,.close')){e.preventDefault();if(state!=='pending')onClose();}}} dangerouslySetInnerHTML={{__html:pages.confirmation}}/></>;
}
export default function DocumentPage({kind}){
 const router=useRouter(),id=kind==='profile'?router.query.userId:router.query.assetId,auth=AuthenticationStore.useContainer(),host=useRef(null);
 const [data,setData]=useState(null),[html,setHtml]=useState(''),[error,setError]=useState(''),[purchase,setPurchase]=useState(null),[favorited,setFavorited]=useState(false);
 useEffect(()=>{if(!id)return;let current=true;setError('');setHtml('');setData(null);
  (async()=>{let result;
   if(kind==='profile'){const user=await getUserInfo({userId:id});const responses=await Promise.allSettled([getFriends({userId:id}),getFollowersCount({userId:id}),getFollowingsCount({userId:id}),getUserGames({userId:id})]);const value=i=>responses[i].status==='fulfilled'?responses[i].value:null;result={user,counts:[value(0)?.length||0,value(1)||0,value(2)||0],games:value(3)?.data||[]};}
   else if(kind==='game'){const [place]=await multiGetPlaceDetails({placeIds:[id]});if(!place)throw new Error('This game is unavailable.');const [universe]=await multiGetUniverseDetails({universeIds:[place.universeId]});if(!universe)throw new Error('This game is unavailable.');result={place,universe};}
   else{result=(await getItemDetails([id])).data.data[0];if(!result)throw new Error('This item is unavailable.');}
   if(current){setData(result);setHtml(markup(kind,result,Number(auth.userId)===Number(id)));}
  })().catch(e=>{if(current)setError(e.message||'Unable to load this page.');});return()=>{current=false;};
 },[id,kind,auth.userId]);
 useEffect(()=>{if(!html||!data||!host.current)return;let current=true;const root=host.current;
  const image=(target,entry,className)=>{if(!current||entry?.state!=='Completed'||!entry.imageUrl)return;const e=root.querySelector(target);if(e){const img=document.createElement('img');img.src=entry.imageUrl;img.alt='';if(className)img.className=className;e.appendChild(img);}};
  if(kind==='profile'){multiGetUserHeadshots({userIds:[id],size:'150x150'}).then(([entry])=>image('.profile-avatar-image .avatar-card-link',entry,'avatar-card-image profile-avatar-thumb')).catch(()=>{});multiGetUserThumbnails({userIds:[id],size:'352x352'}).then(([entry])=>image('#UserAvatar .thumbnail-span',entry)).catch(()=>{});}
  else multiGetAssetThumbnails({assetIds:[id]}).then(([entry])=>image(kind==='game'?'.carousel-inner .item':'#AssetThumbnail .thumbnail-span',entry,kind==='game'?'carousel-thumb':'')).catch(()=>{});
  if(auth.userId&&kind!=='profile')getIsFavorited({assetId:id,userId:auth.userId}).then(v=>{if(current)setFavorited(Boolean(v.isFavorited??v));}).catch(()=>{});
  return()=>{current=false;};
 },[html,data,auth.userId]);
 const requireLogin=()=>{if(auth.isAuthenticated)return true;window.location.assign('/login?ReturnUrl='+encodeURIComponent(router.asPath));return false;};
 const click=async e=>{const tab=e.target.closest('#horizontal-tabs a');if(tab){e.preventDefault();const root=host.current,target=tab.getAttribute('href');root.querySelectorAll('#horizontal-tabs li,.tab-pane').forEach(el=>el.classList.remove('active'));tab.closest('li').classList.add('active');const pane=root.querySelector(target);pane?.classList.add('active');if(target==='#game-instances'){try{const result=await getServers({placeId:id,offset:0});pane.textContent=result.Collection.length?result.Collection.length+' running servers.':'No running games found.';}catch{pane.textContent='Unable to load game servers.';}}}
  try{
   if(e.target.closest('#MultiplayerVisitButton')){e.preventDefault();if(data.place.isPlayable&&requireLogin())await launchGame({placeId:id,year:data.place.year});}
   if(e.target.closest('#toggle-favorite,#toggle-game-favorite')){e.preventDefault();if(requireLogin()){await (favorited?deleteFavorite:createFavorite)({assetId:id,userId:auth.userId});setFavorited(!favorited);host.current.querySelector('#favorite-icon,#game-favorite-icon')?.classList.toggle('icon-favorite-selected',!favorited);}}
   if(e.target.closest('#preserved-add-friend')){e.preventDefault();if(requireLogin()){await sendFriendRequest({userId:id});const button=host.current.querySelector('#preserved-add-friend');button.textContent='Pending';button.disabled=true;}}
   if(e.target.closest('#profile-message-btn')){e.preventDefault();window.location.assign('/messages/compose?recipientId='+id);}
   if(e.target.closest('.PurchaseButton')){e.preventDefault();if(data.isForSale&&requireLogin())setPurchase('confirm');}
   const vote=e.target.closest('.upvote,.downvote');if(vote){e.preventDefault();if(requireLogin())await voteOnGame({universeId:data.universe.id,isUpvote:vote.classList.contains('upvote')});}
  }catch{setError('The request could not be completed. Please try again.');}
 };
 return <>{error&&<div className='content'><div className='alert-warning' role='alert'>{error}</div></div>}{html?<div ref={host} onClick={click} dangerouslySetInnerHTML={{__html:html}}/>:!error&&<div className='content'><div className='spinner spinner-default'/></div>}{purchase&&<Confirmation item={data} state={purchase} onClose={()=>setPurchase(null)} onConfirm={async()=>{setPurchase('pending');try{const result=await purchaseItem({assetId:data.id,productId:data.productId||data.id,sellerId:data.creatorTargetId,price:data.price,expectedCurrency:1});setPurchase(result.purchased?'success':'error');}catch{setPurchase('error');}}}/>}</>;
}
