// abc2svg - modules.js - module handling
//
// Copyright (C) 2018-2019 Jean-Francois Moine
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

abc2svg.loadjs = function(fn, onsuccess, onerror) {
  if (onerror)
    onerror()
}

abc2svg.modules = {
  ambitus:      { fn: 'modules/ambitus.js' },
  beginps:      { fn: 'modules/psvg.js' },
  'break':      { fn: 'modules/break.js' },
  capo:         { fn: 'modules/capo.js' },
  clip:         { fn: 'modules/clip.js' },
  clairnote:    { fn: 'modules/clair.js' },
  voicecombine: { fn: 'modules/combine.js' },
  diagram:      { fn: 'modules/diag.js' },
  equalbars:    { fn: 'modules/equalbars.js' },
  grid:         { fn: 'modules/grid.js' },
  grid2:        { fn: 'modules/grid2.js' },
  MIDI:         { fn: 'modules/MIDI.js' },
  pageheight:   { fn: 'modules/page.js' },
  ercmap:       { fn: 'modules/perc.js' },
  soloffs:      { fn: 'modules/soloffs.js' },
  sth:          { fn: 'modules/sth.js' },
  temperament:  { fn: 'modules/temper.js' },
  wps:          { fn: 'modules/wps.js' },

  nreq: 0,
  hooks: [],
  g_hooks: [],

  // scan the file and find the required modules
  // @file: ABC file
  // @relay: (optional) callback function for continuing the treatment
  // @errmsg: (optional) function to display an error message if any
  //  This function gets one argument: the message
  // return true when all modules are loaded
  load: function(file, relay, errmsg) {

    function get_errmsg() {
      if (typeof user == 'object' && user.errmsg)
        return user.errmsg
      if (typeof printErr == 'function')
        return printErr
      if (typeof alert == 'function')
        return function(m) { alert(m) }
      if (typeof console == 'object')
        return console.log
      return function(){}
    }

    // test if some keyword in the file
      var  m, r,
    nreq_i = this.nreq,
    ls = file.match(/(^|\n)(%%|I:).+?\b/g)

    if (!ls)
      return true
    this.cbf = relay ||    // (only one callback function)
      function(){}
    this.errmsg = errmsg || get_errmsg()

    for (var i = 0; i < ls.length; i++) {
      m = abc2svg.modules[ls[i].replace(/\n?(%%|I:)/, '')]
      if (!m || m.loaded)
        continue

      m.loaded = true

      // load the module
        this.nreq++;
        abc2svg.loadjs(m.fn,
            function() {  // if success
          if (--abc2svg.modules.nreq == 0)
            abc2svg.modules.cbf()
            },
            function() {  // if error
          abc2svg.modules.errmsg('error loading ' + m.fn);
          if (--abc2svg.modules.nreq == 0)
            abc2svg.modules.cbf()
            })
    }
    return this.nreq == nreq_i
  }
} // modules
