const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/index-CL4swxXD.js","assets/index-Bt1SQNzf.css"])))=>i.map(i=>d[i]);
import{cl as t,d as D,b as R,dc as g,w as c,o as A,R as I,e as f,aJ as L}from"./index-CL4swxXD.js";class P{created;id}const T=`
export default async function handler(ctx: Context) {
  return 'pong';
}
`.trimStart();var V=(e=>(e.JSON="json",e.JSON5="json5",e.Function="function",e.Text="text",e.YAML="yaml",e))(V||{}),y=(e=>(e.json="json",e.json5="plaintext",e.function="typescript",e.text="markdown",e.yaml="yaml",e))(y||{});class M extends P{type="json";private=!1;raw="{}";name="";reference="root";comment;metatype;schema;enable;method;secret;builtIn=!1}var l;(e=>{e.libSource=`
 `.trim(),e.libUri="ts:filename/extends.d.ts"})(l||(l={}));const v=Object.freeze(Object.defineProperty({__proto__:null,get globalTypeDeclare(){return l}},Symbol.toStringTag,{value:"Module"})),h=Object.assign({"./node/assert.d.ts":()=>t(()=>import("./assert.d-z9w53SsN.js"),[]).then(e=>e.default),"./node/async_hooks.d.ts":()=>t(()=>import("./async_hooks.d-B9rt11F2.js"),[]).then(e=>e.default),"./node/base.d.ts":()=>t(()=>import("./base.d-B9hLN46M.js"),[]).then(e=>e.default),"./node/buffer.d.ts":()=>t(()=>import("./buffer.d-C5eug5JV.js"),[]).then(e=>e.default),"./node/child_process.d.ts":()=>t(()=>import("./child_process.d-DmzlSa3K.js"),[]).then(e=>e.default),"./node/cluster.d.ts":()=>t(()=>import("./cluster.d-5fB-OEot.js"),[]).then(e=>e.default),"./node/constants.d.ts":()=>t(()=>import("./constants.d-C4y09FgR.js"),[]).then(e=>e.default),"./node/crypto.d.ts":()=>t(()=>import("./crypto.d-O2YtD14o.js"),[]).then(e=>e.default),"./node/dgram.d.ts":()=>t(()=>import("./dgram.d-DL_4np3W.js"),[]).then(e=>e.default),"./node/dns.d.ts":()=>t(()=>import("./dns.d-CJFV6fnB.js"),[]).then(e=>e.default),"./node/domain.d.ts":()=>t(()=>import("./domain.d-DB4dUuk8.js"),[]).then(e=>e.default),"./node/fs.d.ts":()=>t(()=>import("./fs.d-BAYqPgzi.js"),[]).then(e=>e.default),"./node/globals.d.ts":()=>t(()=>import("./globals.d-BFLZ9fa5.js"),[]).then(e=>e.default),"./node/globals.global.d.ts":()=>t(()=>import("./globals.global.d-BYBn4iMV.js"),[]).then(e=>e.default),"./node/index.d.ts":()=>t(()=>import("./index.d-BdKhL8OE.js"),[]).then(e=>e.default),"./node/inspector.d.ts":()=>t(()=>import("./inspector.d-Ci1-a7MX.js"),[]).then(e=>e.default),"./node/net.d.ts":()=>t(()=>import("./net.d-3BiG-OBh.js"),[]).then(e=>e.default),"./node/os.d.ts":()=>t(()=>import("./os.d-BOmVYeaU.js"),[]).then(e=>e.default),"./node/path.d.ts":()=>t(()=>import("./path.d-DxF3hWbM.js"),[]).then(e=>e.default),"./node/perf_hooks.d.ts":()=>t(()=>import("./perf_hooks.d-tB0Ip8q0.js"),[]).then(e=>e.default),"./node/punycode.d.ts":()=>t(()=>import("./punycode.d-BH8FuZew.js"),[]).then(e=>e.default),"./node/querystring.d.ts":()=>t(()=>import("./querystring.d-C3ITSgP7.js"),[]).then(e=>e.default),"./node/readline.d.ts":()=>t(()=>import("./readline.d-BfmzZypd.js"),[]).then(e=>e.default),"./node/stream.d.ts":()=>t(()=>import("./stream.d-BOSiuy1K.js"),[]).then(e=>e.default),"./node/string_decoder.d.ts":()=>t(()=>import("./string_decoder.d-DVYxf0C2.js"),[]).then(e=>e.default),"./node/timers.d.ts":()=>t(()=>import("./timers.d-DJ6D63km.js"),[]).then(e=>e.default),"./node/trace_events.d.ts":()=>t(()=>import("./trace_events.d-Ce--kvdr.js"),[]).then(e=>e.default),"./node/url.d.ts":()=>t(()=>import("./url.d-5cjNMJgS.js"),[]).then(e=>e.default),"./node/util.d.ts":()=>t(()=>import("./util.d-BKbpMPM-.js"),[]).then(e=>e.default),"./node/wasi.d.ts":()=>t(()=>import("./wasi.d-CFOHPEHH.js"),[]).then(e=>e.default),"./node/zlib.d.ts":()=>t(()=>import("./zlib.d-PhjgZe1U.js"),[]).then(e=>e.default)}),u={};for(const e in h){const n=await h[e]();u[`ts:node/${e.split("/").pop()}`]=n}const x=D({props:{value:{type:Object,required:!0},onSave:{type:Function,required:!1},language:{type:String,default:"typescript"}},setup(e,{expose:n}){const p=R(),s=g(p,e.value,r=>{e.value.value=r},{language:e.language});n(s),c(()=>[s.loaded.value,e.language],([r,d])=>{r&&t(()=>import("./index-CL4swxXD.js").then(_=>_.er),__vite__mapDeps([0,1])).then(_=>{const o=s.editor.getModel();o&&_.editor.setModelLanguage(o,d)})}),A(()=>{t(()=>import("./index-CL4swxXD.js").then(r=>r.er),__vite__mapDeps([0,1])).then(r=>{const d=r.languages.typescript.typescriptDefaults.getCompilerOptions();d.target=r.languages.typescript.ScriptTarget.ESNext,d.allowNonTsExtensions=!0,d.moduleResolution=r.languages.typescript.ModuleResolutionKind.NodeJs,d.esModuleInterop=!0,r.languages.typescript.typescriptDefaults.setCompilerOptions(d);const _="ts:filename/global.d.ts";r.editor.getModel(r.Uri.parse(_))||I.api.fn.types.get().then(o=>{const i=o;r.languages.typescript.typescriptDefaults.addExtraLib(i,_),r.editor.createModel(i,"typescript",r.Uri.parse(_))}),Object.keys(v).forEach(o=>{const i=v[o],{libSource:E,libUri:a}=i,O=r.Uri.parse(a);r.editor.getModel(O)||(r.languages.typescript.typescriptDefaults.addExtraLib(E,a),r.editor.createModel(E,"typescript",r.Uri.parse(a)))});for(const o in u){const i=u[o];r.languages.typescript.typescriptDefaults.addExtraLib(i,o),r.editor.createModel(i,"typescript",r.Uri.parse(o))}})});const m=c(()=>s.loaded.value,r=>{m(),t(()=>import("./index-CL4swxXD.js").then(d=>d.er),__vite__mapDeps([0,1])).then(d=>{s.editor.addCommand(d.KeyMod.CtrlCmd|d.KeyCode.KeyS,()=>{e.onSave?.()})})});return()=>f("div",{class:"relative h-full w-full"},[f("div",{class:"relative h-full w-full",ref:p},null),L(s.Snip)])}});export{x as F,M as S,V as a,y as b,T as d};
