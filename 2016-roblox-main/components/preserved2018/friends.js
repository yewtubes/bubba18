import React,{useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import AuthenticationStore from '../../stores/authentication';
import capture from './friends.generated.json';
import locale from './friends-language.generated.json';
import {loadOriginalScript} from './frame';
import * as service from '../../services/friends';
import {getUserInfo} from '../../services/users';
import {multiGetUserThumbnails} from '../../services/thumbnails';

// Preserve the recovered Angular view; translate BubbaBlox contracts into its
// scope fields. The original controller remains in the research resource set.
export default function Friends2018(){
 const router=useRouter(),auth=AuthenticationStore.useContainer(),host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{const userId=Number(router.query.userId);if(!userId||auth.isPending)return;let disposed=false,scope,generation=0;
  (async()=>{
   await loadOriginalScript('/preserved/2018/vendor/angular.js');if(disposed)return;
   const angular=window.angular,name='preservedFriends'+Date.now(),app=angular.module(name,[]),root=host.current;
   const translate=(key,params)=>{let result=locale[key]||key;for(const [k,v] of Object.entries(params||{}))result=result.split('{'+k+'}').join(v);return result;};
   app.filter('translate',()=>translate);app.run(['$templateCache',cache=>cache.put('system-feedback','<div class="alert-system-feedback"><div class="alert alert-warning"></div></div>')]);
   app.controller('friendsController',['$scope',function(s){scope=s;s.currentData={isMyProfile:userId===auth.userId,userName:'',activeTab:'friends',currentPage:0,totalPerPage:18,totalPages:1,isFindFriendsEnabled:false,hasBtns:false,ignoreAll:false};s.friendsContent={friends:{data:{Friends:[],TotalFriends:0}}};s.friendsCount=0;s.disabled=false;s.disablePrevious=()=>s.currentData.currentPage===0;s.disableNext=()=>s.currentData.currentPage+18>=s.friendsContent.friends.data.TotalFriends;s.hasMenu=()=>false;
    const apply=callback=>{if(!disposed)s.$evalAsync(callback);};
    const load=async()=>{const request=++generation,tab=s.currentData.activeTab,offset=s.currentData.currentPage;let rows=[],total=0;
     if(tab==='friends'){const result=await service.getFriends({userId});total=result.length;rows=result.slice(offset,offset+18);}
     else if(tab==='following'||tab==='followers'){const [result,count]=await Promise.all([tab==='following'?service.getFollowings({userId,cursor:String(offset),limit:18}):service.getFollowers({userId,cursor:String(offset),limit:18}),tab==='following'?service.getFollowingsCount({userId}):service.getFollowersCount({userId})]);rows=result.data;total=count;}
     else{if(userId!==auth.userId)return;const [result,count]=await Promise.all([service.getFriendRequests({cursor:String(offset),limit:18}),service.getFriendRequestCount()]);rows=result.data;total=count;}
     const images=rows.length?await multiGetUserThumbnails({userIds:rows.map(e=>e.id),size:'150x150'}):[];
     if(disposed||request!==generation)return;apply(()=>{s.currentData.totalPages=Math.max(1,Math.ceil(total/18));s.currentData.hasBtns=tab==='friend-requests';s.friendsContent.friends.data={TotalFriends:total,Friends:rows.map(e=>({UserId:e.id,Username:e.name||e.username,AbsoluteURL:'/users/'+e.id+'/profile',AvatarUri:images.find(i=>i.targetId===e.id&&i.state==='Completed')?.imageUrl||'',isAvailable:true,IsDeleted:false,IsFollowed:true,lastLocation:''}))};s.friendsCount=total;});
    };
    const run=promise=>promise.catch(()=>{if(!disposed)setError('Unable to load friends.');});
    s.selectTab=tab=>{s.currentData.activeTab=tab;s.currentData.currentPage=0;window.location.hash='!/'+tab;run(load());};
    s.newPage=direction=>{s.currentData.currentPage+=direction==='next'?18:-18;run(load());};
    s.acceptFriendRequest=id=>run(service.acceptFriendRequest({userId:id}).then(load));s.declineFriendRequest=id=>run(service.declineFriendRequest({userId:id}).then(load));
    s.declineAllFriendRequests=()=>run((async()=>{s.disabled=true;try{for(const friend of s.friendsContent.friends.data.Friends)await service.declineFriendRequest({userId:friend.UserId});await load();}finally{apply(()=>{s.disabled=false;});}})());
    getUserInfo({userId}).then(user=>apply(()=>{s.currentData.userName=user.name;})).catch(()=>setError('User not found.'));
    const initial=window.location.hash.replace(/^#!\//,'');s.selectTab(['friends','followers','following','friend-requests'].includes(initial)?initial:'friends');
   }]);
   const t=document.createElement('template');t.innerHTML=capture.html;t.content.querySelector('#state-properties')?.remove();
   t.content.querySelectorAll('[captcha]').forEach(e=>e.remove());
   if(userId!==auth.userId)t.content.querySelector('#requests')?.remove();
   root.replaceChildren(t.content.cloneNode(true));angular.bootstrap(root,[name]);
   const click=e=>{const tab=e.target.closest('#horizontal-tabs > li');if(tab){e.preventDefault();scope.$apply(()=>scope.selectTab(tab.id==='requests'?'friend-requests':tab.id));}};root.addEventListener('click',click);root.__removeClick=()=>root.removeEventListener('click',click);
  })().catch(()=>{if(!disposed)setError('Unable to load friends.');});
  return()=>{disposed=true;generation++;scope?.$destroy();host.current?.__removeClick?.();};
 },[router.query.userId,auth.isPending,auth.userId]);
 return <>{error&&<div className='content'><p role='alert'>{error}</p></div>}<div ref={host}/></>;
}
Friends2018.preserved2018=true;Friends2018.preservedPage='friends';
