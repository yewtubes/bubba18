import React,{useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';
import _ from 'lodash';
import AuthenticationStore from '../../stores/authentication';
import {searchUsers} from '../../services/users';
import {getFriendStatuses,getFollowingStatus,sendFriendRequest,acceptFriendRequest} from '../../services/friends';
import {multiGetPresence} from '../../services/presence';
import {multiGetUserThumbnails} from '../../services/thumbnails';
import {loadOriginalScript} from './frame';
import capture from './search.generated.json';

// The dated templates, controller and pagination directive remain original.
// This module translates independent backend contracts and omits production ads.
export default function Search2018(){
 const host=useRef(null),router=useRouter(),auth=AuthenticationStore.useContainer(),[error,setError]=useState('');
 useEffect(()=>{
  if(!router.isReady||auth.isPending)return;let disposed=false,scope;const root=host.current;
  (async()=>{
   for(const file of ['vendor/jquery.js','vendor/angular.js','vendor/angular-sanitize.js','intl-string.original.js','search-runtime.original.js'])await loadOriginalScript('/preserved/2018/'+file);
   if(disposed)return;
   const angular=window.angular,app=angular.module('preservedSearch'+Date.now(),['ngSanitize']);
   app.config(['$locationProvider',provider=>provider.html5Mode({enabled:true,requireBase:false,rewriteLinks:false})]);
   const translate=(key,params)=>{let value=capture.locale[key]||key;for(const [name,text] of Object.entries(params||{}))value=value.split('{'+name+'}').join(text??'');return value;};
   app.value('_',{..._,object:_.zipObject});app.filter('translate',()=>translate);
   app.run(['$templateCache',cache=>Object.entries(capture.templates).forEach(([key,html])=>cache.put(key,html))]);
   app.value('abpService',{registerAd(){},refreshAllAds(){},adIds:{}});
   app.value('captchaInterface',{ids:{},types:{}});app.value('urlService',{getAbsoluteUrl:url=>url});
   app.value('googleAnalyticsEventsService',{fireEvent(){}});
   app.value('chatDispatchService',{buildPermissionVerifier(){},startChat(){setError('Chat is not connected on this page yet.');}});
   app.factory('playerSearchService',['$q',function($q){
    let metadata;
    const request=task=>$q.resolve(task).catch(e=>{if(!disposed)setError('The player search request could not be completed. Please try again.');return $q.reject(e);});
    return {
     getMetaData:(url,keyword)=>{
      if(!url)return metadata;
      // 12 cards come from the original controller. The minimum length is from
      // a later metadata capture; exact 2018 metadata remains unverified.
      metadata={Keyword:keyword,MaxRows:12,IsPhone:false,IsTablet:false,IsGuest:!auth.isAuthenticated,FriendshipStatusValues:['NoFriendship','PendingOnOtherUser','PendingOnCurrentUser','Friends'],CurrentUserId:auth.userId||0,InApp:false,InAndroidApp:false,IniOSApp:false,KeywordMinLength:3,IsChatDisabledByPrivacySetting:true};
      return $q.resolve(metadata);
     },
     getSearchResults:query=>request((async()=>{
      if(!disposed)setError('');
      const keyword=query.keyword||'',result=await searchUsers({keyword,offset:query.startIdx||0,limit:12}),rows=result.UserSearchResults||[],ids=rows.map(user=>user.UserId);
      if(!ids.length)return {...result,Keyword:keyword,processedResult:[]};
      const [images,presences,statuses,following]=await Promise.all([
       multiGetUserThumbnails({userIds:ids,size:'150x150'}),multiGetPresence({userIds:ids}),
       auth.isAuthenticated?getFriendStatuses({authenticatedUserId:auth.userId,userIds:ids}):[],
       auth.isAuthenticated?getFollowingStatus({userIds:ids}):[]
      ]);
      return {...result,Keyword:keyword,processedResult:rows.map(user=>{
       const image=images.find(entry=>entry.targetId===user.UserId),presence=presences.find(entry=>entry.userId===user.UserId),status=statuses.find(entry=>entry.id===user.UserId)?.status;
       return {...user,YourOwnResult:user.UserId===auth.userId,PreviousUserNamesCsv:user.PreviousUserNamesCsv||'',PrimaryGroup:user.PrimaryGroup||'',Thumbnail:{Url:image?.state==='Completed'?image.imageUrl:undefined,Final:image?.state==='Completed'},FriendshipStatus:({Friends:'Friends',RequestSent:'PendingOnOtherUser',RequestReceived:'PendingOnCurrentUser'})[status]||'NoFriendship',IsFollowed:following.some(entry=>entry.targetUserId===user.UserId&&entry.isFollowing),IsOnline:Number(presence?.userPresenceType)>0,InGame:Number(presence?.userPresenceType)===2,InStudio:Number(presence?.userPresenceType)===3,LastLocation:presence?.lastLocation||'',AllowedToFollowInGame:false};
      })};
     })()),
     addFriend:id=>request(sendFriendRequest({userId:id}).then(()=>({success:true}))),
     acceptFriend:id=>request(acceptFriendRequest({userId:id}).then(()=>({success:true})))
    };
   }]);
   window.Roblox=window.Roblox||{};
   window.Roblox.BootstrapWidgets={...window.Roblox.BootstrapWidgets,ToggleSystemMessage(element,a,b,message){if(!disposed)setError(message||'The request could not be completed.');}};
   window.registerPreservedPlayerSearch(app,app);
   root.innerHTML=capture.html;angular.bootstrap(root,[app.name]);scope=angular.element(root.querySelector('[ng-controller]')).scope();
  })().catch(()=>{if(!disposed)setError('Unable to load player search.');});
  return()=>{disposed=true;scope?.$destroy();};
 },[router.isReady,auth.isPending,auth.userId]);
 return <>{error&&<div className='content'><p role='alert'>{error}</p></div>}<div ref={host}/></>;
}
Search2018.preserved2018=true;Search2018.preservedPage='search';
