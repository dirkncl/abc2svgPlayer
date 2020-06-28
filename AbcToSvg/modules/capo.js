// capo.js - module to add a capo chord line
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%capo" appears in a ABC source.
//
// Parameters
//	%%capo n	'n' is the capo fret number

abc2svg.capo = {

// function called when setting a chord symbol on a music element
    gch_capo: function(a_gch) {
    var	gch, gch2, i2,
	cfmt = this.cfmt(),
	transp = cfmt.capo,
	i = 0

	while (1) {
		gch = a_gch[i++]
		if (!gch)
			return
		if (gch.type == 'g')
			break
	}
	gch2 = Object.create(gch);
	gch2.capo = false;		// (would be erased when setting gch)
	gch2.text = this.gch_tr1(gch2.text, -abc2svg.ifb40[transp % 12])
	if (!this.capo_first) {			// if new tune
		this.capo_first = true;
		gch2.text += "  (capo: " + transp.toString() + ")"
	}

	gch2.font = this.get_font(cfmt.capofont ? "capo" : "annotation");
	a_gch.splice(i, 0, gch2)

	// set a mark in the first chord symbol for %%diagram
	gch.capo = true
    }, // gch_capo()

    gch_build: function(of, s) {
    var	a_gch = this.get_a_gch()
	if (this.cfmt().capo && a_gch)
		abc2svg.capo.gch_capo.call(this, a_gch);
	of(s)
    },

    output_music: function(of) {
	this.capo_first = false;
	of()
    },

    set_fmt: function(of, cmd, param) {
	if (cmd == "capo") {
		this.cfmt().capo = param
		return
	}
	of(cmd, param)
    },

    set_hooks: function(abc) {
	abc.gch_build = abc2svg.capo.gch_build.bind(abc, abc.gch_build);
	abc.output_music = abc2svg.capo.output_music.bind(abc, abc.output_music);
	abc.set_format = abc2svg.capo.set_fmt.bind(abc, abc.set_format)
    }
} // capo

abc2svg.modules.hooks.push(abc2svg.capo.set_hooks);

// the module is loaded
abc2svg.modules.capo.loaded = true
