/* Le référentiel postal (5 800 entrées) n'est plus importé statiquement : il est chargé
   à la demande, uniquement si une colonne code postal existe réellement. */
let POSTAL_CITIES = null;

export async function loadPostalReference() {
  if (POSTAL_CITIES) return POSTAL_CITIES;
  const response = await fetch(new URL('./postal-reference.json', import.meta.url), { cache: 'force-cache' });
  if (!response.ok) throw new Error('Référentiel postal indisponible.');
  POSTAL_CITIES = await response.json();
  return POSTAL_CITIES;
}

/** Permet aux tests d'injecter le référentiel sans requête réseau. */
export function setPostalReference(data) { POSTAL_CITIES = data || null; }

export const FIELDS={device:['appareil','device','device_type','type_appareil'],userAgent:['user_agent','useragent','user agent'],postalCode:['code_postal','code postal','cp','postal_code','zipcode','zip'],date:['horodatage','timestamp','date','created_at','date_creation'],id:['id_lead','lead_id'],form:['form_id','id_forme','formulaire'],source:['source','traffic_source'],campaign:['utm_campaign','campagne','campaign'],city:['ville','city'],region:['region','région','state'],solution:['solution','solutions']};
export function normalize(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[\s-]+/g,'_');}
export function detectHeader(rows){let best=0,score=-1;rows.slice(0,30).forEach((r,i)=>{const ns=r.map(normalize);const s=Object.values(FIELDS).reduce((n,a)=>n+Number(a.some(x=>ns.includes(normalize(x)))),0)*10+r.filter(x=>typeof x==='string'&&x.trim()).length/100;if(s>score){score=s;best=i;}});return best;}
export function inferMapping(headers){const ns=headers.map(normalize);return Object.fromEntries(Object.entries(FIELDS).map(([k,a])=>[k,ns.findIndex(n=>a.map(normalize).includes(n))]));}
const validDay=(y,m,d)=>{const t=new Date(Date.UTC(y,m-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d?t.toISOString().slice(0,10):null;};
export function parseDay(v){if(v===null||v===undefined||v==='')return null;if(typeof v==='number'){if(v<1||v>100000)return null;return new Date(Date.UTC(1899,11,30)+Math.floor(v)*86400000).toISOString().slice(0,10);}const s=String(v).trim();let m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);if(m)return validDay(+m[1],+m[2],+m[3]);m=s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})(?:\s.*)?$/);return m?validDay(+m[3],+m[2],+m[1]):null;}
export function splitSolutions(v){return [...new Set(String(v??'').split(/[,;\n|]+/).map(s=>s.trim()).filter(Boolean))];}
export function classifyDevice(device,userAgent){const value=String(userAgent||device||'').trim();if(!value)return 'Non renseigné';if(/bot|crawler|spider|headless/i.test(value))return 'Robot / automatisation';if(/android/i.test(value))return 'Android';if(/iphone|ipod/i.test(value))return 'iPhone';if(/ipad|tablet/i.test(value))return 'iPad / tablette';if(/windows|macintosh|mac os|cros|linux|^(pc|desktop|ordinateur|mac)$/i.test(value))return 'PC / ordinateur';return 'Autre / indéterminé';}
export function postalInfo(raw,declaredCity){let cp=String(raw??'').trim();if(/^\d{4}$/.test(cp))cp='0'+cp;const valid=/^\d{5}$/.test(cp);const candidates=valid&&POSTAL_CITIES?(POSTAL_CITIES[cp]||[]):[];const declared=String(declaredCity??'').trim();const city=declared||(candidates.length===1?candidates[0]:'Non renseignée');let label;if(!cp)label=declared?'CP absent — '+declared:'Code postal non renseigné';else if(!valid)label='Code postal invalide';else if(declared)label=cp+' — '+declared;else if(candidates.length===1)label=cp+' — '+candidates[0];else if(candidates.length>1)label=cp+' — '+candidates.length+' communes possibles';else label=cp+' — commune non identifiée';return {postalCode:cp,city,postalCity:label};}
export function processRows(rows,headerIndex,mapping){const headers=rows[headerIndex]||[];let invalidDates=0,missingIds=0;const seen=new Set();let duplicateIds=0;const records=rows.slice(headerIndex+1).filter(r=>r.some(v=>v!==''&&v!==null&&v!==undefined)).map(r=>{const val=k=>mapping[k]>=0?r[mapping[k]]:null;const day=parseDay(val('date'));if(!day)invalidDates++;const id=String(val('id')??'').trim();if(mapping.id>=0&&!id)missingIds++;if(id){if(seen.has(id))duplicateIds++;seen.add(id);}const clean=k=>String(val(k)??'').trim();const filled=headers.reduce((n,_,i)=>n+Number(r[i]!==undefined&&r[i]!==null&&String(r[i]).trim()!==''),0);return {day,id,form:clean('form')||'Non renseigné',source:clean('source')||'Non attribuée',campaign:clean('campaign')||'Non renseignée',device:classifyDevice(val('device'),val('userAgent')),...postalInfo(val('postalCode'),val('city')),region:clean('region')||'Non renseignée',solutions:splitSolutions(val('solution')),filled,totalFields:headers.length};});return {records,invalidDates,missingIds,duplicateIds,headers,mapping};}
export function spreadsheetId(input){const v=input.trim();const match=v.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);if(match)return match[1];if(/^[\w-]{20,200}$/.test(v))return v;throw new Error('Collez une URL Google Sheets valide ou son identifiant.');}
export function localDay(timeZone){try{return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{return new Date().toISOString().slice(0,10);}}
export const dayNumber=s=>Math.round(Date.parse(s+'T00:00:00Z')/86400000);
export const shiftDay=(s,n)=>new Date((dayNumber(s)+n)*86400000).toISOString().slice(0,10);
export function calendar(start,end){if(!start||!end)return [];const n=dayNumber(end)-dayNumber(start)+1;if(n<1)return [];if(n>3660)throw new Error('La période dépasse 3 660 jours. Réduisez le filtre de dates.');return Array.from({length:n},(_,i)=>shiftDay(start,i));}
