import{d,b as r,o as y,e,s as b,m as k,aX as x,Q as N,f as c,B as m,R as p,F as T,dB as B,cm as C,$ as L,Y as S,a3 as M,y as R,am as U,an as v,C as D}from"./index-Crl3qwRq.js";import{X as w}from"./index-DWe_LhmR.js";import{N as E,a as F}from"./ListItem-BFxNn35C.js";import{b as g,c as i}from"./index-BX9mOqVA.js";import{E as h}from"./types-w5g51IlY.js";const V=d({setup(){const s=r([]),l=r(!1),n=async()=>{l.value=!0;const{data:t}=await p.api.health.log.list(a.value).get();s.value=t,l.value=!1};y(()=>{n()});const u=r(""),o=r(!1),a=r("native");return()=>e(T,null,[e(b,{transformOrigin:"center",show:o.value,onUpdateShow:t=>void(o.value=t)},{default:()=>[e(k,{title:"查看日志",class:"modal-card !bg-dark-400 !all:text-white !w-[100rem] !text-white",bordered:!1,closable:!0,onClose:()=>{o.value=!1}},{default:()=>[e(O,{data:u.value},null)]})]}),e(x,{show:l.value},{default:()=>[e(E,{class:"min-h-[300px] bg-transparent"},{header(){return e(N,{class:"ml-auto w-32",value:a.value,onUpdateValue:t=>{a.value=t,n()},options:[{label:"PM2",value:"pm2"},{label:"系统记录",value:"native"}]},null)},default(){return s.value.map(t=>e(F,{key:t.filename},{default(){return e("div",{class:"flex flex-col"},[e("span",null,[t.filename]),e("span",{class:"grid grid-cols-[5rem,auto] text-sm text-gray-400 dark:text-gray-600"},[e("span",null,[t.size]),e("span",null,[c("类型："),t.type])])])},suffix(){return e("div",{class:"flex space-x-2"},[e(m,{ghost:!0,type:"primary",onClick:()=>{p.api.health.log(a.value).get({params:{filename:t.filename}}).then(f=>{u.value=f,o.value=!0})}},{default:()=>[c("查看")]}),e(m,{ghost:!0,type:"error",onClick:()=>{p.api.health.log(a.value).delete({params:{filename:t.filename}}).then(()=>{s.value.splice(s.value.findIndex(f=>f.filename===t.filename),1)})}},{default:()=>[c("删除")]})])}}))}})]})])}}),O=d({props:{data:{type:String,default:""}},setup(s){const l=r(!0);return y(()=>{setTimeout(()=>{l.value=!1},1e3)}),()=>e("div",{class:"relative flex h-[600px] max-h-[70vh] overflow-auto"},[l.value?e("div",{class:"flex h-full w-full items-center justify-center"},[e(x,{show:!0,strokeWidth:14},null)]):e(w,{class:"w-full flex-grow",onReady:n=>{n.write(s.data)}},null)])}}),q=d({setup(){const s=(a=!0)=>{i.socket.emit("log",{prevLog:a})};let l;const n=[],u=a=>{l?(n.length>0&&o(l),l.write(a)):n.push(a)},o=a=>{for(;n.length;){const t=n.shift();a.write(t)}};return B(()=>{s(),g.on(h.STDOUT,u)}),C(()=>{const a=()=>{s(!1)};return i.socket.io.on("open",a),()=>{i.socket.io.off("open",a)}}),L(()=>{i.socket.emit("unlog"),g.off(h.STDOUT,u)}),()=>e(w,{darkMode:!0,onReady:a=>{l=a,o(l)}},null)}}),A=d({setup(){const s=S(),l=M(()=>s.query.tab?.toString()||"0"),n=R();return()=>e(D,null,{default:()=>[e(U,{size:"medium",value:l.value,onUpdateValue:u=>{n.replace({...s,query:{...s.query,tab:u}})}},{default:()=>[e(v,{tab:"日志",name:"0"},{default:()=>[e(V,null,null)]}),e(v,{tab:"实时",name:"1"},{default:()=>[e(q,null,null)]})]})]})}});export{A as default};
