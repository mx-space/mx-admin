import{aE as a,aC as i,aD as d,aF as l,dF as D,dG as E,d as v,aG as I,b8 as L,aH as b,aI as j,bW as B,a3 as H,aP as M,aJ as s,aK as N,dH as K,aM as O,aN as T}from"./index-Crl3qwRq.js";const V=a([i("list",`
 --n-merged-border-color: var(--n-border-color);
 --n-merged-color: var(--n-color);
 --n-merged-color-hover: var(--n-color-hover);
 margin: 0;
 font-size: var(--n-font-size);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 padding: 0;
 list-style-type: none;
 color: var(--n-text-color);
 background-color: var(--n-merged-color);
 `,[d("show-divider",[i("list-item",[a("&:not(:last-child)",[l("divider",`
 background-color: var(--n-merged-border-color);
 `)])])]),d("clickable",[i("list-item",`
 cursor: pointer;
 `)]),d("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `),d("hoverable",[i("list-item",`
 border-radius: var(--n-border-radius);
 `,[a("&:hover",`
 background-color: var(--n-merged-color-hover);
 `,[l("divider",`
 background-color: transparent;
 `)])])]),d("bordered, hoverable",[i("list-item",`
 padding: 12px 20px;
 `),l("header, footer",`
 padding: 12px 20px;
 `)]),l("header, footer",`
 padding: 12px 0;
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[a("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),i("list-item",`
 position: relative;
 padding: 12px 0; 
 box-sizing: border-box;
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[l("prefix",`
 margin-right: 20px;
 flex: 0;
 `),l("suffix",`
 margin-left: 20px;
 flex: 0;
 `),l("main",`
 flex: 1;
 `),l("divider",`
 height: 1px;
 position: absolute;
 bottom: 0;
 left: 0;
 right: 0;
 background-color: transparent;
 transition: background-color .3s var(--n-bezier);
 pointer-events: none;
 `)])]),D(i("list",`
 --n-merged-color-hover: var(--n-color-hover-modal);
 --n-merged-color: var(--n-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),E(i("list",`
 --n-merged-color-hover: var(--n-color-hover-popover);
 --n-merged-color: var(--n-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]),F=Object.assign(Object.assign({},b.props),{size:{type:String,default:"medium"},bordered:Boolean,clickable:Boolean,hoverable:Boolean,showDivider:{type:Boolean,default:!0}}),m=N("n-list"),S=v({name:"List",props:F,setup(e){const{mergedClsPrefixRef:r,inlineThemeDisabled:o,mergedRtlRef:t}=I(e),h=L("List",t,r),u=b("List","-list",V,K,e,r);j(m,{showDividerRef:B(e,"showDivider"),mergedClsPrefixRef:r});const c=H(()=>{const{common:{cubicBezierEaseInOut:f},self:{fontSize:p,textColor:g,color:x,colorModal:C,colorPopover:z,borderColor:R,borderColorModal:$,borderColorPopover:_,borderRadius:k,colorHover:w,colorHoverModal:P,colorHoverPopover:y}}=u.value;return{"--n-font-size":p,"--n-bezier":f,"--n-text-color":g,"--n-color":x,"--n-border-radius":k,"--n-border-color":R,"--n-border-color-modal":$,"--n-border-color-popover":_,"--n-color-modal":C,"--n-color-popover":z,"--n-color-hover":w,"--n-color-hover-modal":P,"--n-color-hover-popover":y}}),n=o?M("list",void 0,c,e):void 0;return{mergedClsPrefix:r,rtlEnabled:h,cssVars:o?void 0:c,themeClass:n?.themeClass,onRender:n?.onRender}},render(){var e;const{$slots:r,mergedClsPrefix:o,onRender:t}=this;return t?.(),s("ul",{class:[`${o}-list`,this.rtlEnabled&&`${o}-list--rtl`,this.bordered&&`${o}-list--bordered`,this.showDivider&&`${o}-list--show-divider`,this.hoverable&&`${o}-list--hoverable`,this.clickable&&`${o}-list--clickable`,this.themeClass],style:this.cssVars},r.header?s("div",{class:`${o}-list__header`},r.header()):null,(e=r.default)===null||e===void 0?void 0:e.call(r),r.footer?s("div",{class:`${o}-list__footer`},r.footer()):null)}}),J=v({name:"ListItem",setup(){const e=O(m,null);return e||T("list-item","`n-list-item` must be placed in `n-list`."),{showDivider:e.showDividerRef,mergedClsPrefix:e.mergedClsPrefixRef}},render(){const{$slots:e,mergedClsPrefix:r}=this;return s("li",{class:`${r}-list-item`},e.prefix?s("div",{class:`${r}-list-item__prefix`},e.prefix()):null,e.default?s("div",{class:`${r}-list-item__main`},e):null,e.suffix?s("div",{class:`${r}-list-item__suffix`},e.suffix()):null,this.showDivider&&s("div",{class:`${r}-list-item__divider`}))}});export{S as N,J as a};
