import{o as k}from"./utils-aa18f176.js";import{a as A}from"./Tag-dcf5c411.js";import{T as K,a4 as w,aV as _,a6 as C,aW as G,a5 as F,f as X,V as Y,H as v,X as B,n as z,a7 as P,w as D,Y as U,m as q,aO as J,a$ as Q,$ as y,a0 as Z,aP as ee,db as re,ao as oe,br as te}from"./index-21204e7a.js";const I=!1,ae=K("n-avatar-group");var ne=w("avatar",`
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
`,[_(C("&","--n-merged-color: var(--n-color-modal);")),G(C("&","--n-merged-color: var(--n-color-popover);")),C("img",`
 width: 100%;
 height: 100%;
 `),F("text",`
 white-space: nowrap;
 display: inline-block;
 position: absolute;
 left: 50%;
 top: 50%;
 `),w("icon",`
 vertical-align: bottom;
 font-size: calc(var(--n-merged-size) - 6px);
 `),F("text","line-height: 1.25")]);const se=Object.assign(Object.assign({},P.props),{size:[String,Number],src:String,circle:{type:Boolean,default:void 0},objectFit:String,round:{type:Boolean,default:void 0},bordered:{type:Boolean,default:void 0},onError:Function,fallbackSrc:String,intersectionObserverOptions:Object,lazy:Boolean,color:String});var ce=X({name:"Avatar",props:se,setup(o){const{mergedClsPrefixRef:s,inlineThemeDisabled:R}=Y(o),a=v(!1);let i=null;const h=v(null),l=v(null),x=()=>{const{value:e}=h;if(e&&(i===null||i!==e.innerHTML)){i=e.innerHTML;const{value:r}=l;if(r){const{offsetWidth:b,offsetHeight:n}=r,{offsetWidth:t,offsetHeight:L}=e,p=.9,j=Math.min(b/t*p,n/L*p,1);e.style.transform=`translateX(-50%) translateY(-50%) scale(${j})`}}},m=B(ae,null),d=z(()=>{const{size:e}=o;if(e)return e;const{size:r}=m||{};return r||"medium"}),c=P("Avatar","-avatar",ne,re,o,s),g=B(A,null),f=z(()=>{if(m)return!0;const{round:e,circle:r}=o;return e!==void 0||r!==void 0?e||r:g?g.roundRef.value:!1}),O=z(()=>m?!0:o.bordered||!1),W=e=>{if(!S.value)return;a.value=!0;const{onError:r}=o;r&&r(e)};D(()=>o.src,()=>a.value=!1);const T=z(()=>{const e=d.value,r=f.value,b=O.value,{color:n}=o,{self:{borderRadius:t,fontSize:L,color:p,border:j,colorModal:M,colorPopover:N},common:{cubicBezierEaseInOut:V}}=c.value;let E;return typeof e=="number"?E=`${e}px`:E=c.value.self[oe("height",e)],{"--n-font-size":L,"--n-border":b?j:"none","--n-border-radius":r?"50%":t,"--n-color":n||p,"--n-color-modal":n||M,"--n-color-popover":n||N,"--n-bezier":V,"--n-merged-size":`var(--n-avatar-size-override, ${E})`}}),u=R?U("avatar",z(()=>{const e=d.value,r=f.value,b=O.value,{color:n}=o;let t="";return e&&(typeof e=="number"?t+=`a${e}`:t+=e[0]),r&&(t+="b"),b&&(t+="c"),n&&(t+=te(n)),t}),T,o):void 0,H=v(null),S=v(!o.lazy);q(()=>{if(I)return;let e;const r=J(()=>{e?.(),e=void 0,o.lazy&&(e=k(H.value,o.intersectionObserverOptions,S))});Q(()=>{r(),e?.()})});const $=v(!o.lazy);return{textRef:h,selfRef:l,mergedRoundRef:f,mergedClsPrefix:s,fitTextTransform:x,cssVars:R?void 0:T,themeClass:u?.themeClass,onRender:u?.onRender,hasLoadError:a,handleError:W,imageRef:H,shouldStartLoading:S,loaded:$,mergedOnLoad:e=>{const{onLoad:r}=o;r?.(e),$.value=!0}}},render(){var o,s;const{$slots:R,src:a,mergedClsPrefix:i,lazy:h,onRender:l,mergedOnLoad:x,shouldStartLoading:m,loaded:d}=this;l?.();let c;const g=(s=(o=this.$slots).placeholder)===null||s===void 0?void 0:s.call(o);return this.hasLoadError?c=y("img",{src:this.fallbackSrc,style:{objectFit:this.objectFit}}):c=Z(R.default,f=>{if(f)return y(ee,{onResize:this.fitTextTransform},{default:()=>y("span",{ref:"textRef",class:`${i}-avatar__text`},f)});if(a)return y("img",{loading:h?"lazy":"eager",ref:"imageRef",src:I||m||d?a:void 0,onLoad:x,"data-image-src":a,onError:this.handleError,style:[{objectFit:this.objectFit},g&&!d?{height:"0",width:"0",visibility:"hidden"}:""]})}),y("span",{ref:"selfRef",class:[`${i}-avatar`,this.themeClass],style:this.cssVars},c,h&&!d&&g)}});export{ce as N};
