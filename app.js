(function(){
"use strict";
const $=id=>document.getElementById(id);
$("jsStatus").textContent="🟢 JavaScript aktiv";
$("jsStatus").className="status green";

const cats={
 human:{name:"Mensch",score:50},
 machine:{name:"Maschine",score:50},
 material:{name:"Material",score:50},
 method:{name:"Methode",score:50},
 measurement:{name:"Messung",score:45},
 environment:{name:"Milieu / Umgebung",score:40},
 management:{name:"Management / Änderung",score:45},
 design:{name:"Konstruktion / BOM",score:45}
};

const capabilities={
 countertest:"unknown",
 compareGoodBad:"unknown",
 measurement:"unknown",
 observeProcess:"unknown",
 traceability:"unknown",
 localization:"unknown",
 stopProduction:"unknown"
};

let active=false;
let currentQuestion=null;
let asked=new Set();
let history=[];

function reset(){
 Object.values(cats).forEach(c=>c.score=50);
 cats.measurement.score=45; cats.environment.score=40; cats.management.score=45; cats.design.score=45;
 Object.keys(capabilities).forEach(k=>capabilities[k]="unknown");
 active=false; currentQuestion=null; asked=new Set(); history=[];
}
function bump(k,n){cats[k].score=Math.max(5,Math.min(98,cats[k].score+n))}
function sorted(){return Object.entries(cats).sort((a,b)=>b[1].score-a[1].score)}
function add(text,who="ai"){$("dialog").insertAdjacentHTML("beforeend",`<div class="msg ${who==="user"?"user":""}">${text}</div>`)}
function norm(s){return (s||"").toLowerCase();}
function contains(t,arr){return arr.some(x=>t.includes(x))}

function analyseFreeText(text){
 const t=norm(text);
 if(/mitarbeiter|monteur|bediener|person/.test(t)){bump("human",16);bump("method",8)}
 if(/montage|eingebaut|montiert|arbeitsweise|reihenfolge|handhabung/.test(t)){bump("method",18);bump("human",7)}
 if(/dichtung|material|charge|lieferant|kleber|teil|gummi/.test(t))bump("material",18);
 if(/anlage|werkzeug|greifer|vorrichtung|roboter|düse|duese/.test(t))bump("machine",18);
 if(/druck|wasser|temperatur|umgebung/.test(t)){bump("environment",10);bump("measurement",7)}
 if(/mess|prüf|pruef|test|lehre/.test(t))bump("measurement",10);
 if(/änderung|aenderung|neu|wechsel|seit/.test(t))bump("management",15);
 if(/variante|konstruktion|bom|teilenummer|geometrie/.test(t))bump("design",17);
 if(/nur früh|nur frueh|nur spät|nur spaet|nur nacht|andere schicht/.test(t)){bump("human",15);bump("method",15)}
 if(/alle schichten|in allen schichten/.test(t)){bump("human",-8);bump("method",-4)}
}

function render(){
 $("ranking").innerHTML=sorted().map(([k,c],i)=>`<div class="m"><b>${i+1}. ${c.name}</b><span class="tag">${c.score}/100</span><div class="bar"><i style="width:${c.score}%"></i></div></div>`).join("");
 const top=sorted()[0][1];
 $("decision").innerHTML=`<div class="decision"><b>Aktuelle Prüfpriorität: ${top.name}</b><br>Keine Ursache gilt als bestätigt, solange kein belastbarer Nachweis vorliegt. Wenn ein Prüfweg nicht möglich ist, wird ein Alternativweg gewählt.</div>`;
 renderPaths();
}

function renderPaths(){
 const map={
  countertest:"Gegenversuch",
  compareGoodBad:"Gut-/Schlechtvergleich",
  measurement:"Messdaten",
  observeProcess:"Prozessbeobachtung",
  traceability:"Rückverfolgung",
  localization:"Fehlerlokalisierung",
  stopProduction:"Produktionsstopp möglich"
 };
 $("pathStatus").innerHTML=Object.entries(map).map(([k,label])=>{
   const v=capabilities[k];
   const cls=v==="yes"?"good":v==="no"?"blocked":"unknown";
   const text=v==="yes"?"möglich":v==="no"?"nicht möglich":"ungeklärt";
   return `<div class="path ${cls}"><b>${label}</b>: ${text}</div>`;
 }).join("");
}

const Q = {
 localize:{
  title:"Fehlerbild eingrenzen",
  text:"Kann die Eintrittsstelle bzw. der genaue Fehlerort am Schlechtfahrzeug lokalisiert werden?",
  options:[
   ["Ja, eindeutig","loc_yes"],["Teilweise","loc_partial"],["Nein","loc_no"]
  ]
 },
 compare:{
  title:"Vergleichsmöglichkeit",
  text:"Ist ein direkter Vergleich zwischen Gut- und Schlechtfahrzeug möglich?",
  options:[
   ["Ja","compare_yes"],["Nein","compare_no"],["Unbekannt","compare_unknown"]
  ]
 },
 counter:{
  title:"Gegenversuch",
  text:"Ist ein Gegenversuch technisch und organisatorisch möglich?",
  options:[
   ["Ja","counter_yes"],["Nein","counter_no"],["Nur eingeschränkt","counter_limited"]
  ]
 },
 measure:{
  title:"Objektive Daten",
  text:"Sind Mess-, Prüf- oder Qualitätsdaten verfügbar, die Gut und Schlecht unterscheiden können?",
  options:[
   ["Ja","measure_yes"],["Nein","measure_no"],["Teilweise","measure_partial"]
  ]
 },
 observe:{
  title:"Prozessbeobachtung",
  text:"Kann die Montage oder der Prozess direkt beobachtet werden, ohne die Produktion zu stoppen?",
  options:[
   ["Ja","observe_yes"],["Nein","observe_no"]
  ]
 },
 trace:{
  title:"Rückverfolgung",
  text:"Sind Fahrzeug, Bauteilcharge, Mitarbeiter, Schicht, Werkzeug- oder Prozessdaten rückverfolgbar?",
  options:[
   ["Ja","trace_yes"],["Teilweise","trace_partial"],["Nein","trace_no"]
  ]
 },
 shift:{
  title:"Schichtvergleich",
  text:"Gibt es deutliche Unterschiede zwischen den Schichten?",
  options:[
   ["Ja","shift_yes"],["Nein","shift_no"],["Unbekannt","shift_unknown"]
  ]
 },
 humanMethod:{
  title:"Mensch / Methode",
  text:"Unterscheiden sich Mitarbeiter, Montageweise, Reihenfolge oder Handhabung zwischen Gut- und Schlechtfällen?",
  options:[
   ["Ja","hm_yes"],["Nein","hm_no"],["Unbekannt","hm_unknown"]
  ]
 },
 change:{
  title:"Änderung vor Fehlerbeginn",
  text:"Gab es vor dem ersten Auftreten eine Änderung an Bauteil, Lieferant, Werkzeug, Prozess, Arbeitsanweisung oder Prüfprogramm?",
  options:[
   ["Ja","change_yes"],["Nein","change_no"],["Unbekannt","change_unknown"]
  ]
 },
 variant:{
  title:"Variantenbezug",
  text:"Ist der Fehler auf bestimmte Varianten, Seiten, Türen, Scheiben, Dichtungen oder Teilenummern begrenzt?",
  options:[
   ["Ja","variant_yes"],["Nein","variant_no"],["Unbekannt","variant_unknown"]
  ]
 },
 fallback:{
  title:"Alternativweg",
  text:"Welcher Prüfweg ist aktuell noch realistisch verfügbar?",
  options:[
   ["Prozess beobachten","fallback_observe"],["Rückverfolgung nutzen","fallback_trace"],["Fehler lokalisieren","fallback_localize"],["Nur Daten sammeln","fallback_collect"]
  ]
 }
};

function ask(qid){
 currentQuestion=qid; asked.add(qid);
 const q=Q[qid];
 $("questionBox").hidden=false;
 $("questionTitle").textContent=q.title;
 $("questionText").textContent=q.text;
 $("options").innerHTML=q.options.map(([label,val])=>`<button data-val="${val}">${label}</button>`).join("");
 [...$("options").querySelectorAll("button")].forEach(btn=>btn.addEventListener("click",()=>handleAnswer(btn.dataset.val,btn.textContent)));
 add("<b>AEA:</b> "+q.text);
}

function chooseNext(){
 if(!asked.has("localize")) return "localize";
 if(capabilities.localization!=="yes" && !asked.has("compare")) return "compare";

 if(capabilities.compareGoodBad==="yes"){
   if(!asked.has("variant")) return "variant";
   if(!asked.has("shift")) return "shift";
   if(!asked.has("humanMethod")) return "humanMethod";
   if(!asked.has("change")) return "change";
   if(!asked.has("counter")) return "counter";
   if(capabilities.countertest==="no" && !asked.has("measure")) return "measure";
   if(capabilities.measurement==="no" && !asked.has("observe")) return "observe";
   if(capabilities.observeProcess==="no" && !asked.has("trace")) return "trace";
 }

 if(capabilities.compareGoodBad==="no"){
   if(!asked.has("measure")) return "measure";
   if(capabilities.measurement!=="yes" && !asked.has("observe")) return "observe";
   if(capabilities.observeProcess!=="yes" && !asked.has("trace")) return "trace";
   if(capabilities.traceability!=="yes" && !asked.has("change")) return "change";
 }

 if(capabilities.countertest==="no"){
   if(capabilities.compareGoodBad==="unknown" && !asked.has("compare")) return "compare";
   if(capabilities.measurement==="unknown" && !asked.has("measure")) return "measure";
   if(capabilities.observeProcess==="unknown" && !asked.has("observe")) return "observe";
   if(capabilities.traceability==="unknown" && !asked.has("trace")) return "trace";
 }

 if(!asked.has("change")) return "change";
 if(!asked.has("variant")) return "variant";
 if(!asked.has("humanMethod")) return "humanMethod";
 if(!asked.has("shift")) return "shift";

 return "fallback";
}

function handleAnswer(code,label){
 add(label,"user");
 history.push({q:currentQuestion,a:label});
 interpret(code);
 render();
 const next=chooseNext();
 ask(next);
}

function interpret(code){
 if(code==="loc_yes"){capabilities.localization="yes";bump("measurement",8)}
 if(code==="loc_partial"){capabilities.localization="partial";bump("measurement",4)}
 if(code==="loc_no"){capabilities.localization="no";bump("measurement",4)}

 if(code==="compare_yes"){capabilities.compareGoodBad="yes"}
 if(code==="compare_no"){capabilities.compareGoodBad="no"}
 if(code==="compare_unknown"){capabilities.compareGoodBad="unknown"}

 if(code==="counter_yes"){capabilities.countertest="yes"}
 if(code==="counter_no"){capabilities.countertest="no"}
 if(code==="counter_limited"){capabilities.countertest="limited"}

 if(code==="measure_yes"){capabilities.measurement="yes";bump("measurement",12)}
 if(code==="measure_no"){capabilities.measurement="no";bump("measurement",-8)}
 if(code==="measure_partial"){capabilities.measurement="partial";bump("measurement",4)}

 if(code==="observe_yes"){capabilities.observeProcess="yes";bump("method",8);bump("human",6)}
 if(code==="observe_no"){capabilities.observeProcess="no"}

 if(code==="trace_yes"){capabilities.traceability="yes";bump("material",6);bump("management",6)}
 if(code==="trace_partial"){capabilities.traceability="partial";bump("material",3)}
 if(code==="trace_no"){capabilities.traceability="no"}

 if(code==="shift_yes"){bump("human",15);bump("method",15);bump("machine",6);bump("material",5)}
 if(code==="shift_no"){bump("human",-8);bump("method",-5)}

 if(code==="hm_yes"){bump("human",20);bump("method",20)}
 if(code==="hm_no"){bump("human",-16);bump("method",-14)}

 if(code==="change_yes"){bump("management",20);bump("machine",6);bump("material",6);bump("method",6)}
 if(code==="change_no"){bump("management",-12)}

 if(code==="variant_yes"){bump("design",18);bump("material",10)}
 if(code==="variant_no"){bump("design",-10)}

 if(code==="fallback_observe"){capabilities.observeProcess="yes";bump("method",8);bump("human",6)}
 if(code==="fallback_trace"){capabilities.traceability="yes";bump("material",6);bump("management",6)}
 if(code==="fallback_localize"){capabilities.localization="yes";bump("measurement",8)}
 if(code==="fallback_collect"){bump("measurement",4)}
}

$("startBtn").addEventListener("click",()=>{
 const p=$("problem").value.trim();
 if(!p){$("clickStatus").textContent="Bitte zuerst ein Problem eingeben.";return}
 reset();
 active=true;
 $("clickStatus").textContent="✓ Klick erkannt – Fall läuft.";
 $("dialog").innerHTML="";
 add(p,"user");
 analyseFreeText(p);
 render();
 add("<b>AEA:</b> Fall gestartet. Ich nutze keinen starren Fragenkatalog. Wenn ein Prüfweg nicht möglich ist, weiche ich automatisch auf Vergleich, Messung, Beobachtung, Rückverfolgung oder Datensammlung aus.");
 ask("localize");
});

$("answerBtn").addEventListener("click",()=>{
 if(!active)return;
 const a=$("answer").value.trim();
 if(!a)return;
 add(a,"user");
 analyseFreeText(a);
 $("answer").value="";
 render();
 const next=chooseNext();
 ask(next);
});
$("answer").addEventListener("keydown",e=>{if(e.key==="Enter")$("answerBtn").click()});
})();