// temper.js - module to define the temperament
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%temperament" appears in a ABC source.
//
// Parameters
//	%%temperament <list>
// The <list> must contain 12 integer values that are the detune values in cents
// of the 12 notes of the equal scale.
// Examples:
//
// % pythagore (~500 B.C)
// %%temperament +00 +14 +04 -06 +08 -02 +12 +02 +16 +06 -04 +10
//
// % just intonation
// %%temperament +00 -08 -18 -06 -14 -02 -10 +02 -08 -16 -04 -12
//
// % meantone (Pietro Aaron 1523)
// %%temperament +00 -24 -07 +10 -14 +03 -21 -03 -27 +10 +07 -17
//
// % Andreas Werckmeister III (1681)
// %%temperament +00 -04 +04 +00 -04 +04 +00 +02 -08 +00 +02 -02
//
// % well temperament (F.A. Vallotti 1754)
// %%temperament +00 -06 -04 -02 -08 +02 -08 -02 -04 -06 +00 -10

abc2svg.temper = {

    // move the temperament to the 1st voice
    set_bar_num: function(of) {
	of()
	if (this.cfmt().temper) {
	    var	v0 = this.get_voice_tb()[0];

		v0.temper = new Float32Array(12)
		for (var i = 0; i < 12; i++)
			v0.temper[i] = this.cfmt().temper[i] / 100
	}
    },

    // get the temperament
    set_fmt: function(of, cmd, param) {
	if (cmd == "temperament") {
	    var	ls = new Float32Array(param.split(/ +/)),
		i = ls.length

		if (i == 12) {
			while (--i >= 0) {
				if (isNaN(ls[i]))
					break
				ls[i] = i + ls[i] / 100	// delta -> MIDI/octave
			}
			if (i < 0) {
				this.cfmt().temper = ls
				return
			}
		}
		this.syntax(1, this.errs.bad_val, "%%temperament")
		return
	}
	of(cmd, param)
    },

    set_hooks: function(abc) {
	abc.set_bar_num = abc2svg.temper.set_bar_num.bind(abc, abc.set_bar_num);
	abc.set_format = abc2svg.temper.set_fmt.bind(abc, abc.set_format)
    }
} // temper


abc2svg.modules.hooks.push(abc2svg.temper.set_hooks);

// the module is loaded
abc2svg.modules.temperament.loaded = true
