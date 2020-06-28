// abc2svg - tail.js
//
// Copyright (C) 2014-2020 Jean-Francois Moine
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

// initialize
	init_tune()

// Abc functions used by the modules
Abc.prototype.add_style = function(s) { style += s };
Abc.prototype.cfmt = function() { return cfmt };
Abc.prototype.clone = clone;
Abc.prototype.deco_cnv = deco_cnv;
Abc.prototype.draw_meter = draw_meter
Abc.prototype.draw_note = draw_note;
Abc.prototype.errs = errs;
Abc.prototype.font_class = font_class;
Abc.prototype.gch_tr1 = gch_tr1;
Abc.prototype.get_a_gch = function() { return a_gch };
Abc.prototype.get_bool = get_bool;
Abc.prototype.get_cur_sy = function() { return cur_sy };
Abc.prototype.get_curvoice = function() { return curvoice };
Abc.prototype.get_delta_tb = function() { return delta_tb };
Abc.prototype.get_decos = function() { return decos };
Abc.prototype.get_font = get_font;
Abc.prototype.get_font_style = function() { return font_style };
Abc.prototype.get_glyphs = function() { return glyphs };
Abc.prototype.get_img = function() { return img };
Abc.prototype.get_maps = function() { return maps };
Abc.prototype.get_multi = function() { return multicol };
Abc.prototype.get_newpage = function() {
	if (block.newpage) {
		block.newpage = false;
		return true
	}
};
Abc.prototype.get_posy = function() { var t = posy; posy = 0; return t };
Abc.prototype.get_staff_tb = function() { return staff_tb };
Abc.prototype.get_top_v = function() { return par_sy.top_voice };
Abc.prototype.get_tsfirst = function() { return tsfirst };
Abc.prototype.get_unit = get_unit;
Abc.prototype.get_voice_tb = function() { return voice_tb };
Abc.prototype.goto_tune = goto_tune;
Abc.prototype.info = function() { return info };
Abc.prototype.new_block = new_block;
Abc.prototype.out_arp = out_arp;
Abc.prototype.out_deco_str = out_deco_str;
Abc.prototype.out_deco_val = out_deco_val;
Abc.prototype.out_ltr = out_ltr;
Abc.prototype.param_set_font = param_set_font;
Abc.prototype.parse = parse;
Abc.prototype.psdeco = empty_function;
Abc.prototype.psxygl = empty_function;
Abc.prototype.set_cur_sy = function(sy) { cur_sy = sy };
Abc.prototype.set_dscale = set_dscale;
Abc.prototype.set_font = set_font;
Abc.prototype.set_hl = set_hl
Abc.prototype.set_scale = set_scale;
Abc.prototype.set_tsfirst = function(s) { tsfirst = s };
Abc.prototype.set_v_param = set_v_param;
Abc.prototype.strwh = strwh;
Abc.prototype.stv_g = function() { return stv_g };
Abc.prototype.svg_flush = svg_flush;
Abc.prototype.syntax = syntax;
Abc.prototype.tunes = tunes
Abc.prototype.unlksym = unlksym;
Abc.prototype.use_font = use_font;
Abc.prototype.vskip = vskip
Abc.prototype.xy_str = xy_str;
Abc.prototype.xygl = xygl;

    var	hook_init		// set after setting the first module hooks

    // export functions and/or set module hooks
    function set_hooks() {
    var	h = abc2svg.modules.hooks,
	gh = abc2svg.modules.g_hooks

	function set_hs(hs) {
		for (var k = 0; k < hs.length; k++)
			hs[k](self)
	} // set_hs()

	if (hook_init) {			// if new modules
		if (h.length) {
			set_hs(h);
			gh.push.apply(gh, h);
			abc2svg.modules.hooks = []
		}
	} else {				// all modules
		if (h.length) {
			gh.push.apply(gh, h);
			abc2svg.modules.hooks = []
		}
		set_hs(gh);
		hook_init = true
	}
    } // set_hooks()
}	// end of Abc()

// compatibility
var Abc = abc2svg.Abc

// nodejs
if (typeof module == 'object' && typeof exports == 'object') {
	exports.abc2svg = abc2svg;
	exports.Abc = Abc
}
