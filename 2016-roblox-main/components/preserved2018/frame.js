import React,{useEffect,useMemo,useRef,useState} from 'react';
import Head from 'next/head';
import pages from './pages.generated.json';
import account from './account-navigation.generated.json';
import AuthenticationStore from '../../stores/authentication';
import {logout} from '../../services/auth';
export function loadOriginalScript(src){
 window.__preservedScripts=window.__preservedScripts||{};
 return window.__preservedScripts[src]||(window.__preservedScripts[src]=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);}));
}
export default function Frame({page,title,legacy,children}){
 const auth=AuthenticationStore.useContainer(),nav=useRef(null),[sidebarOpen,setSidebarOpen]=useState(true);
 const signedIn=useMemo(()=>{
  if(!auth.isAuthenticated||typeof document==='undefined'||!account.header)return null;
  const t=document.createElement('template');t.innerHTML=account.header+account.sidebar;
  const text=(selector,value)=>{const e=t.content.querySelector(selector);if(e)e.textContent=value;};
  text('.age-bracket-label',auth.username);text('#nav-robux-amount',String(auth.robux||0));text('#navigation .text-lead a',auth.username);
  t.content.querySelector('#navigation')?.classList.add('nav-show');
  t.content.querySelectorAll('script,iframe,.rbx-nav-events,.rbx-nav-sponsor').forEach(e=>e.remove());
  t.content.querySelectorAll('#navigation li.font-bold.small').forEach(e=>{if(e.textContent.trim()==='Events')e.remove();});
  t.content.querySelectorAll('a').forEach(a=>{
   let href=(a.getAttribute('href')||'').replace(/^https?:\/\/(?:www|web)\.roblox\.com/,'').replace(/\/users\/\d+\//g,'/users/'+auth.userId+'/');
   const aliases={'/my/avatar':'/My/Avatar','/my/account':'/My/Account','/my/groups.aspx':'/My/Groups.aspx','/my/messages/#!/inbox':'/My/Messages','/upgrades/robux?ctx=nav':'/robux.aspx'};
   a.href=aliases[href.toLowerCase()]||href;
   if(a.id==='nav-friends')a.href='/users/'+auth.userId+'/friends';
   if(a.id==='nav-profile')a.href='/users/'+auth.userId+'/profile';
   if(a.classList.contains('navbar-brand'))a.href='/home';
   if(a.dataset.behavior==='logout')a.href='#logout';
   if(a.id==='nav-trade')a.href='/My/Trades.aspx';
   if(a.textContent.trim()==='Develop')a.textContent='Create';
  });
  return {header:t.content.querySelector('#header')?.outerHTML,sidebar:t.content.querySelector('#navigation')?.outerHTML};
 },[auth.isAuthenticated,auth.username,auth.userId,auth.robux]);
 useEffect(()=>{if(!signedIn)return;let disposed=false;
  (async()=>{await loadOriginalScript('/preserved/2018/vendor/jquery.js');await loadOriginalScript('/preserved/2018/vendor/bootstrap.js');if(disposed)return;
   window.jQuery(nav.current).find('[data-toggle="popover"]').popover({html:true,container:'#preserved-2018-page',placement:'bottom',trigger:'click',content:function(){const key=this.dataset.bind;return Array.from(nav.current.querySelectorAll('.rbx-popover-content')).find(e=>e.dataset.toggle===key)?.innerHTML||'';}});
  })().catch(()=>{});
  return()=>{disposed=true;if(window.jQuery?.fn?.popover)window.jQuery(nav.current).find('[data-toggle="popover"]').popover('destroy');};
 },[signedIn]);
 useEffect(()=>{document.documentElement.setAttribute('data-preserved-2018','');document.body.style.margin='0';return()=>document.documentElement.removeAttribute('data-preserved-2018');},[]);
 const input=()=>{const root=nav.current,field=root.querySelector('#navbar-search-input');if(!field)return;root.querySelectorAll('.rbx-navbar-search-string').forEach(e=>e.textContent=field.value);root.querySelectorAll('[data-searchurl]').forEach(e=>{const a=e.querySelector('a');if(a)a.href=e.dataset.searchurl+encodeURIComponent(field.value);});const menu=root.querySelector('.dropdown-menu');if(menu)menu.style.display=field.value?'block':'none';};
 const search=()=>{const a=nav.current.querySelector('.rbx-navbar-search-option.selected a');if(a)window.location.assign(a.href);};
 return <div id='preserved-2018-page' className='rbx-body' data-preserved-page={page} data-sidebar-open={signedIn&&sidebarOpen?'true':'false'} onClick={e=>{if(e.target.closest('[data-behavior=logout]')){e.preventDefault();logout().then(()=>window.location.assign('/login'));}}}><Head><title>{title||'Roblox'} - Roblox</title><link rel='stylesheet' href='/preserved/2018/leanbase.page.css'/>{page&&<link rel='stylesheet' href={'/preserved/2018/'+page+'.page.css'}/>}<meta name='viewport' content='width=device-width,initial-scale=1'/></Head><div id='wrap' className={'wrap no-gutter-ads '+(signedIn?'logged-in':'logged-out')}><div ref={nav} onInput={input} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}} onClick={e=>{if(e.target.closest('#navbar-search-btn')){e.preventDefault();search();}if(e.target.closest('.rbx-nav-collapse')){const navigation=document.querySelector('#navigation');if(navigation)setSidebarOpen(navigation.classList.toggle('nav-show'));}}} dangerouslySetInnerHTML={{__html:signedIn?.header||pages.header}}/>{signedIn?.sidebar&&<div dangerouslySetInnerHTML={{__html:signedIn.sidebar}}/>}<div className='container-main'>{legacy?<div className='content'><div className='preserved-backend-page'>{children}</div></div>:children}</div><div dangerouslySetInnerHTML={{__html:pages.footer}}/></div></div>;
}
