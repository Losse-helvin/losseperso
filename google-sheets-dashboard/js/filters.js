export const FILTER_FIELDS=['form','source','campaign','city','solution'];
export function filterRecords(rows,f,{ignoreDates=false}={}){return rows.filter(r=>(ignoreDates||((!f.start||(r.day&&r.day>=f.start))&&(!f.end||(r.day&&r.day<=f.end))))&&FILTER_FIELDS.every(k=>!f[k]||(k==='solution'?r.solutions.includes(f[k]):r[k]===f[k])));}
export function readFilters(){return Object.fromEntries(['start','end',...FILTER_FIELDS].map(k=>[k,document.getElementById(k).value]));}
export function populateFilters(records){for(const k of FILTER_FIELDS){const el=document.getElementById(k),old=el.value;const vs=[...new Set(records.flatMap(r=>k==='solution'?r.solutions:[r[k]]))].sort((a,b)=>a.localeCompare(b));el.replaceChildren(new Option('Tous',''),...vs.map(v=>new Option(v,v)));if(vs.includes(old))el.value=old;}}
export function resetFilters(){['start','end',...FILTER_FIELDS].forEach(k=>document.getElementById(k).value='');}
