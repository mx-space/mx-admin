function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["js/index-BPupO9ga.js","assets/index-D1jYty6g.css"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import{d,dv as f,c as v,b as l,e,by as u,F as m,H as p,C as g,R as h,c3 as _}from"./index-BPupO9ga.js";import{F as y,d as b}from"./index-YeluL0D_.js";import{_ as S}from"./CheckCircleOutlined-DE_G6Sru.js";import{T}from"./two-col-CUO2qxo0.js";const H=d({setup(){const s=f("debug-serverless",b),i=v(),t=l(),r=l(""),o=async()=>{try{const n=await h.api.debug.function.post({data:{function:s.value},errorHandler:a=>{r.value=`Error: ${a.data.message}`,i.error(a.data.message)}});_(()=>import("./index-BPupO9ga.js").then(a=>a.e6),__vite__mapDeps([0,1])).then(a=>{a.editor.colorize(JSON.stringify(n.data,null,2),"typescript",{tabSize:2}).then(c=>{t.value.innerHTML=c}).catch(()=>{t.value.innerHTML=JSON.stringify(n,null,2)})})}catch{}};return()=>e(g,{actionsElement:e(m,null,[e(p,{icon:e(S,null,null),onClick:o},null)])},{default:()=>[e(T,null,{default:()=>[e(u,{span:"18"},{default:()=>[e("div",{class:"h-[80vh]"},[e(y,{value:s,onSave:o},null)])]}),e(u,{span:"18"},{default:()=>[e("pre",{class:"max-h-[calc(100vh-10rem)] overflow-auto !bg-transparent !bg-none",ref:t},[r.value])]})]})]})}});export{H as default};
