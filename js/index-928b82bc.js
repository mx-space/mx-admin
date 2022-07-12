import{a4 as c,ag as I,a6 as x,a5 as w,aU as U,af as ne,f as b,V as j,a7 as q,a8 as A,$ as o,ap as re,aq as ie,T as se,eB as ae,X as M,c1 as oe,n as z,Y as le,a0 as E,_ as $,aM as ce,a1 as R,eC as de,ao as m,ac as _,cP as ue,g as pe,dT as fe,p as T,m as ve,R as C,H as y,a as e,c5 as me,c9 as he,u as ge,L as p,d as F,N as V,b as S}from"./index-21204e7a.js";import{F as xe}from"./Tag-dcf5c411.js";import{N as d}from"./FormItem-2912e4a0.js";import{N as be}from"./DynamicTags-fe5a01be.js";import{N as D}from"./Form-c4ef022e.js";import"./Add-5371f318.js";import"./prop-79a97849.js";var ze=c("steps",`
 width: 100%;
 display: flex;
`,[c("step",`
 position: relative;
 display: flex;
 flex: 1;
 `,[I("disabled","cursor: not-allowed"),I("clickable",`
 cursor: pointer;
 `),x("&:last-child",[c("step-splitor","display: none;")])]),c("step-splitor",`
 background-color: var(--n-splitor-color);
 margin-top: calc(var(--n-step-header-font-size) / 2);
 height: 1px;
 flex: 1;
 align-self: flex-start;
 margin-left: 12px;
 margin-right: 12px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),c("step-content","flex: 1;",[c("step-content-header",`
 color: var(--n-header-text-color);
 margin-top: calc(var(--n-indicator-size) / 2 - var(--n-step-header-font-size) / 2);
 line-height: var(--n-step-header-font-size);
 font-size: var(--n-step-header-font-size);
 position: relative;
 display: flex;
 font-weight: var(--n-step-header-font-weight);
 margin-left: 9px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `,[w("title",`
 white-space: nowrap;
 flex: 0;
 `)]),w("description",`
 color: var(--n-description-text-color);
 margin-top: 12px;
 margin-left: 9px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),c("step-indicator",`
 background-color: var(--n-indicator-color);
 box-shadow: 0 0 0 1px var(--n-indicator-border-color);
 height: var(--n-indicator-size);
 width: var(--n-indicator-size);
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[c("step-indicator-slot",`
 position: relative;
 width: var(--n-indicator-icon-size);
 height: var(--n-indicator-icon-size);
 font-size: var(--n-indicator-icon-size);
 line-height: var(--n-indicator-icon-size);
 `,[w("index",`
 display: inline-block;
 text-align: center;
 position: absolute;
 left: 0;
 top: 0;
 font-size: var(--n-indicator-index-font-size);
 width: var(--n-indicator-icon-size);
 height: var(--n-indicator-icon-size);
 line-height: var(--n-indicator-icon-size);
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[U()]),c("icon",`
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[U()]),c("base-icon",`
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[U()])])]),I("vertical","flex-direction: column;",[ne("show-description",[x(">",[c("step","padding-bottom: 8px;")])]),x(">",[c("step","margin-bottom: 16px;",[x("&:last-child","margin-bottom: 0;"),x(">",[c("step-indicator",[x(">",[c("step-splitor",`
 position: absolute;
 bottom: -8px;
 width: 1px;
 margin: 0 !important;
 left: calc(var(--n-indicator-size) / 2);
 height: calc(100% - var(--n-indicator-size));
 `)])]),c("step-content",[w("description","margin-top: 8px;")])])])])])]);function ye(t,n){return typeof t!="object"||t===null||Array.isArray(t)?null:(t.props||(t.props={}),t.props.internalIndex=n+1,t)}function we(t){return t.map((n,i)=>ye(n,i))}const Ce=Object.assign(Object.assign({},q.props),{current:Number,status:{type:String,default:"process"},size:{type:String,default:"medium"},vertical:Boolean,"onUpdate:current":[Function,Array],onUpdateCurrent:[Function,Array]}),H=se("n-steps");var Se=b({name:"Steps",props:Ce,setup(t,{slots:n}){const{mergedClsPrefixRef:i}=j(t),s=q("Steps","-steps",ze,ae,t,i);return A(H,{props:t,mergedThemeRef:s,mergedClsPrefixRef:i,stepsSlots:n}),{mergedClsPrefix:i}},render(){const{mergedClsPrefix:t}=this;return o("div",{class:[`${t}-steps`,this.vertical&&`${t}-steps--vertical`]},we(re(ie(this))))}});const Ne={status:String,title:String,description:String,disabled:Boolean,internalIndex:{type:Number,default:0}};var k=b({name:"Step",props:Ne,setup(t){const n=M(H,null);n||oe("step","`n-step` must be placed inside `n-steps`.");const{inlineThemeDisabled:i}=j(),{props:s,mergedThemeRef:v,mergedClsPrefixRef:r,stepsSlots:f}=n,a=z(()=>s.vertical),N=z(()=>{const{status:l}=t;if(l)return l;{const{internalIndex:u}=t,{current:g}=s;if(g===void 0)return"process";if(u<g)return"finish";if(u===g)return s.status||"process";if(u>g)return"wait"}return"process"}),P=z(()=>{const{value:l}=N,{size:u}=s,{common:{cubicBezierEaseInOut:g},self:{stepHeaderFontWeight:K,[m("stepHeaderFontSize",u)]:W,[m("indicatorIndexFontSize",u)]:L,[m("indicatorSize",u)]:G,[m("indicatorIconSize",u)]:J,[m("indicatorTextColor",l)]:X,[m("indicatorBorderColor",l)]:Y,[m("headerTextColor",l)]:Q,[m("splitorColor",l)]:Z,[m("indicatorColor",l)]:ee,[m("descriptionTextColor",l)]:te}}=v.value;return{"--n-bezier":g,"--n-description-text-color":te,"--n-header-text-color":Q,"--n-indicator-border-color":Y,"--n-indicator-color":ee,"--n-indicator-icon-size":J,"--n-indicator-index-font-size":L,"--n-indicator-size":G,"--n-indicator-text-color":X,"--n-splitor-color":Z,"--n-step-header-font-size":W,"--n-step-header-font-weight":K}}),h=i?le("step",z(()=>{const{value:l}=N,{size:u}=s;return`${l[0]}${u[0]}`}),P,s):void 0,O=z(()=>{if(t.disabled)return;const{onUpdateCurrent:l,"onUpdate:current":u}=s;return l||u?()=>{l&&_(l,t.internalIndex),u&&_(u,t.internalIndex)}:void 0});return{stepsSlots:f,mergedClsPrefix:r,vertical:a,mergedStatus:N,handleStepClick:O,cssVars:i?void 0:P,themeClass:h?.themeClass,onRender:h?.onRender}},render(){const{mergedClsPrefix:t,onRender:n,handleStepClick:i,disabled:s}=this,v=E(this.$slots.default,r=>{const f=r||this.description;return f?o("div",{class:`${t}-step-content__description`},f):null});return n?.(),o("div",{class:[`${t}-step`,s&&`${t}-step--disabled`,!s&&i&&`${t}-step--clickable`,this.themeClass,v&&`${t}-step--show-description`,`${t}-step--${this.mergedStatus}-status`],style:this.cssVars,onClick:i},o("div",{class:`${t}-step-indicator`},o("div",{class:`${t}-step-indicator-slot`},o(ce,null,{default:()=>E(this.$slots.icon,r=>{const{mergedStatus:f,stepsSlots:a}=this;return f==="finish"||f==="error"?f==="finish"?o(R,{clsPrefix:t,key:"finish"},{default:()=>$(a["finish-icon"],()=>[o(xe,null)])}):f==="error"?o(R,{clsPrefix:t,key:"error"},{default:()=>$(a["error-icon"],()=>[o(de,null)])}):null:r||o("div",{key:this.internalIndex,class:`${t}-step-indicator-slot__index`},this.internalIndex)})})),this.vertical?o("div",{class:`${t}-step-splitor`}):null),o("div",{class:`${t}-step-content`},o("div",{class:`${t}-step-content-header`},o("div",{class:`${t}-step-content-header__title`},$(this.$slots.title,()=>[this.title])),this.vertical?null:o("div",{class:`${t}-step-splitor`})),v))}});const Ie="_full_1tlcw_1";var Ue={full:Ie};const $e=()=>M("configs");var qe=b({setup(){ue(()=>{pe()&&fe()});const t=T({});ve(async()=>{const i=await C.api.init.configs.default.get();Object.assign(t,i)}),A("configs",t);const n=y(0);return()=>e("div",{class:Ue.full},[e(me,{title:"\u521D\u59CB\u5316",class:"modal-card sm m-auto form-card"},{default:()=>[e(Se,{size:"small",current:n.value},{default:()=>[e(k,{status:n.value>0?"finish":"process",title:"\u7AD9\u70B9\u8BBE\u7F6E",description:"\u5148\u8BBE\u7F6E\u4E00\u4E0B\u7AD9\u70B9\u76F8\u5173\u914D\u7F6E\u5427"},null),e(k,{status:n.value>1?"finish":n.value<1?"wait":"process",title:"\u4E3B\u4EBA\u4FE1\u606F",description:"\u8BF7\u544A\u8BC9\u4F60\u7684\u540D\u5B57"},null),e(k,{status:n.value>2?"finish":n.value<2?"wait":"process",title:"(\u0E51\u2022\u0300\u3142\u2022\u0301)\u0648\u2727",description:"\u4E00\u5207\u5C31\u7EEA\u4E86"},null)]}),e("div",{class:"mt-[3.5rem]"},[JSON.stringify(t)==="{}"?e("div",{class:"text-center py-4"},[e(he,null,null)]):o([ke,Te,Fe][n.value],{onNext(){n.value++}})])]})])}});const B={onNext:{type:Function,required:!0}},ke=b({props:B,setup(t){const n=$e(),i=y(n?.seo?.title||""),s=y(n?.seo?.keywords),v=y(n?.seo?.description||""),r=T({adminUrl:`${location.origin}/qaqdmin`,serverUrl:`${location.origin}/api/v2`,webUrl:location.origin,wsUrl:location.origin}),f=async()=>{await Promise.all([C.api.init.configs("seo").patch({data:{title:i.value,keywords:s.value,description:v.value}}),C.api.init.configs("url").patch({data:{...r}})]),t.onNext()};return()=>e(D,null,{default:()=>[e(d,{label:"\u7AD9\u70B9\u6807\u9898",required:!0},{default:()=>[e(p,{value:i.value,onUpdateValue:a=>void(i.value=a)},null)]}),e(d,{label:"\u7AD9\u70B9\u63CF\u8FF0",required:!0},{default:()=>[e(p,{value:v.value,onUpdateValue:a=>void(v.value=a)},null)]}),e(d,{label:"\u5173\u952E\u5B57"},{default:()=>[e(be,{value:s.value,onUpdateValue:a=>void(s.value=a)},null)]}),e(d,{label:"\u524D\u7AEF\u5730\u5740"},{default:()=>[e(p,{value:r.webUrl,onInput:a=>void(r.webUrl=a)},null)]}),e(d,{label:"API \u5730\u5740"},{default:()=>[e(p,{value:r.serverUrl,onInput:a=>void(r.serverUrl=a)},null)]}),e(d,{label:"\u540E\u53F0\u5730\u5740"},{default:()=>[e(p,{value:r.adminUrl,onInput:a=>void(r.adminUrl=a)},null)]}),e(d,{label:"Gateway \u5730\u5740"},{default:()=>[e(p,{value:r.wsUrl,onInput:a=>void(r.wsUrl=a)},null)]}),e(F,{justify:"end"},{default:()=>[e(V,{onClick:f,round:!0,type:"primary"},{default:()=>[S("\u4E0B\u4E00\u6B65")]})]})]})}}),Te=b({props:B,setup(t){const n=T({}),i=y(""),s=ge(),v=async()=>{if(i.value!==n.password){s.error("\u4E24\u6B21\u5BC6\u7801\u4E0D\u4E00\u81F4");return}await C.api.user.register.post({data:{...n}}),t.onNext()};return()=>e(D,null,{default:()=>[e(d,{label:"\u4F60\u7684\u540D\u5B57 (\u767B\u5F55\u51ED\u8BC1)",required:!0},{default:()=>[e(p,{value:n.username,onUpdateValue:r=>{n.username=r}},null)]}),e(d,{label:"\u6635\u79F0"},{default:()=>[e(p,{value:n.name,onUpdateValue:r=>{n.name=r}},null)]}),e(d,{label:"\u90AE\u7BB1",required:!0},{default:()=>[e(p,{value:n.mail,onUpdateValue:r=>{n.mail=r}},null)]}),e(d,{label:"\u5BC6\u7801",required:!0},{default:()=>[e(p,{value:n.password,type:"password",onUpdateValue:r=>{n.password=r}},null)]}),e(d,{label:"\u786E\u8BA4\u5BC6\u7801",required:!0},{default:()=>[e(p,{value:i.value,type:"password",onUpdateValue:r=>{i.value=r}},null)]}),e(d,{label:"\u4E2A\u4EBA\u9996\u9875"},{default:()=>[e(p,{value:n.url,onUpdateValue:r=>{n.url=r}},null)]}),e(d,{label:"\u5934\u50CF"},{default:()=>[e(p,{value:n.avatar,onUpdateValue:r=>{n.avatar=r}},null)]}),e(d,{label:"\u4E2A\u4EBA\u4ECB\u7ECD"},{default:()=>[e(p,{value:n.introduce,onUpdateValue:r=>{n.introduce=r}},null)]}),e(F,{justify:"end"},{default:()=>[e(V,{disabled:!n.username||!n.mail||!n.password||!i.value,onClick:v,round:!0,type:"primary"},{default:()=>[S("\u4E0B\u4E00\u6B65")]})]})]})}}),Fe=b({props:B,setup(){return()=>e(F,{class:"text-center",vertical:!0},{default:()=>[e("span",{class:"text-base"},[S("\u4F60\u5DF2\u7ECF\u5B8C\u6210\u4E86\u6240\u6709\u7684\u6B65\u9AA4\uFF0C\u5E72\u5F97\u6F02\u4EAE\u3002")]),e(V,{type:"primary",round:!0,onClick:()=>{localStorage.setItem("to-setting","true"),location.reload()}},{default:()=>[S("LINK START")]})]})}});export{qe as default};
