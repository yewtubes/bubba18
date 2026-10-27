import React,{useEffect,useRef,useState} from 'react';
import capture from './home.generated.json';
import AuthenticationStore from '../../stores/authentication';
import {getFriends} from '../../services/friends';
import {getUserStatus,updateStatus} from '../../services/users';
import {getGameList,getGameUrl} from '../../services/games';
import {getFavorites} from '../../services/inventory';
import {multiGetUserHeadshots,multiGetUserThumbnails,multiGetUniverseIcons} from '../../services/thumbnails';

export default function Home2018(){
 const auth=AuthenticationStore.useContainer(),host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{if(auth.isPending||!host.current)return;if(!auth.isAuthenticated){window.location.replace('/login?ReturnUrl=%2Fhome');return;}
  const root=host.current;let disposed=false;
  const text=(selector,value)=>{const e=root.querySelector(selector);if(e)e.textContent=value;};
  const template=document.createElement('template');template.innerHTML=capture.html;
  const friendTemplate=template.content.querySelector('.friend')?.cloneNode(true),gameTemplate=template.content.querySelector('#game-item-card-template .game-card')?.cloneNode(true);
  template.content.querySelectorAll('img').forEach(e=>e.remove());
  template.content.querySelectorAll('.friend-list,.feeds,.blog-news,#friend-activity .game-cards').forEach(e=>e.replaceChildren());
  template.content.querySelector('#friend-activity')?.classList.add('hidden');
  template.content.querySelectorAll('a[href]').forEach(a=>{a.href=(a.getAttribute('href')||'').replace(/\/users\/158910804\//g,'/users/'+auth.userId+'/');});
  template.content.querySelectorAll('.home-header a').forEach(a=>a.href='/users/'+auth.userId+'/profile');
  const status=template.content.querySelector('#txtStatusMessage');if(status)status.value='';
  root.replaceChildren(template.content.cloneNode(true));text('.home-header h1 a','Hello, '+auth.username+'!');text('.home-friends h3','Friends (0)');
  root.querySelector('.home-friends .btn-more').href='/users/'+auth.userId+'/friends';
  const statusLabel=root.querySelector('#statusForm .form-control-label');if(statusLabel)statusLabel.hidden=true;
  const image=(container,entry,className)=>{if(!disposed&&container&&entry?.state==='Completed'&&entry.imageUrl){const img=document.createElement('img');img.className=className;img.src=entry.imageUrl;img.alt='';container.appendChild(img);}};
  const jobs=[
   getFriends({userId:auth.userId}).then(async friends=>{if(disposed)return;text('.home-friends h3','Friends ('+friends.length+')');const ul=root.querySelector('.friend-list');for(const friend of friends.slice(0,9)){const card=friendTemplate.cloneNode(true);card.id='friend_'+friend.id;card.dataset.userId=friend.id;card.querySelectorAll('img,.avatar-status').forEach(e=>e.remove());card.querySelectorAll('a').forEach(a=>{a.href='/users/'+friend.id+'/profile';a.title=friend.name;});card.querySelector('.friend-name').textContent=friend.name;ul.appendChild(card);}if(friends.length){const images=await multiGetUserThumbnails({userIds:friends.slice(0,9).map(f=>f.id),size:'100x100'});for(const entry of images)image(ul.querySelector('[data-user-id="'+entry.targetId+'"] .friend-avatar'),entry,'avatar-card-image');}}),
   multiGetUserHeadshots({userIds:[auth.userId],size:'150x150'}).then(images=>image(root.querySelector('.home-header .avatar'),images[0],'avatar-card-image')),
   getUserStatus({userId:auth.userId}).then(result=>{if(!disposed)root.querySelector('#txtStatusMessage').value=result.status||'';}),
   fetch('/Feeds/GetUserFeed').then(r=>{if(!r.ok)throw new Error('Feed unavailable');return r.text();}).then(html=>{if(disposed)return;const parsed=new DOMParser().parseFromString(html,'text/html'),list=parsed.querySelector('.feeds');if(list){list.querySelectorAll('script,iframe,object,embed,style,link').forEach(e=>e.remove());list.querySelectorAll('*').forEach(e=>{for(const attr of [...e.attributes])if(attr.name.startsWith('on'))e.removeAttribute(attr.name);});list.querySelectorAll('[href],[src]').forEach(e=>{for(const attr of ['href','src']){const value=e.getAttribute(attr);if(value&&!value.startsWith('/'))e.removeAttribute(attr);}});root.querySelector('.feeds').replaceChildren(...list.childNodes);}}),
  ];
  const games=async(selector,items)=>{if(disposed)return;const target=root.querySelector(selector);target.replaceChildren();target.closest('.home-games').classList.toggle('hidden',!items.length);for(const item of items){const card=gameTemplate.cloneNode(true);card.querySelectorAll('img').forEach(e=>e.remove());card.dataset.universeId=item.universeId;card.querySelector('a').href=getGameUrl({placeId:item.placeId,name:item.name});card.querySelector('.game-card-name').textContent=item.name;card.querySelector('.game-card-name').title=item.name;target.appendChild(card);}if(items.length){const images=await multiGetUniverseIcons({universeIds:items.map(g=>g.universeId),size:'150x150'});for(const entry of images)image(target.querySelector('[data-universe-id="'+entry.targetId+'"] .game-card-thumb-container'),entry,'game-card-thumb');}};
  jobs.push(getGameList({sortToken:'recent',limit:6}).then(result=>games('#recently-visited-places-content',result.games||[])).finally(()=>{if(!disposed)root.querySelector('#recently-visited-places-content-spinner').hidden=true;}));
  jobs.push(getFavorites({userId:auth.userId,assetTypeId:9,limit:6,cursor:1}).then(result=>games('#my-favorites-games-content',(result.Data?.Items||[]).map(e=>({placeId:e.Item.AssetId,universeId:e.Item.UniverseId,name:e.Item.Name})))).finally(()=>{if(!disposed)root.querySelector('#my-favorites-games-content-spinner').hidden=true;}));
  Promise.allSettled(jobs).then(results=>{if(!disposed&&results.some(r=>r.status==='rejected'))setError('Some home content could not be loaded.');});
  const click=async event=>{if(!event.target.closest('#shareButton'))return;event.preventDefault();const button=root.querySelector('#shareButton');button.setAttribute('aria-disabled','true');try{await updateStatus({userId:auth.userId,newStatus:root.querySelector('#txtStatusMessage').value});statusLabel.hidden=true;}catch{statusLabel.hidden=false;}finally{button.removeAttribute('aria-disabled');}};
  root.addEventListener('click',click);return()=>{disposed=true;root.removeEventListener('click',click);};
 },[auth.isPending,auth.isAuthenticated,auth.userId,auth.username]);
 return <>{error&&<div className='content'><p role='status'>{error}</p></div>}<div ref={host}/></>;
}
Home2018.preserved2018=true;Home2018.preservedPage='home';
