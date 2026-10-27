import React,{useEffect,useRef,useState} from 'react';
import pages from './pages.generated.json';
import julyCard from './game-card-july.generated.json';
import Head from 'next/head';
import {getGameList,getGameSorts,getGameUrl} from '../../services/games';
import {multiGetUniverseIcons} from '../../services/thumbnails';
const sorts=[['1','Popular','popular'],['11','Top Rated','topRated'],['16','Recommended','recommended'],['3','Featured','featured'],['8','Top Earning','topEarning']];
export default function Games2018(){
 const host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{let disposed=false,generation=0,genre=0,currentSort='default';const root=host.current,keyword=new URLSearchParams(window.location.search).get('keyword')||'';
  const show=async sort=>{
   const request=++generation;currentSort=sort;root.querySelector('#FiltersAndSort')?.classList.remove('loading');root.querySelector('#SortFilter .rbx-selection-label').textContent=sorts.find(v=>v[0]===sort)?.[1]||'Filter By';
   const supported=await getGameSorts({gameSortsContext:'GamesDefaultSorts'}),available=new Set(supported.sorts.map(s=>s.token.toLowerCase()));
   for(const [id,title,token] of sorts){const section=root.querySelector('#GamesListContainer'+id);if(!section)continue;section.classList.add('hidden');if(sort!=='default'&&id!==sort)continue;if(!available.has(token.toLowerCase()))continue;
    const result=await getGameList({sortToken:token,limit:30,keyword,genre});if(disposed||generation!==request)return;if(!result.games.length)continue;
    const ul=section.querySelector('.horizontally-scrollable ul');ul.replaceChildren();
    for(const game of result.games){
     const t=document.createElement('template');t.innerHTML=julyCard.html;const card=t.content.firstElementChild;
     card.dataset.universeId=game.universeId;card.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
     card.querySelector('.game-card-link').href=getGameUrl(game);const name=card.querySelector('.game-card-name');name.textContent=game.name;name.title=game.name;
     card.querySelectorAll('img,.game-card-experimental').forEach(e=>e.remove());
     card.querySelector('.game-card-name-secondary').textContent=Number(game.playerCount||0).toLocaleString('en-US')+' Playing';
     const votes=card.querySelector('.vote-container'),up=Number(game.totalUpVotes||0),down=Number(game.totalDownVotes||0),total=up+down;
     votes.dataset.upvotes=up;votes.dataset.downvotes=down;votes.querySelector('.vote-percentage').style.width=(total?Math.floor(up/total*100):0)+'%';votes.querySelector('.vote-background').classList.toggle('has-votes',down>0);
     card.querySelector('.vote-up-count').textContent=up.toLocaleString('en-US');card.querySelector('.vote-down-count').textContent=down.toLocaleString('en-US');
     const creator=card.querySelector('.creator a');creator.textContent=game.creatorName;creator.href=Number(game.creatorType)===2?'/My/Groups.aspx?gid='+game.creatorId:'/users/'+game.creatorId+'/profile';
     ul.appendChild(card);
    }
    section.classList.remove('hidden');
    multiGetUniverseIcons({universeIds:result.games.map(g=>g.universeId),size:'150x150'}).then(images=>{if(disposed||generation!==request)return;for(const image of images){if(image.state!=='Completed'||!image.imageUrl)continue;const target=ul.querySelector('[data-universe-id="'+image.targetId+'"] .game-card-thumb-container');if(target){const img=document.createElement('img');img.className='game-card-thumb';img.src=image.imageUrl;img.alt='';target.appendChild(img);}}}).catch(()=>{});
   }
   const visible=Array.from(root.querySelectorAll('.games-list-container:not(.search-results-container)')).some(s=>!s.classList.contains('hidden')),empty=root.querySelector('#SearchResultsContainer');empty.classList.toggle('hidden',visible);if(!visible){empty.querySelector('.container-header').textContent='No Search Results Found';empty.querySelector('.games-list').replaceChildren();}
  };
  const click=event=>{const button=event.target.closest('.input-dropdown-btn');if(button){button.closest('.input-group-btn').classList.toggle('open');return;}const sort=event.target.closest('#SortFilter li[data-value]');if(sort){event.preventDefault();sort.closest('.input-group-btn').classList.remove('open');show(sort.dataset.value).catch(()=>setError('Unable to load games.'));}const filter=event.target.closest('#GenreFilter li[data-value]');if(filter){event.preventDefault();genre=Number(filter.dataset.value)||0;filter.closest('.input-group-btn').classList.remove('open');const label=root.querySelector('#GenreFilter .rbx-selection-label');if(label)label.textContent=filter.textContent;show(currentSort).catch(()=>setError('Unable to load games.'));}const scroller=event.target.closest('.scroller');if(scroller)scroller.closest('.games-list').querySelector('.horizontally-scrollable').scrollBy({left:scroller.classList.contains('next')?600:-600,behavior:'smooth'});};
  const over=e=>e.target.closest('.game-card')?.querySelector('.vote-percentage')?.classList.add('hover'),out=e=>e.target.closest('.game-card')?.querySelector('.vote-percentage')?.classList.remove('hover');root.addEventListener('mouseover',over);root.addEventListener('mouseout',out);root.addEventListener('click',click);show('default').catch(()=>setError('Unable to load games.'));return()=>{disposed=true;root.removeEventListener('click',click);root.removeEventListener('mouseover',over);root.removeEventListener('mouseout',out);};
 },[]);
 return <><Head><link rel='stylesheet' href='/preserved/2018/games-july-cards.page.css'/></Head>{error&&<div className='content'><p role='alert'>{error}</p></div>}<div className='july-game-cards' ref={host} dangerouslySetInnerHTML={{__html:pages.games.html}}/></>;
}
Games2018.preserved2018=true;Games2018.preservedPage='games';
