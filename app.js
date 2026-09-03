(function(){
"use strict";

function $(id){ return document.getElementById(id); }

$("jsStatus").textContent = "🟢 JavaScript aktiv";
$("jsStatus").className = "status green";

var names = {
  human:"Mensch / Ausführung",
  machine:"Maschine / Vorrichtung",
  material:"Material",
  method:"Methode / Prozess",
  measurement:"Messung / Prüfung",
  environment:"Milieu / Umgebung",
  management:"Management / Änderung",
  design:"Konstruktion / BOM"
};

var baseScores = {
  human:50,machine:50,material:50,method:50,
  measurement:45,environment:40,management:45,design:45
};

var state;

function newState(){
  state = {
    scores:Object.assign({},baseScores),
    facts:[],
    asked:{},
    completed:{},
    answers:{},
    current:null,
    step:0,
    active:false,
    selectedPath:null
  };
}

function bump(k,n){
  state.scores[k]=Math.max(5,Math.min(98,state.scores[k]+n));
}

function addFact(f){
  if(state.facts.indexOf(f)<0) state.facts.push(f);
}

function addMsg(text,user){
  $("dialog").insertAdjacentHTML("beforeend",
    '<div class="msg '+(user?'user':'')+'">'+text+'</div>');
}

function analyseText(text){
  var t=(text||"").toLowerCase();

  if(/wasser|undicht/.test(t)) addFact("Fehlerbild: Wassereintritt / Undichtigkeit");

  if(/tür|tuer/.test(t)){
    addFact("Fehlerbereich: Tür");
    bump("material",5); bump("method",5); bump("design",5);
  }

  if(/unterschiedlich.*mitarbeiter|verschiedene.*mitarbeiter/.test(t)){
    addFact("Unterschiedliche Mitarbeiter beteiligt");
    bump("human",-2);
  }

  if(/gleicher prozess|gleiche montage|gleiche montageweise|gleiche anweisung/.test(t)){
    addFact("Gleiche Prozessvorgabe");
    bump("method",3);
  }

  if(/folie|türfolie|tuerfolie/.test(t)){
    addFact("Türfolie als möglicher Dichtpfad");
    bump("material",14); bump("method",16);
  }

  if(/roller|anpress|andrück|andrueck/.test(t)){
    addFact("Anpress-/Rollvorgang relevant");
    bump("human",10); bump("method",16);
  }

  if(/abweichung|nicht korrekt|nicht richtig|nicht vollständig|nicht vollstaendig/.test(t)){
    addFact("Hinweis auf Prozessabweichung");
    bump("human",16); bump("method",22);
  }
}

function sortedKeys(){
  return Object.keys(state.scores).sort(function(a,b){
    return state.scores[b]-state.scores[a];
  });
}

function render(){
  $("ranking").innerHTML=sortedKeys().map(function(k,i){
    return '<div class="metric"><b>'+(i+1)+'. '+names[k]+'</b>'+
      '<span class="score">'+state.scores[k]+'/100</span>'+
      '<div class="bar"><i style="width:'+state.scores[k]+'%"></i></div></div>';
  }).join("");

  $("facts").innerHTML=state.facts.length
    ? state.facts.map(function(f){return "• "+f;}).join("<br>")
    : "–";

  var done=Object.keys(state.completed);
  $("completed").innerHTML=done.length
    ? done.map(function(k){return "✓ "+state.completed[k];}).join("<br>")
    : "–";

  $("debug").innerHTML=
    "Schritt: "+state.step+
    "<br>Aktuelle Frage: "+(state.current||"keine")+
    "<br>Gewählter Prüfweg: "+(state.selectedPath||"keiner")+
    "<br>Gestellte IDs: "+Object.keys(state.asked).join(", ");
}

var questions = {
  q_change:{
    title:"Änderung",
    text:"Gab es vor dem ersten Auftreten eine Änderung an Bauteil, Lieferant, Montage, Werkzeug, Prozess oder Prüfprogramm?",
    opts:["Nein","Ja","Unbekannt"]
  },
  q_workers:{
    title:"Mitarbeiter",
    text:"Sind unterschiedliche Mitarbeiter betroffen oder nur einzelne Personen?",
    opts:["Unterschiedliche Mitarbeiter","Nur einzelne Mitarbeiter","Unbekannt"]
  },
  q_process:{
    title:"Soll-Prozess",
    text:"Arbeiten die Mitarbeiter nach derselben Prozessvorgabe bzw. Montageanweisung?",
    opts:["Ja, gleicher Prozess","Nein, unterschiedlich","Unbekannt"]
  },
  q_execution:{
    title:"Ist-Ausführung",
    text:"Wurde überprüft, ob der vorgeschriebene Prozess tatsächlich korrekt ausgeführt wird?",
    opts:["Ja, nachweislich korrekt","Nein, noch nicht geprüft","Abweichung beobachtet"]
  },
  q_localize:{
    title:"Fehlerlokalisierung",
    text:"Kann die genaue Eintrittsstelle bzw. der Dichtpfad lokalisiert werden?",
    opts:["Ja","Teilweise","Nein"]
  },
  q_compare:{
    title:"Gut-/Schlechtvergleich",
    text:"Kann ein Gut- und ein Schlechtfahrzeug direkt verglichen werden?",
    opts:["Ja","Nein","Nur eingeschränkt"]
  },
  q_counter:{
    title:"Gegenversuch",
    text:"Ist ein Gegenversuch technisch und organisatorisch möglich?",
    opts:["Ja","Nein","Nur eingeschränkt"]
  },
  q_counter_result:{
    title:"Ergebnis Gegenversuch",
    text:"Was war das Ergebnis des Gegenversuchs?",
    opts:["Fehler verschwindet","Fehler bleibt bestehen","Noch nicht durchgeführt"]
  },
  q_compare_result:{
    title:"Ergebnis Gut-/Schlechtvergleich",
    text:"Was unterscheidet das Gut- vom Schlechtfahrzeug an der betroffenen Stelle?",
    opts:["Unterschied erkennbar","Kein Unterschied erkennbar","Noch nicht geprüft"]
  },
  q_path:{
    title:"Alternativweg",
    text:"Welcher noch nicht verwendete Prüfweg ist aktuell realistisch verfügbar?",
    opts:["Prozess beobachten","Rückverfolgung nutzen","Fehler lokalisieren","Nur Daten sammeln"]
  },
  q_observe_result:{
    title:"Ergebnis Prozessbeobachtung",
    text:"Was wurde bei der direkten Prozessbeobachtung festgestellt?",
    opts:["Prozess korrekt ausgeführt","Abweichung vom Soll-Prozess","Noch nicht eindeutig"]
  },
  q_trace_result:{
    title:"Ergebnis Rückverfolgung",
    text:"Was hat die Rückverfolgung ergeben?",
    opts:["Zusammenhang gefunden","Kein Zusammenhang","Noch unklar"]
  },
  q_localize_result:{
    title:"Ergebnis Fehlerlokalisierung",
    text:"Wo wurde der Dichtpfad lokalisiert?",
    opts:["Türfolie","Türdichtung","Scheibe / Rahmen","Noch nicht eindeutig"]
  },
  q_collect_result:{
    title:"Ergebnis Datensammlung",
    text:"Was zeigt die bisherige Datensammlung?",
    opts:["Muster erkennbar","Kein Muster","Noch zu wenig Daten"]
  }
};

function nextQuestion(){
  var baseOrder=["q_change","q_workers","q_process","q_execution","q_localize","q_compare","q_counter"];
  var i;

  for(i=0;i<baseOrder.length;i++){
    if(!state.asked[baseOrder[i]]) return baseOrder[i];
  }

  if(state.answers.q_counter==="Ja" && !state.asked.q_counter_result){
    return "q_counter_result";
  }

  if(state.answers.q_compare==="Ja" && !state.asked.q_compare_result){
    return "q_compare_result";
  }

  if(!state.selectedPath && !state.asked.q_path){
    return "q_path";
  }

  if(state.selectedPath==="Prozess beobachten" && !state.asked.q_observe_result){
    return "q_observe_result";
  }

  if(state.selectedPath==="Rückverfolgung nutzen" && !state.asked.q_trace_result){
    return "q_trace_result";
  }

  if(state.selectedPath==="Fehler lokalisieren" && !state.asked.q_localize_result){
    return "q_localize_result";
  }

  if(state.selectedPath==="Nur Daten sammeln" && !state.asked.q_collect_result){
    return "q_collect_result";
  }

  return null;
}

function ask(id){
  if(id===null){
    state.current=null;
    $("questionBox").hidden=true;
    $("finishBox").hidden=false;
    addMsg("<b>AEA:</b> Die aktuell sinnvollen Standardfragen und der gewählte Prüfweg sind abgeschlossen. Ich wiederhole keine alte Frage.",false);
    render();
    return;
  }

  if(state.asked[id]){
    finishWithError("Doppelte Frage verhindert: "+id);
    return;
  }

  state.step++;
  state.current=id;
  state.asked[id]=true;

  var q=questions[id];
  $("questionBox").hidden=false;
  $("finishBox").hidden=true;
  $("stepInfo").textContent="Schritt "+state.step+" · ID: "+id;
  $("questionTitle").textContent=q.title;
  $("questionText").textContent=q.text;

  $("quickAnswers").innerHTML=q.opts.map(function(o){
    return '<button data-a="'+o+'">'+o+'</button>';
  }).join("");

  Array.prototype.forEach.call($("quickAnswers").querySelectorAll("button"),function(btn){
    btn.onclick=function(){
      submit(btn.getAttribute("data-a"));
    };
  });

  addMsg("<b>AEA:</b> "+q.text,false);
  render();
}

function finishWithError(text){
  state.current=null;
  $("questionBox").hidden=true;
  $("finishBox").hidden=false;
  addMsg("<b>Systemschutz:</b> "+text+". Die Schleife wurde gestoppt.",false);
  render();
}

function applyAnswer(id,a){
  state.answers[id]=a;

  if(id==="q_change"){
    state.completed[id]="Änderung geprüft";
    if(a==="Nein"){ bump("management",-12); addFact("Keine bekannte Änderung vor Fehlerbeginn"); }
    if(a==="Ja"){ bump("management",18); addFact("Änderung vor Fehlerbeginn vorhanden"); }
  }

  if(id==="q_workers"){
    state.completed[id]="Mitarbeiterverteilung geprüft";
    if(a==="Unterschiedliche Mitarbeiter"){
      bump("human",-2);
      addFact("Unterschiedliche Mitarbeiter – gemeinsame Prozessabweichung weiterhin möglich");
    }
    if(a==="Nur einzelne Mitarbeiter"){ bump("human",15); }
  }

  if(id==="q_process"){
    state.completed[id]="Soll-Prozess geprüft";
    if(a==="Ja, gleicher Prozess"){
      addFact("Gleiche Prozessvorgabe – korrekte Ausführung noch nicht bewiesen");
      bump("method",3);
    }
  }

  if(id==="q_execution"){
    state.completed[id]="Ist-Ausführung geprüft";
    if(a==="Ja, nachweislich korrekt"){ bump("human",-12); bump("method",-9); }
    if(a==="Nein, noch nicht geprüft"){ bump("human",8); bump("method",12); }
    if(a==="Abweichung beobachtet"){ bump("human",18); bump("method",22); addFact("Abweichung vom Soll-Prozess beobachtet"); }
  }

  if(id==="q_localize") state.completed[id]="Fehlerlokalisierung auf Machbarkeit geprüft";
  if(id==="q_compare") state.completed[id]="Gut-/Schlechtvergleich auf Machbarkeit geprüft";
  if(id==="q_counter") state.completed[id]="Gegenversuch auf Machbarkeit geprüft";

  if(id==="q_counter_result"){
    state.completed[id]="Gegenversuch ausgewertet";
    if(a==="Fehler verschwindet") addFact("Gegenversuch: Fehler verschwindet");
    if(a==="Fehler bleibt bestehen") addFact("Gegenversuch: Fehler bleibt bestehen");
  }

  if(id==="q_compare_result"){
    state.completed[id]="Gut-/Schlechtvergleich ausgewertet";
    if(a==="Unterschied erkennbar"){ bump("measurement",10); addFact("Gut-/Schlechtunterschied erkannt"); }
  }

  if(id==="q_path"){
    state.selectedPath=a;
    state.completed[id]="Prüfweg gewählt: "+a;
  }

  if(id==="q_observe_result"){
    state.completed[id]="Prozessbeobachtung ausgewertet";
    if(a==="Prozess korrekt ausgeführt"){ bump("human",-12); bump("method",-8); }
    if(a==="Abweichung vom Soll-Prozess"){ bump("human",18); bump("method",22); addFact("Direkte Prozessbeobachtung zeigt Abweichung"); }
  }

  if(id==="q_trace_result"){
    state.completed[id]="Rückverfolgung ausgewertet";
    if(a==="Zusammenhang gefunden"){ bump("material",10); bump("management",8); }
  }

  if(id==="q_localize_result"){
    state.completed[id]="Fehlerlokalisierung ausgewertet";
    if(a==="Türfolie"){ bump("material",14); bump("method",16); addFact("Dichtpfad: Türfolie"); }
    if(a==="Türdichtung"){ bump("material",16); bump("design",10); addFact("Dichtpfad: Türdichtung"); }
  }

  if(id==="q_collect_result"){
    state.completed[id]="Datensammlung ausgewertet";
    if(a==="Muster erkennbar"){ bump("measurement",10); addFact("Datensammlung zeigt Muster"); }
  }
}

function submit(answer){
  if(!state.active || !state.current || !answer) return;

  var currentId=state.current;
  addMsg(answer,true);
  analyseText(answer);
  applyAnswer(currentId,answer);
  $("freeAnswer").value="";
  render();

  var next=nextQuestion();

  if(next===currentId || (next && state.asked[next])){
    finishWithError("Wiederholung erkannt");
    return;
  }

  ask(next);
}

$("startBtn").onclick=function(){
  newState();
  var problem=$("problem").value.trim();
  if(!problem) return;

  state.active=true;
  $("dialog").innerHTML="";
  $("finishBox").hidden=true;
  $("runState").textContent="✓ Fall läuft";

  addMsg(problem,true);
  analyseText(problem);
  render();
  ask(nextQuestion());
};

$("sendBtn").onclick=function(){
  var a=$("freeAnswer").value.trim();
  if(a) submit(a);
};

$("freeAnswer").onkeydown=function(e){
  if(e.key==="Enter") $("sendBtn").click();
};

$("observationBtn").onclick=function(){
  var a=$("observation").value.trim();
  if(!a) return;
  addMsg(a,true);
  analyseText(a);
  addFact("Neue Beobachtung: "+a);
  $("observation").value="";
  render();
  addMsg("<b>AEA:</b> Neue Beobachtung bewertet. Keine abgeschlossene Frage wurde erneut geöffnet.",false);
};

newState();
})();