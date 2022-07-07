import{m as Xe,a_ as nn,a$ as dn,f as se,$ as a,a4 as C,a5 as k,a6 as Y,V as un,a7 as ae,U as cn,X as Je,b0 as Ln,n as M,Y as Ee,a1 as fn,b1 as Dn,ao as te,b2 as en,ak as We,ay as hn,az as ye,ag as K,af as Ye,aF as vn,Z as D,b3 as Vn,H as R,w as Te,a8 as tn,b4 as jn,a0 as Hn,aN as Kn,at as Wn,aQ as Un,_ as qn,aA as Be,b5 as Gn,b6 as bn,ar as Zn,b7 as Ue,b8 as Yn,aO as Qn,b9 as Xn,ba as on,q as Jn,F as et,bb as nt,aj as ln,bc as tt,ai as ot,bd as it,be as Qe,av as lt,aw as rt,ax as at,bf as st,bg as dt,bh as rn,bi as ut,bj as ct,aH as ft,ac as X}from"./index-51fd5686.js";import{F as ht,N as qe}from"./Tag-8f667f32.js";function vt(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function Ge(e){const i=e.filter(l=>l!==void 0);if(i.length!==0)return i.length===1?i[0]:l=>{e.forEach(u=>{u&&u(l)})}}function gn(e,i){i&&(Xe(()=>{const{value:l}=e;l&&nn.registerHandler(l,i)}),dn(()=>{const{value:l}=e;l&&nn.unregisterHandler(l)}))}var bt=se({name:"Empty",render(){return a("svg",{viewBox:"0 0 28 28",fill:"none",xmlns:"http://www.w3.org/2000/svg"},a("path",{d:"M26 7.5C26 11.0899 23.0899 14 19.5 14C15.9101 14 13 11.0899 13 7.5C13 3.91015 15.9101 1 19.5 1C23.0899 1 26 3.91015 26 7.5ZM16.8536 4.14645C16.6583 3.95118 16.3417 3.95118 16.1464 4.14645C15.9512 4.34171 15.9512 4.65829 16.1464 4.85355L18.7929 7.5L16.1464 10.1464C15.9512 10.3417 15.9512 10.6583 16.1464 10.8536C16.3417 11.0488 16.6583 11.0488 16.8536 10.8536L19.5 8.20711L22.1464 10.8536C22.3417 11.0488 22.6583 11.0488 22.8536 10.8536C23.0488 10.6583 23.0488 10.3417 22.8536 10.1464L20.2071 7.5L22.8536 4.85355C23.0488 4.65829 23.0488 4.34171 22.8536 4.14645C22.6583 3.95118 22.3417 3.95118 22.1464 4.14645L19.5 6.79289L16.8536 4.14645Z",fill:"currentColor"}),a("path",{d:"M25 22.75V12.5991C24.5572 13.0765 24.053 13.4961 23.5 13.8454V16H17.5L17.3982 16.0068C17.0322 16.0565 16.75 16.3703 16.75 16.75C16.75 18.2688 15.5188 19.5 14 19.5C12.4812 19.5 11.25 18.2688 11.25 16.75L11.2432 16.6482C11.1935 16.2822 10.8797 16 10.5 16H4.5V7.25C4.5 6.2835 5.2835 5.5 6.25 5.5H12.2696C12.4146 4.97463 12.6153 4.47237 12.865 4H6.25C4.45507 4 3 5.45507 3 7.25V22.75C3 24.5449 4.45507 26 6.25 26H21.75C23.5449 26 25 24.5449 25 22.75ZM4.5 22.75V17.5H9.81597L9.85751 17.7041C10.2905 19.5919 11.9808 21 14 21L14.215 20.9947C16.2095 20.8953 17.842 19.4209 18.184 17.5H23.5V22.75C23.5 23.7165 22.7165 24.5 21.75 24.5H6.25C5.2835 24.5 4.5 23.7165 4.5 22.75Z",fill:"currentColor"}))}}),gt=se({props:{onFocus:Function,onBlur:Function},setup(e){return()=>a("div",{style:"width: 0; height: 0",tabindex:0,onFocus:e.onFocus,onBlur:e.onBlur})}}),pt=C("empty",`
 display: flex;
 flex-direction: column;
 align-items: center;
 font-size: var(--n-font-size);
`,[k("icon",`
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 line-height: var(--n-icon-size);
 color: var(--n-icon-color);
 transition:
 color .3s var(--n-bezier);
 `,[Y("+",[k("description",`
 margin-top: 8px;
 `)])]),k("description",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),k("extra",`
 text-align: center;
 transition: color .3s var(--n-bezier);
 margin-top: 12px;
 color: var(--n-extra-text-color);
 `)]);const mt=Object.assign(Object.assign({},ae.props),{description:String,showDescription:{type:Boolean,default:!0},showIcon:{type:Boolean,default:!0},size:{type:String,default:"medium"},renderIcon:Function});var wt=se({name:"Empty",props:mt,setup(e){const{mergedClsPrefixRef:i,inlineThemeDisabled:l}=un(e),u=ae("Empty","-empty",pt,Dn,e,i),{localeRef:f}=cn("Empty"),h=Je(Ln,null),v=M(()=>{var b,F,T;return(b=e.description)!==null&&b!==void 0?b:(T=(F=h?.mergedComponentPropsRef.value)===null||F===void 0?void 0:F.Empty)===null||T===void 0?void 0:T.description}),s=M(()=>{var b,F;return((F=(b=h?.mergedComponentPropsRef.value)===null||b===void 0?void 0:b.Empty)===null||F===void 0?void 0:F.renderIcon)||(()=>a(bt,null))}),_=M(()=>{const{size:b}=e,{common:{cubicBezierEaseInOut:F},self:{[te("iconSize",b)]:T,[te("fontSize",b)]:$,textColor:p,iconColor:z,extraTextColor:E}}=u.value;return{"--n-icon-size":T,"--n-font-size":$,"--n-bezier":F,"--n-text-color":p,"--n-icon-color":z,"--n-extra-text-color":E}}),S=l?Ee("empty",M(()=>{let b="";const{size:F}=e;return b+=F[0],b}),_,e):void 0;return{mergedClsPrefix:i,mergedRenderIcon:s,localizedDescription:M(()=>v.value||f.value.description),cssVars:l?void 0:_,themeClass:S?.themeClass,onRender:S?.onRender}},render(){const{$slots:e,mergedClsPrefix:i,onRender:l}=this;return l?.(),a("div",{class:[`${i}-empty`,this.themeClass],style:this.cssVars},this.showIcon?a("div",{class:`${i}-empty__icon`},e.icon?e.icon():a(fn,{clsPrefix:i},{default:this.mergedRenderIcon})):null,this.showDescription?a("div",{class:`${i}-empty__description`},e.default?e.default():this.localizedDescription):null,e.extra?a("div",{class:`${i}-empty__extra`},e.extra()):null)}});const yt=a(ht);function xt(e,i){return a(hn,{name:"fade-in-scale-up-transition"},{default:()=>e?a(fn,{clsPrefix:i,class:`${i}-base-select-option__check`},{default:()=>yt}):null})}var an=se({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:i,pendingTmNodeRef:l,multipleRef:u,valueSetRef:f,renderLabelRef:h,renderOptionRef:v,labelFieldRef:s,valueFieldRef:_,showCheckmarkRef:S,nodePropsRef:b,handleOptionClick:F,handleOptionMouseEnter:T}=Je(en),$=We(()=>{const{value:x}=l;return x?e.tmNode.key===x.key:!1});function p(x){const{tmNode:P}=e;P.disabled||F(x,P)}function z(x){const{tmNode:P}=e;P.disabled||T(x,P)}function E(x){const{tmNode:P}=e,{value:V}=$;P.disabled||V||T(x,P)}return{multiple:u,isGrouped:We(()=>{const{tmNode:x}=e,{parent:P}=x;return P&&P.rawNode.type==="group"}),showCheckmark:S,nodeProps:b,isPending:$,isSelected:We(()=>{const{value:x}=i,{value:P}=u;if(x===null)return!1;const V=e.tmNode.rawNode[_.value];if(P){const{value:W}=f;return W.has(V)}else return x===V}),labelField:s,renderLabel:h,renderOption:v,handleMouseMove:E,handleMouseEnter:z,handleClick:p}},render(){const{clsPrefix:e,tmNode:{rawNode:i},isSelected:l,isPending:u,isGrouped:f,showCheckmark:h,nodeProps:v,renderOption:s,renderLabel:_,handleClick:S,handleMouseEnter:b,handleMouseMove:F}=this,T=xt(l,e),$=_?[_(i,l),h&&T]:[ye(i[this.labelField],i,l),h&&T],p=v?.(i),z=a("div",Object.assign({},p,{class:[`${e}-base-select-option`,i.class,p?.class,{[`${e}-base-select-option--disabled`]:i.disabled,[`${e}-base-select-option--selected`]:l,[`${e}-base-select-option--grouped`]:f,[`${e}-base-select-option--pending`]:u,[`${e}-base-select-option--show-checkmark`]:h}],style:[p?.style||"",i.style||""],onClick:Ge([S,p?.onClick]),onMouseenter:Ge([b,p?.onMouseenter]),onMousemove:Ge([F,p?.onMousemove])}),a("div",{class:`${e}-base-select-option__content`},$));return i.render?i.render({node:z,option:i,selected:l}):s?s({node:z,option:i,selected:l}):z}}),sn=se({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:i,labelFieldRef:l,nodePropsRef:u}=Je(en);return{labelField:l,nodeProps:u,renderLabel:e,renderOption:i}},render(){const{clsPrefix:e,renderLabel:i,renderOption:l,nodeProps:u,tmNode:{rawNode:f}}=this,h=u?.(f),v=i?i(f,!1):ye(f[this.labelField],f,!1),s=a("div",Object.assign({},h,{class:[`${e}-base-select-group-header`,h?.class]}),v);return f.render?f.render({node:s,option:f}):l?l({node:s,option:f,selected:!1}):s}}),Ct=C("base-select-menu",`
 line-height: 1.5;
 outline: none;
 z-index: 0;
 position: relative;
 border-radius: var(--n-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-color);
`,[C("scrollbar",`
 max-height: var(--n-height);
 `),C("virtual-list",`
 max-height: var(--n-height);
 `),C("base-select-option",`
 min-height: var(--n-option-height);
 font-size: var(--n-option-font-size);
 display: flex;
 align-items: center;
 `,[k("content",`
 z-index: 1;
 white-space: nowrap;
 text-overflow: ellipsis;
 overflow: hidden;
 `)]),C("base-select-group-header",`
 min-height: var(--n-option-height);
 font-size: .93em;
 display: flex;
 align-items: center;
 `),C("base-select-menu-option-wrapper",`
 position: relative;
 width: 100%;
 `),k("loading, empty",`
 display: flex;
 padding: 12px 32px;
 flex: 1;
 justify-content: center;
 `),k("loading",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 `),k("action",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-top: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),C("base-select-group-header",`
 position: relative;
 cursor: default;
 padding: var(--n-option-padding);
 color: var(--n-group-header-text-color);
 `),C("base-select-option",`
 cursor: pointer;
 position: relative;
 padding: var(--n-option-padding);
 transition:
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 box-sizing: border-box;
 color: var(--n-option-text-color);
 opacity: 1;
 `,[K("show-checkmark",`
 padding-right: calc(var(--n-option-padding-right) + 20px);
 `),Y("&::before",`
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),Y("&:active",`
 color: var(--n-option-text-color-pressed);
 `),K("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),K("pending",[Y("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),K("selected",`
 color: var(--n-option-text-color-active);
 `,[Y("&::before",`
 background-color: var(--n-option-color-active);
 `),K("pending",[Y("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),K("disabled",`
 cursor: not-allowed;
 `,[Ye("selected",`
 color: var(--n-option-text-color-disabled);
 `),K("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),k("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[vn({enterScale:"0.5"})])])]),Ft=se({name:"InternalSelectMenu",props:Object.assign(Object.assign({},ae.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,onToggle:Function}),setup(e){const i=ae("InternalSelectMenu","-internal-select-menu",Ct,Vn,e,D(e,"clsPrefix")),l=R(null),u=R(null),f=R(null),h=M(()=>e.treeMate.getFlattenedNodes()),v=M(()=>Gn(h.value)),s=R(null);function _(){const{treeMate:t}=e;let d=null;const{value:B}=e;B===null?d=t.getFirstAvailableNode():(e.multiple?d=t.getNode((B||[])[(B||[]).length-1]):d=t.getNode(B),(!d||d.disabled)&&(d=t.getFirstAvailableNode())),q(d||null)}function S(){const{value:t}=s;t&&!e.treeMate.getNode(t.key)&&(s.value=null)}let b;Te(()=>e.show,t=>{t?b=Te(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?_():S(),bn(N)):S()},{immediate:!0}):b?.()},{immediate:!0}),dn(()=>{b?.()});const F=M(()=>Zn(i.value.self[te("optionHeight",e.size)])),T=M(()=>Ue(i.value.self[te("padding",e.size)])),$=M(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),p=M(()=>{const t=h.value;return t&&t.length===0});function z(t){const{onToggle:d}=e;d&&d(t)}function E(t){const{onScroll:d}=e;d&&d(t)}function x(t){var d;(d=f.value)===null||d===void 0||d.sync(),E(t)}function P(){var t;(t=f.value)===null||t===void 0||t.sync()}function V(){const{value:t}=s;return t||null}function W(t,d){d.disabled||q(d,!1)}function U(t,d){d.disabled||z(d)}function L(t){var d;Be(t,"action")||(d=e.onKeyup)===null||d===void 0||d.call(e,t)}function j(t){var d;Be(t,"action")||(d=e.onKeydown)===null||d===void 0||d.call(e,t)}function Q(t){var d;(d=e.onMousedown)===null||d===void 0||d.call(e,t),!e.focusable&&t.preventDefault()}function de(){const{value:t}=s;t&&q(t.getNext({loop:!0}),!0)}function J(){const{value:t}=s;t&&q(t.getPrev({loop:!0}),!0)}function q(t,d=!1){s.value=t,d&&N()}function N(){var t,d;const B=s.value;if(!B)return;const ne=v.value(B.key);ne!==null&&(e.virtualScroll?(t=u.value)===null||t===void 0||t.scrollTo({index:ne}):(d=f.value)===null||d===void 0||d.scrollTo({index:ne,elSize:F.value}))}function ue(t){var d,B;!((d=l.value)===null||d===void 0)&&d.contains(t.target)&&((B=e.onFocus)===null||B===void 0||B.call(e,t))}function ve(t){var d,B;!((d=l.value)===null||d===void 0)&&d.contains(t.relatedTarget)||(B=e.onBlur)===null||B===void 0||B.call(e,t)}tn(en,{handleOptionMouseEnter:W,handleOptionClick:U,valueSetRef:$,pendingTmNodeRef:s,nodePropsRef:D(e,"nodeProps"),showCheckmarkRef:D(e,"showCheckmark"),multipleRef:D(e,"multiple"),valueRef:D(e,"value"),renderLabelRef:D(e,"renderLabel"),renderOptionRef:D(e,"renderOption"),labelFieldRef:D(e,"labelField"),valueFieldRef:D(e,"valueField")}),tn(jn,l),Xe(()=>{const{value:t}=f;t&&t.sync()});const ce=M(()=>{const{size:t}=e,{common:{cubicBezierEaseInOut:d},self:{height:B,borderRadius:ne,color:xe,groupHeaderTextColor:Ce,actionDividerColor:Fe,optionTextColorPressed:be,optionTextColor:ge,optionTextColorDisabled:ie,optionTextColorActive:H,optionOpacityDisabled:pe,optionCheckColor:le,actionTextColor:Oe,optionColorPending:fe,optionColorActive:he,loadingColor:Se,loadingSize:Re,optionColorActivePending:Me,[te("optionFontSize",t)]:me,[te("optionHeight",t)]:we,[te("optionPadding",t)]:G}}=i.value;return{"--n-height":B,"--n-action-divider-color":Fe,"--n-action-text-color":Oe,"--n-bezier":d,"--n-border-radius":ne,"--n-color":xe,"--n-option-font-size":me,"--n-group-header-text-color":Ce,"--n-option-check-color":le,"--n-option-color-pending":fe,"--n-option-color-active":he,"--n-option-color-active-pending":Me,"--n-option-height":we,"--n-option-opacity-disabled":pe,"--n-option-text-color":ge,"--n-option-text-color-active":H,"--n-option-text-color-disabled":ie,"--n-option-text-color-pressed":be,"--n-option-padding":G,"--n-option-padding-left":Ue(G,"left"),"--n-option-padding-right":Ue(G,"right"),"--n-loading-color":Se,"--n-loading-size":Re}}),{inlineThemeDisabled:ee}=e,Z=ee?Ee("internal-select-menu",M(()=>e.size[0]),ce,e):void 0,oe={selfRef:l,next:de,prev:J,getPendingTmNode:V};return gn(l,e.onResize),Object.assign({mergedTheme:i,virtualListRef:u,scrollbarRef:f,itemSize:F,padding:T,flattenedNodes:h,empty:p,virtualListContainer(){const{value:t}=u;return t?.listElRef},virtualListContent(){const{value:t}=u;return t?.itemsElRef},doScroll:E,handleFocusin:ue,handleFocusout:ve,handleKeyUp:L,handleKeyDown:j,handleMouseDown:Q,handleVirtualListResize:P,handleVirtualListScroll:x,cssVars:ee?void 0:ce,themeClass:Z?.themeClass,onRender:Z?.onRender},oe)},render(){const{$slots:e,virtualScroll:i,clsPrefix:l,mergedTheme:u,themeClass:f,onRender:h}=this;return h?.(),a("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${l}-base-select-menu`,f,this.multiple&&`${l}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},this.loading?a("div",{class:`${l}-base-select-menu__loading`},a(Kn,{clsPrefix:l,strokeWidth:20})):this.empty?a("div",{class:`${l}-base-select-menu__empty`,"data-empty":!0},qn(e.empty,()=>[a(wt,{theme:u.peers.Empty,themeOverrides:u.peerOverrides.Empty})])):a(Wn,{ref:"scrollbarRef",theme:u.peers.Scrollbar,themeOverrides:u.peerOverrides.Scrollbar,scrollable:this.scrollable,container:i?this.virtualListContainer:void 0,content:i?this.virtualListContent:void 0,onScroll:i?void 0:this.doScroll},{default:()=>i?a(Un,{ref:"virtualListRef",class:`${l}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:v})=>v.isGroup?a(sn,{key:v.key,clsPrefix:l,tmNode:v}):v.ignored?null:a(an,{clsPrefix:l,key:v.key,tmNode:v})}):a("div",{class:`${l}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(v=>v.isGroup?a(sn,{key:v.key,clsPrefix:l,tmNode:v}):a(an,{clsPrefix:l,key:v.key,tmNode:v})))}),Hn(e.action,v=>v&&[a("div",{class:`${l}-base-select-menu__action`,"data-action":!0,key:"action"},v),a(gt,{onFocus:this.onTabOut,key:"focus-detector"})]))}}),Ot=Y([C("base-selection",`
 position: relative;
 z-index: auto;
 box-shadow: none;
 width: 100%;
 max-width: 100%;
 display: inline-block;
 vertical-align: bottom;
 border-radius: var(--n-border-radius);
 min-height: var(--n-height);
 line-height: 1.5;
 font-size: var(--n-font-size);
 `,[C("base-loading",`
 color: var(--n-loading-color);
 `),C("base-selection-tags","min-height: var(--n-height);"),k("border, state-border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 pointer-events: none;
 border: var(--n-border);
 border-radius: inherit;
 transition:
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),k("state-border",`
 z-index: 1;
 border-color: #0000;
 `),C("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[k("arrow",`
 font-size: var(--n-arrow-size);
 color: var(--n-arrow-color);
 transition: color .3s var(--n-bezier);
 `)]),C("base-selection-overlay",`
 display: flex;
 align-items: center;
 white-space: nowrap;
 pointer-events: none;
 position: absolute;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 padding: var(--n-padding-single);
 transition: color .3s var(--n-bezier);
 `,[k("wrapper",`
 flex-basis: 0;
 flex-grow: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 `)]),C("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `),C("base-selection-tags",`
 cursor: pointer;
 outline: none;
 box-sizing: border-box;
 position: relative;
 z-index: auto;
 display: flex;
 padding: var(--n-padding-multiple);
 flex-wrap: wrap;
 align-items: center;
 width: 100%;
 vertical-align: bottom;
 background-color: var(--n-color);
 border-radius: inherit;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),C("base-selection-label",`
 height: var(--n-height);
 display: inline-flex;
 width: 100%;
 vertical-align: bottom;
 cursor: pointer;
 outline: none;
 z-index: auto;
 box-sizing: border-box;
 position: relative;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 border-radius: inherit;
 background-color: var(--n-color);
 align-items: center;
 `,[C("base-selection-input",`
 font-size: inherit;
 line-height: inherit;
 outline: none;
 cursor: pointer;
 box-sizing: border-box;
 border:none;
 width: 100%;
 padding: var(--n-padding-single);
 background-color: #0000;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 caret-color: var(--n-caret-color);
 `,[k("content",`
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap; 
 `)]),k("render-label",`
 color: var(--n-text-color);
 `)]),Ye("disabled",[Y("&:hover",[k("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),K("focus",[k("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),K("active",[k("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),C("base-selection-label","background-color: var(--n-color-active);"),C("base-selection-tags","background-color: var(--n-color-active);")])]),K("disabled","cursor: not-allowed;",[k("arrow",`
 color: var(--n-arrow-color-disabled);
 `),C("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[C("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),k("render-label",`
 color: var(--n-text-color-disabled);
 `)]),C("base-selection-tags",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `),C("base-selection-placeholder",`
 cursor: not-allowed;
 color: var(--n-placeholder-color-disabled);
 `)]),C("base-selection-input-tag",`
 height: calc(var(--n-height) - 6px);
 line-height: calc(var(--n-height) - 6px);
 outline: none;
 display: none;
 position: relative;
 margin-bottom: 3px;
 max-width: 100%;
 vertical-align: bottom;
 `,[k("input",`
 font-size: inherit;
 font-family: inherit;
 min-width: 1px;
 padding: 0;
 background-color: #0000;
 outline: none;
 border: none;
 max-width: 100%;
 overflow: hidden;
 width: 1em;
 line-height: inherit;
 cursor: pointer;
 color: var(--n-text-color);
 caret-color: var(--n-caret-color);
 `),k("mirror",`
 position: absolute;
 left: 0;
 top: 0;
 white-space: pre;
 visibility: hidden;
 user-select: none;
 -webkit-user-select: none;
 opacity: 0;
 `)]),["warning","error"].map(e=>K(`${e}-status`,[k("state-border",`border: var(--n-border-${e});`),Ye("disabled",[Y("&:hover",[k("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),K("active",[k("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),C("base-selection-label",`background-color: var(--n-color-active-${e});`),C("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),K("focus",[k("state-border",`
 box-shadow: var(--n-box-shadow-focus-${e});
 border: var(--n-border-focus-${e});
 `)])])]))]),C("base-selection-popover",`
 margin-bottom: -3px;
 display: flex;
 flex-wrap: wrap;
 margin-right: -8px;
 `),C("base-selection-tag-wrapper",`
 max-width: 100%;
 display: inline-flex;
 padding: 0 7px 3px 0;
 `,[Y("&:last-child","padding-right: 0;"),C("tag",`
 font-size: 14px;
 max-width: 100%;
 `,[k("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),St=se({name:"InternalSelection",props:Object.assign(Object.assign({},ae.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,onResize:Function}),setup(e){const i=R(null),l=R(null),u=R(null),f=R(null),h=R(null),v=R(null),s=R(null),_=R(null),S=R(null),b=R(null),F=R(!1),T=R(!1),$=R(!1),p=ae("InternalSelection","-internal-selection",Ot,Yn,e,D(e,"clsPrefix")),z=M(()=>e.clearable&&!e.disabled&&($.value||e.active)),E=M(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):ye(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),x=M(()=>{const o=e.selectedOption;if(!!o)return o[e.labelField]}),P=M(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function V(){var o;const{value:c}=i;if(c){const{value:I}=l;I&&(I.style.width=`${c.offsetWidth}px`,e.maxTagCount!=="responsive"&&((o=S.value)===null||o===void 0||o.sync()))}}function W(){const{value:o}=b;o&&(o.style.display="none")}function U(){const{value:o}=b;o&&(o.style.display="inline-block")}Te(D(e,"active"),o=>{o||W()}),Te(D(e,"pattern"),()=>{e.multiple&&bn(V)});function L(o){const{onFocus:c}=e;c&&c(o)}function j(o){const{onBlur:c}=e;c&&c(o)}function Q(o){const{onDeleteOption:c}=e;c&&c(o)}function de(o){const{onClear:c}=e;c&&c(o)}function J(o){const{onPatternInput:c}=e;c&&c(o)}function q(o){var c;(!o.relatedTarget||!(!((c=u.value)===null||c===void 0)&&c.contains(o.relatedTarget)))&&L(o)}function N(o){var c;!((c=u.value)===null||c===void 0)&&c.contains(o.relatedTarget)||j(o)}function ue(o){de(o)}function ve(){$.value=!0}function ce(){$.value=!1}function ee(o){!e.active||!e.filterable||o.target!==l.value&&o.preventDefault()}function Z(o){Q(o)}function oe(o){if(o.key==="Backspace"&&!t.value&&!e.pattern.length){const{selectedOptions:c}=e;c?.length&&Z(c[c.length-1])}}const t=R(!1);let d=null;function B(o){const{value:c}=i;if(c){const I=o.target.value;c.textContent=I,V()}t.value?d=o:J(o)}function ne(){t.value=!0}function xe(){t.value=!1,J(d),d=null}function Ce(o){var c;T.value=!0,(c=e.onPatternFocus)===null||c===void 0||c.call(e,o)}function Fe(o){var c;T.value=!1,(c=e.onPatternBlur)===null||c===void 0||c.call(e,o)}function be(){var o,c;if(e.filterable)T.value=!1,(o=v.value)===null||o===void 0||o.blur(),(c=l.value)===null||c===void 0||c.blur();else if(e.multiple){const{value:I}=f;I?.blur()}else{const{value:I}=h;I?.blur()}}function ge(){var o,c,I;e.filterable?(T.value=!1,(o=v.value)===null||o===void 0||o.focus()):e.multiple?(c=f.value)===null||c===void 0||c.focus():(I=h.value)===null||I===void 0||I.focus()}function ie(){const{value:o}=l;o&&(U(),o.focus())}function H(){const{value:o}=l;o&&o.blur()}function pe(o){const{value:c}=s;c&&c.setTextContent(`+${o}`)}function le(){const{value:o}=_;return o}function Oe(){return l.value}let fe=null;function he(){fe!==null&&window.clearTimeout(fe)}function Se(){e.disabled||e.active||(he(),fe=window.setTimeout(()=>{F.value=!0},100))}function Re(){he()}function Me(o){o||(he(),F.value=!1)}Xe(()=>{Qn(()=>{const o=v.value;!o||(o.tabIndex=e.disabled||T.value?-1:0)})}),gn(u,e.onResize);const{inlineThemeDisabled:me}=e,we=M(()=>{const{size:o}=e,{common:{cubicBezierEaseInOut:c},self:{borderRadius:I,color:ze,placeholderColor:Ne,textColor:Ae,paddingSingle:Le,paddingMultiple:De,caretColor:Pe,colorDisabled:ke,textColorDisabled:Ve,placeholderColorDisabled:je,colorActive:He,boxShadowFocus:_e,boxShadowActive:re,boxShadowHover:n,border:r,borderFocus:g,borderHover:O,borderActive:m,arrowColor:y,arrowColorDisabled:w,loadingColor:A,colorActiveWarning:Ie,boxShadowFocusWarning:Ke,boxShadowActiveWarning:mn,boxShadowHoverWarning:wn,borderWarning:yn,borderFocusWarning:xn,borderHoverWarning:Cn,borderActiveWarning:Fn,colorActiveError:On,boxShadowFocusError:Sn,boxShadowActiveError:Rn,boxShadowHoverError:Mn,borderError:Tn,borderFocusError:zn,borderHoverError:Pn,borderActiveError:kn,clearColor:_n,clearColorHover:In,clearColorPressed:Bn,clearSize:$n,arrowSize:En,[te("height",o)]:Nn,[te("fontSize",o)]:An}}=p.value;return{"--n-bezier":c,"--n-border":r,"--n-border-active":m,"--n-border-focus":g,"--n-border-hover":O,"--n-border-radius":I,"--n-box-shadow-active":re,"--n-box-shadow-focus":_e,"--n-box-shadow-hover":n,"--n-caret-color":Pe,"--n-color":ze,"--n-color-active":He,"--n-color-disabled":ke,"--n-font-size":An,"--n-height":Nn,"--n-padding-single":Le,"--n-padding-multiple":De,"--n-placeholder-color":Ne,"--n-placeholder-color-disabled":je,"--n-text-color":Ae,"--n-text-color-disabled":Ve,"--n-arrow-color":y,"--n-arrow-color-disabled":w,"--n-loading-color":A,"--n-color-active-warning":Ie,"--n-box-shadow-focus-warning":Ke,"--n-box-shadow-active-warning":mn,"--n-box-shadow-hover-warning":wn,"--n-border-warning":yn,"--n-border-focus-warning":xn,"--n-border-hover-warning":Cn,"--n-border-active-warning":Fn,"--n-color-active-error":On,"--n-box-shadow-focus-error":Sn,"--n-box-shadow-active-error":Rn,"--n-box-shadow-hover-error":Mn,"--n-border-error":Tn,"--n-border-focus-error":zn,"--n-border-hover-error":Pn,"--n-border-active-error":kn,"--n-clear-size":$n,"--n-clear-color":_n,"--n-clear-color-hover":In,"--n-clear-color-pressed":Bn,"--n-arrow-size":En}}),G=me?Ee("internal-selection",M(()=>e.size[0]),we,e):void 0;return{mergedTheme:p,mergedClearable:z,patternInputFocused:T,filterablePlaceholder:E,label:x,selected:P,showTagsPanel:F,isCompositing:t,counterRef:s,counterWrapperRef:_,patternInputMirrorRef:i,patternInputRef:l,selfRef:u,multipleElRef:f,singleElRef:h,patternInputWrapperRef:v,overflowRef:S,inputTagElRef:b,handleMouseDown:ee,handleFocusin:q,handleClear:ue,handleMouseEnter:ve,handleMouseLeave:ce,handleDeleteOption:Z,handlePatternKeyDown:oe,handlePatternInputInput:B,handlePatternInputBlur:Fe,handlePatternInputFocus:Ce,handleMouseEnterCounter:Se,handleMouseLeaveCounter:Re,handleFocusout:N,handleCompositionEnd:xe,handleCompositionStart:ne,onPopoverUpdateShow:Me,focus:ge,focusInput:ie,blur:be,blurInput:H,updateCounter:pe,getCounter:le,getTail:Oe,renderLabel:e.renderLabel,cssVars:me?void 0:we,themeClass:G?.themeClass,onRender:G?.onRender}},render(){const{status:e,multiple:i,size:l,disabled:u,filterable:f,maxTagCount:h,bordered:v,clsPrefix:s,onRender:_,renderTag:S,renderLabel:b}=this;_?.();const F=h==="responsive",T=typeof h=="number",$=F||T,p=a(Xn,null,{default:()=>a(nt,{clsPrefix:s,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var E,x;return(x=(E=this.$slots).arrow)===null||x===void 0?void 0:x.call(E)}})});let z;if(i){const{labelField:E}=this,x=N=>a("div",{class:`${s}-base-selection-tag-wrapper`,key:N.value},S?S({option:N,handleClose:()=>this.handleDeleteOption(N)}):a(qe,{size:l,closable:!N.disabled,disabled:u,onClose:()=>this.handleDeleteOption(N),internalCloseFocusable:!1,internalStopClickPropagation:!0},{default:()=>b?b(N,!0):ye(N[E],N,!0)})),P=(T?this.selectedOptions.slice(0,h):this.selectedOptions).map(x),V=f?a("div",{class:`${s}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},a("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:u,value:this.pattern,autofocus:this.autofocus,class:`${s}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),a("span",{ref:"patternInputMirrorRef",class:`${s}-base-selection-input-tag__mirror`},this.pattern)):null,W=F?()=>a("div",{class:`${s}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},a(qe,{size:l,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:u})):void 0;let U;if(T){const N=this.selectedOptions.length-h;N>0&&(U=a("div",{class:`${s}-base-selection-tag-wrapper`,key:"__counter__"},a(qe,{size:l,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:u},{default:()=>`+${N}`})))}const L=F?f?a(on,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:()=>P,counter:W,tail:()=>V}):a(on,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:()=>P,counter:W}):T?P.concat(U):P,j=$?()=>a("div",{class:`${s}-base-selection-popover`},F?P:this.selectedOptions.map(x)):void 0,Q=$?{show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover}:null,J=(this.selected?!1:this.active?!this.pattern&&!this.isCompositing:!0)?a("div",{class:`${s}-base-selection-placeholder ${s}-base-selection-overlay`},this.placeholder):null,q=f?a("div",{ref:"patternInputWrapperRef",class:`${s}-base-selection-tags`},L,F?null:V,p):a("div",{ref:"multipleElRef",class:`${s}-base-selection-tags`,tabindex:u?void 0:0},L,p);z=a(et,null,$?a(Jn,Object.assign({},Q,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>q,default:j}):q,J)}else if(f){const E=this.pattern||this.isCompositing,x=this.active?!E:!this.selected,P=this.active?!1:this.selected;z=a("div",{ref:"patternInputWrapperRef",class:`${s}-base-selection-label`},a("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${s}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:u,disabled:u,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),P?a("div",{class:`${s}-base-selection-label__render-label ${s}-base-selection-overlay`,key:"input"},a("div",{class:`${s}-base-selection-overlay__wrapper`},S?S({option:this.selectedOption,handleClose:()=>{}}):b?b(this.selectedOption,!0):ye(this.label,this.selectedOption,!0))):null,x?a("div",{class:`${s}-base-selection-placeholder ${s}-base-selection-overlay`,key:"placeholder"},a("div",{class:`${s}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,p)}else z=a("div",{ref:"singleElRef",class:`${s}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?a("div",{class:`${s}-base-selection-input`,title:vt(this.label),key:"input"},a("div",{class:`${s}-base-selection-input__content`},S?S({option:this.selectedOption,handleClose:()=>{}}):b?b(this.selectedOption,!0):ye(this.label,this.selectedOption,!0))):a("div",{class:`${s}-base-selection-placeholder ${s}-base-selection-overlay`,key:"placeholder"},this.placeholder),p);return a("div",{ref:"selfRef",class:[`${s}-base-selection`,this.themeClass,e&&`${s}-base-selection--${e}-status`,{[`${s}-base-selection--active`]:this.active,[`${s}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${s}-base-selection--disabled`]:this.disabled,[`${s}-base-selection--multiple`]:this.multiple,[`${s}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},z,v?a("div",{class:`${s}-base-selection__border`}):null,v?a("div",{class:`${s}-base-selection__state-border`}):null)}});function $e(e){return e.type==="group"}function pn(e){return e.type==="ignored"}function Ze(e,i){try{return!!(1+i.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function Rt(e,i){return{getIsGroup:$e,getIgnored:pn,getKey(u){return $e(u)?u.name||u.key||"key-required":u[e]},getChildren(u){return u[i]}}}function Mt(e,i,l,u){if(!i)return e;function f(h){if(!Array.isArray(h))return[];const v=[];for(const s of h)if($e(s)){const _=f(s[u]);_.length&&v.push(Object.assign({},s,{[u]:_}))}else{if(pn(s))continue;i(l,s)&&v.push(s)}return v}return f(e)}function Tt(e,i,l){const u=new Map;return e.forEach(f=>{$e(f)?f[l].forEach(h=>{u.set(h[i],h)}):u.set(f[i],f)}),u}var zt=Y([C("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 `),C("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[vn({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]);const Pt=Object.assign(Object.assign({},ae.props),{to:Qe.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,internalShowCheckmark:{type:Boolean,default:!0},onChange:[Function,Array],items:Array});var It=se({name:"Select",props:Pt,setup(e){const{mergedClsPrefixRef:i,mergedBorderedRef:l,namespaceRef:u,inlineThemeDisabled:f}=un(e),h=ae("Select","-select",zt,ct,e,i),v=R(e.defaultValue),s=D(e,"value"),_=ln(s,v),S=R(!1),b=R(""),F=M(()=>{const{valueField:n,childrenField:r}=e,g=Rt(n,r);return ft(N.value,g)}),T=M(()=>Tt(J.value,e.valueField,e.childrenField)),$=R(!1),p=ln(D(e,"show"),$),z=R(null),E=R(null),x=R(null),{localeRef:P}=cn("Select"),V=M(()=>{var n;return(n=e.placeholder)!==null&&n!==void 0?n:P.value.placeholder}),W=tt(e,["items","options"]),U=[],L=R([]),j=R([]),Q=R(new Map),de=M(()=>{const{fallbackOption:n}=e;if(n===void 0){const{labelField:r,valueField:g}=e;return O=>({[r]:String(O),[g]:O})}return n===!1?!1:r=>Object.assign(n(r),{value:r})}),J=M(()=>j.value.concat(L.value).concat(W.value)),q=M(()=>{const{filter:n}=e;if(n)return n;const{labelField:r,valueField:g}=e;return(O,m)=>{if(!m)return!1;const y=m[r];if(typeof y=="string")return Ze(O,y);const w=m[g];return typeof w=="string"?Ze(O,w):typeof w=="number"?Ze(O,String(w)):!1}}),N=M(()=>{if(e.remote)return W.value;{const{value:n}=J,{value:r}=b;return!r.length||!e.filterable?n:Mt(n,q.value,r,e.childrenField)}});function ue(n){const r=e.remote,{value:g}=Q,{value:O}=T,{value:m}=de,y=[];return n.forEach(w=>{if(O.has(w))y.push(O.get(w));else if(r&&g.has(w))y.push(g.get(w));else if(m){const A=m(w);A&&y.push(A)}}),y}const ve=M(()=>{if(e.multiple){const{value:n}=_;return Array.isArray(n)?ue(n):[]}return null}),ce=M(()=>{const{value:n}=_;return!e.multiple&&!Array.isArray(n)?n===null?null:ue([n])[0]||null:null}),ee=ot(e),{mergedSizeRef:Z,mergedDisabledRef:oe,mergedStatusRef:t}=ee;function d(n,r){const{onChange:g,"onUpdate:value":O,onUpdateValue:m}=e,{nTriggerFormChange:y,nTriggerFormInput:w}=ee;g&&X(g,n,r),m&&X(m,n,r),O&&X(O,n,r),v.value=n,y(),w()}function B(n){const{onBlur:r}=e,{nTriggerFormBlur:g}=ee;r&&X(r,n),g()}function ne(){const{onClear:n}=e;n&&X(n)}function xe(n){const{onFocus:r}=e,{nTriggerFormFocus:g}=ee;r&&X(r,n),g()}function Ce(n){const{onSearch:r}=e;r&&X(r,n)}function Fe(n){const{onScroll:r}=e;r&&X(r,n)}function be(){var n;const{remote:r,multiple:g}=e;if(r){const{value:O}=Q;if(g){const{valueField:m}=e;(n=ve.value)===null||n===void 0||n.forEach(y=>{O.set(y[m],y)})}else{const m=ce.value;m&&O.set(m[e.valueField],m)}}}function ge(n){const{onUpdateShow:r,"onUpdate:show":g}=e;r&&X(r,n),g&&X(g,n),$.value=n}function ie(){oe.value||(ge(!0),$.value=!0,e.filterable&&Ve())}function H(){ge(!1)}function pe(){b.value="",j.value=U}const le=R(!1);function Oe(){e.filterable&&(le.value=!0)}function fe(){e.filterable&&(le.value=!1,p.value||pe())}function he(){oe.value||(p.value?e.filterable||H():ie())}function Se(n){var r,g;!((g=(r=x.value)===null||r===void 0?void 0:r.selfRef)===null||g===void 0)&&g.contains(n.relatedTarget)||(S.value=!1,B(n),H())}function Re(n){xe(n),S.value=!0}function Me(n){S.value=!0}function me(n){var r;!((r=z.value)===null||r===void 0)&&r.$el.contains(n.relatedTarget)||(S.value=!1,B(n),H())}function we(){var n;(n=z.value)===null||n===void 0||n.focus(),H()}function G(n){var r;p.value&&(!((r=z.value)===null||r===void 0)&&r.$el.contains(n.target)||H())}function o(n){if(!Array.isArray(n))return[];if(de.value)return Array.from(n);{const{remote:r}=e,{value:g}=T;if(r){const{value:O}=Q;return n.filter(m=>g.has(m)||O.has(m))}else return n.filter(O=>g.has(O))}}function c(n){I(n.rawNode)}function I(n){if(oe.value)return;const{tag:r,remote:g,clearFilterAfterSelect:O,valueField:m}=e;if(r&&!g){const{value:y}=j,w=y[0]||null;if(w){const A=L.value;A.length?A.push(w):L.value=[w],j.value=U}}if(g&&Q.value.set(n[m],n),e.multiple){const y=o(_.value),w=y.findIndex(A=>A===n[m]);if(~w){if(y.splice(w,1),r&&!g){const A=ze(n[m]);~A&&(L.value.splice(A,1),O&&(b.value=""))}}else y.push(n[m]),O&&(b.value="");d(y,ue(y))}else{if(r&&!g){const y=ze(n[m]);~y?L.value=[L.value[y]]:L.value=U}ke(),H(),d(n[m],n)}}function ze(n){return L.value.findIndex(g=>g[e.valueField]===n)}function Ne(n){p.value||ie();const{value:r}=n.target;b.value=r;const{tag:g,remote:O}=e;if(Ce(r),g&&!O){if(!r){j.value=U;return}const{onCreate:m}=e,y=m?m(r):{[e.labelField]:r,[e.valueField]:r},{valueField:w}=e;W.value.some(A=>A[w]===y[w])||L.value.some(A=>A[w]===y[w])?j.value=U:j.value=[y]}}function Ae(n){n.stopPropagation();const{multiple:r}=e;!r&&e.filterable&&H(),ne(),r?d([],[]):d(null,null)}function Le(n){!Be(n,"action")&&!Be(n,"empty")&&n.preventDefault()}function De(n){Fe(n)}function Pe(n){var r,g,O,m,y;switch(n.key){case" ":if(e.filterable)break;n.preventDefault();case"Enter":if(!(!((r=z.value)===null||r===void 0)&&r.isCompositing)){if(p.value){const w=(g=x.value)===null||g===void 0?void 0:g.getPendingTmNode();w?c(w):e.filterable||(H(),ke())}else if(ie(),e.tag&&le.value){const w=j.value[0];if(w){const A=w[e.valueField],{value:Ie}=_;e.multiple&&Array.isArray(Ie)&&Ie.some(Ke=>Ke===A)||I(w)}}}n.preventDefault();break;case"ArrowUp":if(n.preventDefault(),e.loading)return;p.value&&((O=x.value)===null||O===void 0||O.prev());break;case"ArrowDown":if(n.preventDefault(),e.loading)return;p.value?(m=x.value)===null||m===void 0||m.next():ie();break;case"Escape":p.value&&(ut(n),H()),(y=z.value)===null||y===void 0||y.focus();break}}function ke(){var n;(n=z.value)===null||n===void 0||n.focus()}function Ve(){var n;(n=z.value)===null||n===void 0||n.focusInput()}function je(){var n;!p.value||(n=E.value)===null||n===void 0||n.syncPosition()}be(),Te(D(e,"options"),be);const He={focus:()=>{var n;(n=z.value)===null||n===void 0||n.focus()},blur:()=>{var n;(n=z.value)===null||n===void 0||n.blur()}},_e=M(()=>{const{self:{menuBoxShadow:n}}=h.value;return{"--n-menu-box-shadow":n}}),re=f?Ee("select",void 0,_e,e):void 0;return Object.assign(Object.assign({},He),{mergedStatus:t,mergedClsPrefix:i,mergedBordered:l,namespace:u,treeMate:F,isMounted:it(),triggerRef:z,menuRef:x,pattern:b,uncontrolledShow:$,mergedShow:p,adjustedTo:Qe(e),uncontrolledValue:v,mergedValue:_,followerRef:E,localizedPlaceholder:V,selectedOption:ce,selectedOptions:ve,mergedSize:Z,mergedDisabled:oe,focused:S,activeWithoutMenuOpen:le,inlineThemeDisabled:f,onTriggerInputFocus:Oe,onTriggerInputBlur:fe,handleTriggerOrMenuResize:je,handleMenuFocus:Me,handleMenuBlur:me,handleMenuTabOut:we,handleTriggerClick:he,handleToggle:c,handleDeleteOption:I,handlePatternInput:Ne,handleClear:Ae,handleTriggerBlur:Se,handleTriggerFocus:Re,handleKeydown:Pe,handleMenuAfterLeave:pe,handleMenuClickOutside:G,handleMenuScroll:De,handleMenuKeydown:Pe,handleMenuMousedown:Le,mergedTheme:h,cssVars:f?void 0:_e,themeClass:re?.themeClass,onRender:re?.onRender})},render(){return a("div",{class:`${this.mergedClsPrefix}-select`},a(lt,null,{default:()=>[a(rt,null,{default:()=>a(St,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize},{arrow:()=>{var e,i;return[(i=(e=this.$slots).arrow)===null||i===void 0?void 0:i.call(e)]}})}),a(at,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===Qe.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>a(hn,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,i,l;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),st(a(Ft,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(i=this.menuProps)===null||i===void 0?void 0:i.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:"medium",renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(l=this.menuProps)===null||l===void 0?void 0:l.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.internalShowCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange}),{empty:()=>{var u,f;return[(f=(u=this.$slots).empty)===null||f===void 0?void 0:f.call(u)]},action:()=>{var u,f;return[(f=(u=this.$slots).action)===null||f===void 0?void 0:f.call(u)]}}),this.displayDirective==="show"?[[dt,this.mergedShow],[rn,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[rn,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}});export{gt as F,It as N,wt as a,Ft as b,Rt as c,vt as g,Ge as m};
