// abc2svg - front.js - ABC parsing front-end
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

    var	sav = {},	// save global (between tunes) definitions
	mac = {},	// macros (m:)
	maci = {}	// first letters of macros

// translation table from the ABC draft version 2.2
var abc_utf = {
	"=D": "Đ",
	"=H": "Ħ",
	"=T": "Ŧ",
	"=d": "đ",
	"=h": "ħ",
	"=t": "ŧ",
	"/O": "Ø",
	"/o": "ø",
//	"/D": "Đ",
//	"/d": "đ",
	"/L": "Ł",
	"/l": "ł",
	"vL": "Ľ",
	"vl": "ľ",
	"vd": "ď",
	".i": "ı",
	"AA": "Å",
	"aa": "å",
	"AE": "Æ",
	"ae": "æ",
	"DH": "Ð",
	"dh": "ð",
//	"ng": "ŋ",
	"OE": "Œ",
	"oe": "œ",
	"ss": "ß",
	"TH": "Þ",
	"th": "þ"
}

// accidentals as octal values (abcm2ps compatibility)
var oct_acc = {
	"1": "\u266f",
	"2": "\u266d",
	"3": "\u266e",
	"4": "&#x1d12a;",
	"5": "&#x1d12b;"
}

// convert the escape sequences to utf-8
function cnv_escape(src) {
	var	c, c2,
		dst = "",
		i, j = 0

	while (1) {
		i = src.indexOf('\\', j)
		if (i < 0)
			break
		dst += src.slice(j, i);
		c = src[++i]
		if (!c)
			return dst + '\\'
		switch (c) {
		case '0':
		case '2':
			if (src[i + 1] != '0')
				break
			c2 = oct_acc[src[i + 2]]
			if (c2) {
				dst += c2;
				j = i + 3
				continue
			}
			break
		case 'u':
			j = Number("0x" + src.slice(i + 1, i + 5));
			if (isNaN(j) || j < 0x20) {
				dst += src[++i] + "\u0306"	// breve accent
				j = i + 1
				continue
			}
			dst += String.fromCharCode(j);
			j = i + 5
			continue
		case 't':			// TAB
			dst += ' ';
			j = i + 1
			continue
		default:
			c2 = abc_utf[src.slice(i, i + 2)]
			if (c2) {
				dst += c2;
				j = i + 2
				continue
			}

			// try unicode combine characters
			c2 = src[i + 1]
			if (!/[A-Za-z]/.test(c2))
				break
			switch (c) {
			case '`':
				dst += c2 + "\u0300"	// grave
				j = i + 2
				continue
			case "'":
				dst += c2 + "\u0301"	// acute
				j = i + 2
				continue
			case '^':
				dst += c2 + "\u0302"	// circumflex
				j = i + 2
				continue
			case '~':
				dst += c2 + "\u0303"	// tilde
				j = i + 2
				continue
			case '=':
				dst += c2 + "\u0304"	// macron
				j = i + 2
				continue
			case '_':
				dst += c2 + "\u0305"	// overline
				j = i + 2
				continue
			case '.':
				dst += c2 + "\u0307"	// dot
				j = i + 2
				continue
			case '"':
				dst += c2 + "\u0308"	// dieresis
				j = i + 2
				continue
			case 'o':
				dst += c2 + "\u030a"	// ring
				j = i + 2
				continue
			case 'H':
				dst += c2 + "\u030b"	// hungarumlaut
				j = i + 2
				continue
			case 'v':
				dst += c2 + "\u030c"	// caron
				j = i + 2
				continue
//			case ',':
//				dst += c2 + "\u0326"	// comma below
//				j = i + 2
//				continue
			case 'c':
				dst += c2 + "\u0327"	// cedilla
				j = i + 2
				continue
			case ';':
				dst += c2 + "\u0328"	// ogonek
				j = i + 2
				continue
			}
			break
		}
		dst += '\\' + c;
		j = i + 1
	}
	return dst + src.slice(j)
}

// ABC include
var include = 0

function do_include(fn) {
	var file, parse_sav

	if (!user.read_file) {
		syntax(1, "No read_file support")
		return
	}
	if (include > 2) {
		syntax(1, "Too many include levels")
		return
	}
	file = user.read_file(fn)
	if (!file) {
		syntax(1, "Cannot read file '$1'", fn)
		return
	}
	include++;
	parse_sav = clone(parse);
	tosvg(fn, file);
	parse_sav.state = parse.state;
	parse = parse_sav;
	include--
}

// parse ABC code
function tosvg(in_fname,		// file name
		file,			// file content
		bol, eof) {		// beginning/end of file
	var	i, c, eol, end,
		select,
		line0, line1,
		last_info, opt, text, a, b, s,
		pscom,
		txt_add = '\n'		// for "+:"

	// check if a tune is selected
	function tune_selected() {
		var	re, res,
			i = file.indexOf('K:', bol)

		if (i < 0) {
//			syntax(1, "No K: in tune")
			return false
		}
		i = file.indexOf('\n', i)
		if (parse.select.test(file.slice(parse.bol, i)))
			return true
		re = /\n\w*\n/;
		re.lastIndex = i;
		res = re.exec(file)
		if (res)
			eol = re.lastIndex
		else
			eol = eof
		return false
	} // tune_selected()

	// remove the comment at end of text
	function uncomment(src, do_escape) {
		if (!src)
			return src
		if (src.indexOf('%') >= 0)
			src = src.replace(/([^\\])%.*/, '$1')
				 .replace(/\\%/g, '%');
		src = src.replace(/\s+$/, '')
		if (do_escape && src.indexOf('\\') >= 0)
			return cnv_escape(src)
		return src
	} // uncomment()

	function end_tune() {
		generate()
		set_page()		// the page layout may have changed
		if (info.W)
			put_words(info.W);
		put_history();
		parse.state = 0		// file header
		blk_flush()		// (force end of block)
		cfmt = sav.cfmt;
		info = sav.info;
		char_tb = sav.char_tb;
		glovar = sav.glovar;
		maps = sav.maps;
		mac = sav.mac;
		maci = sav.maci;
		parse.tune_v_opts = null;
		parse.scores = null;
		init_tune()
		img.chg = true;
		set_page();
	} // end_tune()

	// get %%voice
	function do_voice(select, in_tune) {
	    var	opt, bol
		if (select == "end")
			return		// end of previous %%voice

		// get the options
		if (in_tune) {
			if (!parse.tune_v_opts)
				parse.tune_v_opts = {};
			opt = parse.tune_v_opts
		} else {
			if (!parse.voice_opts)
				parse.voice_opts = {};
			opt = parse.voice_opts
		}
		opt[select] = []
		while (1) {
			bol = ++eol
			if (file[bol] != '%')
				break
			eol = file.indexOf('\n', eol);
			if (file[bol + 1] != line1)
				continue
			bol += 2
			if (eol < 0)
				text = file.slice(bol)
			else
				text = file.slice(bol, eol);
			a = text.match(/\S+/)
			switch (a[0]) {
			default:
				opt[select].push(uncomment(text, true))
				continue
			case "score":
			case "staves":
			case "tune":
			case "voice":
				bol -= 2
				break
			}
			break
		}
		eol = parse.eol = bol - 1
	} // do_voice()

	// apply the options to the current tune
	function tune_filter() {
	    var	o, opts, j, pc, h,
		i = file.indexOf('K:', bol)

		i = file.indexOf('\n', i);
		h = file.slice(parse.bol, i)	// tune header

		for (i in parse.tune_opts) {
			if (!parse.tune_opts.hasOwnProperty(i))
				continue
			if (!(new RegExp(i)).test(h))
				continue
			opts = parse.tune_opts[i]
			for (j = 0; j < opts.t_opts.length; j++) {
				pc = opts.t_opts[j]
				switch (pc.match(/\S+/)[0]) {
				case "score":
				case "staves":
					if (!parse.scores)
						parse.scores = [];
					parse.scores.push(pc)
					break
				default:
					self.do_pscom(pc)
					break
				}
			}
			opts = opts.v_opts
			if (!opts)
				continue
			for (j in opts) {
				if (!opts.hasOwnProperty(j))
					continue
				if (!parse.tune_v_opts)
					parse.tune_v_opts = {};
				if (!parse.tune_v_opts[j])
					parse.tune_v_opts[j] = opts[j]
				else
					parse.tune_v_opts[j] =
						parse.tune_v_opts[j].
								concat(opts[j])
			}
		}
	} // tune_filter()

	// export functions and/or set module hooks
	if (abc2svg.modules
	 && (abc2svg.modules.hooks.length || abc2svg.modules.g_hooks.length))
		set_hooks()

	// initialize
	parse.file = file;		// used for errors
	parse.fname = in_fname

	// scan the file
	if (bol == undefined)
		bol = 0
	if (!eof)
		eof = file.length
	for ( ; bol < eof; bol = parse.eol + 1) {
		eol = file.indexOf('\n', bol)	// get a line
		if (eol < 0 || eol > eof)
			eol = eof;
		parse.eol = eol

		// remove the ending white spaces
		while (1) {
			eol--
			switch (file[eol]) {
			case ' ':
			case '\t':
				continue
			}
			break
		}
		eol++
		if (eol == bol) {		// empty line
			if (parse.state == 1) {
				parse.istart = bol;
				syntax(1, "Empty line in tune header - ignored")
			} else if (parse.state >= 2) {
				end_tune()
				if (parse.select) {	// skip to next tune
					eol = file.indexOf('\nX:', parse.eol)
					if (eol < 0)
						eol = eof
					parse.eol = eol
				}
			}
			continue
		}
		parse.istart = parse.bol = bol;
		parse.iend = eol;
		parse.line.index = 0;

		// check if the line is a pseudo-comment or I:
		line0 = file[bol];
		line1 = file[bol + 1]
		if (line0 == '%') {
			if (parse.prefix.indexOf(line1) < 0)
				continue		// comment

			// change "%%abc xxxx" to "xxxx"
			if (file[bol + 2] == 'a'
			 && file[bol + 3] == 'b'
			 && file[bol + 4] == 'c'
			 && file[bol + 5] == ' ') {
				bol += 6;
				line0 = file[bol];
				line1 = file[bol + 1]
			} else {
				pscom = true
			}
		} else if (line0 == 'I' && line1 == ':') {
			pscom = true
		}

		// pseudo-comments
		if (pscom) {
			pscom = false;
			bol += 2		// skip %%/I:
			text = file.slice(bol, eol)
			a = text.match(/([^\s]+)\s*(.*)/)
			if (!a || a[1][0] == '%')
				continue
			switch (a[1]) {
			case "abcm2ps":
			case "ss-pref":
				parse.prefix = a[2]	// may contain a '%'
				continue
			case "abc-include":
				do_include(uncomment(a[2]))
				continue
			}

			// beginxxx/endxxx
			if (a[1].slice(0, 5) == 'begin') {
				b = a[1].substr(5);
				end = '\n' + line0 + line1 + "end" + b;
				i = file.indexOf(end, eol)
				if (i < 0) {
					syntax(1, "No $1 after %%$2",
							end.slice(1), a[1]);
					parse.eol = eof
					continue
				}
				self.do_begin_end(b, uncomment(a[2]),
					file.slice(eol + 1, i).replace(
						new RegExp('^' + line0 + line1, 'gm'),
										''));
				parse.eol = file.indexOf('\n', i + 6)
				if (parse.eol < 0)
					parse.eol = eof
				continue
			}
			switch (a[1]) {
			case "select":
				if (parse.state != 0) {
					syntax(1, errs.not_in_tune, "%%select")
					continue
				}
				select = uncomment(text.slice(7))
				if (select[0] == '"')
					select = select.slice(1, -1);
				if (!select) {
					delete parse.select
					continue
				}
				select = select.replace(/\(/g, '\\(');
				select = select.replace(/\)/g, '\\)');
//				select = select.replace(/\|/g, '\\|');
				parse.select = new RegExp(select, 'm')
				continue
			case "tune":
				if (parse.state != 0) {
					syntax(1, errs.not_in_tune, "%%tune")
					continue
				}
				select = uncomment(a[2])

				// if void %%tune, free all tune options
				if (!select) {
					parse.tune_opts = {}
					continue
				}
				
				if (select == "end")
					continue	// end of previous %%tune

				if (!parse.tune_opts)
					parse.tune_opts = {};
				parse.tune_opts[select] = opt = {
						t_opts: []
//						v_opts: {}
					};
				while (1) {
					bol = ++eol
					if (file[bol] != '%')
						break
					eol = file.indexOf('\n', eol);
					if (file[bol + 1] != line1)
						continue
					bol += 2
					if (eol < 0)
						text = file.slice(bol)
					else
						text = file.slice(bol, eol);
					a = text.match(/([^\s]+)\s*(.*)/)
					switch (a[1]) {
					case "tune":
						break
					case "voice":
						do_voice(uncomment(a[2],
								true), true)
						continue
					default:
						opt.t_opts.push(
							uncomment(text, true))
						continue
					}
					break
				}
				if (parse.tune_v_opts) {
					opt.v_opts = parse.tune_v_opts;
					parse.tune_v_opts = null
				}
				parse.eol = bol - 1
				continue
			case "voice":
				if (parse.state != 0) {
					syntax(1, errs.not_in_tune, "%%voice")
					continue
				}
				select = uncomment(a[2])

				/* if void %%voice, free all voice options */
				if (!select) {
					parse.voice_opts = null
					continue
				}
				
				do_voice(select)
				continue
			}
			self.do_pscom(uncomment(text, true))
			continue
		}

		// music line (or free text)
		if (line1 != ':' || !/[A-Za-z+]/.test(line0)) {
			last_info = undefined;
			if (parse.state < 2)
				continue
			parse.line.buffer = uncomment(file.slice(bol, eol), true);
			if (parse.line.buffer)
				parse_music_line()
			continue
		}

		// information fields
		bol += 2
		while (1) {
			switch (file[bol]) {
			case ' ':
			case '\t':
				bol++
				continue
			}
			break
		}
		text = uncomment(file.slice(bol, eol), true)
		if (line0 == '+') {
			if (!last_info) {
				syntax(1, "+: without previous info field")
				continue
			}
			txt_add = ' ';		// concatenate
			line0 = last_info
		}

		switch (line0) {
		case 'X':			// start of tune
			if (parse.state != 0) {
				syntax(1, errs.ignored, line0)
				continue
			}
			if (parse.select
			 && !tune_selected()) {	// skip to the next tune
				eol = file.indexOf('\nX:', parse.eol)
				if (eol < 0)
					eol = eof;
				parse.eol = eol
				continue
			}

			sav.cfmt = clone(cfmt);
			sav.info = clone(info, 2)	// (level 2 for info.V[])
			sav.char_tb = clone(char_tb);
			sav.glovar = clone(glovar);
			sav.maps = clone(maps, 1);
			sav.mac = clone(mac);
			sav.maci = clone(maci);
			info.X = text;
			parse.state = 1			// tune header
			if (blkdiv < 1)		// (if no newpage)
				blkdiv = 1	// the tune starts by the next SVG
			if (parse.tune_opts)
				tune_filter()
			continue
		case 'T':
			switch (parse.state) {
			case 0:
				continue
			case 1:
			case 2:
				if (info.T == undefined)	// (keep empty T:)
					info.T = text
				else
					info.T += "\n" + text
				continue
			}
			s = new_block("title");
			s.text = text
			continue
		case 'K':
			switch (parse.state) {
			case 0:
				continue
			case 1:				// tune header
				info.K = text
				break
			}
			do_info(line0, text)
			continue
		case 'W':
			if (parse.state == 0
			 || cfmt.writefields.indexOf(line0) < 0)
				break
			if (info.W == undefined)
				info.W = text
			else
				info.W += txt_add + text
			break

		case 'm':
			if (parse.state >= 2) {
				syntax(1, errs.ignored, line0)
				continue
			}
			a = text.match(/(.*?)[= ]+(.*)/)
			if (!a || !a[2]) {
				syntax(1, errs.bad_val, "m:")
				continue
			}
			mac[a[1]] = a[2];
			maci[a[1][0]] = true	// first letter
			break

		// info fields in tune body only
		case 's':
			if (parse.state != 3
			 || cfmt.writefields.indexOf(line0) < 0)
				break
			get_sym(text, txt_add == ' ')
			break
		case 'w':
			if (parse.state != 3
			 || cfmt.writefields.indexOf(line0) < 0)
				break
			get_lyrics(text, txt_add == ' ')
			if (text.slice(-1) == '\\') {	// old continuation
				txt_add = ' ';
				last_info = line0
				continue
			}
			break
		case '|':			// "|:" starts a music line
			if (parse.state < 2)
				continue
			parse.line.buffer = text
			parse_music_line()
			continue
		default:
			if ("ABCDFGHNOSZ".indexOf(line0) >= 0) {
				if (parse.state >= 2) {
					syntax(1, errs.ignored, line0)
					continue
				}
//				if (cfmt.writefields.indexOf(c) < 0)
//					break
				if (!info[line0])
					info[line0] = text
				else
					info[line0] += txt_add + text
				break
			}

			// info field which may be embedded
			do_info(line0, text)
			continue
		}
		txt_add = '\n';
		last_info = line0
	}
	if (include)
		return
	if (parse.state >= 2)
		end_tune();
	parse.state = 0
}
Abc.prototype.tosvg = tosvg
