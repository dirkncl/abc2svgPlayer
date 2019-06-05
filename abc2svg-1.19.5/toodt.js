// abc2svg - toodt.js - ABC translation to ODT+SVG
//
// Copyright (C) 2017-2019 Jean-Francois Moine
//
// This file is part of abc2svg.
//
// abc2svg is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with abc2svg.  If not, see <http://www.gnu.org/licenses/>.

// This script is a backend which permits to generate (ODT+SVG)
// instead of the (XHTML+SVG) default of the batch script 'abc2svg'.
//
// Usage:
// - creation of a .odt file (default: ./abc.odt)
//
//  abc2svg toodt.js some_ABC_file.abc [-o output_file]
//
//  (this script must appear immediately after the command)
//
// Constraints:
// This module runs only with the nodeJS script 'abc2svg' and asks for
// the npm module 'jszip' to be installed.

    var  margins, page_size, page_type, page_left, page_mid, page_right,
  header, footer, headerfont, footerfont, in_p, t_info, title,
  style = '',
  content = '',
  imgs = '',
  seq = 0,
  outfn = 'abc.odt',
  fs = require('fs'),    // file system
  JSZip = require('jszip'),  // Zip
  zip = new JSZip(),
  sep = require('path').sep;  // '/' or '\'

// get the command line arguments
function get_args(args) {
    var  a, i

  if (!args)      // compatibility
    return

  for (i = 0; i < args.length; i++) {
    a = args[i]
    if (a == '-o') {
      outfn = args[i + 1];
      args.splice(i++, 2)
    }
  }
}

// convert a pixel value into page unit
function set_unit(p) {
  if (typeof p == "string")
    return p
  if (page_type[0] == 'L')
    return (p / 96).toFixed(1) + 'in'
  return (p / 37.8).toFixed(1) + 'cm'
}

// output a header or a footer
function gen_hf(type, stype, str) {
    var  c, i, res_left,
  j = 0,
  res = '<style:' + type + '>\n\
<text:p text:style-name="' + stype + '\"><text:tab/>'

  if (str[0] == '"')
    str = str.slice(1, -1)
  if (str.indexOf('\t') < 0)    // if no TAB
    str = '\t' + str    // center

  for (i = 0; i < str.length; i++) {
    c = str[i]
    switch (c) {
    case '\t':
      if (j < 2) {
        res += '<text:tab/>';
        j++    // next column
      }
      continue
    case '\\':      // hope '\n'
      res += '</text:p>\n\
<text:p text:style-name="' + stype + '\">';
      j = 0;
      i++
      continue
    default:
      res += c
      continue
    case '$':
      break
    }
    c = str[++i]
    switch (c) {
    case 'd':
      t = abc.get_fname();
      res += fs.statSync(t).ctime.toLocaleString()
      break
    case 'D':
      res += (new Date()).toLocaleString()
      break
    case 'F':
      res += abc.get_fname()
      break
    case 'I':
      c = str[++i]
    case 'T':
      t = abc.info()[c]
      if (t) {
        t_info = '\
  <text:variable-decls>\n\
   <text:variable-decl office:value-type="string" text:name="tinfo"/>\n\
  </text:variable-decls>\n\
<text:p text:style-name="P">\n';
        in_p = true;
        res += '\
<text:variable-get text:name="tinfo">any</text:variable-get>'
      }
      break
    case 'P':
      res += '<text:page-number/>'
      break
    case 'V':
      res += "abc2svg-" + abc2svg.version
      break
    }
  }
  res = res + '</text:p>\n\
</style:' + type + '>\n';

  // handle page even/odd
  i = res.indexOf('page-number/>')
  if (i <= 0)
    return res
  c = res[i + 13]
  if (c != '0' && c != '1')
    return res
  res_left = res.replace('<style:' + type, '<style:' + type + '-left')
    .replace('</style:' + type, '</style:' + type + '-left');
  res = res.replace('<text:page-number/>0', '')
    .replace('page-number/>1', 'page-number/>');
  res_left = res_left.replace('<text:page-number/>1', '')
    .replace('page-number/>0', 'page-number/>')
  return res + res_left
} // gen_hf()

// create the odt file
function odt_out() {
    var  cdate = (new Date()).toUTCString();

  // content.xml
  if (in_p) {
    in_p = false;
    content += '</text:p>\n'
  }
  zip.file('content.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n\
<office:document-content\
 xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"\
 xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"\
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"\
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"\
 xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"\
 xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"\
 xmlns:xlink="http://www.w3.org/1999/xlink"\
 xmlns:dc="http://purl.org/dc/elements/1.1/"\
 xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"\
 xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"\
 xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"\
 xmlns:ooo="http://openoffice.org/2004/office"\
 xmlns:ooow="http://openoffice.org/2004/writer"\
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"\
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
 office:version="1.1">\n\
<office:font-face-decls>\n\
 <style:font-face style:name="abc2svg" svg:font-family="abc2svg">\n\
  <svg:font-face-src>\n\
   <svg:font-face-uri xlink:href="Fonts/abc2svg.ttf" xlink:type="simple"/>\n\
  </svg:font-face-src>\n\
 </style:font-face>\n\
</office:font-face-decls>\n\
<office:body>\n\
 <office:text>\n' +
    (t_info || '') +
    content + '\
 </office:text>\n\
</office:body>\n\
</office:document-content>\n',
    { compression: "DEFLATE" });

  // Fonts/abc2svg.ttf
  zip.file('Fonts/abc2svg.ttf',
    fs.readFileSync(__dirname + sep + 'abc2svg.ttf'),
    { compression: "STORE" });

// manifest.rdf (?)

  // META-INF/manifest.xml
//fixme: which mimetype for ttf?
// application/x-font-ttf application/font-sfnt font/ttf
  zip.file('META-INF/manifest.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n\
<!DOCTYPE manifest:manifest PUBLIC "-//OpenOffice.org//DTD Manifest 1.0//EN" "Manifest.dtd">\n\
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">\n\
 <manifest:file-entry manifest:media-type="application/vnd.oasis.opendocument.text" manifest:full-path="/"/>\n\
 <manifest:file-entry manifest:media-type="application/x-font-ttf" manifest:full-path="Fonts/abc2svg.ttf"/>\n\
 <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>\n\
 <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>\n\
 <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="meta.xml"/>\n\
 <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="settings.xml"/>\n' +
    imgs +
'</manifest:manifest>\n',
    { compression: "DEFLATE" });

  // meta.xml
  zip.file('meta.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n\
<office:document-meta\
 xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"\
 xmlns:xlink="http://www.w3.org/1999/xlink"\
 xmlns:dc="http://purl.org/dc/elements/1.1/"\
 xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"\
 xmlns:ooo="http://openoffice.org/2004/office"\
 office:version="1.1">\n\
<office:meta>\n\
<meta:generator>abc2svg toodt.js</meta:generator>\n\
<dc:creator>user</dc:creator>\n\
<meta:creation-date>' + cdate + '\n\
</meta:creation-date>\n\
<dc:date>' + cdate + '\n\
</dc:date>\n\
</office:meta>\n\
</office:document-meta>\n',
    { compression: "DEFLATE" });

  // Pictures/* done in svg_out

  // settings.xml
  zip.file('settings.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n\
<office:document-settings office:version="1.1"\
 xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"\
 xmlns:xlink="http://www.w3.org/1999/xlink"\
 xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"\
 xmlns:ooo="http://openoffice.org/2004/office" />\n',
    { compression: "DEFLATE" });

  // styles.xml
  zip.file('styles.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n\
<office:document-styles\
 xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"\
 xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"\
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"\
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"\
 xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"\
 xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"\
 xmlns:xlink="http://www.w3.org/1999/xlink"\
 xmlns:dc="http://purl.org/dc/elements/1.1/"\
 xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"\
 xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"\
 xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"\
 xmlns:ooo="http://openoffice.org/2004/office"\
 xmlns:ooow="http://openoffice.org/2004/writer"\
 office:version="1.1">\n\
 <office:styles>\n\
  <style:default-style style:family="paragraph">\n\
   <style:paragraph-properties fo:orphans="5" fo:widows="5"/>\n\
   <style:text-properties style:use-window-font-color="true"\
 style:font-name="Liberation Serif" fo:font-size="12pt"/>\n\
  </style:default-style>\n\
 <style:style style:name="Standard" style:family="paragraph" style:class="text"/>\n\
 <style:style style:name="P" style:family="paragraph"\
 style:parent-style-name="Standard"/>\n\
 <style:style style:name="Pbr" style:family="paragraph"\
 style:parent-style-name="Standard">\n\
  <style:paragraph-properties fo:break-before="page"/>\n\
 </style:style>\n\
<style:style style:name="Header" style:family="paragraph"\
 style:parent-style-name="Standard" style:class="extra">\n\
 <style:paragraph-properties>\n\
  <style:tab-stops>\n\
   <style:tab-stop style:position="' + page_left + '" style:type="left"/>\n\
   <style:tab-stop style:position="' + page_mid + '" style:type="center"/>\n\
   <style:tab-stop style:position="' + page_right + '" style:type="right"/>\n\
  </style:tab-stops>\n\
 </style:paragraph-properties>\n\
 <style:text-properties ' + headerfont + '/>\n\
</style:style>\n\
<style:style style:name="Footer" style:family="paragraph"\
 style:parent-style-name="Standard" style:class="extra">\n\
 <style:paragraph-properties>\n\
  <style:tab-stops>\n\
   <style:tab-stop style:position="' + page_left + '" style:type="left"/>\n\
   <style:tab-stop style:position="' + page_mid + '" style:type="center"/>\n\
   <style:tab-stop style:position="' + page_right + '" style:type="right"/>\n\
  </style:tab-stops>\n\
 </style:paragraph-properties>\n\
 <style:text-properties ' + footerfont + '/>\n\
</style:style>\n\
 </office:styles>\n\
 <office:automatic-styles>\n\
 <style:style style:family="graphic" style:name="graphic1" style:display-name="graphic1" style:parent-style-name="Graphics">\n\
  <style:graphic-properties style:wrap="run-through" style:run-through="foreground" style:vertical-pos="top" style:vertical-rel="baseline"/>\n\
 </style:style>\n\
 <style:page-layout style:name="Standard">\n\
  <style:page-layout-properties ' + margins + '\
 fo:margin-left="0" fo:margin-right="0"/>\n\
 </style:page-layout>\n\
 </office:automatic-styles>\n\
 <office:master-styles>\n\
  <style:master-page style:name="Standard" style:page-layout-name="Standard">\n' +
  (header || '') +
  (footer || '') + '\
  </style:master-page>\n\
 </office:master-styles>\n\
</office:document-styles>',
    { compression: "DEFLATE" });

// - generate the ODT file
  zip  .generateNodeStream({streamFiles:true})
    .pipe(fs.createWriteStream(outfn))
    .on('finish', function () {
      console.log(outfn + ' created')
    })
}

abc2svg.abort = function(e) {
  abc.blk_flush();
  if (typeof abc2svg.printErr == 'function')
    abc2svg.printErr(e.message + "\n*** Abort ***\n" + e.stack)
  else
    content += "<text:p>" + e.message +
      "\n*** Abort ***\n" + e.stack + "</text:p>\n";
  odt_out();
  abc2svg.quit()
}

// convert a CSS font definition (in pixels) to ODT (in points)
function def_font(font) {
    var  css_font = abc.style_font(abc.cfmt()[font])
      .slice(5)    // remove 'font:'
      .split(' '),
  l = css_font.length,
  fo = 'fo:font-family="' + css_font[--l] + '"',
  i = css_font[--l].slice(0, -2)

  fo += ' fo:font-size="' +
    (i * 72 / 96).toFixed(1) + 'pt"'
  while (--l >= 0) {
    i = css_font[l]
    switch (i) {
    case 'italic':
    case 'oblique':
      fo += ' fo:font-style="' + i + '"'
      break
    case 'bold':
      fo += ' fo:font-weight="' + i + '"'
      break
    }
  }
  return fo
}

function font_bug(str) {
    var i, k, l, r, w,
  j = 0

  while (1) {
    i = str.indexOf('font:', j)
    if (i < 0)
      return str
    if (str[i - 1] == '"') {
      j = str.indexOf('"', i)
    } else {
      j = str.indexOf('}', i);
      k = str.indexOf(';', i)
      if (j < 0 || (k >= 0 && k < j))
        j = k
    }
    w = str.slice(i + 5, j).match(/[^ \t"]+|".+?"/g) // "

    l = w.length;
    r = 'font-family:' + w[--l] +
      ';font-size:' + w[--l]
    while (--l >= 0) {
      switch (w[l]) {
      case 'italic':
        r += ';font-style:italic'
        break
      case 'oblique':
        r += ';font-style:oblique'
        break
      case 'bold':
        r += ';font-weight:bold'
        break
      }
    }
    str = str.replace(str.slice(i, j), r)
  }
}

function svg_out(str) {
    var  img, r, w, h,
  cfmt = abc.cfmt()

  switch (str.slice(0, 4)) {
  case '<svg':

    // get the first header/footer
    if (header == undefined) {
      r = cfmt.header;
      header = r ? gen_hf("header", "Header", r) : '';
      headerfont = def_font("headerfont")
    }
    if (footer == undefined) {
      r = cfmt.footer;
      footer = r ? gen_hf("footer", "Footer", r) : '';
      footerfont = def_font("footerfont")
    }

//fixme: the shorthand 'font:' does not work in the library 'librsvg'
// used by libreoffice and abiword
// (https://gitlab.gnome.org/GNOME/librsvg/issues/34)
    str = font_bug(str)

    // save the image
    img = 'Pictures/abc' + (++seq).toString() + '.svg';
    zip.file(img, str, { compression: "DEFLATE" });

    // it is part of the document
    imgs +='\
<manifest:file-entry manifest:media-type="image/svg+xml"\
 manifest:full-path="' + img + '"/>\n';

    // insert in the document content
    r = str.slice(0, 200).match(/.*width="(.*?)px" height="(.*?)px"/);
    w = r[1] / 96;    // convert pixel to inch
    h = r[2] / 96;
    if (!in_p) {
      in_p = true;
      content += '<text:p text:style-name="P">\n'
    }
    content += '<draw:frame text:anchor-type="as-char"\
 draw:z-index="0" draw:style-name="graphic1"\
 svg:width="' + w.toFixed(2) + 'in" svg:height="' + h.toFixed(2) + 'in">\
<draw:image xlink:href="' + img + '"\
 xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>\
</draw:frame>\n';
    break
  case '<div':    // start of block or header/footer or page break
    if (in_p) {
      in_p = false;
      content += '</text:p>\n'
    }
    if (str.indexOf('newpage') > 0) {
      content += '<text:p text:style-name="Pbr">\n';
      in_p = true
    }
    break
  case '</di':        // end of block
    if (in_p) {
      in_p = false;
      content += '</text:p>\n'
    }
    break
//fixme: markup - more tags to be added
  default:
    if (in_p) {
      in_p = false;
      content += '</text:p>\n'
    }
    content += str.replace(/  |<p|<\/p|<br\/>/g, function(c) {
      switch (c) {
      case '  ': return '  '    // space + nbspace
      case '<p': return '<text:p'
      case '</p': return '</text:p'
      case '<br/>': return '<text:line-break/>'
      }
    })
    break
  }

  // if header/footer with $T, define the variable
  if (t_info && in_p) {
      var  title2 = abc.info().T

    if (title2)      // extract the main title
      title2 = title2.split('\n', 1)[0]
    if (title2 && title2 != title) {
      title = title2;
      content += '<text:variable-set \
text:display="none" text:formula="ooow:' + title + '" \
office:value-type="string" \
office:string-value="' +
        title + '" text:name="tinfo"/>\n'
    }
  }
}

// entry point from cmdline
abc2svg.abc_init = function(args) {
  console.log('ODT generation started');

  get_args(args);

  // generate mimetype which is the first item and without compression
  zip.file('mimetype',
    'application/vnd.oasis.opendocument.text',
    { compression: "STORE" });

  // define some functions in the Abc object
  abc.tosvg("toodt", "\
%%fullsvg 1\n\
%%musicfont abc2svg")

  // get the page parameters
  user.img_out = function(str) {
      var cfmt = abc.cfmt(),
    pw = cfmt.pagewidth;

    // page size
    if (pw > 800) {
      page_type = 'Letter';
      page_size = 'fo:page-width="8.5in" fo:page-height="11in"';
      page_left = set_unit(cfmt.leftmargin);
      page_mid = '4.25in';
      page_right = set_unit(816 - cfmt.rightmargin)
    } else {
      page_type = 'A4';
      page_size = 'fo:page-width="21cm" fo:page-height="29.7cm"';
      page_left = set_unit(cfmt.leftmargin);
      page_mid = '10.5cm';
      page_right = set_unit(793.8 - cfmt.rightmargin)
    }

    // if abc2svg page formatting
    if (abc.page)
      margins = 'fo:margin-top="0" fo:margin-bottom="0"'
    else
        margins = 'fo:margin-top="' +
      set_unit(cfmt.topmargin || 37.8) +
      '" fo:margin-bottom="' +
      set_unit(cfmt.botmargin || 37.8) + '"';

    // output the first generated string
    svg_out(str);

    // change the output function
    user.img_out = svg_out
  }

  user.page_format = true
}

abc2svg.abc_end = function() {
  odt_out()
}
