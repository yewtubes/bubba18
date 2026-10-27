import React,{useEffect,useRef,useState} from 'react';
import Head from 'next/head';
import {useRouter} from 'next/router';
import capture from './group-redesign.generated.json';
import AuthenticationStore from '../../stores/authentication';
import * as groups from '../../services/groups';
import {getGroupGames,getGameUrl} from '../../services/games';
import {searchCatalog,getItemDetails,getItemUrl} from '../../services/catalog';
import {multiGetGroupIcons,multiGetUserHeadshots,multiGetUniverseIcons} from '../../services/thumbnails';
import {loadOriginalScript} from './frame';

const thumbnailTypes={groupIcon:'groupIcon',avatarHeadshot:'avatarHeadshot',gameIcon:'gameIcon'},thumbnailSizes={small:'small',medium:'medium',large:'large'};
export default function Group2018(){
 const router=useRouter(),auth=AuthenticationStore.useContainer(),host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{
  if(!router.isReady||auth.isPending)return;let disposed=false,scope;const root=host.current;
  const fail=message=>{if(!disposed)setError(message||'The group request could not be completed.');};
  (async()=>{
   setError('');const memberships=auth.userId?await groups.getUserGroups({userId:auth.userId}):[];
   const groupId=Number(router.query.gid||memberships[0]?.group.id);
   if(!Number.isSafeInteger(groupId)||groupId<1){root.innerHTML='';fail(auth.isAuthenticated?'You have not joined any groups.':'Log in to view your groups.');return;}
   const [info,roles]=await Promise.all([groups.getInfo({groupId}),groups.getRoles({groupId})]);
   const membership=memberships.find(entry=>entry.group.id===groupId),role=membership?.role||roles.find(entry=>entry.rank===0);
   const permission=role?await groups.getPermissionsForRoleset({groupId,rolesetId:role.id}):{};
   if(disposed)return;
   window.Roblox=window.Roblox||{};for(const file of ['vendor/jquery.js','vendor/bootstrap.js','vendor/angular.js','vendor/angular-sanitize.js','intl-string.original.js'])await loadOriginalScript('/preserved/2018/'+file);
   if(disposed)return;
   const angular=window.angular,app=angular.module('preservedGroupRedesign'+Date.now(),['ngSanitize']);
   const translate=(key,params)=>{let text=capture.locale[key]||key;for(const [k,v] of Object.entries(params||{}))text=text.split('{'+k+'}').join(v??'');return text;};
   app.filter('translate',()=>translate);app.filter('abbreviate',()=>value=>String(value??0));
   app.filter('formatDate',()=>value=>value?new Date(value).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'');
   app.filter('linkify',()=>value=>String(value||'').escapeHTML().replace(/\r?\n/g,'<br>'));
   app.run(['$templateCache',cache=>Object.entries(capture.templates).forEach(([key,html])=>cache.put(key,html))]);
   app.component('thumbnail2d',{template:capture.templates['2d-thumbnail'],bindings:{thumbnailType:'<',thumbnailTargetId:'<',size:'<'},controller:['$scope',function(s){
    let version=0,dead=false;this.thumbnailState='Pending';this.getCssClasses=()=>({'icon-pending':this.thumbnailState==='Pending','icon-error':this.thumbnailState==='Error','icon-blocked':this.thumbnailState==='Blocked','icon-in-review':this.thumbnailState==='InReview'});
    this.$onChanges=()=>{const request=++version,id=Number(this.thumbnailTargetId);if(!id)return;const task=this.thumbnailType==='groupIcon'?multiGetGroupIcons({groupIds:[id]}):this.thumbnailType==='gameIcon'?multiGetUniverseIcons({universeIds:[id],size:'150x150'}):multiGetUserHeadshots({userIds:[id],size:'150x150'});
     task.then(entries=>{if(dead||disposed||request!==version)return;const image=entries.find(entry=>entry.targetId===id);s.$evalAsync(()=>{this.thumbnailState=image?.state||'Pending';this.thumbnailUrl=image?.state==='Completed'?image.imageUrl:undefined;});}).catch(()=>{if(!dead&&!disposed)s.$evalAsync(()=>{this.thumbnailState='Error';});});};this.$onDestroy=()=>{dead=true;};
   }]});
   const withThumbs=function(){this.thumbnailTypes=thumbnailTypes;this.thumbnailSizes=thumbnailSizes;};
   app.component('groupsList',{template:capture.templates['groups-list'],bindings:{groups:'<',currentGroup:'<',metadata:'<',isLoadingGroups:'<'},controller:withThumbs});
   app.component('groupsListItem',{template:capture.templates['groups-list-item'],bindings:{group:'<'},controller:withThumbs});
   app.directive('groupAbout',()=>({template:capture.templates['group-about']}));
   app.component('groupMembersList',{template:capture.templates['group-members-list'],bindings:{roles:'<',groupId:'<',isAuthenticatedUser:'<'},controller:['$scope',function(s){
    const c=this;withThumbs.call(c);let busy=false,page=1,cursor='0',next=null,history=['0'],generation=0,dead=false;c.members=[];c.numGroupMembers=info.memberCount;c.profilePageUrl=id=>'/users/'+id+'/profile';
    const load=async()=>{const request=++generation;busy=true;try{const result=await groups.getRolesetMembers({groupId:c.groupId,roleSetId:c.data.currentRoleId,cursor,limit:9,sortOrder:'Desc'});if(dead||disposed||request!==generation)return;s.$evalAsync(()=>{c.members=result.data.map(row=>({...row.user||row,presence:{}}));next=c.data.currentRoleMemberCount>0&&Number(cursor)+result.data.length>=c.data.currentRoleMemberCount?null:result.nextPageCursor;c.loadMembersError=false;});}catch{if(!dead&&!disposed)s.$evalAsync(()=>{c.loadMembersError=true;c.members=[];});}finally{if(!dead&&!disposed)s.$evalAsync(()=>{busy=false;});}};
    c.membersPager={isBusy:()=>busy,getCurrentPageNumber:()=>page,canLoadNextPage:()=>!busy&&next!==null,canLoadPreviousPage:()=>!busy&&page>1,loadNextPage:()=>{if(!busy&&next!==null){cursor=next;history[page]=cursor;page++;load();}},loadPreviousPage:()=>{if(!busy&&page>1){page--;cursor=history[page-1];load();}}};
    c.updateRole=role=>{c.data={currentRoleId:role.id,currentRoleName:role.name,currentRoleMemberCount:Number(role.memberCount||0)};page=1;cursor='0';history=['0'];next=null;load();};
    c.$onInit=()=>{const first=c.roles.find(role=>role.rank>0);if(first)c.updateRole(first);};c.$onDestroy=()=>{dead=true;generation++;};
   }]});
   app.directive('groupWall',()=>({template:capture.templates['group-wall']}));
   app.directive('groupComments',()=>({template:capture.templates['group-comments']}));
   app.controller('groupWallController',['$scope',function(s){
    s.groupWall={posts:[],postData:'',loadFailure:false,isPostInProgress:false};let busy=true;
    s.groupWall.pager={isBusy:()=>busy,loadNextPage(){}};s.isInfiniteScrollingDisabled=()=>true;s.showWallPrivacySettingsText=()=>false;
    s.canViewWall=()=>auth.isAuthenticated&&Boolean(permission.permissions?.groupPostsPermissions?.viewWall);s.canPostToWall=()=>auth.isAuthenticated&&Boolean(permission.permissions?.groupPostsPermissions?.postToWall);s.canSendPost=()=>!s.groupWall.isPostInProgress&&Boolean(s.groupWall.postData.trim());s.captchaActionTypes={};
    const load=async()=>{try{const result=await groups.getWall({groupId,cursor:'0',limit:10,sort:'Desc'});if(!disposed)s.$evalAsync(()=>{s.groupWall.posts=result.data.map(post=>({...post,poster:{...post.poster.user,role:post.poster.role},posted:post.created}));s.groupWall.loadFailure=false;});}catch{if(!disposed)s.$evalAsync(()=>{s.groupWall.loadFailure=true;});}finally{if(!disposed)s.$evalAsync(()=>{busy=false;});}};
    s.sendPost=()=>{if(!s.canSendPost())return;s.groupWall.isPostInProgress=true;groups.postToWall({groupId,content:s.groupWall.postData}).then(()=>{if(!disposed)s.$evalAsync(()=>{s.groupWall.postData='';});return load();}).catch(()=>fail('The wall post could not be sent.')).finally(()=>{if(!disposed)s.$evalAsync(()=>{s.groupWall.isPostInProgress=false;});});};if(s.canViewWall())load();else busy=false;
   }]);
   app.directive('groupGames',()=>({template:capture.templates['group-games']}));
   app.component('groupGamesItem',{template:capture.templates['group-games-item'],bindings:{game:'<'},controller:function(){withThumbs.call(this);this.goToGameDetails=()=>{};}});
   app.controller('groupGamesController',['$scope',function(s){let busy=true;s.games=[];s.layout={loadGamesError:false};s.gamesPager={isBusy:()=>busy,getCurrentPageNumber:()=>1,canLoadNextPage:()=>false};getGroupGames({groupId}).then(result=>{if(!disposed)s.$evalAsync(()=>{s.games=result.data.map(game=>({...game,votes:{},gameReferralUrl:getGameUrl({placeId:game.rootPlace.id,name:game.name})}));});}).catch(()=>{if(!disposed)s.$evalAsync(()=>{s.layout.loadGamesError=true;});}).finally(()=>{if(!disposed)s.$evalAsync(()=>{busy=false;});});}]);
   app.directive('groupStore',()=>({template:capture.templates['group-store']}));
   app.directive('groupStoreItem',()=>({template:capture.templates['group-store-item']}));
   app.controller('groupStoreController',['$scope',function(s){s.layout={isLoading:true};s.storeData={results:[],showPagination:false};s.getDevelopPageUrl=()=>'/develop';
    (async()=>{const result=await searchCatalog({category:'All',creatorType:'Group',creatorId:groupId,limit:28,cursor:'0',sort:0}),details=(await getItemDetails(result.data.map(item=>item.id))).data.data;if(!disposed)s.$evalAsync(()=>{s.storeData.results=details.map(item=>({Name:item.name,AbsoluteUrl:getItemUrl({assetId:item.id,name:item.name}),Price:item.price,IsFree:item.price===0,NoPriceText:item.price===0?'Free':'',Thumbnail:{}}));});})().catch(()=>{if(!disposed)s.$evalAsync(()=>{s.layout.loadStoreItemsError=true;});}).finally(()=>{if(!disposed)s.$evalAsync(()=>{s.layout.isLoading=false;});});
   }]);
   app.component('groupAffiliates',{template:`<div class="section-content-off" role="status" ng-bind="'Message.GetGroupRelationshipsError' | translate"></div>`,bindings:{groupId:'<'}});
   app.controller('groupController',['$scope',function(s){scope=s;s.thumbnailTypes=thumbnailTypes;s.thumbnailSizes=thumbnailSizes;s.isAuthenticatedUser=auth.isAuthenticated;s.currencyInRobux=null;s.layout={};s.Data={activeTab:'about'};s.captcha={};s.captchaActionTypes={};
    s.groupConstants={currentTab:{1:'about',2:'store',3:'affiliates'},joinStatus:{allowed:6}};
    s.library={metadata:{isPhone:false,isConfigureGroupPageEnabled:false,groupStatusMaxLength:255,groupPostMaxLength:500},currentUser:{id:auth.userId},groupsList:{groups:memberships.map(row=>({...row.group,groupUrl:'/Groups/Group.aspx?gid='+row.group.id}))},currentGroup:{id:groupId,group:{...info,shout:info.shout||{shoutData:''}},role,roles:roles.filter(role=>role.rank>0),permissions:{groupPostsPermissions:{},groupEconomyPermissions:{},...permission.permissions}}};s.resources={www:{createGroupUrl:'/My/CreateGroup.aspx',upgradeMembershipUrl:'/buildersclub'}};
    s.isLoadFinished=()=>true;s.isLockedGroup=()=>Boolean(info.isLocked);s.isInGroup=()=>Boolean(membership);s.currentUserIsInAnyGroup=()=>memberships.length>0;s.canCreateGroup=()=>auth.isAuthenticated;s.createGroupTitle=()=>translate('Action.CreateGroup');s.doesGroupHaveOwner=()=>Boolean(info.owner);s.isGroupBCOnly=()=>false;s.showJoinGroupButtonUI=()=>6;s.isCaptchaActive=()=>false;
    s.profilePageUrl=id=>'/users/'+id+'/profile';s.canViewStatus=()=>Boolean(s.library.currentGroup.group.shout?.body&&s.library.currentGroup.group.shout?.poster);s.canPostToStatus=()=>auth.isAuthenticated&&Boolean(permission.permissions?.groupPostsPermissions?.postToStatus);
    s.canViewWall=()=>auth.isAuthenticated&&Boolean(permission.permissions?.groupPostsPermissions?.viewWall);s.canPostToWall=()=>auth.isAuthenticated&&Boolean(permission.permissions?.groupPostsPermissions?.postToWall);
    s.joinGroup=()=>groups.joinGroup({groupId}).then(()=>window.location.reload()).catch(()=>fail('The group could not be joined.'));
    let posting=false;s.sendGroupShout=()=>{const message=s.library.currentGroup.group.shout.shoutData;if(posting||!message?.trim())return;posting=true;groups.setStatus({groupId,message}).then(()=>groups.getInfo({groupId})).then(info=>{if(!disposed)s.$evalAsync(()=>{s.library.currentGroup.group.shout={...info.shout,shoutData:''};});}).catch(()=>fail('The group shout could not be posted.')).finally(()=>{posting=false;});};
    s.canViewGroupAdmin=()=>role?.rank===255;s.groupAdminUrl=()=>'/My/GroupAdmin.aspx?gid='+groupId;s.canAdvertiseGroup=()=>false;s.canViewAuditLogs=()=>false;s.isGroupPrimary=()=>false;s.showReportAbuseModal=()=>fail('Reporting is not connected on this page yet.');s.makePrimary=()=>groups.setGroupAsPrimary({groupId}).catch(()=>fail('Primary group could not be updated.'));s.removePrimary=()=>groups.removePrimaryGroup().catch(()=>fail('Primary group could not be updated.'));s.showLeaveGroupModal=()=>fail('Use the existing group administration page to leave this group.');s.claimOwnership=()=>groups.claimGroupOwnership({groupId}).then(()=>window.location.reload()).catch(()=>fail('This group could not be claimed.'));
   }]);
   root.innerHTML='<div class="content"><div id="group-container"><div class="group-details-container">'+capture.templates['group-base']+'</div></div></div>';angular.bootstrap(root,[app.name]);
   const click=event=>{const tab=event.target.closest('#horizontal-tabs .group-tab');if(tab){event.preventDefault();scope.$apply(()=>{scope.Data.activeTab=tab.id;});}const dropdown=event.target.closest('.group-dropdown .input-dropdown-btn');if(dropdown)dropdown.parentElement.classList.toggle('open');if(event.target.closest('.group-dropdown .dropdown-menu a'))event.target.closest('.group-dropdown').classList.remove('open');
    const trigger=event.target.closest('.group-header .group-menu .rbx-menu-item');if(trigger){event.preventDefault();const el=window.jQuery(trigger);if(!el.data('bs.popover')){el.popover({html:true,container:trigger.parentElement,placement:'bottom',trigger:'manual',content:()=>angular.element(root).injector().get('$compile')(capture.templates['group-menu-popover'])(scope.$new())[0]});}el.popover('toggle');}
   };root.addEventListener('click',click);root.__removeGroupClick=()=>root.removeEventListener('click',click);
  })().catch(()=>fail('Some group content could not be loaded.'));
  return()=>{disposed=true;scope?.$root.$destroy();root.__removeGroupClick?.();root.replaceChildren();};
 },[router.isReady,router.query.gid,auth.isPending,auth.userId]);
 return <><Head><link rel='stylesheet' href='/preserved/2018/group-redesign-adapter.css'/></Head>{error&&<div className='content'><p role='status'>{error}</p></div>}<div ref={host}/></>;
}
Group2018.preserved2018=true;Group2018.preservedPage='group-redesign';
