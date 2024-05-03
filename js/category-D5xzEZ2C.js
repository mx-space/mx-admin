import{d as T,u as I,a as R,r as b,b as y,c as D,o as z,R as c,w as E,e,N,f as n,g as x,t as j,h as S,B as d,i as M,j as V,k as H,l as O,F as L,H as P,A as U,C as _,m as $,n as G,p as B,q as F,s as J,v as K}from"./index-Dym10iWb.js";function Q(u){return typeof u=="function"||Object.prototype.toString.call(u)==="[object Object]"&&!K(u)}const X=T(u=>{const a=I(R),g=b([]),r=y(!0),s=a.fetch,p=D();z(async()=>{r.value=!0,await s(),r.value=!1;const{data:l}=await c.api.categories.get({params:{type:"tag"}});g.push(...l)});const h=y(""),m=b([]);E(()=>h.value,async l=>{if(!l)return;const t=await c.api.categories(l).get({params:{tag:"true"}});m.length=0,m.push(...t.data)});const i=y(!1),k=()=>({name:"",slug:""}),v=y(k());return()=>{let l;return e(_,{actionsElement:e(L,null,[e(P,{variant:"success",icon:e(U,null,null),onClick:()=>{i.value=!0,v.value=k()}},null)])},{default:()=>[e(N,{prefix:"bar"},{default:()=>[n("分类")]}),e(q,{show:i,onSubmit:async t=>{const{name:o,slug:C}=t,w=typeof i.value=="string"?i.value:null;if(w){await c.api.categories(w).put({data:{name:o,slug:C,type:0}}),p.success("修改成功");const f=a.data.value.findIndex(A=>A.id==w);a.data.value[f]={...a.data.value[f],...t}}else{const f=await c.api.categories.post({data:{name:o,slug:C}});p.success("创建成功"),a.data.value.push(f.data)}},initialState:v.value},null),e(x,{rowClassName:()=>j,bordered:!1,data:a.data.value||[],remote:!0,loading:r.value,columns:[{title:"名称",key:"name"},{title:"数",key:"count"},{title:"路径",key:"slug",width:300},{width:300,title:"操作",fixed:"right",key:"id",render(t){return e(S,{size:12},{default:()=>[e(d,{size:"tiny",quaternary:!0,type:"primary",onClick:o=>{v.value={name:t.name,slug:t.slug},i.value=t.id}},{default:()=>[n("编辑")]}),e(M,{positiveText:"取消",negativeText:"删除",onNegativeClick:async()=>{await c.api.categories(t.id).delete(),p.success("删除成功"),await a.fetch(!0)}},{trigger:()=>e(d,{quaternary:!0,type:"error",size:"tiny"},{default:()=>[n("移除")]}),default:()=>e("span",{class:"max-w-48"},[n("确定要删除 "),t.title,n(" ?")])})]})}}]},null),e(N,{prefix:"bar"},{default:()=>[n("标签")]}),e(S,{size:12},Q(l=g.map(t=>e(V,{value:t.count,key:t.name},{default:()=>[e(H,{class:"border border-gray-200",round:!0,type:"success",checkable:!0,bordered:!0,checked:h.value==t.name,onUpdateChecked:o=>{o&&(h.value=t.name)}},{default:()=>[t.name]})]})))?l:{default:()=>[l]}),m.length!=0&&e(x,{remote:!0,class:"mt-4",data:m,columns:[{title:"标题",key:"title",render(t){return e(O,{to:`/posts/edit?id=${t.id}`},{default:()=>[e(d,{type:"primary",quaternary:!0},{default:()=>[t.title]})]})}},{title:"分类",key:"category",render(t){return t.category.name}}]},null)]})}}),q=T(u=>{const a=b(u.initialState??{name:"",slug:""});E(()=>u.initialState,s=>{s&&(a.name=s.name,a.slug=s.slug)});const g=D(),r=()=>{if(!a.name||!a.slug){g.error("名字 和 路径 不能为空");return}u.onSubmit(a),u.show.value=!1};return()=>e(J,{transformOrigin:"center",show:!!u.show.value,onUpdateShow:s=>{u.show.value=s}},{default:()=>e($,{style:"width: 500px;max-width: 90vw",headerStyle:{textAlign:"center"},title:u.initialState?"编辑":"新建"},{default:()=>[e(G,{onSubmit:r,model:a,rules:{name:{required:!0,trigger:["input","blur"]},slug:{required:!0,trigger:["input","blur"]}}},{default:()=>[e(B,{path:"name",label:"名字"},{default:()=>[e(F,{placeholder:"",onInput:s=>{a.name=s},value:a.name},null)]}),e(B,{path:"slug",label:"路径"},{default:()=>[e(F,{placeholder:"",onInput:s=>{a.slug=s},value:a.slug},null)]}),e("div",{class:"text-center"},[e(S,{size:12,align:"center",inline:!0},{default:()=>[e(d,{type:"success",onClick:r,round:!0},{default:()=>[n("确定")]}),e(d,{onClick:()=>u.show.value=!1,round:!0},{default:()=>[n("取消")]})]})])]})]})})});q.props=["initialState","onSubmit","show"];export{X as CategoryView};
