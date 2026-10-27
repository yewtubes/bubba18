import React,{useState} from 'react';
import pages from './pages.generated.json';
export function Create2018(){return <div onClick={e=>{if(e.target.closest('.studio-launch')){e.preventDefault();window.location.assign('/download');}if(e.target.closest('#scroll-to-top-btn'))window.scrollTo({top:0,behavior:'smooth'});}} dangerouslySetInnerHTML={{__html:pages.create.html}}/>;}
Create2018.preserved2018=true;Create2018.preservedPage='create';
export function Robux2018(){const [unavailable,setUnavailable]=useState(false);return <>{unavailable&&<div className='content'><div className='alert-info' role='status'>Purchasing Robux is unavailable on this independent server.</div></div>}<div onClick={e=>{if(e.target.closest('.robux-buy,a[href*="premium/membership"],a[href*="PaymentMethods"]')){e.preventDefault();setUnavailable(true);window.scrollTo(0,0);}}} dangerouslySetInnerHTML={{__html:pages.robux.html}}/></>;}
Robux2018.preserved2018=true;Robux2018.preservedPage='robux';
