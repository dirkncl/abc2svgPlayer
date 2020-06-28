// page.js - module to generate one SVG image per page
//
// Copyright (C) 2018-2020 Jean-Francois Moine - GPL3+
//
// This module is loaded when "%%pageheight" appears in a ABC source.
//
// Parameters
//	%%pageheight <unit>

abc2svg.page = {

    // output a new block
    img_out: function(page, p) {
    var	cur_img_out = user.img_out;

	page.user_out(p)
	
	// if user.img_out has been changed
	if (user.img_out != cur_img_out) {
		page.user_out = user.img_out	// save the new function
		user.img_out = cur_img_out	// and restore ours
	}
    },

    // function called at end of generation
    abc_end: function(of) {
    var page = this.page
	if (page && page.in_page) {
		abc2svg.page.close_page(page)
		if (user.img_out == page.img_out_sav)
			user.img_out = page.user_out
	}
	of()
    }, // abc_end()

    // generate a header or a footer in page.hf and return its height
    gen_hf: function(page, up, font, str) {
    var	a, i, j, k, x, y, y0, s,
	cfmt = page.abc.cfmt(),
	fh = font.size * 1.1,
	pos = [ '">',
		'" text-anchor="middle">',
		'" text-anchor="end">' ]

	// create the text of a header or a footer
	function header_footer(o_font, str) {
	    var	c, i, k, t, n_font,
		c_font = o_font,
		nl = 1,
		j = 0,
		r = ["", "", ""]

		if (str[0] == '"')
			str = str.slice(1, -1)
		if (str.indexOf('\t') < 0)		// if no TAB
			str = '\t' + str		// center

		for (i = 0; i < str.length; i++) {
			c = str[i]
			switch (c) {
			case '>':
				r[j] += "&gt;"
				continue
			case '<':
				r[j] += "&lt;"
				continue
			case '&':
				for (k = i + 1; k < i + 8; k++) {
					if (!str[k] || str[k] == '&'
					 || str[k] == ';')
						break
				}
				r[j] += str[k] == ';' ? "&" : "&amp;"
				continue
			case '\t':
				if (j < 2)
					j++		// next column
				continue
			case '\\':			// hope '\n'
				if (c_font != o_font) {
					r[j] += "</tspan>"
//					c_font = o_font
				}
				for (j = 0; j < 3; j++)
					r[j] += '\n';
				nl++;
				j = 0;
				i++
				continue
			default:
				r[j] += c
				continue
			case '$':
				break
			}
			c = str[++i]
			switch (c) {
			case 'd':
				if (!abc2svg.get_mtime)
					break // cannot know the change time of the file
				t = abc2svg.get_mtime(page.abc.parse.fname)
				// fall thru
			case 'D':
				if (c == 'D')
					t = new Date()
				if (cfmt.dateformat[0] == '"')
					cfmt.dateformat = cfmt.dateformat.slice(1, -1)
				r[j] += strftime(cfmt.dateformat, t)
				break
			case 'F':
				r[j] += page.abc.parse.fname
				break
			case 'I':
				c = str[++i]
			case 'T':
				t = page.abc.info()[c]
				if (t)
					r[j] += t.split('\n', 1)[0]
				break
			case 'P':
			case 'Q':
				t = c == 'P' ? page.pn : page.pna
				switch (str[i + 1]) {
				case '0':
					i++
					if (!(t & 1))
						r[j] += t
					break
				case '1':
					i++
					if (t & 1)
						r[j] += t
					break
				default:
					r[j] += t
					break
				}
				break
			case 'V':
				r[j] += "abc2svg-" + abc2svg.version
				break
			default:
				if (c == '0')
					n_font = o_font
				else if (c >= '1' && c < '9')
					n_font = page.abc.get_font("u" + c)
				else
					break

				// handle the font changes
				if (n_font == c_font)
					break
				if (c_font != o_font)
					r[j] += "</tspan>";
				c_font = n_font
				if (c_font == o_font)
					break
				r[j] += '<tspan class="' +
						font_class(n_font) + '">'
				break
			}
		}
		if (c_font != o_font)
			r[j] += "</tspan>";

		r[4] = nl		// number of lines
		return r
	} // header_footer()

	function font_class(font) {
		if (font.class)
			return 'f' + font.fid + cfmt.fullsvg + ' ' + font.class
		return 'f' + font.fid + cfmt.fullsvg
	}

	// gen_hf

	if (str[0] == '-') {		// not on 1st page
		if (page.pn == 1)
			return 0
		str = str.slice(1)
	}

	a = header_footer(font, str)
	y0 = font.size * .8
	for (i = 0; i < 3; i++) {
		str = a[i]
		if (!str)
			continue
		if (i == 0)
			x = cfmt.leftmargin
		else if (i == 1)
			x = cfmt.pagewidth / 2
		else
			x = cfmt.pagewidth - cfmt.rightmargin
		y = y0
		k = 0
		while (1) {
			j = str.indexOf('\n', k)
			if (j >= 0)
				s = str.slice(k, j)
			else
				s = str.slice(k)
			if (s)
				page.hf += '<text class="' +
						font_class(font) +
						'" x="' + x.toFixed(1) +
						'" y="' + y.toFixed(1) +
						pos[i] +
						s + '</text>\n'
			if (j < 0)
				break
			k = j + 1
			y += fh
		}
	}
	return fh * a[4]
    }, // gen_hf()

    // start a new page
    open_page: function(page,
			ht) {	// spacing under the header
    var	h, l,
//	font_style,
	abc = page.abc,
	cfmt = abc.cfmt(),
	sty = ""

	page.pn++
	page.pna++

	// start a new page
	if (page.first)
		page.first = false
	else
		sty = "page-break-before:always"
	if (page.gutter)
		sty += (sty ? ";" : "") + "margin-left:" +
			((page.pn & 1) ? page.gutter : -page.gutter).toFixed(1) + "px"
	abc2svg.page.img_out(page, sty ?
			'<div style="' + sty + '">' :
			'<div>')
	page.in_page = true

	ht += page.topmargin
	page.hmax = cfmt.pageheight - page.botmargin - ht

	// define the header/footer
	page.hf = ''
	if (page.header) {
		l = abc.get_font_style().length
		h = abc2svg.page.gen_hf(page, true,
					abc.get_font("header"), page.header)
		sty = abc.get_font_style().slice(l)		// new style(s)
		if (cfmt.fullsvg || sty != page.hsty) {
			page.hsty = sty
			sty = '<style>' + sty + '\n</style>\n'
		} else {
			sty = ''
		}
		abc2svg.page.img_out(page,
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	width="' + cfmt.pagewidth.toFixed(0) +
			'px" height="' + (ht + h).toFixed(0) +
			'px">\n' + sty +
			'<g transform="translate(0,' +
				page.topmargin.toFixed(1) + ')">' +
				page.hf + '</g>\n</svg>')
		page.hmax -= h;
		page.hf = ''
	} else {
		abc2svg.page.img_out(page,
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	width="' + cfmt.pagewidth.toFixed(0) +
			'px" height="' + ht.toFixed(0) +
			'px">\n</svg>')
	}
	if (page.footer) {
		l = abc.get_font_style().length
		page.fh = abc2svg.page.gen_hf(page, false,
					abc.get_font("footer"), page.footer)
		sty = abc.get_font_style().slice(l)		// new style(s)
		if (cfmt.fullsvg || sty != page.fsty) {
			page.fsty = sty
			page.ffsty = '<style>' + sty + '\n</style>\n'
		} else {
			page.ffsty = ''
		}
		page.hmax -= page.fh
	}

	page.h = 0
    }, // open_page()

    close_page: function(page) {
    var	h,
	cfmt = page.abc.cfmt()

	page.in_page = false
	if (page.footer) {
		h = page.hmax + page.fh - page.h
		abc2svg.page.img_out(page,
			'<svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
	xmlns:xlink="http://www.w3.org/1999/xlink"\n\
	width="' + cfmt.pagewidth.toFixed(0) +
			'px" height="' + h.toFixed(0) +
			'px">\n' + page.ffsty +
			'<g transform="translate(0,' +
				(h - page.fh).toFixed(1) + ')">' +
			page.hf + '</g>\n</svg>')
	}
	abc2svg.page.img_out(page, '</div>')
	page.h = 0
    }, // close_page()

    // handle the output flow of the abc2svg generator
    img_in: function(p) {
    var h, ht, nh,
	page = this.page

	// copy a block
	function blkcpy(page) {
		while (page.blk.length)
			abc2svg.page.img_out(page, page.blk.shift())
		page.blk = null			// direct output
	} // blkcpy()

	// img_in()
	switch (p.slice(0, 4)) {
	case "<div":				// block of new tune
		if (p.indexOf('newpage') > 0
		 || (page.oneperpage && this.info().X)
		 || !page.h) {			// empty page
			if (page.in_page)
				abc2svg.page.close_page(page)
			abc2svg.page.open_page(page, 0)
		}
		page.blk = []			// in block
		page.hb = page.h		// keep the offset of the start of tune
		break
	case "<svg":				// SVG image
		h = Number(p.match(/height="(\d+)px"/)[1])
		while (h + page.h >= page.hmax) { // if (still) page overflow
			ht = page.blk ? 0 :
				this.cfmt().topspace // tune continuation

			if (page.blk) {
				if (!page.hb) {	// overflow on the first page
					blkcpy(page)
					nh = 0
				} else {
					nh = page.h - page.hb
					page.h = page.hb
				}
			}
			abc2svg.page.close_page(page)
			abc2svg.page.open_page(page, ht)

			if (page.blk) {		// if inside a block
				blkcpy(page)	// output the beginning of the tune
				page.h = nh
			}
			if (h > page.hmax)
				break		// error
		}

		// if no overflow yet, keep the block
		if (page.blk)
			page.blk.push(p)
		else
			abc2svg.page.img_out(page, p)
		page.h += h
		break
	case "</di":				// end of block
		if (page.blk)
			blkcpy(page)
		break
//	default:
////fixme: %%beginml cannot be treated (no information about its height)
//		break
	}
    }, // img_in()

    // handle the page related parameters
    set_fmt: function(of, cmd, parm) {
    var	v,
	cfmt = this.cfmt(),
	page = this.page

	if (cmd == "pageheight") {
		v = this.get_unit(parm)
		if (isNaN(v)) {
			this.syntax(1, this.errs.bad_val, '%%' + cmd)
			return
		}
		cfmt.pageheight = v

		// if first definition, install the hook
		if (!page && user.img_out && abc2svg.abc_end) {
			this.page = page = {
				abc: this,
				topmargin: 38,	// 1cm
				botmargin: 38,	// 1cm
//				gutter: 0,
				h: 0,		// current page height
				pn: 0,		// page number
				pna: 0,		// absolute page number
				first: true,	// no skip to next page
				user_out: user.img_out
			}

			// don't let the backend handle the header/footer
			if (cfmt.header) {
				page.header = cfmt.header;
				cfmt.header = null
			}
			if (cfmt.footer) {
				page.footer = cfmt.footer;
				cfmt.footer = null
			}

			// get the previously defined page parameters
			if (cfmt.botmargin) {
				v = this.get_unit(cfmt.botmargin)
				if (!isNaN(v))
					page.botmargin = v
			}
			if (cfmt.topmargin) {
				v = this.get_unit(cfmt.topmargin)
				if (!isNaN(v))
					page.topmargin = v
			}
			if (cfmt.gutter) {
				v = this.get_unit(cfmt.gutter)
				if (!isNaN(v))
					page.gutter = v
			}
			if (cfmt.oneperpage)
				page.oneperpage = this.get_bool(cfmt.oneperpage)
			if (!cfmt.dateformat)
				cfmt.dateformat = "%b %e, %Y %H:%M"

			// set the hooks
			user.img_out = abc2svg.page.img_in.bind(this);
			page.img_out_sav = user.img_out;
			abc2svg.abc_end = abc2svg.page.abc_end.bind(this,
								abc2svg.abc_end)
		}
		return
	}
	if (page) {
		switch (cmd) {
		case "header":
		case "footer":
			page[cmd] = parm
			return
		case "newpage":
			if (!parm)
				break
			v = Number(parm)
			if (isNaN(v)) {
				this.syntax(1, this.errs.bad_val, '%%' + cmd)
				return
			}
			page.pn = v - 1
			return
		case "gutter":
		case "botmargin":
		case "topmargin":
			v = this.get_unit(parm)
			if (isNaN(v)) {
				this.syntax(1, this.errs.bad_val, '%%' + cmd)
				return
			}
			page[cmd] = v
			return
		case "oneperpage":
			page[cmd] = this.get_bool(parm)
			return
		}
	}
	of(cmd, parm)
    }, // set_fmt()

    set_hooks: function(abc) {
	abc.set_format = abc2svg.page.set_fmt.bind(abc, abc.set_format)
    }
} // page

abc2svg.modules.hooks.push(abc2svg.page.set_hooks);

// the module is loaded
abc2svg.modules.pageheight.loaded = true
