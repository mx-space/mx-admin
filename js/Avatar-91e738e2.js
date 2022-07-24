import{o as V}from"./utils-aa18f176.js";import{a as A}from"./Tag-efe4d54a.js";import{T as K,a4 as F,aW as _,a6 as O,aX as G,a5 as $,f as X,V as Y,H as v,X as B,n as z,a7 as W,w as D,Y as Q,m as U,aO as q,O as J,$ as y,a0 as Z,aQ as ee,dc as re,ao as oe,br as te}from"./index-8cc1a1a4.js";const I=!1,ne=K("n-avatar-group"),ae=F("avatar",`
 width: var(--n-merged-size);
 height: var(--n-merged-size);
 color: #FFF;
 font-size: var(--n-font-size);
 display: inline-flex;
 position: relative;
 overflow: hidden;
 text-align: center;
 border: var(--n-border);
 border-radius: var(--n-border-radius);
 --n-merged-color: var(--n-color);
 background-color: var(--n-merged-color);
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
`,[_(O("&","--n-merged-color: var(--n-color-modal);")),G(O("&","--n-merged-color: var(--n-color-popover);")),O("img",`
 width: 100%;
 height: 100%;
 `),$("text",`
 white-space: nowrap;
 display: inline-block;
 position: absolute;
 left: 50%;
 top: 50%;
 `),F("icon",`
 vertical-align: bottom;
 font-size: calc(var(--n-merged-size) - 6px);
 `),$("text","line-height: 1.25")]),se=Object.assign(Object.assign({},W.props),{size:[String,Number],src:String,circle:{type:Boolean,default:void 0},objectFit:String,round:{type:Boolean,default:void 0},bordered:{type:Boolean,default:void 0},onError:Function,fallbackSrc:String,intersectionObserverOptions:Object,lazy:Boolean,color:String}),ce=X({name:"Avatar",props:se,setup(o){const{mergedClsPrefixRef:s,inlineThemeDisabled:R}=Y(o),n=v(!1);let i=null;const h=v(null),l=v(null),x=()=>{const{value:e}=h;if(e&&(i===null||i!==e.innerHTML)){i=e.innerHTML;const{value:r}=l;if(r){const{offsetWidth:b,offsetHeight:a}=r,{offsetWidth:t,offsetHeight:L}=e,p=.9,j=Math.min(b/t*p,a/L*p,1);e.style.transform=`translateX(-50%) translateY(-50%) scale(${j})`}}},m=B(ne,null),d=z(()=>{const{size:e}=o;if(e)return e;const{size:r}=m||{};return r||"medium"}),c=W("Avatar","-avatar",ae,re,o,s),g=B(A,null),f=z(()=>{if(m)return!0;const{round:e,circle:r}=o;return e!==void 0||r!==void 0?e||r:g?g.roundRef.value:!1}),C=z(()=>m?!0:o.bordered||!1),M=e=>{if(!S.value)return;n.value=!0;const{onError:r}=o;r&&r(e)};D(()=>o.src,()=>n.value=!1);const T=z(()=>{const e=d.value,r=f.value,b=C.value,{color:a}=o,{self:{borderRadius:t,fontSize:L,color:p,border:j,colorModal:N,colorPopover:P},common:{cubicBezierEaseInOut:k}}=c.value;let E;return typeof e=="number"?E=`${e}px`:E=c.value.self[oe("height",e)],{"--n-font-size":L,"--n-border":b?j:"none","--n-border-radius":r?"50%":t,"--n-color":a||p,"--n-color-modal":a||N,"--n-color-popover":a||P,"--n-bezier":k,"--n-merged-size":`var(--n-avatar-size-override, ${E})`}}),u=R?Q("avatar",z(()=>{const e=d.value,r=f.value,b=C.value,{color:a}=o;let t="";return e&&(typeof e=="number"?t+=`a${e}`:t+=e[0]),r&&(t+="b"),b&&(t+="c"),a&&(t+=te(a)),t}),T,o):void 0,H=v(null),S=v(!o.lazy);U(()=>{if(I)return;let e;const r=q(()=>{e?.(),e=void 0,o.lazy&&(e=V(H.value,o.intersectionObserverOptions,S))});J(()=>{r(),e?.()})});const w=v(!o.lazy);return{textRef:h,selfRef:l,mergedRoundRef:f,mergedClsPrefix:s,fitTextTransform:x,cssVars:R?void 0:T,themeClass:u?.themeClass,onRender:u?.onRender,hasLoadError:n,handleError:M,imageRef:H,shouldStartLoading:S,loaded:w,mergedOnLoad:e=>{const{onLoad:r}=o;r?.(e),w.value=!0}}},render(){var o,s;const{$slots:R,src:n,mergedClsPrefix:i,lazy:h,onRender:l,mergedOnLoad:x,shouldStartLoading:m,loaded:d}=this;l?.();let c;const g=(s=(o=this.$slots).placeholder)===null||s===void 0?void 0:s.call(o);return this.hasLoadError?c=y("img",{src:this.fallbackSrc,style:{objectFit:this.objectFit}}):c=Z(R.default,f=>{if(f)return y(ee,{onResize:this.fitTextTransform},{default:()=>y("span",{ref:"textRef",class:`${i}-avatar__text`},f)});if(n)return y("img",{loading:h?"lazy":"eager",ref:"imageRef",src:I||m||d?n:void 0,onLoad:x,"data-image-src":n,onError:this.handleError,style:[{objectFit:this.objectFit},g&&!d?{height:"0",width:"0",visibility:"hidden"}:""]})}),y("span",{ref:"selfRef",class:[`${i}-avatar`,this.themeClass],style:this.cssVars},c,h&&!d&&g)}});export{ce as N};
