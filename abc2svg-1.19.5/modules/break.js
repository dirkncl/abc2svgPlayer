// break.js - module to handle the %%break command
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%break" appears in a ABC source.
//
// Parameters
//  %%break measure_nb [":" num "/" den] [" " measure ...]*

abc2svg.break = {

  // get the %%break parameters
  get_break: function(parm) {
      var  C = abc2svg.C,
    b, c, d, sq,
    a = parm.split(/[ ,]/),
    cfmt = this.cfmt()

    if (!cfmt.break)
      cfmt.break = []
    for (n = 1; n < a.length; n++) {
      b = a[n];
      c = b.match(/(\d+)([a-z]?)(:\d+\/\d+)?/)
      if (!c) {
        this.syntax(1, this.errs.bad_val, "%%break")
        continue
      }
      if (c[2])
        sq = c[2].charCodeAt(0) - 0x61
      if (!c[3]) {
        cfmt.break.push({  // on measure bar
            m: c[1],
            t: 0,
            sq: sq})
        continue
      }
      d = c[3].match(/:(\d+)\/(\d+)/)
      if (!d || d[2] < 1) {
        this.syntax(1, "Bad denominator in %%break")
        continue
      }
      cfmt.break.push({
          m: c[1],
          t: d[1] * C.BLEN / d[2],
          sq: sq})
    }
  }, // get_break()

  // insert the EOLs of %%break
  do_break: function() {
      var  i, m, t, brk, seq,
    voice_tb = this.get_voice_tb()
    v = this.get_cur_sy().top_voice,
    s1 = voice_tb[v].sym,
    cfmt = this.cfmt()

    for (i = 0; i < cfmt.break.length; i++) {
      brk = cfmt.break[i];
      m = brk.m
      for (s = s1; s; s = s.next) {
        if (s.bar_num == m)
          break
      }
      if (!s)
        continue

      if (brk.sq) {
        seq = brk.sq
        for (s = s.ts_next; s; s = s.ts_next) {
          if (s.bar_num == m) {
            if (--seq == 0)
              break
          }
        }
        if (!s)
          continue
      }

      t = brk.t
      if (t) {
        t = s.time + t
        for ( ; s; s = s.next) {
          if (s.time >= t)
            break
        }
        if (!s)
          continue
        s = s.prev
      }
      s.eoln = true
    }
  }, // do_break()

    do_pscom: function (of, text) {
  if (text.slice(0, 6) == "break ")
    abc2svg.break.get_break.call(this, text)
  else
    of(text)
    },

    set_bar_num: function(of) {
  of()
  if (this.cfmt().break)
    abc2svg.break.do_break.call(this)
    },

    set_hooks: function(abc) {
  abc.do_pscom = abc2svg.break.do_pscom.bind(abc, abc.do_pscom);
  abc.set_bar_num = abc2svg.break.set_bar_num.bind(abc, abc.set_bar_num)
    }
} // break

abc2svg.modules.hooks.push(abc2svg.break.set_hooks);

// the module is loaded
abc2svg.modules.break.loaded = true
