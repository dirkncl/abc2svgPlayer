// abc2svg - ABC to SVG translator
// @source: https://chiselapp.com/user/moinejf/repository/abc2svg
// Copyright (C) 2014-2018 Jean-Francois Moine - LGPL3+
abc2svg.temper={set_bar_num:function(of){of();if(this.cfmt().temper){var v0=this.get_voice_tb()[0];v0.temper=new Float32Array(12);for(var i=0;i<12;i++)v0.temper[i]=this.cfmt().temper[i]/100}},set_fmt:function(of,cmd,param,lock){if(cmd=="temperament"){var ls=new Float32Array(param.split(/ +/)),i=ls.length;if(i==12){while(--i>=0){if(isNaN(parseInt(ls[i])))break}if(i<0){this.cfmt().temper=ls;return}}this.syntax(1,errs.bad_val,"%%temperament");return}of(cmd,param,lock)}};abc2svg.modules.hooks.push("syntax",["set_bar_num","abc2svg.temper.set_bar_num"],["set_format","abc2svg.temper.set_fmt"]);abc2svg.modules.temperament.loaded=true;
