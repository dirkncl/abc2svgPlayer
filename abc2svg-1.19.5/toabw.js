// abc2svg - toabw.js - SVG generation for Abiword
//
// Copyright (C) 2018-2019 Jean-Francois Moine
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

// This script is a backend which permits to generate (ABW+SVG)
// instead of the (XHTML+SVG) default of batch scripts.
//
// Usage:
// - creation of a .abw file (example with abcjs24 - result 'o.abw')
//
//  abcjs24 toabw.js some_ABC_file.abc > o.abw
//
//  (the script must appear immediately after the command)
//
// - conversion of ABW to PDF (result 'o.pdf')
//
//  abiword -t pdf --to-name=o.pdf o.abw
//
//Constraints:
// The abc2svg music font (abc2svg.woff or abc2svg.ttf) must be installed
// in the local system for correct rendering and conversion to PDF
// (the generated pdf file contains the used glyphs so that it may be
// displayed anywhere).

    var  topmargin, botmargin, page_size, page_type,
  header, footer,
  section = '',
  data = '',
  seq = 1

// set a value in page unit
function set_unit(p) {
  if (typeof p == "string")
    return p
  if (page_type[0] == 'L')
    return (p / 96).toFixed(1) + 'in'
  return (p / 37.8).toFixed(1) + 'cm'
}

function header_footer(str) {
    var  c, i, t,
  j = 0,
  r = ["", "", ""]

  if (str[0] == '"')
    str = str.slice(1, -1)
  if (str.indexOf('\t') < 0)    // if no TAB
    str = '\t' + str    // center

  for (i = 0; i < str.length; i++) {
    c = str[i]
    switch (c) {
    case '\t':
      if (j < 2)
        j++    // next column
      continue
    case '\\':      // hope '\n'
      for (j = 0; j < 3; j++)
        r[j] += '\n';
      j = 0;
      i++
      continue
    default:
      r[j] += c
      continue
    case '$':
      break
    }
    c = str[++i]
    switch (c) {
    case 'd':  // cannot know the modification date of the file
      break
    case 'D':
      r[j] += (new Date()).toUTCString()
      break
    case 'F':
      r[j] += abc.get_fname()
      break
    case 'I':
      c = str[++i]
    case 'T':
      t = abc.info()[c]
      if (t)
        r[j] += t.split('\n', 1)[0]
      break
    case 'P':
      r[j] += '<field type="page_number" xid="' +
          (++seq).toString() + '"></field>'
      break
    case 'V':
      r[j] += "abc2svg-" + abc2svg.version
      break
    }
  }
  return r
}

// output a header or footer
function gen_hf(type, str) {
  var  a, i, j, res,
    lcr = ["left", "center", "right"]

  function hfp(hf_pos) {
    if (hf_pos == 0)
      return '<p style="Normal" xid="' +
        (++seq).toString() + '">'
    return '<p style="Normal" xid="' + (++seq).toString() +
        '" props="text-align:' + lcr[hf_pos] + '">'
  } // hfp()

//fixme: could be reduced:
// if only one 'l', 'c' or 'r' => <p> with align
// if no 'c' -> table with 2 columns

  res = '<section id="'+ (type[0] == 'h' ? '0' : '1') +
    '" listid="0" parentid="0" type="' + type +
    '" xid="' + (++seq).toString() + '">\n\
<table xid="' + (++seq).toString() + '"\
 props="list-tag:1; table-column-props:6.00cm/6.00cm/6.00cm/;\
table-column-leftpos:' + (page_type[0] == 'L' ? '0.6in' : '1.5cm') + '">\n';

  a = header_footer(str)
  for (i = 0; i < 3; i++) {
    res += '<cell xid="' + (++seq).toString() + '"\
 props="left-attach:' + i + '; right-attach:' + (i + 1).toString() +
      '; bot-attach:1; top-attach:0;\
 top-color:ffffff; right-color:ffffff; bg-style:1;\
 left-color:ffffff; bot-color:ffffff">\n';
    str = a[i]
    if (!str) {
      res += '</cell>\n'
      continue
    }
    j = str.indexOf('\n')
    if (j >= 0)
      res += hfp(i) + str.slice(0, j) + '</p>\n' +
        hfp(i) + str.slice(j + 1)
    else
      res += hfp(i) + str;
    res += '</p>\n</cell>\n'
  }
  return res + '</table>\n</section>'
} // gen_hf()

// output the abw file
function abw_out() {
    var  now = new Date(),
  cdate = now.toUTCString()

  print('<?xml version="1.0" encoding="UTF-8"?>\n\
<!DOCTYPE abiword PUBLIC "-//ABISOURCE//DTD AWML 1.0 Strict//EN"\
 "http://www.abisource.com/awml.dtd">\n\
<abiword template="false" xmlns:ct="http://www.abisource.com/changetracking.dtd"\
 xmlns:fo="http://www.w3.org/1999/XSL/Format"\
 xmlns:math="http://www.w3.org/1998/Math/MathML"\
 xid-max="'+ seq.toString() + '" xmlns:dc="http://purl.org/dc/elements/1.1/"\
 styles="unlocked" fileformat="1.0" xmlns:svg="http://www.w3.org/2000/svg"\
 xmlns:awml="http://www.abisource.com/awml.dtd"\
 xmlns="http://www.abisource.com/awml.dtd"\
 xmlns:xlink="http://www.w3.org/1999/xlink"\
 version="0.99.2" xml:space="preserve" props="dom-dir:ltr;\
 document-footnote-restart-section:0; document-endnote-type:numeric;\
 document-endnote-place-enddoc:1; document-endnote-initial:1; lang:en-US;\
 document-endnote-restart-section:0; document-footnote-restart-page:0;\
 document-footnote-type:numeric; document-footnote-initial:1;\
document-endnote-place-endsection:0">\n\
\n\
<metadata>\n\
<m key="abiword.date_last_changed">' + cdate + '\n\
</m>\n\
<m key="abiword.generator">abc2svg</m>\n\
<m key="dc.creator">user</m>\n\
<m key="dc.date">' + cdate + '\n\
</m>\n\
<m key="dc.format">application/x-abiword</m>\n\
</metadata>\n\
<rdf>\n\
</rdf>\n\
<history version="1" edit-time="111" last-saved="1511365517"\
 uid="e1099094-cf9b-11e7-913c-a8bbb9484d15">\n\
<version id="1" started="1511365517" uid="23b1c56a-cf9c-11e7-913c-a8bbb9484d15"\
 auto="0" top-xid="3"/>\n\
</history>\n\
<styles>\n\
<s type="P" name="Normal" followedby="Current Settings"\
 props="font-family:Times New Roman;\
 margin-top:0pt; color:000000; margin-left:0pt; text-position:normal;\
 widows:2; font-style:normal; text-indent:0in; font-variant:normal;\
 font-weight:normal; margin-right:0pt; font-size:12pt; text-decoration:none;\
 margin-bottom:0pt; line-height:1.0; bgcolor:transparent; text-align:left;\
 font-stretch:normal"/>\n\
</styles>\n\
<pagesize pagetype="' + page_type + '"\
 orientation="portrait" ' + page_size + '\
 page-scale="1.00"/>\n\
<section xid="1" props="page-margin-footer:1.00cm; page-margin-header: 1.00cm;\
 page-margin-right: 0.00cm;\
 page-margin-left: 0.00cm;\
 page-margin-top: ' + topmargin + ';\
 page-margin-bottom: ' + botmargin + '">\n'+ section + '</section>');
  if (header)
    print(header)
  if (footer)
    print(footer)
  print('<data>' + data + '</data>\n</abiword>')
}

// replace <>& by XML character references
function clean_txt(txt) {
  return txt.replace(/<|>|&.*?;|&/g, function(c) {
    switch (c) {
    case '<': return "&lt;"
    case '>': return "&gt;"
    }
    if (c == '&')
      return "&amp;"
    return c
  })
}

abc2svg.abort = function(e) {
  abc.blk_flush();
  if (typeof abc2svg.printErr == 'function')
    abc2svg.printErr(e.message + "\n*** Abort ***\n" + e.stack)
  else
    section += "<p>" + e.message + "\n*** Abort ***\n" + e.stack + "</p>\n";
  abc2svg.abc_end();
  abc2svg.quit()
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
    var  r, w, h,
  cfmt = abc.cfmt()

  switch (str.slice(0, 4)) {
  case '<svg':
//fixme: the shorthand 'font:' does not work in the library 'librsvg'
// used by libreoffice and abiword
// (https://gitlab.gnome.org/GNOME/librsvg/issues/34)
    str = font_bug(str)
    data += '<d name="g'+ (++seq).toString() +
      '" mime-type="image/svg+xml" base64="no">\n\
<![CDATA[' + str + ']]>\n\
</d>\n';
    r = str.slice(0, 200).match(/.*width="(.*?)px" height="(.*?)px"/);
    w = r[1] / 96;
    h = r[2] / 96;
    section += '<p style="Normal" xid="'+
      (seq + 1).toString() + '"><image dataid="g' +
      seq.toString() + '" xid="' +seq.toString() +
      '" props="height:' + h.toFixed(2) + 'in; width:' +
        w.toFixed(2) + 'in"/></p>\n';
    seq++

    // get the first header/footer
    if (header == undefined) {
      r = cfmt.header;
      header = r ? gen_hf("header", r) : ''
    }
    if (footer == undefined) {
      r = cfmt.footer;
      footer = r ? gen_hf("footer", r) : ''
    }
    break
  case '<div':
    if (str.indexOf('newpage') > 0)
      section += '<p style="Normal" xid="' +
        (++seq).toString() + '"><pbr/></p>\n'
    break
  case '</di':    // end of image
    break
//fixme: markup
  default:
    section += str.replace(/<p| style|<span|<\/span>|<br\/>|size:.+?px/g,
          function(c) {
      switch (c) {
      case '<p':
        return '<p style="Normal" xid="' +
          (++seq).toString() + '"'
      case ' style':
        return ' props'
      case '<span':
        return '<c'
      case '</span>':
        return '</c>'
      case '<br/>':      // hope followed by '\n'!
        return ''
      default:      // size:..px
        var r = c.match(/size:(.+)px/)
        return 'size:' + (r[1] * 72 / 96).toFixed(1) + 'pt'
      }
    })
    section += '\n'
    break
  }
}

// entry point from cmdline
abc2svg.abc_init = function() {

  // get the page parameters
  user.img_out = function(str) {
      var cfmt = abc.cfmt(),
    pw = cfmt.pagewidth;

    page_type = pw > 800 ? 'Letter' : 'A4';
    page_size = pw > 800 ?
        'width="8.50" height="11.00" units="in"' :
        'width="210.00" height="297.00" units="mm"';
    if (abc.page) {
      topmargin = botmargin = 0
    } else {
      topmargin = set_unit(cfmt.topmargin || 37.8);
      botmargin = set_unit(cfmt.botmargin || 37.8)
    }

    // output the first generated string
    svg_out(str);

    // change the output function
    user.img_out = svg_out
  }

  user.page_format = true

  // define some parameters and functions in the Abc object
  abc.tosvg('toabw', "\
%%fullsvg 1\n\
%%musicfont abc2svg")
}

abc2svg.abc_end = function() {
  if (user.errtxt)
    section += "<p>" + clean_txt(user.errtxt) + "</p>\n";
  abw_out()
}
