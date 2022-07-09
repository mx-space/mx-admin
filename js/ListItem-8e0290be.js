import{a6 as n,a4 as t,ag as $,a5 as d,aV as P,aW as y,f as c,V as R,a7 as m,a8 as j,n as I,Y as L,$ as s,T as V,db as M,X as T,c1 as w}from"./index-47c857f6.js";var B=n([t("list",`
 --n-merged-border-color: var(--n-border-color);
 --n-merged-color: var(--n-color);
 font-size: var(--n-font-size);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 padding: 0;
 list-style-type: none;
 color: var(--n-text-color);
 background-color: var(--n-merged-color);
 `,[$("bordered",`
 border-radius: var(--n-border-radius);
 border: 1px solid var(--n-merged-border-color);
 `,[t("list-item",`
 padding: 12px 20px;
 `,[n("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),d("header, footer",`
 padding: 12px 20px;
 `,[n("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)])]),d("header, footer",`
 padding: 12px 0;
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[n("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),t("list-item",`
 padding: 12px 0; 
 box-sizing: border-box;
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: border-color .3s var(--n-bezier);
 `,[d("prefix",`
 margin-right: 20px;
 flex: 0;
 `),d("suffix",`
 margin-left: 20px;
 flex: 0;
 `),d("main",`
 flex: 1;
 `),n("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)])]),P(t("list",`
 --n-merged-color: var(--n-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),y(t("list",`
 --n-merged-color: var(--n-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const E=Object.assign(Object.assign({},m.props),{size:{type:String,default:"medium"},bordered:{type:Boolean,default:!1}}),b=V("n-list");var O=c({name:"List",props:E,setup(e){const{mergedClsPrefixRef:r,inlineThemeDisabled:o}=R(e),i=m("List","-list",B,M,e,r);j(b,{mergedClsPrefixRef:r});const a=I(()=>{const{common:{cubicBezierEaseInOut:f},self:{fontSize:p,textColor:v,color:u,colorModal:x,colorPopover:g,borderColor:h,borderColorModal:C,borderColorPopover:z,borderRadius:_}}=i.value;return{"--n-font-size":p,"--n-bezier":f,"--n-text-color":v,"--n-color":u,"--n-border-radius":_,"--n-border-color":h,"--n-border-color-modal":C,"--n-border-color-popover":z,"--n-color-modal":x,"--n-color-popover":g}}),l=o?L("list",void 0,a,e):void 0;return{mergedClsPrefix:r,cssVars:o?void 0:a,themeClass:l?.themeClass,onRender:l?.onRender}},render(){var e;const{$slots:r,mergedClsPrefix:o,onRender:i}=this;return i?.(),s("ul",{class:[`${o}-list`,this.bordered&&`${o}-list--bordered`,this.themeClass],style:this.cssVars},r.header?s("div",{class:`${o}-list__header`},r.header()):null,(e=r.default)===null||e===void 0?void 0:e.call(r),r.footer?s("div",{class:`${o}-list__footer`},r.footer()):null)}}),k=c({name:"ListItem",setup(){const e=T(b,null);return e||w("list-item","`n-list-item` must be placed in `n-list`."),{mergedClsPrefix:e.mergedClsPrefixRef}},render(){const{$slots:e,mergedClsPrefix:r}=this;return s("li",{class:`${r}-list-item`},e.prefix?s("div",{class:`${r}-list-item__prefix`},e.prefix()):null,e.default?s("div",{class:`${r}-list-item__main`},e):null,e.suffix?s("div",{class:`${r}-list-item__suffix`},e.suffix()):null)}});export{O as N,k as a};
