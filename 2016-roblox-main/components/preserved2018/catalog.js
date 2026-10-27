import React,{useEffect,useRef,useState} from 'react';
import _ from 'lodash';
import pages from './pages.generated.json';
import captured from './catalog.generated.json';
import {loadOriginalScript} from './frame';
import {searchCatalog,getItemDetails,getItemUrl} from '../../services/catalog';
import {multiGetAssetThumbnails} from '../../services/thumbnails';
export default function Catalog2018(){
 const host=useRef(null),[error,setError]=useState('');
 useEffect(()=>{let current=true,scope;
  (async()=>{
   await loadOriginalScript('/preserved/2018/vendor/jquery.js');await loadOriginalScript('/preserved/2018/vendor/bootstrap.js');await loadOriginalScript('/preserved/2018/vendor/angular.js');await loadOriginalScript('/preserved/2018/vendor/angular-sanitize.js');
   if(!current)return;
   window.Roblox=window.Roblox||{};Roblox.Lang={CatalogResources:captured.locale};Roblox.CatalogTemplates={CardItemTemplate:'catalog-item-card'};
   Roblox.DeviceMeta=()=>({isPhone:false,isInApp:false});Roblox.Endpoints={getAbsoluteUrl:url=>url};
   await loadOriginalScript('/preserved/2018/intl-string.original.js');Roblox.IntlUtils=new Roblox.Intl('en-us');
   Roblox.BootstrapWidgets={SetupAccordion(){},SetupVerticalMenu(){},SetupDropdown(){},ShowAccordionMenu(selector){window.jQuery(selector).collapse('show');}};
   const angular=window.angular;let app;
   try{app=angular.module('robloxApp');}catch{
    app=angular.module('robloxApp',['ngSanitize']);window.robloxApp=app;
    const translate=(key,params)=>{let value=captured.locale[key]||key;for(const [name,text] of Object.entries(params||{}))value=value.replace(new RegExp('\\{'+name+'\\}','g'),text);return value;};
    app.provider('languageResource',function(){this.setLanguageKeysFromFile=()=>{};this.$get=()=>({get:translate,getTranslation:translate});});
    app.filter('translate',()=>translate);app.filter('abbreviate',()=>number=>Number(number||0).toLocaleString('en-US'));app.value('_',_);
    app.factory('abpService',()=>({adIds:{leaderboardAbp:'leaderboard'},registerAd(){},refreshAllAds(){}}));
    app.run(['$templateCache',cache=>Object.entries(captured.templates).forEach(([key,value])=>cache.put(key,value))]);
    app.factory('catalogService',['$q',function($q){return {
     getMetaData:()=>$q.resolve(captured.metadata),getSearchOptions:()=>$q.resolve(angular.copy(captured.options)),
     getPagedItems:(query,requestNumber)=>$q.resolve((async()=>{
      const q=typeof query==='string'?Object.fromEntries(new URLSearchParams(query)):query||{};
      const category={0:'Featured',1:'All',2:'Collectibles',3:'Clothing',4:'BodyParts',5:'Gear',11:'Accessories',12:'AvatarAnimations'}[Number(q.Category)]||'All';
      const page=Number(q.PageNumber||1),limit=Number(q.ResultsPerPage||28);
      const result=await searchCatalog({category,subCategory:q.Subcategory,query:q.Keyword,limit,cursor:String((page-1)*limit),sort:q.SortType||0,creatorType:q.CreatorType,creatorId:q.CreatorID});
      const ids=(result.data||[]).map(e=>e.id);const details=(await getItemDetails(ids)).data.data;
      const images=ids.length?await multiGetAssetThumbnails({assetIds:ids}):[];
      const items=details.map(item=>({AssetId:item.id,Name:item.name,Url:getItemUrl({assetId:item.id,name:item.name}),Creator:item.creatorName,CreatorName:item.creatorName,CreatorAbsoluteUrl:'/users/'+item.creatorTargetId+'/profile',CreatorType:item.creatorType,Price:item.price,PriceInRobux:item.price,IsForSale:item.isForSale,IsFree:item.price===0,IsLimited:(item.itemRestrictions||[]).includes('Limited'),IsLimitedUnique:(item.itemRestrictions||[]).includes('LimitedUnique'),Thumbnail:{Url:images.find(e=>e.targetId===item.id)?.imageUrl||'',Final:images.find(e=>e.targetId===item.id)?.state==='Completed'},ThumbnailUrl:images.find(e=>e.targetId===item.id)?.imageUrl||'',ItemType:'Asset'}));
      return {PageNumber:page,ResultsPerPage:limit,Keyword:q.Keyword||null,PageHash:"",IsValidCreatorName:true,Items:items,Results:items,ResultsCount:result._total||items.length,TotalResults:result._total||items.length,RequestNumber:requestNumber};
     })())
    };}]);
   }
   await loadOriginalScript('/preserved/2018/catalog-runtime.original.js');if(!current)return;
   angular.bootstrap(host.current,['robloxApp','catalog']);scope=angular.element(host.current).scope();
  })().catch(e=>{console.error(e);if(current)setError('Unable to load the catalog.');});
  return()=>{current=false;scope?.$destroy();};
 },[]);
 return <>{error&&<div className='content'><p role='alert'>{error}</p></div>}<div ref={host} dangerouslySetInnerHTML={{__html:pages.catalog.html}}/></>;
}
Catalog2018.preserved2018=true;Catalog2018.preservedPage='catalog';
