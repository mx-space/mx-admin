import{bn as le,cp as se,bp as de,a4 as M,a5 as t,aU as P,a6 as N,ag as l,af as U,f as ce,V as ue,a7 as H,ai as he,H as T,Z as be,aj as fe,n as _,Y as ve,cq as j,$ as n,a0 as v,aM as ge,aN as we,ac as D,ao as g,aK as K,ar as s}from"./index-f417bb43.js";const me=e=>{const{primaryColor:d,opacityDisabled:h,borderRadius:o,textColor3:r}=e,w="rgba(0, 0, 0, .14)";return Object.assign(Object.assign({},se),{iconColor:r,textColor:"white",loadingColor:d,opacityDisabled:h,railColor:w,railColorActive:d,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:o,railBorderRadiusMedium:o,railBorderRadiusLarge:o,buttonBorderRadiusSmall:o,buttonBorderRadiusMedium:o,buttonBorderRadiusLarge:o,boxShadowFocus:`0 0 0 2px ${de(d,{alpha:.2})}`})},pe={name:"Switch",common:le,self:me};var ye=pe,xe=M("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[t("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),t("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),t("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),M("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[P({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),t("checked, unchecked",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 box-sizing: border-box;
 position: absolute;
 white-space: nowrap;
 top: 0;
 bottom: 0;
 display: flex;
 align-items: center;
 line-height: 1;
 `),t("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),t("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),N("&:focus",[t("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),l("round",[t("rail","border-radius: calc(var(--n-rail-height) / 2);",[t("button","border-radius: calc(var(--n-button-height) / 2);")])]),U("disabled",[U("icon",[l("rubber-band",[l("pressed",[t("rail",[t("button","max-width: var(--n-button-width-pressed);")])]),t("rail",[N("&:active",[t("button","max-width: var(--n-button-width-pressed);")])]),l("active",[l("pressed",[t("rail",[t("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),t("rail",[N("&:active",[t("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),l("active",[t("rail",[t("button","left: calc(100% - (var(--n-rail-height) + var(--n-button-width)) / 2)")])]),t("rail",`
 overflow: hidden;
 height: var(--n-rail-height);
 min-width: var(--n-rail-width);
 border-radius: var(--n-rail-border-radius);
 cursor: pointer;
 position: relative;
 transition:
 opacity .3s var(--n-bezier),
 background .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-rail-color);
 `,[t("button-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 font-size: calc(var(--n-button-height) - 4px);
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 display: flex;
 justify-content: center;
 align-items: center;
 line-height: 1;
 `,[P()]),t("button",`
 align-items: center; 
 top: var(--n-offset);
 left: var(--n-offset);
 height: var(--n-button-width);
 width: var(--n-button-width-pressed);
 max-width: var(--n-button-width);
 border-radius: var(--n-button-border-radius);
 background-color: var(--n-button-color);
 box-shadow: var(--n-button-box-shadow);
 box-sizing: border-box;
 cursor: inherit;
 content: "";
 position: absolute;
 transition:
 background-color .3s var(--n-bezier),
 left .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 max-width .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `)]),l("active",[t("rail","background-color: var(--n-rail-color-active);")]),l("loading",[t("rail",`
 cursor: wait;
 `)]),l("disabled",[t("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]);const ke=Object.assign(Object.assign({},H.props),{size:{type:String,default:"medium"},value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},onChange:[Function,Array]});var Ce=ce({name:"Switch",props:ke,setup(e){const{mergedClsPrefixRef:d,inlineThemeDisabled:h}=ue(e),o=H("Switch","-switch",xe,ye,e,d),r=he(e),{mergedSizeRef:w,mergedDisabledRef:b}=r,y=T(e.defaultValue),C=be(e,"value"),f=fe(C,y),x=_(()=>f.value===e.checkedValue),m=T(!1),i=T(!1),c=_(()=>{const{railStyle:a}=e;if(!!a)return a({focused:i.value,checked:x.value})});function u(a){const{"onUpdate:value":R,onChange:S,onUpdateValue:V}=e,{nTriggerFormInput:$,nTriggerFormChange:z}=r;R&&D(R,a),V&&D(V,a),S&&D(S,a),y.value=a,$(),z()}function L(){const{nTriggerFormFocus:a}=r;a()}function O(){const{nTriggerFormBlur:a}=r;a()}function A(){e.loading||b.value||(f.value!==e.checkedValue?u(e.checkedValue):u(e.uncheckedValue))}function I(){i.value=!0,L()}function E(){i.value=!1,O(),m.value=!1}function Y(a){e.loading||b.value||a.key===" "&&(f.value!==e.checkedValue?u(e.checkedValue):u(e.uncheckedValue),m.value=!1)}function X(a){e.loading||b.value||a.key===" "&&(a.preventDefault(),m.value=!0)}const W=_(()=>{const{value:a}=w,{self:{opacityDisabled:R,railColor:S,railColorActive:V,buttonBoxShadow:$,buttonColor:z,boxShadowFocus:q,loadingColor:Z,textColor:G,iconColor:J,[g("buttonHeight",a)]:k,[g("buttonWidth",a)]:Q,[g("buttonWidthPressed",a)]:ee,[g("railHeight",a)]:B,[g("railWidth",a)]:F,[g("railBorderRadius",a)]:te,[g("buttonBorderRadius",a)]:ae},common:{cubicBezierEaseInOut:ie}}=o.value,ne=K((s(B)-s(k))/2),oe=K(Math.max(s(B),s(k))),re=s(B)>s(k)?F:K(s(F)+s(k)-s(B));return{"--n-bezier":ie,"--n-button-border-radius":ae,"--n-button-box-shadow":$,"--n-button-color":z,"--n-button-width":Q,"--n-button-width-pressed":ee,"--n-button-height":k,"--n-height":oe,"--n-offset":ne,"--n-opacity-disabled":R,"--n-rail-border-radius":te,"--n-rail-color":S,"--n-rail-color-active":V,"--n-rail-height":B,"--n-rail-width":F,"--n-width":re,"--n-box-shadow-focus":q,"--n-loading-color":Z,"--n-text-color":G,"--n-icon-color":J}}),p=h?ve("switch",_(()=>w.value[0]),W,e):void 0;return{handleClick:A,handleBlur:E,handleFocus:I,handleKeyup:Y,handleKeydown:X,mergedRailStyle:c,pressed:m,mergedClsPrefix:d,mergedValue:f,checked:x,mergedDisabled:b,cssVars:h?void 0:W,themeClass:p?.themeClass,onRender:p?.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:d,checked:h,mergedRailStyle:o,onRender:r,$slots:w}=this;r?.();const{checked:b,unchecked:y,icon:C,"checked-icon":f,"unchecked-icon":x}=w,m=!(j(C)&&j(f)&&j(x));return n("div",{role:"switch","aria-checked":h,class:[`${e}-switch`,this.themeClass,m&&`${e}-switch--icon`,h&&`${e}-switch--active`,d&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`],tabindex:this.mergedDisabled?void 0:0,style:this.cssVars,onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},n("div",{class:`${e}-switch__rail`,"aria-hidden":"true",style:o},v(b,i=>v(y,c=>i||c?n("div",{"aria-hidden":!0,class:`${e}-switch__children-placeholder`},n("div",{class:`${e}-switch__rail-placeholder`},n("div",{class:`${e}-switch__button-placeholder`}),i),n("div",{class:`${e}-switch__rail-placeholder`},n("div",{class:`${e}-switch__button-placeholder`}),c)):null)),n("div",{class:`${e}-switch__button`},v(C,i=>v(f,c=>v(x,u=>n(ge,null,{default:()=>this.loading?n(we,{key:"loading",clsPrefix:e,strokeWidth:20}):this.checked&&(c||i)?n("div",{class:`${e}-switch__button-icon`,key:c?"checked-icon":"icon"},c||i):!this.checked&&(u||i)?n("div",{class:`${e}-switch__button-icon`,key:u?"unchecked-icon":"icon"},u||i):null})))),v(b,i=>i&&n("div",{key:"checked",class:`${e}-switch__checked`},i)),v(y,i=>i&&n("div",{key:"unchecked",class:`${e}-switch__unchecked`},i)))))}});export{Ce as N};
