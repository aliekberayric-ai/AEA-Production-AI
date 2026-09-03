(function(){"use strict";const $=id=>document.getElementById(id);$("status").textContent="🟢 JavaScript aktiv";$("status").className="good";
let S; const Q=[
{id:"change",q:"Gab es vor dem ersten Auftreten eine Änderung?",o:["Nein","Ja","Unbekannt"]},
{id:"workers",q:"Sind unterschiedliche Mitarbeiter betroffen?",o:["Ja, unterschiedliche Mitarbeiter","Nur einzelne","Unbekannt"]},
{id:"sameProcess",q:"Arbeiten sie nach derselben Prozessvorgabe?",o:["Ja, gleicher Prozess","Nein","Unbekannt"]},
{id:"execution",q:"Wurde die tatsächliche Ausführung des Prozesses direkt beobachtet?",o:["Ja","Nein"]},
{id:"execResult",q:"Was wurde bei der Prozessbeobachtung festgestellt?",o:["Prozess korrekt","Abweichung vom Soll-Prozess","Nicht eindeutig"]},
{id:"location",q:"Wo ist der Dichtpfad bzw. die Fehlerstelle lokalisiert?",o:["Türfolie","Türdichtung","Scheibe/Rahmen","Noch nicht lokalisiert"]},
{id:"why",q:"Falls eine Ausführungsabweichung vorliegt: Warum passiert sie?",o:["Roller/Anpressung fehlt","Taktzeit","Ergonomie/Zugänglichkeit","Arbeitsanweisung/Schulung","Noch unbekannt"]},
{id:"trace",q:"Ist die Abweichung über Stempel, Mitarbeiter, Fahrzeug oder Zeitraum rückverfolgbar?",o:["Ja","Nein","Teilweise"]},
{id:"proof",q:"Wurde die vermutete Fehlerstelle korrekt nachgearbeitet und anschließend erneut geprüft?",o:["Ja, danach dicht","Ja, weiterhin undicht","Noch nicht geprüft"]}
];
function reset(){S={i:0,a:{},facts:[],observations:[],done:{}}}
function addFact(x){if(!S.facts.includes(x))S.facts.push(x)}
function msg(x,u=false){
let c=$("chat"),near=c.scrollHeight-c.scrollTop-c.clientHeight<90;
c.insertAdjacentHTML("beforeend",`<div class="msg ${u?"user":""}">${x}</div>`);
if(near||u)requestAnimationFrame(()=>c.scrollTop=c.scrollHeight)
}
function parse(t){let x=t.toLowerCase();if(/türfolie|tuerfolie/.test(x))addFact("Türfolie als Fehler-/Dichtpfad genannt");if(/nicht richtig.*angedrückt|nicht.*angedrückt|nicht.*angedrueckt|roller.*nicht|nicht.*roller/.test(x)){addFact("Unzureichendes Andrücken / Rollern der Türfolie beobachtet");S.a.execResult="Abweichung vom Soll-Prozess"}if(/stempel|rückverfolg|rueckverfolg/.test(x)){addFact("Ausführung ist rückverfolgbar");S.a.trace="Ja"}if(/unterschiedliche.*mitarbeiter|verschiedene.*mitarbeiter/.test(x))addFact("Unterschiedliche Mitarbeiter beteiligt");if(/danach dicht|nacharbeit.*dicht/.test(x))S.a.proof="Ja, danach dicht"}
function ask(){while(S.i<Q.length && S.done[Q[S.i].id])S.i++;if(S.i>=Q.length){$("qbox").hidden=true;render();return}let q=Q[S.i];$("question").textContent=q.q;$("opts").innerHTML=q.o.map(o=>`<button data-a="${o}">${o}</button>`).join("");[...$("opts").querySelectorAll("button")].forEach(b=>b.onclick=()=>submit(b.dataset.a));msg("<b>AEA:</b> "+q.q)}
function submit(a){let q=Q[S.i];S.a[q.id]=a;S.done[q.id]=true;msg(a,true);parse(a);
if(q.id==="change"&&a==="Nein")addFact("Keine bekannte Änderung vor Fehlerbeginn");
if(q.id==="workers"&&a.startsWith("Ja"))addFact("Unterschiedliche Mitarbeiter – gemeinsamer Ausführungsfehler bleibt möglich");
if(q.id==="sameProcess"&&a.startsWith("Ja"))addFact("Gleicher Soll-Prozess; korrekte Ist-Ausführung dadurch nicht bewiesen");
if(q.id==="execution"&&a==="Nein")addFact("Tatsächliche Prozessausführung noch nicht beobachtet");
if(q.id==="execResult"&&a==="Abweichung vom Soll-Prozess")addFact("Direkte Beobachtung zeigt Abweichung vom Soll-Prozess");
if(q.id==="location"&&a!=="Noch nicht lokalisiert")addFact("Dichtpfad lokalisiert: "+a);
if(q.id==="why"&&a!=="Noch unbekannt")addFact("Mögliche Warum-Ursache: "+a);
if(q.id==="trace"&&a==="Ja")addFact("Abweichung ist rückverfolgbar");
if(q.id==="proof"&&a==="Ja, danach dicht")addFact("Nacharbeit + Wiederholprüfung: Fahrzeug danach dicht");
S.i++;$("answer").value="";render();ask()}
function evidence(){return S.facts.some(x=>/Unzureichendes Andrücken|Abweichung vom Soll-Prozess/.test(x))}
function localized(){return S.facts.some(x=>/Türfolie/.test(x))}
function confirmed(){return S.a.proof==="Ja, danach dicht" && evidence() && localized()}
function render(){
let ev=evidence(),loc=localized(),conf=confirmed(),why=S.a.why;
let diagnosis=ev&&loc?"Bei der Montage der Türfolie liegt eine beobachtete Abweichung vom Soll-Prozess vor. Unzureichendes Andrücken kann einen unvollständigen Klebe-/Dichtpfad verursachen.":"Ursache noch nicht ausreichend eingegrenzt.";
let immediate=ev?"Betroffene Fahrzeuge über Rückverfolgbarkeit eingrenzen. Türfolienverklebung prüfen und fehlerhafte Verklebungen nach Arbeitsvorgabe nacharbeiten. Bis zur Absicherung erhöhte Kontrolle am betroffenen Prozessschritt.":"Fehlerstelle lokalisieren und tatsächliche Prozessausführung beobachten.";
let whytext=why&&why!=="Noch unbekannt"?"Aktueller Warum-Hinweis: <b>"+why+"</b>. Prüfen, ob dies die Abweichung reproduzierbar erklärt.":"Die Abweichung ist noch keine Root Cause. Ermitteln, warum der Soll-Prozess nicht zuverlässig eingehalten wird: Werkzeug/Roller, Taktzeit, Ergonomie, Zugänglichkeit, Schulung oder Arbeitsstandard.";
let permanent=why&&why!=="Noch unbekannt"?"Dauermaßnahme auf die bestätigte Warum-Ursache ausrichten; nicht pauschal den Mitarbeiter verantwortlich machen. Prozess anschließend standardisieren und absichern.":"Dauermaßnahme erst nach Bestätigung der Warum-Ursache festlegen.";
let proof=conf?"Nacharbeit beseitigt den Fehler im Wiederholtest. Zusammenhang ist stark bestätigt. Für endgültige Absicherung mehrere betroffene und Referenzfahrzeuge prüfen.":"Gezielter Nachweis: betroffene Verklebung korrekt nacharbeiten → erneuter Wassertest → Ergebnis dokumentieren. Idealerweise an mehreren Fahrzeugen bestätigen.";
let status=conf?"🟢 Ursache stark bestätigt":ev&&loc?"🟡 Starker Verdacht / Nachweis erforderlich":"🟠 Ursache offen";
$("result").innerHTML=`<div class="block yellow"><h3>Status Root Cause</h3>${status}</div>
<div class="block blue"><h3>Arbeitsdiagnose</h3>${diagnosis}</div>
<div class="block red"><h3>Sofortmaßnahme / Containment</h3>${immediate}</div>
<div class="block yellow"><h3>Warum-Ursache prüfen</h3>${whytext}</div>
<div class="block blue"><h3>Dauermaßnahme</h3>${permanent}</div>
<div class="block green"><h3>Wirksamkeitsnachweis</h3>${proof}</div>
<div class="block"><h3>Erkannte Fakten</h3>${S.facts.length?S.facts.map(x=>"• "+x).join("<br>"):"–"}</div>`;
}
$("start").onclick=()=>{reset();$("chat").innerHTML="";let p=$("problem").value.trim();msg(p,true);parse(p);$("qbox").hidden=false;render();ask()};
$("send").onclick=()=>{let a=$("answer").value.trim();if(a)submit(a)};
$("answer").onkeydown=e=>{if(e.key==="Enter")$("send").click()};
$("resetDemo").onclick=()=>{
  reset();
  $("chat").innerHTML="Noch kein Fall gestartet.";
  $("qbox").hidden=true;
  $("problem").value="Wassereintritt in den Fahrzeuginnenraum. Undichtigkeit an der Tür.";
  $("result").innerHTML="<p>Noch keine Diagnose.</p>";
};
reset();
})();