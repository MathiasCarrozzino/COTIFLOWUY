(function(){
var OK="calc3dlaser.orders",TK="calc3dlaser.ordtimes",flt="p",eid=null,TM={on:true,t1:"10:00",t2:"19:00"},g=function(i){return document.getElementById(i)};
window.ORD=[];
function ld(){try{ORD=JSON.parse(localStorage.getItem(OK)||"[]")||[]}catch(e){ORD=[]}try{var t=JSON.parse(localStorage.getItem(TK)||"null");if(t&&t.t1)TM=t}catch(e){}}
function sv(){try{localStorage.setItem(OK,JSON.stringify(ORD))}catch(e){g("om").textContent="No se pudo guardar en este dispositivo."}}
function svt(){try{localStorage.setItem(TK,JSON.stringify(TM))}catch(e){}}
function pad(n){return("0"+n).slice(-2)}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function fm(s){if(!s)return"Sin fecha";var p=s.split("-");return p[2]+"/"+p[1]+"/"+p[0]}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
function nd(o){return!o.done}
function plan(){
  var out=[],pe=ORD.filter(nd),now=new Date();
  if(!pe.length)return out;
  var so=pe.slice().sort(function(a,b){return(a.fec||"9999").localeCompare(b.fec||"9999")}),f=so[0],nm=(f.cli||f.det||"pedido").slice(0,28);
  for(var d=0;d<30;d++){
    var day=new Date(now.getFullYear(),now.getMonth(),now.getDate()+d),ds=iso(day);
    var due=pe.filter(function(o){return o.fec===ds}).length,late=pe.filter(function(o){return o.fec&&o.fec<ds}).length,n=pe.length;
    var b="Tenés "+n+(n>1?" pedidos pendientes":" pedido pendiente");
    var x=[];if(due)x.push(due+" para hoy");if(late)x.push(late+(late>1?" atrasados":" atrasado"));
    if(x.length)b+=": "+x.join(", ");
    b+=". Próximo: "+nm+(f.fec?" ("+fm(f.fec)+")":"")+".";
    [TM.t1,TM.t2].forEach(function(t,k){
      var h=String(t||"").split(":");if(h.length<2)return;
      var at=new Date(day.getFullYear(),day.getMonth(),day.getDate(),+h[0],+h[1]);
      if(at<=now)return;
      out.push({id:d*2+k+1,at:at,title:"Pedidos pendientes",body:b});
    });
  }
  return out;
}
window.ordPlan=plan;
function rs(ask){
  if(!window.NB||!NB.native)return;
  (async function(){
    if(ask&&TM.on&&ORD.some(nd))await NB.notifPerm();
    await NB.notifSet(TM.on?plan():[]);
  })();
}
function rd(){
  var t=iso(new Date()),pe=ORD.filter(nd),
  due=pe.filter(function(o){return o.fec===t}).length,late=pe.filter(function(o){return o.fec&&o.fec<t}).length;
  g("bpd").textContent="Pedidos ("+pe.length+")";
  var k=g("ok");k.textContent="";
  [["Pendientes",pe.length],["Para hoy",due],["Atrasados",late]].forEach(function(a){var d=el("div");d.appendChild(el("small","",a[0]));d.appendChild(el("b","",a[1]));k.appendChild(d)});
  var L=ORD.filter(function(o){return flt==="a"||(flt==="p"?!o.done:o.done)}).sort(function(a,b){return(a.fec||"9999").localeCompare(b.fec||"9999")});
  var box=g("ol");box.textContent="";
  if(!L.length){box.appendChild(el("p","note","No hay pedidos para mostrar."));return}
  L.forEach(function(o){
    var c=el("div","it"+(o.done?" ok":"")),tp=el("div","top"),l=el("div");
    l.appendChild(el("h3","",o.cli||"Sin cliente"));l.appendChild(el("small","",o.tipo));
    var r=el("span","t",fm(o.fec));
    if(!o.done&&o.fec){if(o.fec<t){r.style.color="#dc2626";r.textContent+=" · atrasado"}else if(o.fec===t)r.textContent+=" · hoy"}
    tp.appendChild(l);tp.appendChild(r);c.appendChild(tp);
    if(o.det)c.appendChild(el("p","note",o.det));
    var a=el("div","acts"),b1=el("button","btn p",o.done?"Reabrir":"Marcar hecho"),b2=el("button","btn","Editar"),b3=el("button","btn","Borrar");
    b1.onclick=function(){o.done=!o.done;o.upd=Date.now();sv();rd();rs(false)};
    b2.onclick=function(){eid=o.id;g("oc").value=o.cli;g("od").value=o.det;g("ot").value=o.tipo;g("of").value=o.fec;g("osv").textContent="Guardar cambios";g("ocn").hidden=false;window.scrollTo(0,0)};
    b3.onclick=function(){if(confirm("¿Borrar este pedido?")){ORD=ORD.filter(function(x){return x!==o});sv();rd();rs(false)}};
    a.appendChild(b1);a.appendChild(b2);a.appendChild(b3);c.appendChild(a);box.appendChild(c);
  });
}
function rst(){eid=null;g("oc").value="";g("od").value="";g("ot").selectedIndex=0;g("of").value="";g("osv").textContent="Guardar pedido";g("ocn").hidden=true}
function fill(){
  g("oav").checked=!!TM.on;g("ot1").value=TM.t1;g("ot2").value=TM.t2;
  g("oan").textContent=(window.NB&&NB.native)?"Se programan los próximos 30 días y se actualizan cada vez que cambiás un pedido o abrís la app.":"Los avisos funcionan en la app instalada en Android.";
}
window.renderOrd=function(){fill();rd()};
g("osv").onclick=function(){
  var c=g("oc").value.trim(),d=g("od").value.trim();
  if(!c&&!d){g("om").textContent="Cargá al menos el cliente o el detalle.";return}
  var o={cli:c,det:d,tipo:g("ot").value,fec:g("of").value};
  if(eid){ORD.forEach(function(x){if(x.id===eid){x.cli=o.cli;x.det=o.det;x.tipo=o.tipo;x.fec=o.fec;x.upd=Date.now()}})}
  else{o.id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);o.done=false;o.ts=o.upd=Date.now();ORD.unshift(o)}
  sv();rst();rd();rs(true);g("om").textContent="Pedido guardado.";
};
g("ocn").onclick=rst;
g("oav").onchange=async function(){
  var c=this,w=c.checked;
  if(w&&window.NB&&NB.native&&!(await NB.notifPerm())){c.checked=false;g("oan").textContent="Permití las notificaciones de la app en los ajustes del teléfono.";return}
  TM.on=w;svt();rs(false);
};
g("ot1").onchange=function(){if(this.value){TM.t1=this.value;svt();rs(false)}};
g("ot2").onchange=function(){if(this.value){TM.t2=this.value;svt();rs(false)}};
["of1","of2","of3"].forEach(function(id,i){g(id).onclick=function(){flt=["p","h","a"][i];["of1","of2","of3"].forEach(function(x){g(x).setAttribute("aria-pressed",x===id?"true":"false")});rd()}});
g("bpd").onclick=function(){view(6)};
g("back6").onclick=function(){view(1)};
window.ordMerge=function(a){
  if(!Array.isArray(a))return;
  var m={};ORD.forEach(function(o){m[o.id]=o});
  a.forEach(function(o){if(o&&o.id&&(!m[o.id]||(o.upd||0)>=(m[o.id].upd||0)))m[o.id]=o});
  ORD=Object.keys(m).map(function(k){return m[k]});sv();rd();rs(false);
};
window.addEventListener("nb-resume",function(){rs(false)});
ld();rd();rs(false);
})();
