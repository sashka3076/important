﻿var e;
if(!window.__idm_init__){var v=function(a,b){b&&(a[b]=!0);return a},x=function(){var a=window.self===window.top;a&&(this.T=!0,this.L=0);this.V=[];this.X=[];this.i={};this.K();window.__idm_connect__=this.K.bind(this,!0);this.b(1,window,"scroll",this.ta);this.b(1,window,"blur",this.ma);this.b(1,window,"keydown",this.Z,!0);this.b(1,window,"keyup",this.Z,!0);this.b(1,window,"mousedown",this.na,!0);this.b(1,window,"mouseup",this.pa,!0);this.b(1,window,"mousemove",this.oa,!0);this.b(1,document,"beforeload",this.ka,
!0);this.b(1,document,"DOMContentLoaded",this.la);a&&this.b(1,window,"resize",this.sa)};window.__idm_init__=!0;"undefined"==typeof browser&&(browser=chrome);var y=Function.call.bind(Array.prototype.slice),z=Function.apply.bind(Array.prototype.push),A={16:!0,17:!0,18:!0,45:!0,46:!0},F=["video","audio","object","embed"],G=/(?!)/;e=x.prototype;e.c=0;e.f=0;e.w=-1;e.A=-1;e.ca=1;e.I="";e.D=G;e.m="";e.o=G;e.h={};e.F=G;e.G=G;e.H=G;e.B=G;e.C=G;e.K=function(a){this.aa(-1);this.a=a=browser.runtime.connect({name:(this.T?
"top":"sub")+(a?":retry":"")});this.s=a.id||a.portId_||this.s||Math.ceil(1048575*Math.random());this.b(-1,a,"onMessage",this.ra);this.b(-1,a,"onDisconnect",this.qa)};e.qa=function(){browser.runtime.lastError;this.aa();this.a=this.s=null;window.__idm_init__=!1;window.__idm_connect__=null};e.ra=function(a){switch(a[0]){case 11:var b=a[2];if(b){this.L=b;try{window.frameElement&&window.frameElement.setAttribute("__idm_frm__",b)}catch(f){}}a[5]&&this.va(a[5],a.slice(6));a[3]&&this.P();a[4]&&this.v();break;
case 17:this.da();a[1]&&this.P();a[2]&&this.v(!0);break;case 12:var b=this.ga(a[4]?RegExp(a[4],"i"):null,a[2]),c=[27,a[1],this.L,b.length];a[3]||(c[4]=b,c[5]=window.location.href,this.T&&(c[6]=window.location.href,c[7]=document.title));this.a.postMessage(c);break;case 13:this.xa=a[1];break;case 14:this.g(a[1]);break;case 15:this.ia(a);break;case 16:this.ja(a);break;case 18:this.ha(a)}};e.va=function(a,b){switch(this.ba=a){case 1:this.I=b.shift()||"";this.D=RegExp(b.shift()||"(?!)");this.o=RegExp(b.shift()||
"(?!)");this.m=b.shift()||"";this.h=(b.shift()||"").split(/[|:]/).reduce(v,{});this.F=RegExp(b.shift()||"(?!)");this.G=RegExp(b.shift()||"(?!)");this.H=RegExp(b.shift()||"(?!)");break;case 2:this.B=RegExp(b.shift()||"(?!)");break;case 3:this.C=RegExp(b.shift()||"(?!)")}};e.J=function(){if(!this.wa){this.wa=!0;this.b(2,window,"message",this.ua);var a=document.createElement("script");a.src=browser.extension.getURL("document.js");a.onload=function(){a.parentNode.removeChild(a)};document.documentElement.appendChild(a)}};
e.ua=function(a){var b=a.data,c=window.origin||document.origin||location.origin;if(Array.isArray(b)&&a.origin==c)switch(b[0]){case 1229212977:a=this.I;"^"==a[0]&&(a="^"+c+a.substr(1));window.postMessage([1229212978,a],"/");break;case 1229212979:this.a.postMessage([36,parseInt(b[1]),b[2]])}};e.S=function(){var a=window.devicePixelRatio,b=document.width,c=document.body.scrollWidth;b&&c&&(a=b==c?0:b/c);return a};e.u=function(a){try{var b=parseInt(a.getAttribute("__idm_id__"));b||(b=this.s<<10|this.ca++,
a.setAttribute("__idm_id__",b));this.i[b]=a;return b}catch(c){return null}};e.fa=function(a,b,c,f){try{var d=document.activeElement,h=d&&0<=F.indexOf(d.localName)?d:null;h||(h=(d=document.elementFromPoint(this.w,this.A))&&0<=F.indexOf(d.localName)?d:null);for(var k=0,n,p,q,m,l=0;l<F.length;l++){for(var g=document.getElementsByTagName(F[l]),r=0;r<g.length;r++)if(d=g[r],3!=l||"application/x-shockwave-flash"==d.type.toLowerCase()){var t=d.src||d.data;if(t&&(t==a||t==b)){n=d;break}if(!h&&!p)if(!t||t!=
c&&t!=f){var w=d.clientWidth,u=d.clientHeight;if(w&&u){var B=d.getBoundingClientRect();if(!(0>=B.right+window.scrollX||0>=B.bottom+window.scrollY)){var C=window.getComputedStyle(d);if(!C||"hidden"!=C.visibility){var D=w*u;D>k&&1.35*w>u&&w<3*u&&(k=D,q=d);m||(m=d)}}}}else p=d}if(n)break}a=n||h||p||q||m;if(!a)return null;if("embed"==a.localName&&!a.clientWidth&&!a.clientHeight){var E=a.parentElement;"object"==E.localName&&(a=E)}return this.u(a)}catch(H){}};e.ea=function(a,b,c){try{var f,d=[];z(d,document.getElementsByTagName("frame"));
z(d,document.getElementsByTagName("iframe"));for(var h=0;h<d.length;h++){var k=d[h];if(parseInt(k.getAttribute("__idm_frm__"))==a){f=k;break}if(!f){var n=k.src;!n||n!=b&&n!=c||(f=k)}}return this.u(f)}catch(p){}};e.O=function(a){try{var b=a.getBoundingClientRect(),c=Math.round(b.width),f=Math.round(b.height),d;switch(a.localName){case "video":if(15>c||10>f)return null;break;case "audio":if(!c&&!f)return null;d=!0}var h=document.documentElement,k=h.scrollHeight||h.clientHeight,n=Math.round(b.left)+
a.clientLeft,p=Math.round(b.top)+a.clientTop;return n>=(h.scrollWidth||h.clientWidth)||p>=k||d&&!n&&!p?null:[n,p,n+c,p+f,this.S()]}catch(q){}};e.v=function(a){if(a){if(this.l(a)){var b=this.g(),b=[34,!1,b,-2,null];this.a.postMessage(b)}}else if("loading"==document.readyState)this.M=!0;else if(this.l()){this.M=!1;a=1==this.ba;var c,f;a&&(document.getElementsByTagName(this.m).length||document.getElementsByTagName(this.m+"-network-manager").length)&&this.J();for(var d=document.getElementsByTagName("script"),
h=0;h<d.length;h++){var k=d[h],n;if(a){if((n=this.o.exec(k.src))?(this.h[n[1]]||(f=!0),c=k.src,b=1):!k.src&&this.D.test(k.innerText)&&(this.J(),b=this.g(),b=[34,!0,b,-2,k.outerHTML],this.a.postMessage(b),b=2),3==b)break}else if(!k.src&&this.B.test(k.innerText)){b=this.g();b=[34,!0,b,-2,k.outerHTML];this.a.postMessage(b);break}else if(!k.src&&this.C.test(k.innerText)){b=this.g();b=[34,!0,b,-2,k.outerHTML];this.a.postMessage(b);break}}c&&f&&this.R(c)}};e.R=function(a,b,c){if(void 0===c)b=new XMLHttpRequest,
b.responseType="text",b.timeout=1E4,b.onreadystatechange=this.R.bind(this,a,b),b.open("GET",a,!0),b.send();else if(4==b.readyState){var f=this.o.exec(a);if((a=(a=this.F.exec(b.response))&&parseInt(a[1]||a[2],10))&&(!this.h[a]||!this.h[f[1]])&&(c=this.G.exec(b.response),b=this.H.exec(b.response),c&&b&&c[2]==b[1])){var f=f&&f[1],d={};d[118]=a;d[119]=c[0];d[120]=b[0];d[124]=f;this.a.postMessage([37,1,1,d])}}};e.P=function(){this.a.postMessage([21,window.location.href])};e.ja=function(a){var b=a[2]||
this.ea(a[3],a[4],a[5]),c=b&&this.i[b],c=c&&this.O(c);this.a.postMessage([22,a[1],a[3],b,c])};e.ha=function(a){for(var b=a[2],c,f,d=document.getElementsByTagName("a"),h=0;h<d.length;h++)try{var k=d[h];if(k.href==b){c=k.download||null;f=k.innerText.trim()||k.title||null;break}}catch(n){}this.a.postMessage([35,a[1],c,f])};e.ia=function(a){if(this.l(a)){var b=!a[2],c=a[2]||this.fa(a[3],a[4],a[5],a[6]);a=[23,a[1],c,!1];var f=c&&this.i[c];if(f){var d=this.O(f);d&&(a[4]=d);b?(a[5]=f.localName,a[6]=f.src||
f.data):d||document.contains(f)||(a[3]=!0,delete this.i[c])}b&&(a[7]=this.g());this.a.postMessage(a)}};e.g=function(a){var b=this.l(a);if(!(b?0>b&&1==this.ba:a)){var c;try{c=window.top.document.title}catch(f){}c||(c=(b=document.head.querySelector('meta[property="og:title"]'))&&b.getAttribute("content"));if(c)if(c=c.replace(/^\(\d+\)/,"").replace(/[ \t\r\n\u25B6]+/g," ").trim(),a)this.a.postMessage([24,a,c]);else return c}};e.ga=function(a,b){for(var c=this.N(document,a,b),f=document.getElementsByTagName("iframe"),
d=0;d<f.length;d++)try{var h=f[d],k=h.contentDocument;k&&!h.src&&z(c,this.N(k,a,b))}catch(n){}return c};e.N=function(a,b,c){var f=[],d={},h="",k="",n=!c,p;if(c&&(p=a.getSelection(),!p||p.isCollapsed&&!p.toString().trim()))return f;var q=a.getElementsByTagName("a");if(q)for(var m=0;m<q.length;m++){var l=q[m];if(l&&(n||p.containsNode(l,!0)))try{var g=l.href;g&&!d[g]&&b.test(g)&&(d[g]=f.push([g,2,l.download||null,l.innerText.trim()||l.title]));c&&d[g]&&(h+=l.innerText,h+="\n")}catch(u){}}if(q=a.getElementsByTagName("area"))for(m=
0;m<q.length;m++)if((l=q[m])&&(n||p.containsNode(l,!0)))try{(g=l.href)&&!d[g]&&b.test(g)&&(d[g]=f.push([g,2,null,l.alt]))}catch(u){}if(q=n&&a.getElementsByTagName("iframe"))for(m=0;m<q.length;m++)if((l=q[m])&&(n||p.containsNode(l,!0)))try{(g=l.src)&&!d[g]&&b.test(g)&&(d[g]=f.push([g,4]))}catch(u){}if(m=c&&p.toString())for(var r=this.j(m),l=this.j(h),m=0;m<r.length;m++)(g=r[m])&&!d[g]&&b.test(g)&&0>l.indexOf(g)&&(d[g]=f.push([g,1]));if(c=c&&a.getElementsByTagName("textarea"))for(m=0;m<c.length;m++){var l=
c[m],h=l.selectionStart,q=l.selectionEnd,t=p.isCollapsed&&h<q;if(l&&(t||p.containsNode(l,!0)))try{for(var w=l.value,r=this.j(t?w.substring(h,q):w),l=0;l<r.length;l++)(g=r[l])&&!d[g]&&b.test(g)&&(d[g]=f.push([g,1]))}catch(u){}}if(r=(n||!f.length)&&a.getElementsByTagName("img"))for(m=0;m<r.length;m++)if((l=r[m])&&(n||p.containsNode(l,!0)))try{(g=l.src)&&!d[g]&&b.test(g)&&(d[g]=f.push([g,3,null,"<<<=IDMTRANSMITIMGPREFIX=>>>"+l.alt])),n&&l.onclick&&(k+=l.onclick,k+="\n")}catch(u){}if(g=n&&a.getElementsByTagName("script")){for(m=
0;m<g.length;m++)k+=g[m].innerText,k+="\n";for(k=this.j(k);k.length;)(g=k.shift())&&!d[g]&&b.test(g)&&(d[g]=f.push([g,5]))}return f};e.j=function(a){if(!this.U){var b="\\b\\w+://(?:[%T]*(?::[%T]*)?@)?[%H.]+\\.[%H]+(?::\\d+)?(?:/(?:(?: +(?!\\w+:))?[%T/~;])*)?(?:\\?[%Q]*)?(?:#[%T]*)?".replace(/%\w/g,function(a){return this[a]}.bind({"%H":"\\w\\-\u00a0-\ufeff","%T":"\\w\\-.+*()$!,%\u00a0-\ufeff","%Q":"^\\s\\[\\]{}()"}));this.U=RegExp(b,"gi")}for(var c=[];b=this.U.exec(a);)c.push(b.shift());return c};
e.l=function(a){var b=this.c;b||(a=y(arguments),a.unshift(arguments.callee.caller),this.X.push(a));return b};e.da=function(){this.W&&this.c&&(this.c=0,this.Y=window.setTimeout(this.$.bind(this,!1),3E3))};e.la=function(){this.c=-1;var a;try{a=window.top.document.getElementsByTagName("title")[0]}catch(c){}if(a){var b=this.W;b||(this.W=b=new MutationObserver(this.$.bind(this)));b.observe(a,{childList:!0})}this.M&&this.v()};e.$=function(a){0>this.c?this.c=1:++this.c;a&&(window.clearTimeout(this.Y),this.Y=
null);a=this.X;for(var b;b=a.shift();)b.shift().apply(this,b)};e.ka=function(a){var b=a.target,c=b.localName;0<=F.indexOf(c)&&a.url&&(b=this.u(b),this.a.postMessage([25,b,c,a.url]))};e.Z=function(a){A[a.keyCode]&&this.a.postMessage([31,a.keyCode,"keydown"==a.type])};e.na=function(a){this.xa&&this.a.postMessage([28]);if(0==a.button){var b=a.view.getSelection();b&&b.isCollapsed&&!b.toString().trim()&&(this.f=1);this.a.postMessage([32,a.button,!0])}};e.pa=function(a){if(0==a.button){this.w=a.clientX;
this.A=a.clientY;this.a.postMessage([32,a.button,!1]);var b=a.view.getSelection();b&&this.f&&(this.f=b.isCollapsed&&!b.toString().trim()?0:2)&&this.a.postMessage([26,a.clientX,a.clientY,this.S()])}};e.oa=function(){2==this.f&&(this.f=0)};e.ta=function(){this.a.postMessage([29])};e.sa=function(a){a=a.target;this.a.postMessage([30,a.innerWidth,a.innerHeight])};e.ma=function(){this.f=0;this.a.postMessage([33])};e.b=function(a,b,c,f){var d=y(arguments);d[3]=f.bind(this);this.V.push(d);0>a?(b=b[c],b.addListener.apply(b,
d.slice(3))):b.addEventListener.apply(b,d.slice(2))};e.aa=function(a){for(var b=this.V,c=0;c<b.length;c++){var f=b[c][0];if(!a||a==f){var d=b.splice(c--,1).pop(),h=d.splice(0,2).pop();0>f?(h=h[d.shift()],h.removeListener.apply(h,d)):h.removeEventListener.apply(h,d)}}};new x}!0;