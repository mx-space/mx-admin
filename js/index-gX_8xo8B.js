import{d,e as f,aW as u,ao as c,R as l}from"./index-Dym10iWb.js";import{a as r}from"./Upload-COj13gFe.js";const m=d({props:{onFinish:{type:Function},onError:{type:Function},type:{type:String,required:!0}},setup(o,{slots:t}){return()=>{const{onFinish:n,onError:a,type:s,...p}=o;return f(r,u({headers:{authorization:c()||""},showFileList:!1,accept:"image/*",action:`${l.endpoint}/files/upload?type=${s}`,onError:a||(e=>(message.error("上传失败"),e.file)),onFinish:n},Object.fromEntries(Object.entries(p).filter(([e,i])=>typeof i<"u"))),{default:()=>[t.default?.()]})}}});m.props=[...Array.from(Object.keys(r.props)),"type"];export{m as U};
