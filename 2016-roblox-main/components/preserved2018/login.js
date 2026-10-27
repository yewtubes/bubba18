import React,{useEffect,useRef} from 'react';
import {useRouter} from 'next/router';
import captured from './login.generated.json';
import errors from './login-errors.generated.json';
export default function Login2018(){const host=useRef(null),router=useRouter();
 useEffect(()=>{const form=host.current?.querySelector('form');if(!form)return;form.querySelector('[name="returnUrl"]')?.remove();const returnUrl=router.query.ReturnUrl||router.query.returnUrl;if(typeof returnUrl==='string'){const i=document.createElement('input');i.type='hidden';i.name='returnUrl';i.value=returnUrl;form.appendChild(i);}const message=typeof router.query.loginmsg==='string'?router.query.loginmsg:typeof router.query.errorCode==='string'?(errors.messages[router.query.errorCode]||errors.messages[0]):'';form.querySelector('.login-error').textContent=message;},[router.query]);
 return <div className='content'><div ref={host} id='login-container' className='login-container' dangerouslySetInnerHTML={{__html:captured.html}}/></div>;
}
Login2018.preserved2018=true;Login2018.preservedPage='login';
