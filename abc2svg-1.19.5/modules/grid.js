// grid.js - module to insert a chord grid before or after a tune
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%grid" appears in a ABC source.
//
// Parameters
//  %%grid <n> [include=<list>] [nomusic] [norepeat]
//    <n> = number of columns (1: auto)
//      > 0: above the tune, < 0: under the tune
//    <list> = comma separated list of (continuous) measure numbers
//    'nomusic' displays only the grid
//    'norepeat' omits the ':' indications
//  %%gridfont font_name size (default: 'serif 16')

abc2svg.grid = {

// function called before tune generation
    do_grid: function() {
    var  C = abc2svg.C,
  tsfirst = this.get_tsfirst(),
  voice_tb = this.get_voice_tb(),
  img, font_cl, cls,
  cfmt = this.cfmt(),
  grid = cfmt.grid

function get_beat(s) {
    var  beat = C.BLEN / 4

  if (!s.a_meter[0] || s.a_meter[0].top[0] == 'C' || !s.a_meter[0].bot)
    return beat;
  beat = C.BLEN / s.a_meter[0].bot[0] |0
  if (s.a_meter[0].bot[0] == 8
   && s.a_meter[0].top[0] % 3 == 0)
    beat = C.BLEN / 8 * 3
  return beat
} // get_beat()

// generate the grid
function build_grid(chords, bars, font, wmx) {
    var  i, j, k, l, nr, line, bar, w, hr, x0, x, y, yl,
  cell = '',
  pcell = '',
  cells = [],
  nc = grid.n

  // set some chord(s) in each cell
  function set_chords() {
      var  i, ch,
    pch = '-'

    for (i = 0; i < chords.length; i++) {
      ch = chords[i]
      if (!ch[0])
        ch[0] = pch
      if (ch.length == 0)
        continue
      if (ch.length == 1) {
        pch = ch[0]
        continue
      }
      if (ch.length == 2) {
        ch[2] = ch[1];
        ch[1] = null;
        pch = ch[2]
        continue
      }
      if (ch.length == 3) {
        pch = ch[2]
        continue
      }
      if (!ch[2])
        ch[2] = ch[1] || ch[0];
      pch = ch[3]
    }
  } // set_chords()

  // set some chords in each cell
  set_chords()

  // build the content of the cells
  if (!grid.ls) {
    cells = chords
  } else {        // with list of mesure numbers
    bar = bars;
    bars = []
    for (i = 0; i < grid.ls.length; i++) {
      l = grid.ls[i]
      if (l.indexOf('-') < 0)
        l = [l, l]
      else
        l = l.split('-')
      for (k = l[0] - 1; k < l[1]; k++) {
        if (!chords[k])    // error
          break
        cells.push(chords[k]);
        bars.push(bar[k])
      }
    }
  }

  // get the number of columns and rows
  if (nc < 0)
    nc = -nc
  if (nc < 3)        // auto
    nc = cells.length % 6 == 0 ? 6 : 8
  if (nc > cells.length)
    nc = cells.length;
  nr = ((cells.length + nc - 1) / nc) |0;

  hr = font.size * 2
  if (wmx < hr * 1.4)
    wmx = hr * 1.4;        // cell width

  w = wmx * nc
  if (w > img.width) {
    nc /= 2;
    nr *= 2;
    w /= 2
  }

  // build the SVG image
  line = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
  xmlns:xlink="http://www.w3.org/1999/xlink"\n\
  color="black" width="' + img.width.toFixed(0) +
      'px" height="' + (hr * nr + 6).toFixed(0) + 'px"';
  i = cfmt.bgcolor
  if (i)
    line += ' style="background-color: ' + i + '"';
  line += '>\n<style type="text/css">\n\
.mid {text-anchor:middle}\n'

  if (cfmt.fullsvg || grid.nomusic)
    line += '\
.stroke {stroke: currentColor; fill: none}\n\
.' + font_cl + ' {' + this.style_font(font) +  '}\n';
  line += '</style>\n'

  // draw the lines
  line += '<path class="stroke" d="\n';
  x0 = (img.width - w) / 2;
  y = 1
  for (j = 0; j <= nr; j++) {
    line += 'M' + x0.toFixed(1) + ' ' + y.toFixed(1) +
      'h' + w.toFixed(1)+ '\n';
    y += hr
  }
  x = x0
  for (i = 0; i <= nc; i++) {
    line += 'M' + x.toFixed(1) + ' 1v' + (hr * nr).toFixed(1) + '\n';
    x += wmx
  }
  line += '"/>\n';

  // insert the chords
  y = 1 - hr / 2 + font.size * .3;
  yl = 1
  for (i = 0; i < cells.length; i++) {
    cell = cells[i]
    if (i % nc == 0) {
      y += hr;      // new row
      yl += hr;
      x = x0 + wmx / 2
    }
    if (cell.length > 1) {
      line += '<path class="stroke" stroke-width="1" d="M' +
        (x - wmx / 2).toFixed(1) + ' ' +
        yl.toFixed(1) + 'l' +
        wmx.toFixed(1) + ' -' + hr.toFixed(1) +
        '"/>\n';
      if (cell[1]) {
          line += '<path class="stroke" stroke-width="1" d="M' +
        (x - wmx / 2).toFixed(1) + ' ' +
        (yl - hr).toFixed(1) + 'l' +
        (wmx / 2).toFixed(1) + ' ' + (hr / 2).toFixed(1) +
        '"/>\n';
          line += '<text class="' + cls + '" style="font-size:' +
        (font.size * .72).toFixed(1) + '" x="' +
        (x - wmx / 3).toFixed(1) + '" y="' +
        y.toFixed(1) + '">' +
        cell[0] + '</text>\n';
          line += '<text class="' + cls + '" style="font-size:' +
        (font.size * .72).toFixed(1) + '" x="' +
        x.toFixed(1) + '" y="' +
        (y - hr / 3).toFixed(1) + '">' +
        cell[1] + '</text>\n'
      } else {
          line += '<text class="' + cls + '" style="font-size:' +
        (font.size * .72).toFixed(1) + '" x="' +
        (x - wmx * .2).toFixed(1) + '" y="' +
        (y - hr / 4).toFixed(1) + '">' +
        cell[0] + '</text>\n'
      }
      if (cell.length >= 3) {
        if (cell[3]) {
          line += '<path class="stroke" stroke-width="1" d="M' +
        x.toFixed(1) + ' ' +
        (yl - hr / 2).toFixed(1) + 'l' +
        (wmx / 2).toFixed(1) + ' ' + (hr / 2).toFixed(1) +
        '"/>\n';
          line += '<text class="' + cls + '" style="font-size:' +
        (font.size * .72).toFixed(1) + '" x="' +
        x.toFixed(1) + '" y="' +
        (y + hr / 3).toFixed(1) + '">' +
        cell[2] + '</text>\n';
          line += '<text class="' + cls + '" style="font-size:' +
        (font.size * .72).toFixed(1) + '" x="' +
        (x + wmx / 3).toFixed(1) + '" y="' +
        y.toFixed(1) + '">' +
        cell[3] + '</text>\n'
        } else {
          line += '<text class="' + cls + '" style="font-size:' +
        (font.size * .72).toFixed(1) + '" x="' +
        (x + wmx * .2).toFixed(1) + '" y="' +
        (y + hr / 4).toFixed(1) + '">' +
        cell[2] + '</text>\n'
        }
      }
    } else {
      line += '<text class="' + cls + '" x="' +
        x.toFixed(1) + '" y="' + y.toFixed(1) + '">' +
        cell[0] + '</text>\n'
    }
    x += wmx
  }

  // show the repeat signs
  y = 1 - hr / 2 + font.size * .3;
  x = x0
  for (i = 0; i < bars.length; i++) {
    bar = bars[i]
    if (bar[0] == ':')
      line += '<text class="' + cls + '" x="' +
        (x - 5).toFixed(1) +
        '" y="' + y.toFixed(1) +
        '" style="font-weight:bold;font-size:' +
      (font.size + 2).toFixed(1) + '">:</text>\n'
    if (i % nc == 0) {
      y += hr;      // new row
      x = x0
    }
    if (bar[bar.length - 1] == ':')
      line += '<text class="' + cls + '" x="' +
        (x + 5).toFixed(1) +
        '" y="' + y.toFixed(1) +
        '" style="font-weight:bold;font-size:' +
      (font.size + 2).toFixed(1) + '">:</text>\n'
    x += wmx
  }

  return line + '</svg>'
} // build_grid()

    var  s, beat, cur_beat, i, beat_i, p_voice, n, font, wm, bt, w, wmx, rep,
  bars = [],
  chords = [],
  chord = [];

  img = this.get_img();

  // get the beat
  beat = get_beat(voice_tb[0].meter);
  wm = voice_tb[0].meter.wmeasure;

  // set the text style
  if (!cfmt.gridfont)
    this.param_set_font("gridfont", "serif 16");
  font = this.get_font('grid');
  font_cl = this.font_class(font)
  cls = font_cl + " mid";
  this.set_font('grid');    // (for strwh())

  // scan the first voice of the tune
  cur_beat = beat_i = n = wmx = 0;
  bars.push('|')
  for (s = voice_tb[0].sym; s; s = s.next) {
    while (s.time > cur_beat) {
      if (beat_i < 3)    // only 2, 3 or 4 beats / measure...
        beat_i++;
      cur_beat += beat
    }
    switch (s.type) {
    case C.NOTE:
    case C.REST:
      if (s.a_gch) {    // search a chord symbol
        for (i = 0; i < s.a_gch.length; i++) {
          if (s.a_gch[i].type == 'g') {
            if (!chord[beat_i]) {
              chord[beat_i] = s.a_gch[i].text;
              w = this.strwh(chord[beat_i])[0]
              if (w > wmx)
                wmx = w;
              n++
            }
            break
          }
        }
      }
      break
    case C.BAR:
      bt = grid.norep ? '|' : s.bar_type
      if (s.time < wm) {    // if anacrusis
        if (chord.length) {
          chords.push(chord);
          bars.push(bt)
        } else {
          bars[0] = bt
        }
      } else {
        if (!s.bar_num)    // if not normal measure bar
          break
        chords.push(chord);
        bars.push(bt)
      }
      chord = [];
      cur_beat = s.time;  // synchronize in case of error
      beat_i = 0
      if (bt.indexOf(':'))
        rep = true  // some repeat
      break
    case C.METER:
      beat = get_beat(s)
      wm = s.wmeasure
      break
    }
  }
  if (n == 0)        // no chord in this tune
    return

  if (chord.length != 0) {
    bars.push('')
    chords.push(chord)
  }

  // create the grid
  wmx += this.strwh(rep ? '    ' : '  ')[0];
  p_voice = voice_tb[this.get_top_v()]
  s = {
    type: C.BLOCK,
    subtype: 'ml',
    dur: 0,
    time: 0,
    p_v: p_voice,
    v: p_voice.v,
    text: build_grid.call(this, chords, bars, font, wmx)
  }

  if (grid.nomusic) {    // if no music
    this.set_tsfirst(s)
    return
  }

  // and insert it in the tune
  if (cfmt.grid.n < 0) {    // below
    for (var s2 = tsfirst; s2.ts_next; s2 = s2.ts_next)
      ;
    s.time = s2.time;
    s.prev = p_voice.last_sym;
    s.ts_prev = s2;
    p_voice.last_sym.next = s;
    s2.ts_next = s
  } else {      // above
    s.time = 0;
    s.next = p_voice.sym;
    s.ts_next = tsfirst;
    tsfirst.ts_prev = s;
    this.set_tsfirst(s);
    p_voice.sym.prev = s;
    p_voice.sym = s
  }
    }, // do_grid()

    output_music: function(of) {
  if (this.cfmt().grid)
    abc2svg.grid.do_grid.call(this);
  of()
    },

    set_fmt: function(of, cmd, parm) {
  if (cmd == "grid") {
    if (!parm)
      parm = "1";
    parm = parm.split(/\s+/)
    var grid = {n: Number(parm.shift())}
    if (isNaN(grid.n)) {
      if (parm.length) {
        this.syntax(1, this.errs.bad_val, "%%grid")
        return
      }
      grid.n = 1
    }
    while (parm.length) {
      var item = parm.shift()
      if (item == "norepeat")
        grid.norep = true
      else if (item == "nomusic")
        grid.nomusic = true
      else if (item.slice(0, 8) == "include=")
        grid.ls = item.slice(8).split(',')
    }
    this.cfmt().grid = grid
    return
  }
  of(cmd, parm)
    },

    set_hooks: function(abc) {
  abc.output_music = abc2svg.grid.output_music.bind(abc, abc.output_music);
  abc.set_format = abc2svg.grid.set_fmt.bind(abc, abc.set_format)
    }
} // grid

abc2svg.modules.hooks.push(abc2svg.grid.set_hooks);

// the module is loaded
abc2svg.modules.grid.loaded = true
