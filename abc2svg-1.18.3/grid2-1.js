// abc2svg - ABC to SVG translator
// @source: https://chiselapp.com/user/moinejf/repository/abc2svg
// Copyright (C) 2014-2018 Jean-Francois Moine - LGPL3+
abc2svg.grid2={do_grid:function(){var s,v,p_v,voice_tb=this.get_voice_tb();for(v=0;v<voice_tb.length;v++){p_v=voice_tb[v];if(!p_v.grid2)continue;p_v.clef.invis=true;p_v.key.k_sf=p_v.key.k_a_acc=0;p_v.staffnonote=2;for(s=p_v.sym;s;s=s.next){if(s.dur){s.invis=true;delete s.sl1;s.ti1=0;if(s.tf)s.tf[0]=1}}}},draw_chosym:function(s){var ix,gch;this.set_dscale(s.st);for(ix=0;ix<s.a_gch.length;ix++){gch=s.a_gch[ix];if(gch.type!="g")continue;this.use_font(gch.font);this.set_font(gch.font);this.xy_str(s.x+gch.x,gch.y+6,gch.text)}},draw_gchord:function(of,s,gchy_min,gchy_max){if(s.p_v.grid2)abc2svg.grid2.draw_chosym.call(this,s);else of(s,gchy_min,gchy_max)},output_music:function(of){abc2svg.grid2.do_grid.call(this);of()},set_fmt:function(of,cmd,param,lock){if(cmd=="grid2"){var curvoice=this.get_curvoice();if(curvoice){this.set_v_param("stafflines","...");curvoice.grid2=param}return}of(cmd,param,lock)},set_hooks:function(abc){abc.draw_gchord=abc2svg.grid2.draw_gchord.bind(abc,abc.draw_gchord);abc.output_music=abc2svg.grid2.output_music.bind(abc,abc.output_music);abc.set_format=abc2svg.grid2.set_fmt.bind(abc,abc.set_format)}};abc2svg.modules.hooks.push(abc2svg.grid2.set_hooks);abc2svg.modules.grid2.loaded=true;