import{d as w,r as _,e as a,m as v,n as I,V as n,Q as m,bz as b,B as c,f as i}from"./index-Dym10iWb.js";const d="mx-admin:setup-api:url",g="mx-admin:setup-api:gateway",x=w({setup(){const t=_({apiUrl:localStorage.getItem("__api")||`${location.protocol}//${location.host}/api/v2`,gatewayUrl:localStorage.getItem("__gateway")||`${location.protocol}//${location.host}`,persist:!0}),r=()=>{const{apiUrl:e,gatewayUrl:u,persist:U}=t,o=f(e),l=f(u);U?(o&&localStorage.setItem("__api",o),l&&localStorage.setItem("__gateway",l)):(o&&sessionStorage.set("__api",o),l&&sessionStorage.set("__gateway",l)),localStorage.setItem(d,JSON.stringify([...new Set(s.concat(e))])),localStorage.setItem(g,JSON.stringify([...new Set(s.concat(u))]));const p=new URL(location.href);p.hash="#/dashboard",location.href=p.toString(),location.reload()},h=()=>{localStorage.removeItem("__api"),localStorage.removeItem("__gateway"),sessionStorage.removeItem("__api"),sessionStorage.removeItem("__gateway"),location.href=location.pathname,location.hash=""},y=()=>{t.apiUrl="http://localhost:2333",t.gatewayUrl="http://localhost:2333"},s=JSON.safeParse(localStorage.getItem(d)||"[]"),S=JSON.safeParse(localStorage.getItem(g)||"[]");return()=>a("div",{class:"relative flex h-screen w-full items-center justify-center"},[a(v,{title:"设置 API",class:"modal-card sm form-card m-auto"},{default:()=>[a(I,{onSubmit:r},{default:()=>[a(n,{label:"API 地址"},{default:()=>[a(m,{options:s.map(e=>({key:e,value:e,label:e})),filterable:!0,tag:!0,clearable:!0,value:t.apiUrl,onUpdateValue:e=>{t.apiUrl=e}},null)]}),a(n,{label:"Gateway 地址"},{default:()=>[a(m,{tag:!0,options:S.map(e=>({key:e,value:e,label:e})),filterable:!0,clearable:!0,value:t.gatewayUrl,onUpdateValue:e=>{t.gatewayUrl=e}},null)]}),a(n,{label:"持久化",labelPlacement:"left"},{default:()=>[a(b,{value:t.persist,onUpdateValue:e=>{t.persist=e}},null)]}),a("div",{class:"space-x-2 text-center"},[a(c,{onClick:y,round:!0},{default:()=>[i("本地调试")]}),a(c,{onClick:h,round:!0},{default:()=>[i("重置")]}),a(c,{onClick:r,round:!0,type:"primary"},{default:()=>[i("确定")]})])]})]})])}}),f=t=>t?t.startsWith("http")?t:`${["localhost","127.0.0.1"].indexOf(t)>-1?"http":"https"}://${t}`:"";export{x as default};
