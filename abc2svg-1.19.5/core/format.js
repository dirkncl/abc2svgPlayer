// abc2svg - format.js - formatting functions
//
// Copyright (C) 2014-2019 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

var  font_tb = [],
  font_scale_tb = {
    serif: 1,
    serifBold: 1,
    'sans-serif': 1,
    'sans-serifBold': 1,
    Palatino: 1.1,
    monospace: 1.35
  },
  fmt_lock = {}

var cfmt = {
  annotationfont: { name: "sans-serif", size: 12 },
  aligncomposer: 1,
//  botmargin: .7 * IN,    // != 1.8 * CM,
  breaklimit: .7,
  breakoneoln: true,
  cancelkey: true,
  composerfont: { name: "serifItalic", size: 14 },
  composerspace: 6,
//  contbarnb: false,
  dblrepbar: ':][:',
  decoerr: true,
  dynalign: true,
  footerfont: { name: "serif", size: 16 },
  fullsvg: '',
  gchordfont: { name: "sans-serif", size: 12 },
  gracespace: new Float32Array([4, 8, 11]), // left, inside, right
  graceslurs: true,
  headerfont: { name: "serif", size: 16 },
  historyfont: { name: "serif", size: 16 },
  hyphencont: true,
  indent: 0,
  infofont: {name: "serifItalic", size: 14 },
  infoname: 'R "Rhythm: "\n\
B "Book: "\n\
S "Source: "\n\
D "Discography: "\n\
N "Notes: "\n\
Z "Transcription: "\n\
H "History: "',
  infospace: 0,
  keywarn: true,
  leftmargin: 1.4 * CM,
  lineskipfac: 1.1,
  linewarn: true,
  maxshrink: .65,
  maxstaffsep: 2000,
  maxsysstaffsep: 2000,
  measurefirst: 1,
  measurefont: {name: "serifItalic", size: 10},
  measurenb: -1,
  musicspace: 6,
//  notespacingfactor: 1.414,
  partsfont: {name: "serif", size: 15},
  parskipfac: .4,
  partsspace: 8,
//  pageheight: 29.7 * CM,
  pagewidth: 21 * CM,
//  pos: {
//    dyn: 0,
//    gch: 0,
//    gst: 0,
//    orn: 0,
//    stm: 0,
//    voc: 0,
//    vol: 0
//  },
  printmargin: 0,
  rightmargin: 1.4 * CM,
  rbdbstop: true,
  rbmax: 4,
  rbmin: 2,
  repeatfont: {name: "serif", size: 13},
  scale: 1,
  slurheight: 1.0,
  staffsep: 46,
  stemheight: 21,      // one octave
  stretchlast: .25,
  stretchstaff: true,
  subtitlefont: {name: "serif", size: 16},
  subtitlespace: 3,
  sysstaffsep: 34,
  tempofont: {name: "serifBold", size: 12},
  textfont: {name: "serif", size: 16},
//  textoption: undefined,
  textspace: 14,
  titlefont: {name: "serif", size: 20},
//  titleleft: false,
  titlespace: 6,
  titletrim: true,
//  transp: 0,      // global transpose
//  topmargin: .7 * IN,
  topspace: 22,
  tuplets: [0, 0, 0, 0],
  vocalfont: {name: "serifBold", size: 13},
  vocalspace: 10,
  voicefont: {name: "serifBold", size: 13},
//  voicescale: 1,
  writefields: "CMOPQsTWw",
  wordsfont: {name: "serif", size: 16},
  wordsspace: 5
}

function get_bool(param) {
  return !param || !/^(0|n|f)/i.test(param) // accept void as true !
}

// %%font <font> [<encoding>] [<scale>]
function get_font_scale(param) {
    var  i, font,
  a = info_split(param)  // a[0] = font name

  if (a.length <= 1)
    return
  var scale = parseFloat(a[a.length - 1])

  if (isNaN(scale) || scale <= 0.5) {
    syntax(1, "Bad scale value in %%font")
    return
  }
  font_scale_tb[a[0]] = scale
}

// set the width factor of a font
function set_font_fac(font) {
    var scale = font_scale_tb[font.name]

  if (!scale)
    scale = 1.1;
  font.swfac = font.size * scale
}

// %%xxxfont fontname|* [encoding] [size|*]
function param_set_font(xxxfont, param) {
    var  font, old_fn, n, a, new_name, new_fn, new_size, scale

  // "setfont-<n>" goes to "u<n>font"
  if (xxxfont[xxxfont.length - 2] == '-') {
    n = xxxfont[xxxfont.length - 1]
    if (n < '1' || n > '9')
      return
    xxxfont = "u" + n + "font"
  }

  // create a new font
  font = cfmt[xxxfont];
  if (!font) {      // set-font-<n> or new element
    font = {
      name: "sans-serif",
      size: 12
    }
  }
  font = Object.create(font);
  font.fid = font.used = undefined;
  cfmt[xxxfont] = font;

  // fill the values
  a = param.match(/\s+(no)?box(\s|$)/)
  if (a) {        // if box
    if (a[1])
      font.box = false  // nobox
    else
      font.box = true;
    param = param.replace(a[0], a[2])
  }

  a = param.match(/\s+class=(.*?)(\s|$)/)
  if (a) {
    font.class = a[1];
    param = param.replace(a[0], a[2])
  }
  a = param.match(/\s+wadj=(.*?)(\s|$)/)
  if (a) {
      if (typeof document == "undefined")  // useless if in browser
    switch (a[1]) {
    case 'none':
      font.wadj = ''
      break
    case 'space':
      font.wadj = 'spacing'
      break
    case 'glyph':
      font.wadj = 'spacingAndGlyphs'
      break
    default:
      syntax(1, errs.bad_val, "%%" + xxxfont)
      break
    }
    param = param.replace(a[0], a[2])
  }

  a = info_split(param)
  if (!a) {
    syntax(1, errs.bad_val, "%%" + xxxfont)
    return
  }
  new_name = a[0]
  if (new_name != "*") {
    new_name = new_name.replace('Times-Roman', 'serif');
    new_name = new_name.replace('Times', 'serif');
    new_name = new_name.replace('Helvetica', 'sans-serif');
    new_name = new_name.replace('Courier', 'monospace');
    font.name = new_name
    font.swfac = 0
  }
  if (a.length > 1) {
    new_size = a[a.length - 1]
    if (new_size != '*') {
      new_size = Number(new_size)
      if (isNaN(new_size)) {
        syntax(1, errs.bad_val, "%%" + xxxfont)
      } else {
        font.size = new_size;
        font.swfac = 0
      }
    }
  }
}

// get a length with a unit - return the number of pixels
function get_unit(param) {
  var v = parseFloat(param)

  switch (param.slice(-2)) {
  case "CM":
  case "cm":
    v *= CM
    break
  case "IN":
  case "in":
    v *= IN
    break
  case "PT":    // paper point in 1/72 inch
  case "pt":
    v *= .75
    break
//  default:  // ('px')  // screen pixel in 1/96 inch
  }
  return v
}

// set the infoname
function set_infoname(param) {
//fixme: check syntax: '<letter> ["string"]'
  var  tmp = cfmt.infoname.split("\n"),
    letter = param[0]

  for (var i = 0; i < tmp.length; i++) {
    var infoname = tmp[i]
    if (infoname[0] != letter)
      continue
    if (param.length == 1)
      tmp.splice(i, 1)
    else
      tmp[i] = param
    cfmt.infoname = tmp.join('\n')
    return
  }
  cfmt.infoname += "\n" + param
}

// get the text option
var textopt = {
  align: 'j',
  center: 'c',
  fill: 'f',
  justify: 'j',
  ragged: 'f',
  right: 'r',
  skip: 's'
}
function get_textopt(param) {
  return textopt[param]
}

/* -- position of a voice element -- */
var posval = {
  above: C.SL_ABOVE,
  auto: 0,    // !! not C.SL_AUTO !!
  below: C.SL_BELOW,
  down: C.SL_BELOW,
  hidden: C.SL_HIDDEN,
  opposite: C.SL_HIDDEN,
  under: C.SL_BELOW,
  up: C.SL_ABOVE
}

/* -- set the position of elements in a voice -- */
function set_pos(k, v) {    // keyword, value
  k = k.slice(0, 3)
  if (k == "ste")
    k = "stm"
  set_v_param("pos", k + ' ' + v)
}

// set/unset the fields to write
function set_writefields(parm) {
  var  c, i,
    a = parm.split(/\s+/)

  if (get_bool(a[1])) {
    for (i = 0; i < a[0].length; i++) {  // set
      c = a[0][i]
      if (cfmt.writefields.indexOf(c) < 0)
        cfmt.writefields += c
    }
  } else {
    for (i = 0; i < a[0].length; i++) {  // unset
      c = a[0][i]
      if (cfmt.writefields.indexOf(c) >= 0)
        cfmt.writefields = cfmt.writefields.replace(c, '')
    }
  }
}

// set a voice specific parameter
function set_v_param(k, v) {
  if (curvoice) {
    self.set_vp([k + '=', v])
    return
  }
  k = [k + '=', v];
  var vid = '*'
  if (!info.V)
    info.V = {}
  if (info.V[vid])
    Array.prototype.push.apply(info.V[vid], k)
  else
    info.V[vid] = k
}

function set_page() {
  if (!img.chg)
    return
  img.chg = false;
  img.lm = cfmt.leftmargin - cfmt.printmargin
  if (img.lm < 0)
    img.lm = 0;
  img.rm = cfmt.rightmargin - cfmt.printmargin
  if (img.rm < 0)
    img.rm = 0;
  img.width = cfmt.pagewidth - 2 * cfmt.printmargin

  // must have 100pt at least as the staff width
  if (img.width - img.lm - img.rm < 100) {
    error(0, undefined, "Bad staff width");
    img.width = img.lm + img.rm + 150
  }
  set_posx()
} // set_page()

// set a format parameter
// (possible hook)
function set_format(cmd, param) {
  var f, f2, v, i

//fixme: should check the type and limits of the parameter values
  if (/.+font(-[\d])?$/.test(cmd)) {
    param_set_font(cmd, param)
    return
  }

  switch (cmd) {
  case "aligncomposer":
  case "barsperstaff":
  case "infoline":
  case "measurefirst":
  case "measurenb":
  case "rbmax":
  case "rbmin":
  case "shiftunison":
    v = parseInt(param)
    if (isNaN(v)) {
      syntax(1, "Bad integer value");
      break
    }
    cfmt[cmd] = v
    break
  case "microscale":
    f = parseInt(param)
    if (isNaN(f) || f < 4 || f > 256 || f % 1) {
      syntax(1, errs.bad_val, "%%" + cmd)
      break
    }
    set_v_param("uscale", f)
    break
  case "bgcolor":
  case "dblrepbar":
  case "titleformat":
    cfmt[cmd] = param
    break
  case "breaklimit":      // float values
  case "lineskipfac":
  case "maxshrink":
  case "pagescale":
  case "parskipfac":
  case "scale":
  case "slurheight":
  case "stemheight":
  case "stretchlast":
    f = parseFloat(param)
    if (isNaN(f)) {
      syntax(1, errs.bad_val, '%%' + cmd)
      break
    }
    switch (cmd) {
    case "scale":      // old scale
      f /= .75
    case "pagescale":
      cmd = "scale";
      img.chg = true
      break
    }
    cfmt[cmd] = f
    break
  case "annotationbox":
  case "gchordbox":
  case "measurebox":
  case "partsbox":
    cfmt[cmd.replace("box", "font")]  // font
      .box = get_bool(param)
    break
  case "bstemdown":
  case "breakoneoln":
  case "cancelkey":
  case "contbarnb":
  case "custos":
  case "decoerr":
  case "dynalign":
  case "flatbeams":
  case "graceslurs":
  case "graceword":
  case "hyphencont":
  case "keywarn":
  case "linewarn":
  case "rbdbstop":
  case "singleline":
  case "squarebreve":
  case "splittune":
  case "straightflags":
  case "stretchstaff":
  case "timewarn":
  case "titlecaps":
  case "titleleft":
    cfmt[cmd] = get_bool(param)
    break
  case "chordnames":
    v = param.split(',')
    cfmt.chordnames = {}
    for (i = 0; i < v.length; i++)
      cfmt.chordnames['CDEFGAB'[i]] = v[i]
    break
  case "composerspace":
  case "indent":
  case "infospace":
  case "maxstaffsep":
  case "maxsysstaffsep":
  case "musicspace":
  case "partsspace":
  case "staffsep":
  case "subtitlespace":
  case "sysstaffsep":
  case "textspace":
  case "titlespace":
  case "topspace":
  case "vocalspace":
  case "wordsspace":
    f = get_unit(param)  // normally, unit in points - 72 DPI accepted
    if (isNaN(f))
      syntax(1, errs.bad_val, '%%' + cmd)
    else
      cfmt[cmd] = f
    break
  case "print-leftmargin":  // to remove
    syntax(0, "$1 is deprecated - use %%printmargin instead", '%%' + cmd)
    cmd = "printmargin"
    // fall thru
  case "printmargin":
//  case "botmargin":
  case "leftmargin":
//  case "pageheight":
  case "pagewidth":
  case "rightmargin":
//  case "topmargin":
    f = get_unit(param)  // normally unit in cm or in - 96 DPI
    if (isNaN(f)) {
      syntax(1, errs.bad_val, '%%' + cmd)
      break
    }
    cfmt[cmd] = f;
    img.chg = true
    break
  case "concert-score":
    if (cfmt.sound != "play")
      cfmt.sound = "concert"
    break
  case "writefields":
    set_writefields(param)
    break
  case "dynamic":
  case "gchord":
  case "gstemdir":
  case "ornament":
  case "stemdir":
  case "vocal":
  case "volume":
    set_pos(cmd, param)
    break
  case "font":
    get_font_scale(param)
    break
  case "fullsvg":
    if (parse.state != 0) {
      syntax(1, errs.not_in_tune, "%%fullsvg")
      break
    }
//fixme: should check only alpha, num and '_' characters
    cfmt[cmd] = param
    break
  case "gracespace":
    v = param.split(/\s+/)
    for (i = 0; i < 3; i++)
      if (isNaN(Number(v[i]))) {
        syntax(1, errs.bad_val, "%%gracespace")
        break
      }
    for (i = 0; i < 3; i++)
      cfmt[cmd][i] = Number(v[i])
    break
  case "tuplets":
    cfmt[cmd] = param.split(/\s+/);
    v = cfmt[cmd][3]
    if (v      // if 'where'
     && (posval[v]))  // translate the keyword
      cfmt[cmd][3] = posval[v]
    break
  case "infoname":
    set_infoname(param)
    break
  case "notespacingfactor":
    f = parseFloat(param)
    if (isNaN(f) || f < 1 || f > 2) {
      syntax(1, errs.bad_val, "%%" + cmd)
      break
    }
    i = 5;        // index of crotchet
    f2 = space_tb[i]
    for ( ; --i >= 0; ) {
      f2 /= f;
      space_tb[i] = f2
    }
    i = 5;
    f2 = space_tb[i]
    for ( ; ++i < space_tb.length; ) {
      f2 *= f;
      space_tb[i] = f2
    }
    break
  case "play":
    cfmt.sound = "play"    // without clef
    break
  case "pos":
    cmd = param.split(/\s+/);
    set_pos(cmd[0], cmd[1])
    break
  case "sounding-score":
    if (cfmt.sound != "play")
      cfmt.sound = "sounding"
    break
  case "staffwidth":
    v = get_unit(param)
    if (isNaN(v)) {
      syntax(1, errs.bad_val, '%%' + cmd)
      break
    }
    if (v < 100) {
      syntax(1, "%%staffwidth too small")
      break
    }
    v = cfmt.pagewidth - v - cfmt.leftmargin
    if (v < 2) {
      syntax(1, "%%staffwidth too big")
      break
    }
    cfmt.rightmargin = v;
    img.chg = true
    break
  case "textoption":
    cfmt[cmd] = get_textopt(param)
    break
  case "titletrim":
    v = Number(param)
    if (isNaN(v))
      cfmt[cmd] = get_bool(param)
    else
      cfmt[cmd] = v
    break
  case "combinevoices":
    syntax(1, "%%combinevoices is deprecated - use %%voicecombine instead")
    break
  case "voicemap":
    set_v_param("map", param)
    break
  case "voicescale":
    set_v_param("scale", param)
    break
  default:    // memorize all global commands
    if (parse.state == 0)    // (needed for modules)
      cfmt[cmd] = param
    break
  }
}

// font stuff

// build a font style
function style_font(font) {
    var  fn = font.name,
  r = '',
  a = fn.match(/-?[bB]old/)

  if (a) {
    r += "bold ";
    fn = fn.replace(a[0], '')
  }
  a = fn.match(/-?[iI]talic/)
  if (a) {
    r += "italic ";
    fn = fn.replace(a[0], '')
  }
  a = fn.match(/-?[oO]blique/)
  if (a) {
    r += "oblique ";
    fn = fn.replace(a[0], '')
  }
  return 'font:' + r + font.size.toFixed(1) + 'px ' + fn
}
Abc.prototype.style_font = style_font

// build a font class
function font_class(font) {
  if (font.class)
    return 'f' + font.fid + cfmt.fullsvg + ' ' + font.class
  return 'f' + font.fid + cfmt.fullsvg
}

// use the font
function use_font(font) {
  if (!font.used) {
    font.used = true;
    if (font.fid == undefined) {
      font.fid = font_tb.length;
      font_tb.push(font)
      if (!font.swfac)
        set_font_fac(font)
    }
    font_style += "\n.f" + font.fid + cfmt.fullsvg +
      " {" + style_font(font) + "}"
  }
}

// get the font of the 'xxxfont' parameter
function get_font(fn) {
  fn += "font"
    var  font = cfmt[fn]
  if (!font) {
    syntax(1, "Unknown font $1", '$' + fn[1]);
    font = gene.curfont
  }

  use_font(font)
  return font
}
