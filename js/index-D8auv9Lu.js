import{cO as S,cP as F,cQ as T,cR as k,d as o,Y as x,b as C,av as N,R as u,Z as E,w as R,o as D,a3 as M,e as t,ao as O,C as q,k as A,h as f,v as P,f as r,bv as j,a1 as V,i as K,B as L}from"./index-CL4swxXD.js";const z=new Map([[S,"博文"],[F,"手记"],[T,"速记"],[k,"说说"]]);function p(a){return typeof a=="function"||Object.prototype.toString.call(a)==="[object Object]"&&!P(a)}const Y=o({setup(){const a=x(),s=C(!1);N(async()=>{const e=await u.api.subscribe.status.get().then(c=>c.enable);s.value=e});const n=async()=>{await u.api.options("featureList").patch({data:{emailSubscribe:!s.value}}),s.value=!s.value},{loading:g,checkedRowKeys:y,data:m,pager:l,fetchDataFn:d}=E((e,c)=>async(w=a.query.page||1,B=10)=>{const b=await u.api.subscribe.get({params:{page:w,size:B,sortBy:"created",sortOrder:"-1"}});e.value=b.data,c.value=b.pagination}),i=d;R(()=>a.query.page,async e=>{await i(e)}),D(async()=>{await d()});const v=M(()=>[{title:"邮箱",key:"email",ellipsis:{tooltip:!0},width:140},{title:"订阅内容",key:"subscribe",width:250,render(e){return t(Q,{bit:e.subscribe},null)}},{title:"创建于",width:250,key:"created",sortOrder:"descend",render(e){return t(V,{time:e.created},null)}},{title:"操作",fixed:"right",width:40,key:"id",render(e){return t(f,null,{default:()=>[t(K,{positiveText:"取消",negativeText:"删除",onNegativeClick:async()=>{await u.api.subscribe.unsubscribe.get({params:{email:e.email,cancelToken:e.cancelToken}}),message.success("删除成功"),await i(l.value.currentPage)}},{trigger:()=>t(L,{quaternary:!0,type:"error",size:"tiny"},{default:()=>[r("移除")]}),default:()=>t("span",{class:"max-w-48"},[r("确定要删除 "),e.title,r("？")])})]})}}]),h=o(()=>()=>t("div",{class:"inline-flex items-center"},[t("span",null,[r("邮件订阅开启状态：")]),t(j,{value:s.value,onChange:n},null)]));return()=>t(q,{description:t(h,null,null)},{default:()=>[t(O,{data:m,loading:g.value,columns:v.value,onFetchData:i,pager:l,onUpdateCheckedRowKeys:e=>{y.value=e}},null)]})}}),Q=o({props:{bit:{type:Number,required:!0}},render(){const a=[];for(const[s,n]of z.entries())s&this.bit&&a.push(t(A,{round:!0},p(n)?n:{default:()=>[n]}));return t(f,null,p(a)?a:{default:()=>[a]})}});export{Q as SubscribeBit,Y as default};
