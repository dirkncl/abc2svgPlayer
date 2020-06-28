// grid2.js - module to replace a voice in the music by a chord grid
//
// Copyright (C) 2018-2019 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%grid2" appears in a ABC source.
//
// Parameters
//	%%grid2 y
// This command must appear in a voice.

abc2svg.grid2 = {

// function called before tune generation
    do_grid: function() {
    var s, v, p_v, ix, cs, c_a_cs, bt,
	voice_tb = this.get_voice_tb()

	for (v = 0; v < voice_tb.length; v++) {
		p_v = voice_tb[v]
		if (!p_v.grid2)
			continue
		p_v.clef.invis = true;		// no clef
		p_v.key.k_sf = p_v.key.k_a_acc = 0; // no key signature
		p_v.staffnonote = 2		// draw the staff
		for (s = p_v.sym; s; s = s.next) {
			delete s.a_dd		// no decoration
			if (!s.dur) {
				if (s.bar_type)
					bt = s.time
				continue
			}

			// set all notes
				s.invis = true;	//  as invisible
				delete s.sl1;	//  with no slur
				delete s.tie_s	//  and no tie
				if (s.tf)	// don't show the tuplets
					s.tf[0] = 1
				if (!s.a_gch) {
					if (s.time == bt)
						s.a_gch = c_a_cs
					continue
				}
				for (ix = 0; ix < s.a_gch.length; ix++) {
					gch = s.a_gch[ix]
					if (gch.type == 'g') {
						c_a_cs = s.a_gch
						break
					}
				}
		}
	}
    }, // do_grid()

    // draw the chord symbol in the middle of the staff
    draw_chosym: function(s) {
    var	ix, gch;

	this.set_dscale(s.st)
	for (ix = 0; ix < s.a_gch.length; ix++) {
		gch = s.a_gch[ix]
		if (gch.type != 'g')
			continue
		this.use_font(gch.font);
		this.set_font(gch.font);
		this.xy_str(s.x + gch.x, gch.y + 6, gch.text)
	}
    }, // draw_chosym()

    draw_gchord: function(of, s, gchy_min, gchy_max) {
	if (s.p_v.grid2)
		abc2svg.grid2.draw_chosym.call(this, s)
	else
		of(s, gchy_min, gchy_max)
    },

    output_music: function(of) {
	abc2svg.grid2.do_grid.call(this);
	of()
    },

    set_fmt: function(of, cmd, param) {
	if (cmd == "grid2") {
	    var	curvoice = this.get_curvoice()
		if (curvoice) {
			this.set_v_param("stafflines", "...");	// no staff lines
			curvoice.grid2 = param
		}
		return
	}
	of(cmd, param)
    },

    set_hooks: function(abc) {
	abc.draw_gchord = abc2svg.grid2.draw_gchord.bind(abc, abc.draw_gchord);
	abc.output_music = abc2svg.grid2.output_music.bind(abc, abc.output_music);
	abc.set_format = abc2svg.grid2.set_fmt.bind(abc, abc.set_format)
    }
} // grid2

abc2svg.modules.hooks.push(abc2svg.grid2.set_hooks);

// the module is loaded
abc2svg.modules.grid2.loaded = true
