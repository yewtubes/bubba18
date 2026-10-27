import React,{useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import capture from './group.generated.json';
import AuthenticationStore from '../../stores/authentication';
import {getInfo,getRoles,getRolesetMembers,getWall,getUserGroups,joinGroup} from '../../services/groups';
import {getGroupGames,getGameUrl} from '../../services/games';
import {multiGetGroupIcons,multiGetUserThumbnails,multiGetUniverseIcons} from '../../services/thumbnails';

export default function Group2018(){
 const router=useRouter(),auth=AuthenticationStore.useContainer(),host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{const groupId=Number(router.query.gid);if(auth.isPending||!Number.isSafeInteger(groupId)||groupId<1)return;setError('');let disposed=false,memberRequest=0;const root=host.current;root.innerHTML=capture.html;
  const q=s=>root.querySelector(s),text=(s,value)=>{const e=q(s);if(e)e.textContent=value;};
  const clone=html=>{const t=document.createElement('template');t.innerHTML=html;const e=t.content.firstElementChild;e.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));return e;};
  const img=(container,entry,size)=>{if(disposed||!container||entry?.state!=='Completed'||!entry.imageUrl)return;const e=container.querySelector('img')||document.createElement('img');e.src=entry.imageUrl;e.alt='';e.width=size;e.height=size;container.appendChild(e);};
  const members=async roleId=>{const request=++memberRequest,result=await getRolesetMembers({groupId,roleSetId:roleId,limit:100,sortOrder:'Asc'});if(disposed||request!==memberRequest)return;
   root.querySelectorAll('.GroupMember').forEach(e=>e.remove());const target=q('#GroupRoleSetsMembersPane .MembersUpdatePanel');
   for(const row of result.data){const user=row.user||row,card=clone(capture.member);card.dataset.userId=user.userId;card.querySelectorAll('a').forEach(a=>a.href='/users/'+user.userId+'/profile');card.querySelector('.NameText').textContent=user.username;target.appendChild(card);}
   if(result.data.length){const images=await multiGetUserThumbnails({userIds:result.data.map(r=>r.user?.userId??r.userId),size:'100x100'});for(const e of images)img(q('.GroupMember[data-user-id="'+e.targetId+'"] .Avatar a'),e,100);}
  };
  const ready=(async()=>{
   // Wall permission failures must not hide the public description and members.
   // Keep authorization on the server; report the unavailable section explicitly.
   const [info,roles,games,wall]=await Promise.all([getInfo({groupId}),getRoles({groupId}),getGroupGames({groupId}),getWall({groupId,limit:10,sort:'Desc'}).catch(()=>null)]);if(disposed)return;
   text('.right-col h2',info.name);text('#GroupDescP pre',info.description||'');text('#MemberCount','Members: '+Number(info.memberCount).toLocaleString('en-US'));
   const owner=q('#ctl00_cphRoblox_OwnershipPanel');owner.append('Owned By:',document.createElement('br'));if(info.owner){const a=document.createElement('a');a.href='/users/'+info.owner.userId+'/profile';a.textContent=info.owner.username;a.style.fontStyle='italic';owner.appendChild(a);}else owner.append('Nobody!');
   const select=q('.MembersDropDownList');for(const role of roles.filter(r=>r.rank>0)){const option=document.createElement('option');option.value=role.id;option.textContent=role.name;select.appendChild(option);}if(select.value)await members(Number(select.value));
   const list=q('#GroupsPeoplePane_Games .results-container');for(const game of games.data){const card=clone(capture.game),placeId=game.rootPlace?.id;if(!placeId)continue;card.dataset.universeId=game.id;card.querySelectorAll('a').forEach(a=>a.href=getGameUrl({placeId,name:game.name}));card.querySelector('.PlaceName a').textContent=game.name;card.querySelector('.PlayersOnline').textContent=Number(game.playing||0)+' players online';list.appendChild(card);}
   const posts=q('#ctl00_cphRoblox_GroupWallPane_GroupWallUpdatePanel');if(!wall)setError(auth.isAuthenticated?'The group wall could not be loaded.':'Log in to request access to the group wall.');for(const post of wall?.data||[]){const card=clone(capture.wall),user=post.poster.user;card.dataset.userId=user.userId;card.querySelectorAll('a').forEach(a=>a.href='/users/'+user.userId+'/profile');card.querySelector('.GroupWall_PostContainer').textContent=post.body;const userLink=document.createElement('a');userLink.href='/users/'+user.userId+'/profile';userLink.textContent=user.username;card.querySelector('.UserLink').appendChild(userLink);card.querySelector('.GroupWall_PostDate span').textContent=new Date(post.created).toLocaleString('en-US');posts.appendChild(card);}
   const images=await multiGetGroupIcons({groupIds:[groupId]});img(q('.GroupThumbnail a'),images[0],150);
   if(games.data.length){const icons=await multiGetUniverseIcons({universeIds:games.data.map(g=>g.id),size:'150x150'});for(const e of icons)img(q('.GroupPlace[data-universe-id="'+e.targetId+'"] a'),e,150);}
   if(auth.userId){const groups=await getUserGroups({userId:auth.userId});if(!disposed&&groups.some(e=>e.group.id===groupId))q('#ctl00_cphRoblox_JoinGroup').hidden=true;}
  })().catch(()=>{if(!disposed)setError('Some group content could not be loaded.');});
  const change=e=>{if(e.target.matches('.MembersDropDownList'))members(Number(e.target.value)).catch(()=>setError('Members could not be loaded.'));};
  const click=async e=>{
   const tab=e.target.closest('#GroupsPeopleContainer .tab');if(tab){const name=tab.id.replace('GroupsPeople_','');if(!['Games','Members'].includes(name)){setError('This group section is not connected yet.');return;}root.querySelectorAll('#GroupsPeopleContainer .tab').forEach(n=>n.classList.toggle('active',n===tab));root.querySelectorAll('#GroupsPeople_Pane > .tab-content').forEach(n=>n.style.display=n.id==='GroupsPeoplePane_'+name?'block':'none');}
   if(e.target.closest('#ctl00_cphRoblox_JoinGroup')){if(!auth.isAuthenticated){window.location.assign('/login?ReturnUrl='+encodeURIComponent(router.asPath));return;}try{await joinGroup({groupId});window.location.reload();}catch{setError('The group could not be joined.');}}
   if(e.target.closest('#ctl00_cphRoblox_GroupSearchBar_SearchButton')){e.preventDefault();window.location.assign('/SearchGroups.aspx?keyword='+encodeURIComponent(q('.SearchKeyword').value));}
  };
  root.addEventListener('click',click);root.addEventListener('change',change);return()=>{disposed=true;memberRequest++;root.removeEventListener('click',click);root.removeEventListener('change',change);};
 },[router.query.gid,auth.userId,auth.isPending]);
 return <>{error&&<div className='content'><p role='status'>{error}</p></div>}<div className='group-document' ref={host}/></>;
}
Group2018.preserved2018=true;Group2018.preservedPage='group';
