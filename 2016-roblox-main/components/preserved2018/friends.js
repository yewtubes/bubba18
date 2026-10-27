import React,{useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import AuthenticationStore from '../../stores/authentication';
import capture from './friends.generated.json';
import controls from './friends-controls.generated.json';
import locale from './friends-language.generated.json';
import {loadOriginalScript} from './frame';
import * as service from '../../services/friends';
import {getUserInfo} from '../../services/users';
import {multiGetUserThumbnails} from '../../services/thumbnails';

// Preserve the recovered Angular view; translate BubbaBlox contracts into its
// scope fields. The original controller remains in the research resource set.
export default function Friends2018(){
 const router=useRouter(),auth=AuthenticationStore.useContainer(),host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{const userId=Number(router.query.userId);if(!userId||auth.isPending)return;const requestedTab=router.asPath.split('#!/')[1]||window.location.hash.replace(/^#!\//,'');let disposed=false,scope,generation=0;
  (async()=>{
   await loadOriginalScript('/preserved/2018/vendor/jquery.js');await loadOriginalScript('/preserved/2018/vendor/bootstrap.js');await loadOriginalScript('/preserved/2018/vendor/angular.js');if(disposed)return;
   const angular=window.angular,name='preservedFriends'+Date.now(),app=angular.module(name,[]),root=host.current;
   app.config(['$locationProvider',provider=>provider.hashPrefix('!')]);
   const translate=(key,params)=>{let result=locale[key]||key;for(const [k,v] of Object.entries(params||{}))result=result.split('{'+k+'}').join(v);return result;};
   app.filter('translate',()=>translate);app.run(['$templateCache',cache=>{cache.put('friend-card-menu',controls.menu);cache.put('system-feedback','<div class="alert-system-feedback"><div class="alert alert-warning"></div></div>');}]);
   app.directive('cardMenu',()=>({restrict:'A',scope:true,templateUrl:'friend-card-menu',link(s,element){
    const trigger=element.find('[data-toggle="popover"]');
    trigger.popover({html:true,container:element,placement:'bottom',trigger:'click',content:()=>element.find('.rbx-popover-content').html()});
    const click=e=>{const action=e.target.closest('.friend-unfollow,.friend-follow,.friend-unfriend');if(!action)return;e.preventDefault();trigger.popover('hide');s.$apply(()=>{if(action.classList.contains('friend-unfollow'))s.unFollow(s.friend);else if(action.classList.contains('friend-follow'))s.follow(s.friend);else s.unFriend(s.friend);});};
    element.on('click',click);s.$on('$destroy',()=>{element.off('click',click);trigger.popover('destroy');});
   }}));
   app.controller('friendsController',['$scope',function(s){scope=s;let operation=false;s.currentData={isMyProfile:userId===auth.userId,userName:'',activeTab:'friends',currentPage:0,totalPerPage:18,totalPages:1,isFindFriendsEnabled:false,hasBtns:false,ignoreAll:false,templateVisible:false};s.friendsContent={friends:{data:{Friends:[],TotalFriends:0}}};s.friendsCount=0;s.disabled=false;s.disablePrevious=()=>s.disabled||s.currentData.currentPage===0;s.disableNext=()=>s.disabled||s.currentData.currentPage+18>=s.friendsContent.friends.data.TotalFriends;s.hasMenu=(data,friend)=>data.isMyProfile&&!friend.isCardFrozen&&(data.activeTab==='following'||friend.IsDeleted);
    const apply=callback=>{if(!disposed)s.$evalAsync(callback);};
    const load=async()=>{const request=++generation,tab=s.currentData.activeTab,offset=s.currentData.currentPage;let rows=[],total=0;
     if(tab==='friends'){const result=await service.getFriends({userId});total=result.length;rows=result.slice(offset,offset+18);}
     else if(tab==='following'||tab==='followers'){const [result,count]=await Promise.all([tab==='following'?service.getFollowings({userId,cursor:String(offset),limit:18}):service.getFollowers({userId,cursor:String(offset),limit:18}),tab==='following'?service.getFollowingsCount({userId}):service.getFollowersCount({userId})]);rows=result.data;total=count;}
     else{if(userId!==auth.userId)return;const [result,count]=await Promise.all([service.getFriendRequests({cursor:String(offset),limit:18}),service.getFriendRequestCount()]);rows=result.data;total=count;}
     if(offset>0&&!rows.length){s.currentData.currentPage=Math.max(0,Math.ceil(total/18)-1)*18;return load();}
     const images=rows.length?await multiGetUserThumbnails({userIds:rows.map(e=>e.id),size:'150x150'}):[];
     if(disposed||request!==generation)return;apply(()=>{s.currentData.totalPages=Math.max(1,Math.ceil(total/18));s.currentData.hasBtns=tab==='friend-requests';s.currentData.templateVisible=true;s.friendsContent.friends.data={TotalFriends:total,Friends:rows.map(e=>({UserId:e.id,Username:e.name||e.username,AbsoluteURL:'/users/'+e.id+'/profile',AvatarUri:images.find(i=>i.targetId===e.id&&i.state==='Completed')?.imageUrl,Thumbnail:{Final:images.some(i=>i.targetId===e.id&&i.state==='Completed')},isAvailable:true,IsDeleted:Boolean(e.isDeleted),IsFollowed:tab==='following',lastLocation:translate(e.isOnline?'Label.Online':'Label.Offline'),isPresenceOnline:Boolean(e.isOnline)}))};s.friendsCount=total;});
    };
    const run=promise=>promise.catch(()=>{if(!disposed)setError('The friends request could not be completed. Please try again.');});
    const mutate=action=>{if(operation||userId!==auth.userId||!auth.isAuthenticated)return;operation=true;s.disabled=true;setError('');run((async()=>{try{await action();if(!disposed)await load();}catch(e){if(!disposed)await load();throw e;}finally{operation=false;apply(()=>{s.disabled=false;});}})());};
    const tabs={friends:['Label.Friends','Message.FriendsTabTooltip'],following:['Label.Following','Message.FollowingTabTooltip'],followers:['Label.Followers','Message.FollowerTabTooltip'],'friend-requests':['Label.FriendRequests','Message.RequestsTabTooltip']};
    s.selectTab=tab=>{if(operation)return;if(!tabs[tab]||(tab==='friend-requests'&&userId!==auth.userId))tab='friends';setError('');s.currentData.activeTab=tab;s.currentData.currentPage=0;s.currentData.templateVisible=false;[s.currentData.stateLabel,s.currentData.tooltipLabel]=tabs[tab].map(key=>translate(key));window.history.replaceState(window.history.state,'','#!/'+tab);run(load());};
    s.newPage=direction=>{if(s.disabled)return;s.currentData.currentPage+=direction==='next'?18:-18;run(load());};
    s.acceptFriendRequest=id=>mutate(()=>service.acceptFriendRequest({userId:id}));s.declineFriendRequest=id=>mutate(()=>service.declineFriendRequest({userId:id}));
    s.declineAllFriendRequests=()=>mutate(async()=>{
     // Snapshot all pages before mutations shift offset pagination.
     const ids=new Set(),seen=new Set();let cursor='0';
     do{if(seen.has(cursor))throw new Error('Repeated friend-request cursor');seen.add(cursor);const page=await service.getFriendRequests({cursor,limit:100});for(const friend of page.data)ids.add(friend.id);cursor=page.nextPageCursor;}while(cursor!==null&&cursor!==undefined&&cursor!=='');
     for(const id of ids)await service.declineFriendRequest({userId:id});
    });
    s.unFollow=friend=>mutate(()=>service.unfollowUser({userId:friend.UserId}));s.follow=friend=>mutate(()=>service.followUser({userId:friend.UserId}));s.unFriend=friend=>mutate(()=>service.unfriendUser({userId:friend.UserId}));
    getUserInfo({userId}).then(user=>apply(()=>{s.currentData.userName=user.name;})).catch(()=>{if(!disposed)setError('User not found.');});
    s.selectTab(['friends','followers','following','friend-requests'].includes(requestedTab)?requestedTab:'friends');
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
