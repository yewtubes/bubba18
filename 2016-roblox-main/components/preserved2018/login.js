import React,{useEffect,useRef} from 'react';
import {useRouter} from 'next/router';
import captured from './login.generated.json';
export default function Login2018(){const host=useRef(null),router=useRouter();
 useEffect(()=>{const form=host.current?.querySelector('form');if(!form)return;form.querySelector('[name="returnUrl"]')?.remove();const returnUrl=router.query.ReturnUrl||router.query.returnUrl;if(typeof returnUrl==='string'){const i=document.createElement('input');i.type='hidden';i.name='returnUrl';i.value=returnUrl;form.appendChild(i);}if(typeof router.query.loginmsg==='string')form.querySelector('.login-error').textContent=router.query.loginmsg;},[router.query]);
 return <div className='content'><div ref={host} id='login-container' className='login-container' dangerouslySetInnerHTML={{__html:captured.html}}/></div>;
}
Login2018.preserved2018=true;Login2018.preservedPage='login';
