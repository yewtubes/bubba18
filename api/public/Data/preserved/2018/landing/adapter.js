/* Independent BubbaBlox transport and dependencies for the recovered Dec 2018 client.
 * Native account authorization, Discord verification, cooldowns and 2FA remain authoritative.
 */
(function () {
  'use strict';
  var origin=location.origin,pendingSignupToken=null,capLoading;
  function solveCap(){
    window.CAP_CUSTOM_WASM_URL='/captcha/assets/cap_wasm_bg.wasm';
    window.CAP_CUSTOM_HASHWX_URL='/captcha/assets/hashwx.wasm';
    window.CAP_PAKO_URL='/captcha/assets/pako_inflate.min.js';
    window.CAP_DISABLE_WIDGET_REF=true;
    if(!capLoading)capLoading=new Promise(function(resolve,reject){
      var script=document.createElement('script');script.src='/captcha/assets/widget.js';
      script.onload=function(){resolve();};script.onerror=function(){capLoading=null;script.remove();reject(new Error('CAP could not be loaded.'));};document.head.appendChild(script);
    });
    return capLoading.then(function(){var cap=new window.Cap({apiEndpoint:'/captcha/'});return cap.solve().finally(function(){cap.widget.remove();});});
  }
  function localPath(value,fallback) {
    try { var u=new URL(value||fallback||'/home',origin);return u.origin===origin&&u.pathname.startsWith('/')?u.pathname+u.search+u.hash:(fallback||'/home'); }
    catch(e){return fallback||'/home';}
  }
  var params=new URLSearchParams(location.search),returnUrl=localPath(params.get('ReturnUrl')||params.get('returnUrl'),'/home');
  window.Roblox=window.Roblox||{};
  Roblox.Resources={};Roblox.Lang={};Roblox.SignupMeta={isNewUserLandingAbTestingEnabled:false};
  Roblox.EnvironmentUrls={websiteUrl:origin,authApi:origin+'/local-auth',authAppSite:origin,apiProxyUrl:origin,abtestingApiSite:origin,
    googlePlayStoreLink:'/download',amazonStoreLink:'/download',appStoreLink:'/download',windowsStoreLink:'/download',xboxStoreLink:'/download'};
  Roblox.UrlParser={getParameterValueByName:function(name){return new URLSearchParams(location.search).get(name);}};
  window.EventTracker={fireEvent:function(){}};
  var app=window.robloxApp=angular.module('robloxApp',['ngSanitize']);
  angular.module('captcha',[]);angular.module('roblox.formEvents',[]);angular.module('modal',[]);
  app.provider('languageResource',function(){
    var dictionary={};this.setLanguageKeysFromFile=function(values){angular.extend(dictionary,values);};
    this.$get=function(){return {get:function(key,values){var text=dictionary[key]||key;angular.forEach(values,function(value,name){text=text.split('{'+name+'}').join(value==null?'':value);});return text;}};};
  });
  app.filter('translate',['languageResource',function(resource){return function(key,values){return resource.get(key,values);};}]);
  app.value('urlConstants',{urlQueryStringPrefix:'?',urlQueryParameterSeparator:'&',hashSign:'#'});
  app.value('urlService',{getAbsoluteUrl:function(url){return localPath(url,'/home');}});
  app.value('eventTrackerService',window.EventTracker);
  app.value('eventStreamService',{sendModalShownEvent:function(){},sendModalActionEvent:function(){}});
  app.value('captchaInterface',{ids:{signup:'signup',login:'login'},types:{signup:'signup',login:'login'}});
  app.value('$uibModal',{open:function(){throw new Error('Email verification is unavailable on this independent server.');}});
  app.directive('keyPressEnter',function(){return {link:function(scope,element,attrs){element.on('keydown',function(event){if(event.key==='Enter'){event.preventDefault();scope.$apply(function(){scope.$eval(attrs.keyPressEnter);});}});}};});
  // Prevent the native form submission from racing the recovered Angular handler.
  app.directive('form',function(){return {restrict:'E',link:function(scope,element){element.on('submit',function(event){event.preventDefault();});}};});
  ['captcha','funCaptcha'].forEach(function(name){app.directive(name,function(){return {link:function(scope,element,attrs){scope.$watch(attrs.captchaModel+'.isActivated',function(active){if(!active)return;var setting=scope.$eval(attrs.captchaModel);setting.isActivated=false;if(scope.loginLayout){scope.loginLayout.isProcessing=false;scope.loginLayout.error='Verification is unavailable. Please try again later.';}if(scope.signupForm){scope.isSubmitting=false;scope.signupForm.$generalError=true;scope.signupForm.$generalErrorText='Verification is unavailable. Please try again later.';}});}};});});
  app.factory('httpService',['$http','$q',function($http,$q){
    function authenticated(response){
      return $http.get('/apisite/users/v1/users/authenticated').then(function(user){return {data:{user:user.data}};});
    }
    // fetch exposes the final native redirect URL, needed to preserve the 2FA handoff.
    function nativePost(url,fields){return $q.when(fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields).toString()})).then(function(response){
      if(new URL(response.url).pathname==='/login/2fa'){location.assign('/login/2fa');return $q.reject({status:202,data:{errors:[{code:0}]}});}
      return response.text().then(function(text){var body;try{body=JSON.parse(text);}catch(e){}
        if(!response.ok)return $q.reject({status:response.status,data:body||{reasons:['Unavailable'],errors:[{code:0}]}});
        var redirected=new URL(response.url),message=redirected.searchParams.get('loginmsg')||redirected.searchParams.get('signupmsg');
        if(message)return $q.reject({status:403,data:{message:message,reasons:['Unavailable'],errors:[{code:/too many|wait|attempt/i.test(message)?7:1}]}});
        return authenticated(response).catch(function(){return $q.reject({status:403,data:{reasons:['Unavailable'],errors:[{code:1}]}});});
      });
    });}
    return {
      httpGet:function(options,query){
        var url=new URL(options.url,origin);
        if(url.origin!==origin)return $q.reject({status:400});
        if(url.pathname==='/login/meta-data')return $q.resolve({ReturnUrl:returnUrl});
        if(url.pathname==='/local-auth/v1/auth/metadata')return $q.resolve({cookieLawNoticeTimeout:0});
        if(url.pathname==='/UserCheck/checkifinvalidusernameforsignup')return $http.get(url.pathname,{params:query}).then(function(r){return r.data;});
        return $q.reject({status:501,data:{errors:[{code:0}]}});
      },
      httpPost:function(options,data){
        var url=new URL(options.url,origin);if(url.origin!==origin)return $q.reject({status:400});
        if(url.pathname==='/local-auth/v2/login')return nativePost('/login',{username:data.cvalue,password:data.password,returnUrl:returnUrl});
        if(url.pathname==='/local-auth/v2/signup'){var token=pendingSignupToken;pendingSignupToken=null;return nativePost('/login/signup',Object.assign({},data,{capToken:token||''}));}
        return $q.reject({status:501,data:{errors:[{code:0}],reasons:['Unavailable']}});
      }
    };
  }]);
  // Keep the recovered form/controller; solve CAP before submitting its native request.
  app.run(['$injector',function(injector){
    var definitions=injector.get('signUpDirective'),original=definitions[0].link;
    definitions[0].link=function(scope,element,attrs){
      original.apply(this,arguments);
      var submit=scope.submitSignup,handle=scope.handleSignupErrors;
      scope.handleSignupErrors=function(error){
        error=error||{};error.reasons=error.reasons||['Unavailable'];
        if(error.reasons.indexOf('Captcha')!==-1){scope.isSubmitting=false;scope.setGeneralError();scope.signupForm.$generalErrorText=error.message||'Verification failed. Please try again.';return;}
        handle(error);if(scope.signupForm.$generalError&&error.message)scope.signupForm.$generalErrorText=error.message;
      };
      scope.submitSignup=function(count){
        if(scope.isSubmitting)return;
        if(!scope.isFormValid()||!scope.isGenderValid()||!scope.isValidBirthday(scope.signup.birthdayDay))return submit(count);
        scope.isSubmitting=true;scope.signupForm.$generalError=false;
        solveCap().then(function(result){if(!result||!result.token)throw new Error("Verification interrupted");scope.$evalAsync(function(){pendingSignupToken=result.token;scope.isSubmitting=false;submit(count);});}).catch(function(){scope.$evalAsync(function(){scope.isSubmitting=false;scope.setGeneralError();scope.signupForm.$generalErrorText='Verification is temporarily unavailable. Please try again.';});});
      };
    };
    definitions[0].compile=function(){return definitions[0].link;};
  }]);
  app.run(['$templateCache',function(cache){
    // This deployment serves English. Do not pretend other locale dictionaries exist.
    document.querySelectorAll('.locale-option').forEach(function(link){link.addEventListener('click',function(event){event.preventDefault();});});
    var switcher=document.getElementById('language-switcher');if(switcher)switcher.addEventListener('change',function(){this.value='en_us';});
  }]);
})();
