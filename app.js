(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
$("status").textContent="🟢 JavaScript aktiv";$("status").className="status green";

var base={human:50,machine:50,material:50,method:50,measurement:45,environment:40,management:45,design:45};
var names={human:"Mensch / Ausführung",machine:"Maschine / Vorrichtung",material:"Material",method:"Methode / Prozess",measurement:"Messung / Prüfung",environment:"Milieu / Umgebung",management:"Management / Änderung",design:"Konstruktion / BOM"};
var s={scores:{},facts:[],asked:{},answers:{},focus:"",active:false};
function reset(){s={scores:Object.assign({},base),facts:[],asked:{},answers:{},focus:"",active:true}}
function bump(k,n){s.scores[k]=Math.max(5,Math.min(98,s.scores[k]+n))}
function fact(x){if(s.facts.indexOf(x)<0)s.facts.push(x)}
function msg(x,u){$("chat").insertAdjacentHTML("beforeend",'<div class="msg '+(u?'user':'')+'">'+x+"</div>")}
function lower(x){return (x||"").toLowerCase()}
function analyseText(x){
 var t=lower(x);
 if(t.indexOf("tür")>=0){s.focus="Tür";fact("Fehlerbereich: Tür");bump("material",6);bump("design",6);bump("method",5)}
 if(/undicht|wasser|wassereintritt/.test(t))fact("Fehlerbild: Undichtigkeit / Wassereintritt");
 if(/alle schichten|gleicher fehler/.test(t))fact("Fehler nicht auf eine einzelne Schicht begrenzt");
 if(/unterschiedlich.*mitarbeiter|verschiedene.*mitarbeiter/.test(t)){fact("Unterschiedliche Mitarbeiter beteiligt");bump("human",-3)} // nur leicht, kein Ausschluss
 if(/gleiche montageweise|gleicher prozess|gleichen prozess/.test(t)){fact("Gleicher Soll-Prozess / gleiche Montagevorgabe");bump("method",3)}
 if(/folie|türfolie|tuerfolie/.test(t)){fact("Türfolie als möglicher Dichtpfad genannt");bump("material",12);bump("method",14)}
 if(/roller|anpress|andrück|andrueck/.test(t)){fact("Anpress-/Rollvorgang relevant");bump("method",14);bump("human",10)}
 if(/nicht.*roller|roller.*nicht|nicht richtig|nicht korrekt/.test(t)){bump("human",18);bump("method",20);fact("Hinweis auf mögliche Abweichung bei Prozessausführung")}
 if(/korrekt|nach vorgabe|vollständig.*roller|vollstaendig.*roller/.test(t)){bump("human",-10);bump("method",-7);fact("Korrekte Prozessausführung wurde angegeben")}
 if(/keine änderung|keine aenderung|nein.*änderung|nein.*aenderung/.test(t)){bump("management",-12);fact("Keine bekannte Änderung vor Fehlerbeginn")}
}
function sorted(){return Object.keys(s.scores).sort(function(a,b){return s.scores[b]-s.scores[a]})}
function render(){
 $("rank").innerHTML=sorted().map(function(k,i){return '<div class="metric"><b>'+(i+1)+'. '+names[k]+'</b><span class="score">'+s.scores[k]+'/100</span><div class="bar"><i style="width:'+s.scores[k]+'%"></i></div></div>'}).join("");
 $("facts").innerHTML=s.facts.length?s.facts.map(function(f){return "• "+f}).join("<br>"):"–";
 var opens=[];
 if(!s.asked.execution)opens.push("Ist der Soll-Prozess tatsächlich korrekt ausgeführt?");
 if(!s.asked.location)opens.push("Exakte Eintrittsstelle / Dichtpfad");
 if(!s.asked.goodbad)opens.push("Unterschied Gut- gegen Schlechtfahrzeug");
 if(!s.asked.material)opens.push("Dichtung/Folie/Kleber/Materialzustand");
 $("open").innerHTML=opens.length?opens.map(function(x){return "• "+x}).join("<br>"):"Keine Standardfrage mehr offen – gezielte Nachweisprüfung erforderlich.";
 $("decision").innerHTML="<b>Wichtig:</b> Gleicher Prozess bedeutet nur gleiche Vorgabe. Erst eine beobachtete bzw. nachgewiesene korrekte Ausführung darf Mensch/Methode deutlich herunterstufen.";
}
var qs={
 change:{text:"Gab es vor dem ersten Auftreten eine Änderung an Bauteil, Lieferant, Montage, Werkzeug, Prozess oder Prüfprogramm?",opts:["Nein","Ja","Unbekannt"]},
 workers:{text:"Sind bei Gut- und Schlechtfahrzeugen dieselben oder unterschiedliche Mitarbeiter beteiligt?",opts:["Unterschiedliche Mitarbeiter","Dieselben Mitarbeiter","Unbekannt"]},
 process:{text:"Arbeiten die Mitarbeiter nach derselben Prozessvorgabe bzw. Montageanweisung?",opts:["Ja, gleicher Prozess","Nein, unterschiedlich","Unbekannt"]},
 execution:{text:"Entscheidend: Wurde direkt überprüft, ob der vorgeschriebene Prozess auch tatsächlich korrekt ausgeführt wird – nicht nur, ob alle dieselbe Anweisung haben?",opts:["Ja, Ausführung nachweislich korrekt","Nein, noch nicht überprüft","Abweichung beobachtet"]},
 location:{text:"Wo genau tritt das Wasser ein bzw. welcher Dichtpfad ist betroffen? Zum Beispiel Türfolie, Türdichtung, Scheibe, Kabeldurchführung oder Karosseriefuge?",opts:["Türfolie","Türdichtung","Noch nicht lokalisiert"]},
 goodbad:{text:"Was unterscheidet ein Gut- von einem Schlechtfahrzeug an dieser Stelle? Gibt es einen sicht- oder messbaren Unterschied bei Verklebung, Anpressung, Lage, Dichtung oder Geometrie?",opts:["Unterschied erkennbar","Kein Unterschied erkennbar","Noch nicht geprüft"]},
 material:{text:"Sind Folie/Dichtung/Kleber und deren Zustand bei Gut- und Schlechtfahrzeugen vergleichbar (Charge, Lage, Verschmutzung, Beschädigung, Haftung)?",opts:["Ja, vergleichbar","Nein, Unterschied vorhanden","Noch nicht geprüft"]},
 causewhy:{text:"Falls die Prozessausführung abweicht: Warum kann der vorgeschriebene Arbeitsschritt nicht zuverlässig eingehalten werden – z. B. Taktzeit, Ergonomie, Werkzeug/Roller, Schulung, Arbeitsanweisung oder Zugänglichkeit?",opts:["Taktzeit","Werkzeug/Roller","Arbeitsanweisung/Schulung","Ergonomie/Zugänglichkeit","Noch unklar"]}
};
function next(){
 var order=["change","workers","process","execution","location","goodbad","material"];
 for(var i=0;i<order.length;i++)if(!s.asked[order[i]])return order[i];
 if(s.answers.execution==="Abweichung beobachtet"&&!s.asked.causewhy)return "causewhy";
 return null;
}
function ask(id){
 if(!id){$("q").innerHTML="Die Standardabgrenzung ist beendet. Gib jetzt eine neue Beobachtung ein; sie wird weiter bewertet. Es wird keine bereits gestellte Frage wiederholt."; $("quick").innerHTML=""; return}
 s.asked[id]=true;s.current=id;$("q").textContent=qs[id].text;
 $("quick").innerHTML=qs[id].opts.map(function(o){return '<button class="quick" data-v="'+o+'">'+o+"</button>"}).join("");
 Array.prototype.forEach.call($("quick").querySelectorAll("button"),function(b){b.onclick=function(){submit(b.getAttribute("data-v"))}});
 msg("<b>AEA:</b> "+qs[id].text,false)
}
function submit(a){
 if(!a)return;msg(a,true);s.answers[s.current]=a;analyseText(a);
 if(s.current==="change"&&a==="Nein"){bump("management",-12);fact("Keine bekannte Änderung vor Fehlerbeginn")}
 if(s.current==="workers"&&a==="Unterschiedliche Mitarbeiter"){bump("human",-3);fact("Unterschiedliche Mitarbeiter – individueller Einzelfehler weniger naheliegend, gemeinsame Ausführungsabweichung bleibt offen")}
 if(s.current==="process"&&a==="Ja, gleicher Prozess"){fact("Gleiche Prozessvorgabe – korrekte Ausführung noch nicht bewiesen")}
 if(s.current==="execution"&&a==="Nein, noch nicht überprüft"){bump("human",8);bump("method",12);fact("Tatsächliche Prozessausführung noch ungeprüft")}
 if(s.current==="execution"&&a==="Abweichung beobachtet"){bump("human",18);bump("method",22);fact("Abweichung vom Soll-Prozess beobachtet")}
 if(s.current==="execution"&&a==="Ja, Ausführung nachweislich korrekt"){bump("human",-14);bump("method",-10);fact("Soll-Prozess nachweislich korrekt ausgeführt")}
 if(s.current==="location"&&a==="Türfolie"){bump("material",14);bump("method",16);fact("Dichtpfad auf Türfolie eingegrenzt")}
 if(s.current==="location"&&a==="Türdichtung"){bump("material",15);bump("design",10);fact("Dichtpfad auf Türdichtung eingegrenzt")}
 if(s.current==="goodbad"&&a==="Unterschied erkennbar"){bump("measurement",10);fact("Gut-/Schlechtunterschied vorhanden")}
 if(s.current==="material"&&a==="Nein, Unterschied vorhanden"){bump("material",22);fact("Material-/Zustandsunterschied festgestellt")}
 render();$("answer").value="";ask(next())
}
$("start").onclick=function(){reset();$("chat").innerHTML="";var p=$("problem").value.trim();if(!p)return;msg(p,true);analyseText(p);$("qa").hidden=false;$("run").textContent="✓ Fall läuft";render();ask(next())};
$("send").onclick=function(){var a=$("answer").value.trim();if(a){analyseText(a);msg(a,true);render();$("answer").value="";ask(next())}};
$("answer").onkeydown=function(e){if(e.key==="Enter")$("send").click()};
})();