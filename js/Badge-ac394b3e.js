import{f as C,H as f,n as v,w as Y,Z as N,$ as r,b6 as S,a6 as s,bW as T,a4 as d,cH as I,ag as c,a5 as A,by as W,cv as F,cI as M,bn as _,aF as B,V as L,a7 as k,m as V,am as q,Y as D,ay as X,_ as H,cJ as Z,cq as j,ao as U,br as G}from"./index-f417bb43.js";import{g as J}from"./Select-aacc6a00.js";var z=C({name:"SlotMachineNumber",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],required:!0},oldOriginalNumber:{type:Number,default:void 0},newOriginalNumber:{type:Number,default:void 0}},setup(e){const t=f(null),i=f(e.value),l=f(e.value),n=f("up"),a=f(!1),m=v(()=>a.value?`${e.clsPrefix}-base-slot-machine-current-number--${n.value}-scroll`:null),b=v(()=>a.value?`${e.clsPrefix}-base-slot-machine-old-number--${n.value}-scroll`:null);Y(N(e,"value"),(o,u)=>{i.value=u,l.value=o,S($)});function $(){const o=e.newOriginalNumber,u=e.oldOriginalNumber;u===void 0||o===void 0||(o>u?g("up"):u>o&&g("down"))}function g(o){n.value=o,a.value=!1,S(()=>{var u;(u=t.value)===null||u===void 0||u.offsetWidth,a.value=!0})}return()=>{const{clsPrefix:o}=e;return r("span",{ref:t,class:`${o}-base-slot-machine-number`},i.value!==null?r("span",{class:[`${o}-base-slot-machine-old-number ${o}-base-slot-machine-old-number--top`,b.value]},i.value):null,r("span",{class:[`${o}-base-slot-machine-current-number`,m.value]},r("span",{ref:"numberWrapper",class:[`${o}-base-slot-machine-current-number__inner`,typeof e.value!="number"&&`${o}-base-slot-machine-current-number__inner--not-number`]},l.value)),i.value!==null?r("span",{class:[`${o}-base-slot-machine-old-number ${o}-base-slot-machine-old-number--bottom`,b.value]},i.value):null)}}});const{cubicBezierEaseOut:h}=T;function K({duration:e=".2s"}={}){return[s("&.fade-up-width-expand-transition-leave-active",{transition:`
 opacity ${e} ${h},
 max-width ${e} ${h},
 transform ${e} ${h}
 `}),s("&.fade-up-width-expand-transition-enter-active",{transition:`
 opacity ${e} ${h},
 max-width ${e} ${h},
 transform ${e} ${h}
 `}),s("&.fade-up-width-expand-transition-enter-to",{opacity:1,transform:"translateX(0) translateY(0)"}),s("&.fade-up-width-expand-transition-enter-from",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"}),s("&.fade-up-width-expand-transition-leave-from",{opacity:1,transform:"translateY(0)"}),s("&.fade-up-width-expand-transition-leave-to",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"})]}var Q=s([s("@keyframes n-base-slot-machine-fade-up-in",`
 from {
 transform: translateY(60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),s("@keyframes n-base-slot-machine-fade-down-in",`
 from {
 transform: translateY(-60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),s("@keyframes n-base-slot-machine-fade-up-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(-60%);
 opacity: 0;
 }
 `),s("@keyframes n-base-slot-machine-fade-down-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(60%);
 opacity: 0;
 }
 `),d("base-slot-machine",`
 overflow: hidden;
 white-space: nowrap;
 display: inline-block;
 height: 18px;
 line-height: 18px;
 `,[d("base-slot-machine-number",`
 display: inline-block;
 position: relative;
 height: 18px;
 width: .6em;
 max-width: .6em;
 `,[K({duration:".2s"}),I({duration:".2s",delay:"0s"}),d("base-slot-machine-old-number",`
 display: inline-block;
 opacity: 0;
 position: absolute;
 left: 0;
 right: 0;
 `,[c("top",{transform:"translateY(-100%)"}),c("bottom",{transform:"translateY(100%)"}),c("down-scroll",{animation:"n-base-slot-machine-fade-down-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),c("up-scroll",{animation:"n-base-slot-machine-fade-up-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1})]),d("base-slot-machine-current-number",`
 display: inline-block;
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 1;
 transform: translateY(0);
 width: .6em;
 `,[c("down-scroll",{animation:"n-base-slot-machine-fade-down-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),c("up-scroll",{animation:"n-base-slot-machine-fade-up-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),A("inner",`
 display: inline-block;
 position: absolute;
 right: 0;
 top: 0;
 width: .6em;
 `,[c("not-number",`
 right: unset;
 left: 0;
 `)])])])])]),ee=C({name:"BaseSlotMachine",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],default:0},max:{type:Number,default:void 0},appeared:{type:Boolean,required:!0}},setup(e){W("-base-slot-machine",Q,N(e,"clsPrefix"));const t=f(),i=f(),l=v(()=>{if(typeof e.value=="string")return[];if(e.value<1)return[0];const n=[];let a=e.value;for(e.max!==void 0&&(a=Math.min(e.max,a));a>=1;)n.push(a%10),a/=10,a=Math.floor(a);return n.reverse(),n});return Y(N(e,"value"),(n,a)=>{typeof n=="string"?(i.value=void 0,t.value=void 0):typeof a=="string"?(i.value=n,t.value=void 0):(i.value=n,t.value=a)}),()=>{const{value:n,clsPrefix:a}=e;return typeof n=="number"?r("span",{class:`${a}-base-slot-machine`},r(M,{name:"fade-up-width-expand-transition",tag:"span"},{default:()=>l.value.map((m,b)=>r(z,{clsPrefix:a,key:l.value.length-b-1,oldOriginalNumber:t.value,newOriginalNumber:i.value,value:m}))}),r(F,{key:"+",width:!0},{default:()=>e.max!==void 0&&e.max<n?r(z,{clsPrefix:a,value:"+"}):null})):r("span",{class:`${a}-base-slot-machine`},n)}}});const ae=e=>{const{errorColor:t,infoColor:i,successColor:l,warningColor:n,fontFamily:a}=e;return{color:t,colorInfo:i,colorSuccess:l,colorError:t,colorWarning:n,fontSize:"12px",fontFamily:a}},ne={name:"Badge",common:_,self:ae};var te=ne,ie=s([s("@keyframes badge-wave-spread",{from:{boxShadow:"0 0 0.5px 0px var(--n-ripple-color)",opacity:.6},to:{boxShadow:"0 0 0.5px 4.5px var(--n-ripple-color)",opacity:0}}),d("badge",`
 display: inline-flex;
 position: relative;
 vertical-align: middle;
 color: var(--n-color);
 font-family: var(--n-font-family);
 `,[c("as-is",[d("badge-sup",{position:"static",transform:"translateX(0)"},[B({transformOrigin:"left bottom",originalTransform:"translateX(0)"})])]),c("dot",[d("badge-sup",`
 height: 8px;
 width: 8px;
 padding: 0;
 min-width: 8px;
 left: 100%;
 bottom: calc(100% - 4px);
 `,[s("::before","border-radius: 4px;")])]),d("badge-sup",`
 background: var(--n-color);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 color: #FFF;
 position: absolute;
 height: 18px;
 line-height: 18px;
 border-radius: 9px;
 padding: 0 6px;
 text-align: center;
 font-size: var(--n-font-size);
 transform: translateX(-50%);
 left: 100%;
 bottom: calc(100% - 9px);
 font-variant-numeric: tabular-nums;
 z-index: 1;
 display: flex;
 align-items: center;
 `,[B({transformOrigin:"left bottom",originalTransform:"translateX(-50%)"}),d("base-wave",{zIndex:1,animationDuration:"2s",animationIterationCount:"infinite",animationDelay:"1s",animationTimingFunction:"var(--n-ripple-bezier)",animationName:"badge-wave-spread"}),s("&::before",`
 opacity: 0;
 transform: scale(1);
 border-radius: 9px;
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `)])])]);const oe=Object.assign(Object.assign({},k.props),{value:[String,Number],max:Number,dot:Boolean,type:{type:String,default:"default"},show:{type:Boolean,default:!0},showZero:Boolean,processing:Boolean,color:String});var le=C({name:"Badge",props:oe,setup(e,{slots:t}){const{mergedClsPrefixRef:i,inlineThemeDisabled:l,mergedRtlRef:n}=L(e),a=k("Badge","-badge",ie,te,e,i),m=f(!1),b=()=>{m.value=!0},$=()=>{m.value=!1},g=v(()=>e.show&&(e.dot||e.value!==void 0&&!(!e.showZero&&e.value<=0)||!j(t.value)));V(()=>{g.value&&(m.value=!0)});const o=q("Badge",n,i),u=v(()=>{const{type:y,color:x}=e,{common:{cubicBezierEaseInOut:w,cubicBezierEaseOut:E},self:{[U("color",y)]:R,fontFamily:O,fontSize:P}}=a.value;return{"--n-font-size":P,"--n-font-family":O,"--n-color":x||R,"--n-ripple-color":x||R,"--n-bezier":w,"--n-ripple-bezier":E}}),p=l?D("badge",v(()=>{let y="";const{type:x,color:w}=e;return x&&(y+=x[0]),w&&(y+=G(w)),y}),u,e):void 0;return{rtlEnabled:o,mergedClsPrefix:i,appeared:m,showBadge:g,handleAfterEnter:b,handleAfterLeave:$,cssVars:l?void 0:u,themeClass:p?.themeClass,onRender:p?.onRender}},render(){var e;const{mergedClsPrefix:t,onRender:i,themeClass:l,$slots:n}=this;i?.();const a=(e=n.default)===null||e===void 0?void 0:e.call(n);return r("div",{class:[`${t}-badge`,this.rtlEnabled&&`${t}-badge--rtl`,l,{[`${t}-badge--dot`]:this.dot,[`${t}-badge--as-is`]:!a}],style:this.cssVars},a,r(X,{name:"fade-in-scale-up-transition",onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave},{default:()=>this.showBadge?r("sup",{class:`${t}-badge-sup`,title:J(this.value)},H(n.value,()=>[this.dot?null:r(ee,{clsPrefix:t,appeared:this.appeared,max:this.max,value:this.value})]),this.processing?r(Z,{clsPrefix:t}):null):null}))}});export{le as N};
