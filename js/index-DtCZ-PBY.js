import{cK as S,cL as F,cM as N,cN as T,d as l,Y as k,b as x,as as C,R as u,Z as E,w as D,o as R,a3 as M,e as t,al as q,C as A,k as O,h as f,v as j,f as r,bz as K,a1 as L,i as P,B as V}from"./index-BdlFa6oM.js";const z=new Map([[S,"博文"],[F,"手记"],[N,"速记"],[T,"说说"]]);function p(a){return typeof a=="function"||Object.prototype.toString.call(a)==="[object Object]"&&!j(a)}const Z=l({setup(){const a=k(),s=x(!1);C(async()=>{const e=await u.api.subscribe.status.get().then(c=>c.enable);s.value=e});const n=async()=>{await u.api.options("featureList").patch({data:{emailSubscribe:!s.value}}),s.value=!s.value},{loading:g,checkedRowKeys:y,data:m,pager:o,fetchDataFn:d}=E((e,c)=>async(w=a.query.page||1,B=10)=>{const b=await u.api.subscribe.get({params:{page:w,size:B,sortBy:"created",sortOrder:"-1"}});e.value=b.data,c.value=b.pagination}),i=d;D(()=>a.query.page,async e=>{await i(e)}),R(async()=>{await d()});const h=M(()=>[{title:"邮箱",key:"email",ellipsis:{tooltip:!0},width:140},{title:"订阅内容",key:"subscribe",width:250,render(e){return t(U,{bit:e.subscribe},null)}},{title:"创建于",width:250,key:"created",sortOrder:"descend",render(e){return t(L,{time:e.created},null)}},{title:"操作",fixed:"right",width:40,key:"id",render(e){return t(f,null,{default:()=>[t(P,{positiveText:"取消",negativeText:"删除",onNegativeClick:async()=>{await u.api.subscribe.unsubscribe.get({params:{email:e.email,cancelToken:e.cancelToken}}),message.success("删除成功"),await i(o.value.currentPage)}},{trigger:()=>t(V,{quaternary:!0,type:"error",size:"tiny"},{default:()=>[r("移除")]}),default:()=>t("span",{class:"max-w-48"},[r("确定要删除 "),e.title,r("？")])})]})}}]),v=l(()=>()=>t("div",{class:"inline-flex items-center"},[t("span",null,[r("邮件订阅开启状态：")]),t(K,{value:s.value,onChange:n},null)]));return()=>t(A,{description:t(v,null,null)},{default:()=>[t(q,{data:m,loading:g.value,columns:h.value,onFetchData:i,pager:o,onUpdateCheckedRowKeys:e=>{y.value=e}},null)]})}}),U=l({props:{bit:{type:Number,required:!0}},render(){const a=[];for(const[s,n]of z.entries())s&this.bit&&a.push(t(O,{round:!0},p(n)?n:{default:()=>[n]}));return t(f,null,p(a)?a:{default:()=>[a]})}});export{U as SubscribeBit,Z as default};
