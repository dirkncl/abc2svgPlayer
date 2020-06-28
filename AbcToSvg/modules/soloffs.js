// soloffs.js - module to set the X offset of some elements at start of music line
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// Parameters
//	%%soloffs <type>=<offset> [<type>=<offset>]*
//		<type> is one of 'part', 'tempo' or 'space'
//		<offset> is the X offset from the start of staff

abc2svg.soloffs = {

    set_fmt: function(of, cmd, parm) {
	if (cmd == "soloffs") {
	    var	i, v,
		C = abc2svg.C,
		soloffs = this.cfmt().soloffs = {}

		parm = parm.split(/\s+/)
		while (parm.length) {
			i = parm.shift().split('=')
			v = Number(i[1])
			if (isNaN(v))
				continue		// error
			switch (i[0]) {
//			case 'bar':
//				soloffs[C.BAR] = v
//				break
			case 'part':
				soloffs[C.PART] = v + 10	// see deco.js
				break
			case 'tempo':
				soloffs[C.TEMPO] = v + 16	// see deco.js
				break
			case 'space':
				soloffs[C.SPACE] = v
				break
//			default:
//				// error
//				break
			}
		}
		return
	}
	of(cmd, parm)
    },

    set_sym_glue: function(of, width) {
    var	s,
	C = abc2svg.C,
	tsfirst = this.get_tsfirst(),
	soloffs = this.cfmt().soloffs;

	of(width)		// compute the x offset of the symbols
	if (!soloffs)
		return
	for (s = tsfirst; s; s = s.ts_next) {
		if (s.dur)
			break
		if (soloffs[s.type] != undefined)
			s.x = soloffs[s.type]
	}
    }, // set_sym_glue()

    set_hooks: function(abc) {
	abc.set_sym_glue = abc2svg.soloffs.set_sym_glue.bind(abc, abc.set_sym_glue);
	abc.set_format = abc2svg.soloffs.set_fmt.bind(abc, abc.set_format)
    }
} // soloffs

abc2svg.modules.hooks.push(abc2svg.soloffs.set_hooks);

// the module is loaded
abc2svg.modules.soloffs.loaded = true
