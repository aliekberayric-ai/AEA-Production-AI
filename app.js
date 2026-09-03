(function(){
"use strict";
const $=id=>document.getElementById(id);
const status=$("jsStatus");
status.textContent="🟢 JavaScript aktiv";
status.className="status green";

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
let step=0, active=false;

const questions=[
 "Tritt der Fehler in allen Schichten ungefähr gleich häufig auf oder gibt es deutliche Schichtunterschiede?",
 "Ist der Wassereintritt immer an derselben Stelle im Fahrzeug?",
 "Ist der Fehler auf bestimmte Varianten, Türen, Scheiben, Dichtungen oder Bauteilstände begrenzt?",
 "Gab es vor dem ersten Auftreten eine Änderung an Bauteil, Lieferant, Montage, Werkzeug, Prozess oder Prüfprogramm?",
 "Sind bei Gut- und Schlechtfahrzeugen dieselben Mitarbeiter bzw. dieselbe Montageweise beteiligt?",
 "Kann ein Gut- und ein Schlechtfahrzeug direkt verglichen werden, um Eintrittsstelle und Dichtpfad reproduzierbar nachzuweisen?"
];

function resetScores(){Object.values(cats).forEach(c=>c.score=50);cats.measurement.score=45;cats.environment.score=40;cats.management.score=45;cats.design.score=45}
function bump(k,n){cats[k].score=Math.max(5,Math.min(98,cats[k].score+n))}
function analyse(text){
 const t=text.toLowerCase();
 if(/mitarbeiter|monteur|bediener|person/.test(t)){bump("human",18);bump("method",8)}
 if(/montage|eingebaut|montiert|arbeitsweise|reihenfolge/.test(t)){bump("method",18);bump("human",7)}
 if(/dichtung|material|charge|lieferant|kleber|teil/.test(t))bump("material",18);
 if(/anlage|werkzeug|greifer|vorrichtung|roboter|düse|duese/.test(t))bump("machine",18);
 if(/druck|wasser|temperatur|umgebung/.test(t)){bump("environment",10);bump("measurement",7)}
 if(/mess|prüf|pruef|test|lehre/.test(t))bump("measurement",10);
 if(/änderung|aenderung|neu|wechsel|seit/.test(t))bump("management",15);
 if(/variante|konstruktion|bom|teilenummer|geometrie/.test(t))bump("design",17);
 if(/nur früh|nur frueh|nur spät|nur spaet|nur nacht|andere schicht/.test(t)){bump("human",15);bump("method",15)}
 if(/alle schichten|in allen schichten/.test(t)){bump("human",-10);bump("method",-5)}
 if(/gleiche mitarbeiter/.test(t))bump("human",-18);
 if(/andere mitarbeiter/.test(t)){bump("human",22);bump("method",10)}
 if(/gleiche montage|gleiche arbeitsweise/.test(t))bump("method",-16);
 if(/fehler weg|fehler sinkt|danach dicht|kein wasser/.test(t)){let top=sorted()[0];bump(top[0],20)}
}
function sorted(){return Object.entries(cats).sort((a,b)=>b[1].score-a[1].score)}
function render(){
 $("ranking").innerHTML=sorted().map(([k,c],i)=>`<div class="m"><b>${i+1}. ${c.name}</b><span class="tag">${c.score}/100</span><div class="bar"><i style="width:${c.score}%"></i></div></div>`).join("");
 const top=sorted()[0][1];
 $("decision").innerHTML=`<div class="decision"><b>Aktuelle Prüfpriorität: ${top.name}</b><br>Hohe Priorität ist noch keine bestätigte Ursache. Nächster Schritt: Unterschied zwischen Gut und Schlecht gezielt prüfen und durch Gegenversuch absichern.</div>`;
}
function add(text,who){$("dialog").insertAdjacentHTML("beforeend",`<div class="msg ${who==="user"?"user":""}">${text}</div>`)}
function ask(){
 if(step>=questions.length){
  $("questionLabel").textContent="Weitere Beobachtung / Gegenversuch";
  add("<b>AEA:</b> Die Grundabgrenzung ist durchlaufen. Jetzt bitte Ergebnisse von Vergleich, Messung oder Gegenversuch eingeben.","ai");
  return;
 }
 $("questionLabel").textContent=questions[step];
 add("<b>AEA:</b> "+questions[step],"ai");
}
$("startBtn").addEventListener("click",function(){
 $("clickStatus").textContent="✓ Klick erkannt – Fall läuft.";
 const p=$("problem").value.trim();
 if(!p){$("clickStatus").textContent="Bitte zuerst ein Problem eingeben.";return}
 active=true;step=0;resetScores();analyse(p);
 $("dialog").innerHTML="";
 add(p,"user");
 add("<b>AEA:</b> Fall gestartet. Ich lege mich nicht auf eine Ursache fest, sondern grenze Mensch, Maschine, Material, Methode, Messung, Umgebung, Änderung und Konstruktion gegeneinander ab.","ai");
 $("answerBox").hidden=false;
 render();ask();
});
$("answerBtn").addEventListener("click",function(){
 if(!active)return;
 const a=$("answer").value.trim(); if(!a)return;
 add(a,"user"); analyse(a); render(); $("answer").value=""; step++; ask();
});
$("answer").addEventListener("keydown",e=>{if(e.key==="Enter")$("answerBtn").click()});
})();