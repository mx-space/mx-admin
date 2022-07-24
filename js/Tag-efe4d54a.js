import{f as U,$ as v,bn as no,bo as so,bp as o,a4 as to,ag as f,a5 as P,af as y,a6 as I,H as io,V as ho,a7 as V,a8 as go,Z as bo,am as Co,n as O,Y as vo,a0 as N,bq as uo,T as po,ac as fo,ao as d,br as L}from"./index-8cc1a1a4.js";const $o=U({name:"Checkmark",render(){return v("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},v("g",{fill:"none"},v("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}}),ko=c=>{const{textColor2:h,primaryColorHover:r,primaryColorPressed:k,primaryColor:a,infoColor:i,successColor:s,warningColor:n,errorColor:t,baseColor:m,borderColor:x,opacityDisabled:g,tagColor:u,closeIconColor:e,closeIconColorHover:l,closeIconColorPressed:p,borderRadiusSmall:b,fontSizeMini:C,fontSizeTiny:z,fontSizeSmall:S,fontSizeMedium:$,heightMini:H,heightTiny:B,heightSmall:R,heightMedium:M,closeColorHover:w,closeColorPressed:T,buttonColor2Hover:E,buttonColor2Pressed:_,fontWeightStrong:W}=c;return Object.assign(Object.assign({},so),{closeBorderRadius:b,heightTiny:H,heightSmall:B,heightMedium:R,heightLarge:M,borderRadius:b,opacityDisabled:g,fontSizeTiny:C,fontSizeSmall:z,fontSizeMedium:S,fontSizeLarge:$,fontWeightStrong:W,textColorCheckable:h,textColorHoverCheckable:h,textColorPressedCheckable:h,textColorChecked:m,colorCheckable:"#0000",colorHoverCheckable:E,colorPressedCheckable:_,colorChecked:a,colorCheckedHover:r,colorCheckedPressed:k,border:`1px solid ${x}`,textColor:h,color:u,colorBordered:"rgb(250, 250, 252)",closeIconColor:e,closeIconColorHover:l,closeIconColorPressed:p,closeColorHover:w,closeColorPressed:T,borderPrimary:`1px solid ${o(a,{alpha:.3})}`,textColorPrimary:a,colorPrimary:o(a,{alpha:.12}),colorBorderedPrimary:o(a,{alpha:.1}),closeIconColorPrimary:a,closeIconColorHoverPrimary:a,closeIconColorPressedPrimary:a,closeColorHoverPrimary:o(a,{alpha:.12}),closeColorPressedPrimary:o(a,{alpha:.18}),borderInfo:`1px solid ${o(i,{alpha:.3})}`,textColorInfo:i,colorInfo:o(i,{alpha:.12}),colorBorderedInfo:o(i,{alpha:.1}),closeIconColorInfo:i,closeIconColorHoverInfo:i,closeIconColorPressedInfo:i,closeColorHoverInfo:o(i,{alpha:.12}),closeColorPressedInfo:o(i,{alpha:.18}),borderSuccess:`1px solid ${o(s,{alpha:.3})}`,textColorSuccess:s,colorSuccess:o(s,{alpha:.12}),colorBorderedSuccess:o(s,{alpha:.1}),closeIconColorSuccess:s,closeIconColorHoverSuccess:s,closeIconColorPressedSuccess:s,closeColorHoverSuccess:o(s,{alpha:.12}),closeColorPressedSuccess:o(s,{alpha:.18}),borderWarning:`1px solid ${o(n,{alpha:.35})}`,textColorWarning:n,colorWarning:o(n,{alpha:.15}),colorBorderedWarning:o(n,{alpha:.12}),closeIconColorWarning:n,closeIconColorHoverWarning:n,closeIconColorPressedWarning:n,closeColorHoverWarning:o(n,{alpha:.12}),closeColorPressedWarning:o(n,{alpha:.18}),borderError:`1px solid ${o(t,{alpha:.23})}`,textColorError:t,colorError:o(t,{alpha:.1}),colorBorderedError:o(t,{alpha:.08}),closeIconColorError:t,closeIconColorHoverError:t,closeIconColorPressedError:t,closeColorHoverError:o(t,{alpha:.12}),closeColorPressedError:o(t,{alpha:.18})})},mo={name:"Tag",common:no,self:ko},xo=mo,Po={color:Object,type:{type:String,default:"default"},round:Boolean,size:{type:String,default:"medium"},closable:Boolean,disabled:{type:Boolean,default:void 0}},yo=to("tag",`
 white-space: nowrap;
 position: relative;
 box-sizing: border-box;
 cursor: default;
 display: inline-flex;
 align-items: center;
 flex-wrap: nowrap;
 padding: var(--n-padding);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 line-height: 1;
 height: var(--n-height);
 font-size: var(--n-font-size);
`,[f("strong",`
 font-weight: var(--n-font-weight-strong);
 `),P("border",`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),P("icon",`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),P("avatar",`
 display: flex;
 margin: 0 6px 0 0;
 `),P("close",`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 cursor: pointer;
 `),f("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[P("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),P("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),f("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),f("icon, avatar",[f("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),f("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),f("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[y("disabled",[I("&:hover","background-color: var(--n-color-hover-checkable);",[y("checked","color: var(--n-text-color-hover-checkable);")]),I("&:active","background-color: var(--n-color-pressed-checkable);",[y("checked","color: var(--n-text-color-pressed-checkable);")])]),f("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[y("disabled",[I("&:hover","background-color: var(--n-color-checked-hover);"),I("&:active","background-color: var(--n-color-checked-pressed);")])])])]),Io=Object.assign(Object.assign(Object.assign({},V.props),Po),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalStopClickPropagation:Boolean,onCheckedChange:{type:Function,validator:()=>!0,default:void 0}}),zo=po("n-tag"),Ho=U({name:"Tag",props:Io,setup(c){const h=io(null),{mergedBorderedRef:r,mergedClsPrefixRef:k,inlineThemeDisabled:a,mergedRtlRef:i}=ho(c),s=V("Tag","-tag",yo,xo,c,k);go(zo,{roundRef:bo(c,"round")});function n(e){if(!c.disabled&&c.checkable){const{checked:l,onCheckedChange:p,onUpdateChecked:b,"onUpdate:checked":C}=c;b&&b(!l),C&&C(!l),p&&p(!l)}}function t(e){if(c.internalStopClickPropagation&&e.stopPropagation(),!c.disabled){const{onClose:l}=c;l&&fo(l,e)}}const m={setTextContent(e){const{value:l}=h;l&&(l.textContent=e)}},x=Co("Tag",i,k),g=O(()=>{const{type:e,size:l,color:{color:p,textColor:b}={}}=c,{common:{cubicBezierEaseInOut:C},self:{padding:z,closeMargin:S,closeMarginRtl:$,borderRadius:H,opacityDisabled:B,textColorCheckable:R,textColorHoverCheckable:M,textColorPressedCheckable:w,textColorChecked:T,colorCheckable:E,colorHoverCheckable:_,colorPressedCheckable:W,colorChecked:D,colorCheckedHover:K,colorCheckedPressed:q,closeBorderRadius:A,fontWeightStrong:Y,[d("colorBordered",e)]:Z,[d("closeSize",l)]:G,[d("closeIconSize",l)]:J,[d("fontSize",l)]:Q,[d("height",l)]:j,[d("color",e)]:X,[d("textColor",e)]:oo,[d("border",e)]:eo,[d("closeIconColor",e)]:F,[d("closeIconColorHover",e)]:ro,[d("closeIconColorPressed",e)]:lo,[d("closeColorHover",e)]:co,[d("closeColorPressed",e)]:ao}}=s.value;return{"--n-font-weight-strong":Y,"--n-avatar-size-override":`calc(${j} - 8px)`,"--n-bezier":C,"--n-border-radius":H,"--n-border":eo,"--n-close-icon-size":J,"--n-close-color-pressed":ao,"--n-close-color-hover":co,"--n-close-border-radius":A,"--n-close-icon-color":F,"--n-close-icon-color-hover":ro,"--n-close-icon-color-pressed":lo,"--n-close-icon-color-disabled":F,"--n-close-margin":S,"--n-close-margin-rtl":$,"--n-close-size":G,"--n-color":p||(r.value?Z:X),"--n-color-checkable":E,"--n-color-checked":D,"--n-color-checked-hover":K,"--n-color-checked-pressed":q,"--n-color-hover-checkable":_,"--n-color-pressed-checkable":W,"--n-font-size":Q,"--n-height":j,"--n-opacity-disabled":B,"--n-padding":z,"--n-text-color":b||oo,"--n-text-color-checkable":R,"--n-text-color-checked":T,"--n-text-color-hover-checkable":M,"--n-text-color-pressed-checkable":w}}),u=a?vo("tag",O(()=>{let e="";const{type:l,size:p,color:{color:b,textColor:C}={}}=c;return e+=l[0],e+=p[0],b&&(e+=`a${L(b)}`),C&&(e+=`b${L(C)}`),r.value&&(e+="c"),e}),g,c):void 0;return Object.assign(Object.assign({},m),{rtlEnabled:x,mergedClsPrefix:k,contentRef:h,mergedBordered:r,handleClick:n,handleCloseClick:t,cssVars:a?void 0:g,themeClass:u?.themeClass,onRender:u?.onRender})},render(){var c,h;const{mergedClsPrefix:r,rtlEnabled:k,closable:a,color:{borderColor:i}={},round:s,onRender:n,$slots:t}=this;n?.();const m=N(t.avatar,g=>g&&v("div",{class:`${r}-tag__avatar`},g)),x=N(t.icon,g=>g&&v("div",{class:`${r}-tag__icon`},g));return v("div",{class:[`${r}-tag`,this.themeClass,{[`${r}-tag--rtl`]:k,[`${r}-tag--strong`]:this.strong,[`${r}-tag--disabled`]:this.disabled,[`${r}-tag--checkable`]:this.checkable,[`${r}-tag--checked`]:this.checkable&&this.checked,[`${r}-tag--round`]:s,[`${r}-tag--avatar`]:m,[`${r}-tag--icon`]:x,[`${r}-tag--closable`]:a}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},x||m,v("span",{class:`${r}-tag__content`,ref:"contentRef"},(h=(c=this.$slots).default)===null||h===void 0?void 0:h.call(c)),!this.checkable&&a?v(uo,{clsPrefix:r,class:`${r}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:s,absolute:!0}):null,!this.checkable&&this.mergedBordered?v("div",{class:`${r}-tag__border`,style:{borderColor:i}}):null)}});export{$o as F,Ho as N,zo as a,Po as c,xo as t};
