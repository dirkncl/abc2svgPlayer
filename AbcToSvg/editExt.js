function LoadTune(file,notNumber){
  var addon=notNumber||"";
  var LoadTuneContent;
  var f = new XMLHttpRequest();
  abc_fname[srcidx]=file;
  f.open("GET", file, false);
  f.overrideMimeType('text/plain; charset=UTF-8');
  f.onreadystatechange = function (){
    LoadTuneContent = addon+f.responseText;
    proses(LoadTuneContent);
    //play_tune(-1)
  }
  f.send();
}


function proses(data){
  var i, j, sl,
      content=data,
      s=srcidx==0?"source":"src1";
  elt_ref[s].value = content;
  elt_ref["s" + srcidx].value = abc_fname[srcidx];
  src_change()
}
/*
window.onload=(function Target(){
  var tgt=document.createElement('div');
  tgt.style.display="none";
  tgt.id='target';
  tgt.innerHTML= ''+
      '<svg xmlns="http://www.w3.org/2000/svg"'+
      '  xmlns:xlink="http://www.w3.org/1999/xlink"'+
      '  xml:space="preserve"'+
      '  width="8.3in" height="2in" viewBox="0 0 595 144">'+
      '  <title></title>'+
      '  <text x="250" y="100" font-family="serif" font-size="12"></text>'+
      '</svg>';
  document.getElementById('dright').appendChild(tgt);    
});  
*/

var hStaff=document.createElement('div');
//hStaff.setAttribute('id','hideStaff');
hStaff.id = 'hideStaff';
document.body.appendChild(hStaff);

var btnHS=document.createElement('button');
btnHS.setAttribute('id','HS');
btnHS.style.position="absolute";
btnHS.style.left="35%";
btnHS.innerHTML='Hide Staff'

document.getElementById('hideStaff').appendChild(btnHS);

document.getElementById('HS').addEventListener('click',function(){
  (document.getElementById('target').style.display=='block')? (
    document.getElementById('dright').style.display="none",
    document.getElementById('target').style.display="none",
    document.getElementById('HS').innerHTML="Show Staff"   
  ):(
  document.getElementById('dright').style.display="block",
  document.getElementById('target').style.display="block",
  document.getElementById('HS').innerHTML="Hide Staff" 
  )
},false);
var brk=document.createElement('br');
document.body.appendChild(brk);
var brk=document.createElement('br');
document.body.appendChild(brk);


var ctr=document.createElement('div');
ctr.setAttribute('id','btnHolder');
document.body.appendChild(ctr);
var btn=document.createElement('button');
btn.setAttribute('id','linkHolder');
btn.style['margin-left']="25%";
btn.innerHTML='Play :'
document.getElementById('btnHolder').appendChild(btn);

function fext(file){
  var split=file.split("."),
      ext=split[split.length-1].toLowerCase();//get extension
  console.log(ext);    
  return ext
}

var ls = window.location.search;
var fileIn="";

fileIn = decodeURIComponent(ls).replace(/\+/g, " ").replace('?','');
fext(fileIn);

if(fileIn.indexOf('&')!=-1) {
  fileIn=fileIn.split('&');
  fileIn[1]="";
  fileIn=fileIn[0];
};

if(fileIn.indexOf('=')!=-1||fext(fileIn)!="abc") {
  fileIn=""
};

if(fileIn!="") {
  var dleft=document.getElementById('dleft');
  var dright=document.getElementById('dright');
  document.getElementById('nav').style.display="none";
  document.getElementById('source').style.display="none";
  document.getElementById('b').style.display="none";
  document.getElementById('s0').style.display="none";
  dleft.style="position:absolute;top:0;left:2%;height:50px;opacity:1;background-color:transparent;z-index: 2;overflow: hidden;";
  dright.style="position:absolute;top:60px;left:2%;display:none";
};

var a=document.createElement('a');

a.setAttribute('id','test1');
/*
if(fileIn!="") {
  var f;
  //////////////////////////////
  if(fileIn.includes(";")){
    f = fileIn.split(";");
  
    if(f[0]=="number") {
      var notNumber = "%%jianpu";
      a.href="javascript:LoadTune('"+f[1]+"','"+notNumber+"')";
    }
    else{
      var notNumber=""
    };
  }else{
    a.href="javascript:LoadTune('"+fileIn+"')";
  }

};
*/
if(fileIn!="") {
  var f;
  //////////////////////////////
  if(fileIn.includes(";")){
    f = fileIn.split(";");
  
    if(f[0]=="number"||f[0]=="jianpu") {
      var notNumber = "%%jianpu";
      a.href="javascript:LoadTune('"+f[1]+"','"+notNumber+"')";
    }
    else if(f[0]=="mdnn") {
        var notNumber = "%%mdnn";
        a.href="javascript:LoadTune('"+f[1]+"','"+notNumber+"')";
    }  
    else{
      var notNumber=""
    };
  }else{
    a.href="javascript:LoadTune('"+fileIn+"')";
  }

};

var Fn=fileIn.substring(fileIn.lastIndexOf('/')+1);
a.innerHTML='  ' + Fn.replace('.abc','');
a.setAttribute('style','display:');
a.title="click here to play";
document.getElementById('linkHolder').appendChild(a);
document.getElementById("test1").addEventListener("click",function(){
  document.getElementById("dright").style.display="block";
  document.getElementById("target").style.display="block";
  //play_tune(-1)
},false);
