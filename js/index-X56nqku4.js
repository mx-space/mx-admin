import{ba as F,de as v,cM as c,cJ as o,d as p,as as f,Y as D,bd as E,be as b,a as A,bh as w,dq as y,h as e,i as u,v as h,b7 as s,B as i,s as t}from"./index-DoEgFLcO.js";const $=F("divider",`
 position: relative;
 display: flex;
 width: 100%;
 box-sizing: border-box;
 font-size: 16px;
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
`,[v("vertical",`
 margin-top: 24px;
 margin-bottom: 24px;
 `,[v("no-title",`
 display: flex;
 align-items: center;
 `)]),c("title",`
 display: flex;
 align-items: center;
 margin-left: 12px;
 margin-right: 12px;
 white-space: nowrap;
 font-weight: var(--n-font-weight);
 `),o("title-position-left",[c("line",[o("left",{width:"28px"})])]),o("title-position-right",[c("line",[o("right",{width:"28px"})])]),o("dashed",[c("line",`
 background-color: #0000;
 height: 0px;
 width: 100%;
 border-style: dashed;
 border-width: 1px 0 0;
 `)]),o("vertical",`
 display: inline-block;
 height: 1em;
 margin: 0 8px;
 vertical-align: middle;
 width: 1px;
 `),c("line",`
 border: none;
 transition: background-color .3s var(--n-bezier), border-color .3s var(--n-bezier);
 height: 1px;
 width: 100%;
 margin: 0;
 `),v("dashed",[c("line",{backgroundColor:"var(--n-color)"})]),o("dashed",[c("line",{borderColor:"var(--n-color)"})]),o("vertical",{backgroundColor:"var(--n-color)"})]),_=Object.assign(Object.assign({},b.props),{titlePlacement:{type:String,default:"center"},dashed:Boolean,vertical:Boolean}),d=p({name:"Divider",props:_,setup(l){const{mergedClsPrefixRef:a,inlineThemeDisabled:m}=E(l),x=b("Divider","-divider",$,y,l,a),C=A(()=>{const{common:{cubicBezierEaseInOut:n},self:{color:B,textColor:g,fontWeight:k}}=x.value;return{"--n-bezier":n,"--n-color":B,"--n-text-color":g,"--n-font-weight":k}}),r=m?w("divider",void 0,C,l):void 0;return{mergedClsPrefix:a,cssVars:m?void 0:C,themeClass:r?.themeClass,onRender:r?.onRender}},render(){var l;const{$slots:a,titlePlacement:m,vertical:x,dashed:C,cssVars:r,mergedClsPrefix:n}=this;return(l=this.onRender)===null||l===void 0||l.call(this),f("div",{role:"separator",class:[`${n}-divider`,this.themeClass,{[`${n}-divider--vertical`]:x,[`${n}-divider--no-title`]:!a.default,[`${n}-divider--dashed`]:C,[`${n}-divider--title-position-${m}`]:a.default&&m}],style:r},x?null:f("div",{class:`${n}-divider__line ${n}-divider__line--left`}),!x&&a.default?f(D,null,f("div",{class:`${n}-divider__title`},this.$slots),f("div",{class:`${n}-divider__line ${n}-divider__line--right`})):null)}}),z=p({setup(){return()=>e("div",{class:"mx-auto max-w-4xl space-y-6 p-6"},[e("h1",{class:"text-2xl font-semibold text-neutral-900 dark:text-neutral-100"},[u("Toast 测试")]),e(h,{title:"基础用法",class:"!rounded-xl"},{default:()=>[e("div",{class:"space-y-4"},[e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("状态类型")]),e(s,null,{default:()=>[e(i,{onClick:()=>t.success("操作成功")},{default:()=>[u("Success")]}),e(i,{onClick:()=>t.error("操作失败")},{default:()=>[u("Error")]}),e(i,{onClick:()=>t.warning("请注意")},{default:()=>[u("Warning")]}),e(i,{onClick:()=>t.info("提示信息")},{default:()=>[u("Info")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("带描述文字")]),e(s,null,{default:()=>[e(i,{onClick:()=>{t.success("保存成功",{description:"您的更改已保存"})}},{default:()=>[u("Success + Description")]}),e(i,{onClick:()=>{t.error("保存失败",{description:"请检查网络连接后重试"})}},{default:()=>[u("Error + Description")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("Loading 状态")]),e(s,null,{default:()=>[e(i,{onClick:()=>{const l=t.loading("加载中...");setTimeout(()=>{t.dismiss(l),t.success("加载完成")},2e3)}},{default:()=>[u("Loading → Success")]}),e(i,{onClick:()=>{const l=t.loading("处理中...");setTimeout(()=>{t.dismiss(l),t.error("处理失败")},2e3)}},{default:()=>[u("Loading → Error")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("手动关闭")]),e(s,null,{default:()=>[e(i,{onClick:()=>{const l=t.success("3 秒后自动关闭",{duration:1/0});setTimeout(()=>{t.dismiss(l),t.info("已关闭")},3e3)}},{default:()=>[u("手动 dismiss")]})]})])])]}),e(h,{title:"带 Action 按钮",class:"!rounded-xl"},{default:()=>[e("div",{class:"space-y-4"},[e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("新评论通知")]),e("p",{class:"mb-2 text-xs text-neutral-400"},[u('WebSocket 推送新评论，点击"查看"跳转')]),e(s,null,{default:()=>[e(i,{onClick:()=>{const l=t.success("新的评论",{description:"张三: 这篇文章写得太好了，学到了很多！",action:{label:"查看",onClick:()=>{t.dismiss(l),t.info("跳转到评论页面...")}},duration:1e4})}},{default:()=>[u("模拟新评论")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("友链申请")]),e("p",{class:"mb-2 text-xs text-neutral-400"},[u('收到友链申请，点击"查看"跳转到友链管理')]),e(s,null,{default:()=>[e(i,{onClick:()=>{const l=t.success("新的友链申请",{description:"example.com - 一个有趣的技术博客",action:{label:"查看",onClick:()=>{t.dismiss(l),t.info("跳转到友链管理...")}},duration:1e4})}},{default:()=>[u("模拟友链申请")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("版本更新")]),e("p",{class:"mb-2 text-xs text-neutral-400"},[u("检测到新版本提醒")]),e(s,null,{default:()=>[e(i,{onClick:()=>{t.info("管理后台有新版本可用",{description:"v5.1.0 → v5.2.0",action:{label:"更新",onClick:()=>t.success("开始更新...")},duration:15e3})}},{default:()=>[u("模拟版本更新")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("撤销操作")]),e("p",{class:"mb-2 text-xs text-neutral-400"},[u("删除后提供撤销功能")]),e(s,null,{default:()=>[e(i,{onClick:()=>{t.success("文件已删除",{description:"image-2024-01-15.png",action:{label:"撤销",onClick:()=>t.success("已恢复文件")},duration:8e3})}},{default:()=>[u("删除 + 撤销")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("错误重试")]),e(s,null,{default:()=>[e(i,{onClick:()=>{t.error("保存失败",{description:"服务器返回错误：500 Internal Server Error",action:{label:"重试",onClick:()=>t.info("正在重试...")},duration:1e4})}},{default:()=>[u("服务器错误 + 重试")]})]})])])]}),e(h,{title:"常见业务场景",class:"!rounded-xl"},{default:()=>[e("div",{class:"space-y-4"},[e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("表单提交")]),e(s,null,{default:()=>[e(i,{type:"primary",onClick:async()=>{const l=t.loading("提交中...");await new Promise(a=>setTimeout(a,1500)),t.dismiss(l),t.success("提交成功")}},{default:()=>[u("模拟表单提交")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("批量操作")]),e(s,null,{default:()=>[e(i,{onClick:async()=>{const l=t.loading("正在删除 5 篇文章...");await new Promise(a=>setTimeout(a,1500)),t.dismiss(l),t.success("批量删除完成",{description:"已删除 5 篇文章",action:{label:"撤销",onClick:()=>t.success("已撤销删除")},duration:1e4})}},{default:()=>[u("批量删除文章")]})]})]),e(d,null,null),e("div",null,[e("h4",{class:"mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"},[u("数据同步")]),e(s,null,{default:()=>[e(i,{onClick:()=>{t.warning("数据库有变动",{description:"检测到数据更新，建议刷新页面",action:{label:"刷新",onClick:()=>t.info("页面刷新中...")},duration:1e4})}},{default:()=>[u("数据同步提醒")]})]})])])]})])}});export{z as default};
