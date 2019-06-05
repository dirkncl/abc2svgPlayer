var fs = {};
var basePath;
var readFileStore = [];
fs.readFile = function (file,cb){
  if(!(readFileStore.includes(file))){    
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType('text/plain; charset=utf-8');
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
      if(rawFile.readyState === 4) {
        if(rawFile.status === 200 || rawFile.status == 0) {
         cb(rawFile.responseText)
        }
      }
    }
    rawFile.send(null);
  }
}    

fs.writeFileSync = function writeFileSync(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
  window.close();
}


function Path(refLoader) {
  var len = refLoader.length;
  for(var i = 0; i < document.scripts.length; i++) {
    var Src = document.scripts[i].src,
        n = Src.lastIndexOf(refLoader);
    if(n == Src.length - len)
      return Src.substr(0, n + 1)
  }
  return null
};

var readFileSyncStore = [];
fs.readFileSync = function readFileSync(filePath) {
  if(!(readFileSyncStore.includes(filePath))){
    readFileSyncStore.push(filePath);
    let result = null;
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
        result = xmlhttp.responseText;
        console.log(`loaded : ${filePath}`);
    return result;
  }
};

function imports(Url, head){
  var ext = Url.split('.').pop();
  basePath = basePath||"";
  var url = basePath + Url;
  
  switch(ext){
    case "js":
      head = head||null;
      if(head===null){
        var script = fs.readFileSync(url);
        eval.apply( window, [script] )          
         
      }
      else {
        script = document.createElement('script');
        script.src = url;
        switch(head){
          case "head": document.head.appendChild(script);break;
          case "body": document.body.appendChild(script);break;
        }
      };break
    case "css":
    case "scss":
      head = head||null;
      if(head===null)head = "head";
      var css = document.createElement('link');
      css.rel = "stylesheet"
      css.href = url;
      switch(head){
        case "head": document.head.appendChild(css);break;
        case "body": document.body.appendChild(css);break;
      };break
      
  }  
}