// abc2svg - modules.js - module handling
//
// Copyright (C) 2018-2020 Jean-Francois Moine
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

// empty function
if (!abc2svg.loadjs) {
    abc2svg.loadjs = function(fn, onsuccess, onerror) {
	if (onerror)
		onerror()
    }
}

abc2svg.modules = {
		ambitus: { fn: 'ambitus-1.js' },
	begingrid: { fn: 'grid3-1.js' },
		beginps: { fn: 'psvg-1.js' },
		break: { fn: 'break-1.js' },
		capo: { fn: 'capo-1.js' },
		clip: { fn: 'clip-1.js' },
	clairnote: { fn: 'clair-1.js' },
		voicecombine: { fn: 'combine-1.js' },
		diagram: { fn: 'diag-1.js' },
	equalbars: { fn: 'equalbars-1.js' },
		grid: { fn: 'grid-1.js' },
		grid2: { fn: 'grid2-1.js' },
	jianpu: { fn: 'jianpu-1.js' },
	mdnn: { fn: 'mdnn-1.js' },
		MIDI: { fn: 'MIDI-1.js' },
	pageheight: { fn: 'page-1.js' },
		percmap: { fn: 'perc-1.js' },
	soloffs: { fn: 'soloffs-1.js' },
	sth: { fn: 'sth-1.js' },
	temperament: { fn: 'temper-1.js' },

	nreq: 0,
	hooks: [],
	g_hooks: [],

	// scan the file and find the required modules
	// @file: ABC file
	// @relay: (optional) callback function for continuing the treatment
	// @errmsg: (optional) function to display an error message if any
	//	This function gets one argument: the message
	// return true when all modules are loaded
	load: function(file, relay, errmsg) {

		function get_errmsg() {
			if (typeof user == 'object' && user.errmsg)
				return user.errmsg
			if (typeof abc2svg.printErr == 'function')
				return abc2svg.printErr
			if (typeof alert == 'function')
				return function(m) { alert(m) }
			if (typeof console == 'object')
				return console.log
			return function(){}
		} // get_errmsg()

		// call back functions for loadjs()
		function load_end() {
			if (--abc2svg.modules.nreq == 0)
				abc2svg.modules.cbf()
		}
		function load_ko(fn) {
			abc2svg.modules.errmsg('Error loading the module ' + fn)
			load_end()
		}

		// test if some keyword in the file
	    var	m, r, i,
		nreq_i = this.nreq,
		ls = file.match(/(^|\n)(%%|I:).+?\b/g)

		if (!ls)
			return true
		this.cbf = relay ||		// (only one callback function)
			function(){}
		this.errmsg = errmsg || get_errmsg()

		for (i = 0; i < ls.length; i++) {
			m = abc2svg.modules[ls[i].replace(/\n?(%%|I:)/, '')]
			if (!m || m.loaded)
				continue

			m.loaded = true

			// load the module
			this.nreq++
			abc2svg.loadjs(m.fn, load_end, function(){load_ko(m.fn)})
		}
		return this.nreq == nreq_i
	}
} // modules
