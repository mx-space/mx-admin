import{cj as B,d as N,b as E,c as S,r as P,w as T,e as t,N as M,f as v,n as k,V as w,Q as D,h as V,de as H,M as U,B as h,a2 as Y,bv as F,C as R,ai as $,R as A,df as J}from"./index-Crl3qwRq.js";import{a as O}from"./Upload-Q4hDNqEU.js";class _{constructor(l){this.strList=l,this.strList=l}parse(l){const u=l,f=/-{3,}\r?\n(.*?)-{3,}\r?\n*(.*)$/gms.exec(u);if(!f)return{text:u};const i=f.pop(),g=B(f[1]),s={},{categories:o,tags:x,date:e,updated:d,created:a,title:n}=g;return(e||a)&&(s.date=new Date(e||a).toISOString()),d&&(s.updated=new Date(d).toISOString()),s.categories=o,s.tags=x,s.title=n,Object.keys(s).forEach(r=>{typeof s[r]>"u"&&delete s[r]}),{meta:s,text:i}}start(){const l=this.strList,u=[];for(const[f,i]of l.entries())try{u.push(this.parse(i))}catch(g){throw{idx:f,err:g}}return u}}var b=function(c){return c.Post="post",c.Note="note",c}(b||{});const I=[{value:b.Post,label:"博文"},{label:"日记",value:b.Note}],z=N(()=>{const c=E(b.Post),l=E([]),u=E([]);function f(e){return new _(e).start().map((a,n)=>{const p=l.value[n].file.name.replace(/\.md$/,"");return a.meta?a.meta.slug=a.meta.slug??p:a.meta={title:p,slug:p},a.meta?.date||(a.meta.date=new Date().toISOString()),a})}const i=S();async function g(e){if(e?.preventDefault(),e?.stopPropagation(),!l.value.length)throw new ReferenceError("fileList is empty");const d=[];for await(const a of l.value){const n=await Promise.resolve(new Promise((r,p)=>{const m=a.file;if(!m){i.error("文件不存在"),p("File is empty");return}const y=m.name.split(".").pop();if(m.type&&m.type!=="text/markdown"||!["md","markdown"].includes(y)){i.error(`只能解析 markdown 文件，但是得到了 ${m.type}`),p(`File must be markdown. got type: ${m.type}, got ext: ${y}`);return}const C=new FileReader;C.addEventListener("load",L=>{r(L.target?.result||"")}),C.readAsText(m)}));console.log(n),d.push(n)}try{const a=f(d);i.success("解析完成，结果查看 console 哦"),u.value=a.map((n,r)=>({...n,filename:l.value[r].file?.name??""})),console.log($(u))}catch(a){console.error(a.err),i.error(`文件${l.value[a.idx].name??""}解析失败，具体信息查看 console`)}}async function s(e){if(e.stopPropagation(),e.preventDefault(),!u.value.length)return i.error("请先解析!!");await A.api.markdown.import.post({data:{type:c.value,data:u.value}}),i.success("上传成功！"),l.value=[]}const o=P({includeYAMLHeader:!0,titleBigTitle:!1,filenameSlug:!1,withMetaJson:!0});async function x(){const{includeYAMLHeader:e,filenameSlug:d,withMetaJson:a,titleBigTitle:n}=o,r=await A.api.markdown.export.get({params:{slug:d,yaml:e,show_title:n,with_meta_json:a},responseType:"blob"});J(r,"markdown.zip")}return T(()=>l.value,e=>{e.length==0?u.value=[]:g()}),()=>t(R,null,{default:()=>[t(M,null,{default:()=>[v("从 Markdown 导入数据")]}),t(k,{labelAlign:"right",labelPlacement:"left",labelWidth:150,class:"max-w-[300px]"},{default:()=>[t(w,{label:"导入到:"},{default:()=>[t(D,{options:I,value:c.value,onUpdateValue:e=>void(c.value=e)},null)]}),t(w,{label:"准备好了吗."},{default:()=>[t(V,{vertical:!0},{default:()=>[t(O,{multiple:!0,accept:".md,.markdown",onChange:H(e=>{l.value=e.fileList},250),onRemove:e=>{const a=e.file.name,n=u.value.findIndex(r=>r.filename===a);n!=-1&&u.value.splice(n,1)}},{default:()=>[t(U,null,{default:()=>[t(h,{round:!0},{default:()=>[v("先上传")]}),t(h,{onClick:g,disabled:!l.value.length},{default:()=>[v("再解析")]}),t(h,{onClick:s,round:!0,disabled:!u.value.length},{default:()=>[v("最后导入")]})]})]}),t(Y,{depth:2,class:"!text-sm"},{default:()=>[v("只能上传 markdown 文件")]})]})]})]}),t(M,null,{default:()=>[v("导出数据到 Markdown (Hexo YAML Format)")]}),t(k,{labelAlign:"right",labelPlacement:"left",labelWidth:180,class:"max-w-[400px]"},{default:()=>[t(w,{label:"是否包括 yaml header"},{default:()=>[t(F,{value:o.includeYAMLHeader,onUpdateValue:e=>void(o.includeYAMLHeader=e)},null)]}),t(w,{label:"是否在第一行显示文章标题"},{default:()=>[t(F,{value:o.titleBigTitle,onUpdateValue:e=>void(o.titleBigTitle=e)},null)]}),t(w,{label:"根据 slug 生成文件名"},{default:()=>[t(F,{value:o.filenameSlug,onUpdateValue:e=>void(o.filenameSlug=e)},null)]}),t(w,{label:"导出元数据 JSON"},{default:()=>[t(F,{value:o.withMetaJson,onUpdateValue:e=>void(o.withMetaJson=e)},null)]}),t("div",{class:"w-full text-right"},[t(h,{type:"primary",onClick:x},{default:()=>[v("导出")]})])]})]})});export{z as default};
