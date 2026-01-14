import{aB as L,aC as W,aD as l,aE as p,aF as g,aG as s,d as h,aH as B,aI as E,aJ as U,aK as c,aL as G,aM as J,aN as x,aO as b,aP as Q,aQ as X,aR as Y,a3 as y,aS as f,aT as Z,aU as ee,a as C,o as te,R as S,aV as ie,c as i,F as w,H as ne,A as le,C as oe,i as $,a1 as T,g as m,aW as re,aX as ae,B as _,j as se,I as ce,v as me}from"./index-D5BxuJyQ.js";var v={},P;function ue(){if(P)return v;P=1,Object.defineProperty(v,"__esModule",{value:!0});const e=L(),o={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"};return v.default=(0,e.defineComponent)({name:"Pen",render:function(a,t){return(0,e.openBlock)(),(0,e.createElementBlock)("svg",o,t[0]||(t[0]=[(0,e.createElementVNode)("path",{d:"M290.74 93.24l128.02 128.02l-277.99 277.99l-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22l277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55l128.02 128.02l56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z",fill:"currentColor"},null,-1)]))}}),v}var de=ue();const pe=W(de),k=1.25,ge=l("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${k};
`,[p("horizontal",`
 flex-direction: row;
 `,[g(">",[l("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[p("dashed-line-type",[g(">",[l("timeline-item-timeline",[s("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),g(">",[l("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[g(">",[s("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),l("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[s("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),p("right-placement",[l("timeline-item",[l("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),l("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),p("left-placement",[l("timeline-item",[l("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),l("timeline-item-timeline",`
 left: 0;
 `)])]),l("timeline-item",`
 position: relative;
 `,[g("&:last-child",[l("timeline-item-timeline",[s("line",`
 display: none;
 `)]),l("timeline-item-content",[s("meta",`
 margin-bottom: 0;
 `)])]),l("timeline-item-content",[s("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),s("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),s("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),p("dashed-line-type",[l("timeline-item-timeline",[s("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),l("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${k} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[s("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),s("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),s("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]),fe=Object.assign(Object.assign({},E.props),{horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number}),R=G("n-timeline"),ve=h({name:"Timeline",props:fe,setup(e,{slots:o}){const{mergedClsPrefixRef:r}=B(e),a=E("Timeline","-timeline",ge,U,e,r);return J(R,{props:e,mergedThemeRef:a,mergedClsPrefixRef:r}),()=>{const{value:t}=r;return c("div",{class:[`${t}-timeline`,e.horizontal&&`${t}-timeline--horizontal`,`${t}-timeline--${e.size}-size`,!e.horizontal&&`${t}-timeline--${e.itemPlacement}-placement`]},o)}}}),he={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}},ze=h({name:"TimelineItem",props:he,slots:Object,setup(e){const o=Q(R);o||X("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),Y();const{inlineThemeDisabled:r}=B(),a=y(()=>{const{props:{size:n,iconSize:d},mergedThemeRef:u}=o,{type:z}=e,{self:{titleTextColor:j,contentTextColor:N,metaTextColor:F,lineColor:I,titleFontWeight:O,contentFontSize:M,[f("iconSize",n)]:V,[f("titleMargin",n)]:D,[f("titleFontSize",n)]:H,[f("circleBorder",z)]:q,[f("iconColor",z)]:A},common:{cubicBezierEaseInOut:K}}=u.value;return{"--n-bezier":K,"--n-circle-border":q,"--n-icon-color":A,"--n-content-font-size":M,"--n-content-text-color":N,"--n-line-color":I,"--n-meta-text-color":F,"--n-title-font-size":H,"--n-title-font-weight":O,"--n-title-margin":D,"--n-title-text-color":j,"--n-icon-size":Z(d)||V}}),t=r?ee("timeline-item",y(()=>{const{props:{size:n,iconSize:d}}=o,{type:u}=e;return`${n[0]}${d||"a"}${u[0]}`}),a,o.props):void 0;return{mergedClsPrefix:o.mergedClsPrefixRef,cssVars:r?void 0:a,themeClass:t?.themeClass,onRender:t?.onRender}},render(){const{mergedClsPrefix:e,color:o,onRender:r,$slots:a}=this;return r?.(),c("div",{class:[`${e}-timeline-item`,this.themeClass,`${e}-timeline-item--${this.type}-type`,`${e}-timeline-item--${this.lineType}-line-type`],style:this.cssVars},c("div",{class:`${e}-timeline-item-timeline`},c("div",{class:`${e}-timeline-item-timeline__line`}),x(a.icon,t=>t?c("div",{class:`${e}-timeline-item-timeline__icon`,style:{color:o}},t):c("div",{class:`${e}-timeline-item-timeline__circle`,style:{borderColor:o}}))),c("div",{class:`${e}-timeline-item-content`},x(a.header,t=>t||this.title?c("div",{class:`${e}-timeline-item-content__title`},t||this.title):null),c("div",{class:`${e}-timeline-item-content__content`},b(a.default,()=>[this.content])),c("div",{class:`${e}-timeline-item-content__meta`},b(a.footer,()=>[this.time]))))}}),xe={"timeline-grid":"_timeline-grid_1fzxd_1"};function be(e){return typeof e=="function"||Object.prototype.toString.call(e)==="[object Object]"&&!me(e)}const Ce=h({setup(){const e=C([]),o=C(!0);te(async()=>{S.api.recently.all.get().then(t=>{e.value=t.data,o.value=!1})});const{create:r,edit:a}=ie();return()=>{let t;return i(oe,{actionsElement:i(w,null,[i(ne,{onClick:()=>{r().then(n=>{n&&e.value.unshift(n)})},icon:i(le,null,null)},null)])},{default:()=>[i(ve,null,be(t=e.value.map((n,d)=>i(ze,{type:"default",key:n.id},{icon(){return i(ce,null,{default:()=>[i(pe,null,null)]})},default(){return i("div",{class:xe["timeline-grid"]},[i("span",null,[n.content]),i("div",{class:"action"},[i(_,{quaternary:!0,type:"info",size:"tiny",onClick:()=>{a(n).then(u=>{u&&(e.value[d]=u)})}},{default:()=>[m("编辑")]}),i(se,{placement:"left",positiveText:"取消",negativeText:"删除",onNegativeClick:async()=>{await S.api.recently(n.id).delete(),message.success("删除成功"),e.value.splice(e.value.indexOf(n),1)}},{trigger:()=>i(_,{quaternary:!0,type:"error",size:"tiny"},{default:()=>[m("移除")]}),default:()=>i("span",{class:"max-w-48 break-all"},[m("确定要删除 "),n.content,m(" ?")])})])])},footer(){return i($,{inline:!0,size:5},{default:()=>[i(T,{time:n.created},null),n.modified&&i(w,null,[i("span",{class:"text-gray-400"},[m("·")]),i("span",{class:"text-gray-400"},[m("修改于 "),i(T,{time:n.modified},null)])]),i($,{inline:!0,size:1,align:"center"},{default:()=>[i(re,null,null),m(" "),n.up,i("span",{class:"mx-2"},[m("/")]),i(ae,null,null),m(" "),n.down]})]})}})))?t:{default:()=>[t]})]})}}});export{Ce as default};
