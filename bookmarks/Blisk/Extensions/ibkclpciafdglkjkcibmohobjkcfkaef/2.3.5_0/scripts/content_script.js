var isDebug = false;
var sections = {};

var warnings = 0;
var traverse_out = [];
var traverse_minlevel = null;

if (!isDebug) console.log = function(){}
console.log("debug is active");

function show_section( title, id, content ){
	// remove content whaen all *_tout is removed
	var out = "";
	if ( content != "" ) {
		out += "<div class='container' data-section='" + id + "'><div class='ad_seo_title' data-toggle='" + id + "'>" + title;
		if ( sections[id] !== undefined ) {
			// || sections[id].isContainer
			if ( sections[id].count > 1 ) out += " <span class='itemsCount' title='" + sections[id].count + " items inside'>(" + sections[id].count + " sections)</span>";
			if ( sections[id].warnings > 0 ) out += " <span class='badge badge-warning'>" + sections[id].warnings + "</span>";
			if ( sections[id].info > 0 ) out += " <span class='badge badge-info'>" + sections[id].info + "</span>";
		}
		out += "</div>";
		out += content;
		out += "</div>";
	}
	return out;
}

function updateNofollow(act) {
	var list = $$("a[rel~=nofollow]");

	if ( act == "show" ) {
		for(i = 0; i < list.length; i++) {
			list[i].classList.add("MSI_ext_nofollow");
		}
	} else {
		for(i = 0; i < list.length; i++) {
			list[i].classList.remove("MSI_ext_nofollow");
		}
	}
}

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {

	if ( request.mex.action == "nofollow" ) {
		updateNofollow( request.mex.value ? "show" : "hide" );
		sendResponse({
			farewell: "nofollow sent ok"
		});
	}

	if ( request.mex.action == "pageInfo" ) {

		sections = {
			"common": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},
			"opengraph": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": ""
			},
			"twitter": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": ""
			},
			"headers": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},
			"script": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},
			"videos": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": ""
			},
			"html": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},
			"security": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},			
			"geo": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},						
			"social": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": "",
				"isContainer": true
			},
			"largeimages": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": ""
			},
			"images": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": ""
			},
			"media": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": "",
				"isContainer": true
			},
			"markup": {
				"warnings": 0,
				"info": 0,
				"count": 0,
				"out": "",
				"isContainer": true
			},
			"html5report": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},
			"mobile": {
				"warnings": 0,
				"info": 0,
				"out": ""
			},
		}

		var out = "";
		var jout = {};
		var tout;
		var dotName;

		warnings = 0;

		var i;
		var tip_media_cnt = 0;

		var keys = 0;
		var desclen = 0;
		var headtitle;
		var tout_applink = "";
		// var tout_geo = "";
		var tout_verification = "";
		var tout_cms = "";
		// var tout_mobile = "";
		// var tout_security = "";
		var tout_presentation = "";
		var tout_other = "";



		//////////////
		// LINK

			tout_links = tout_rhints = "";
			var list = $$("link");

			for(i = 0; i < list.length; i++) {
				var rel = list[i].rel.toLowerCase();
				if ( rel != "" ) {
					if ( rel != "stylesheet" && rel != "alternate stylesheet" ) {	// && rel != "shortcut icon" && rel != "icon" && rel != "archives"
						var title = list[i].title;
						var href = list[i].href;

						tmp = "<span class='attr_name'>" + rel + "</span> : ";
						if ( href.substr(0,4) == "http" ) {
							tmp += "<a href='" + href + "' target='_blank' class='cont_link'><span>";
							if( href.match(/^.+\.(jpe?g|bmp|png|gif)$/i) ) tmp += "<img src='" + href + "'>";
							tmp += href + "</span></a>";
						} else {
							tmp += href;
						}
						if ( title != "" ) tmp += " (" + title + ")";

						// console.log("rel",rel);
						if ( rel == "dns-prefetch" || rel == "preload" || rel == "preconnect" || rel == "prefetch" || rel == "preconnect dns-prefetch" || rel == "dns-prefetch preconnect" ) {
							tout_rhints += wrap(tmp,"oneline");
						} else if ( rel == "wlwmanifest" || rel == "edituri" ) {
							tout_cms += wrap(tmp,"oneline");
						} else if ( rel == "canonical" ) {
							sections.common.out += wrap("&lt;link&gt; "+tmp,"oneline");
						} else if ( ["apple-touch-icon-precomposed","icon","apple-touch-icon","shortcut icon","apple-touch-startup-image","mask-icon"].indexOf(rel) !=-1 ) {
							tout_presentation += wrap("&lt;link&gt; "+tmp,"oneline");
						} else {
							tout_links += wrap(tmp,"oneline");
						}

					}
				}
			};





	// COMMON

		if ( $$("title").length > 0 ) {
			headtitle = $("title").innerText;
			sections.common.out += "<div class='ad_seo_item'><span class='attr_name'>{{headtitle}}</span>";
			sections.common.out += " : " + headtitle;
			sections.common.out += " <span class='item_count'>(" + headtitle.length + " {{characters}})</span>";
			sections.common.out += "</div>";
			if ( headtitle.length > 65 ) {
				sections.common.out = show_warning("{{titletoolong}}") + sections.common.out;
				sections.common.warnings ++;
			}
			if ( $$("head title").length == 0 ) {
				sections.common.out = show_warning("{{titlenotinhead}}") + sections.common.out;
				sections.common.warnings ++;
			}
		} else {
			sections.common.out = show_warning("{{missingheadtitle}}") + sections.common.out;
			sections.common.warnings ++;
		}

		var list = $$("meta");

		var og_title=0,og_type=0,og_url=0,og_image=0,og_description=0,og_appid=0;

		for(i = 0; i < list.length; i++) {

			tout = "";

			var content,name,contentIndex,nameIndex;

			// content of name attribute
			dotName = list[i].getAttribute("name");

			// find name

			if ( list[i].attributes.length > 0 ) {
				if ( list[i].attributes[0].nodeName == "content" )  {
					contentIndex = 0;
					nameIndex = 1;
				} else {
					contentIndex = 1;
					nameIndex = 0;
				}
			} else {
				console.log("empty <meta>", list[i].attributes.length , list[i].attributes);
			}

			if ( list[i].attributes[nameIndex] != undefined ) {
				name = list[i].attributes[nameIndex].nodeName;
			} else {
				name = "---";
			}

			content = list[i].getAttribute("content");
			if ( content != null ) {
				contentNull = false;
				content = content.replace(/</g,"&lt;").replace(/>/g,"&gt;");
			} else {
				contentNull = true;
				content = "";
			}

			content = escapeHtml(content).trim();

			///////

			if ( dotName != null ) {
				dotName = dotName.toLowerCase();
				tout += "<a href='http://www.omiod.com/chrome-extensions/meta-seo-inspector/info.php?meta=" + dotName + "&utm_source=MSI_app&utm_medium=info_link&utm_term=" + dotName + "' title='more about "+dotName+"' class='attr_link'><span>" + dotName + "</span></a>";
				tout += " : " + content;

				if ( contentNull ) {
					tout += show_inline_warning("{{notdefined}}");
					if ( list[i].getAttribute("value") != null ) tout += ", {{invalidvalue}}";
				} else {
					if ( content == "" ) {
						tout += show_inline_warning("{{empty}}");
					}
				}

				if ( dotName == "description" && !contentNull ) {
					desclen = content.length;
					if ( desclen > 0 ) tout += " <span class='item_count'>(" + desclen + " {{characters}})</span>";
				}

				if ( dotName == "keywords" ) {
					if ( content.length > 0 ) {
						keys = content.split(',');
						tout += " <span class='item_count'>( " + keys.length + "&nbsp;{{items}} )</span>";
					} else {
						keys = "";
						tout += " <span class='item_count'>({{empty}})</span>";
					}
				}

				if ( dotName == "geo.position" || dotName == "geo.placename" || dotName == "icbm" ) {
					tout += " <a href='https://maps.google.com/maps?q=" + content.replace(/;/g,",") + "' class='cont_link'><img src='http://www.google.com/s2/favicons?domain=maps.google.com'></a>";
				}

			} else if ( name == "property" ) {

				dotName = list[i].attributes[nameIndex].textContent.toLowerCase();
				tout += "<a href='http://www.omiod.com/chrome-extensions/meta-seo-inspector/info.php?meta=" + dotName + "&cont=" + content + "' title='more about "+dotName+"' target='_blank' class='attr_link'><span>" + dotName + "</span></a>";
				tout += " : ";

				if ( content != "" ) {
					if ( content.substr(0,4) == "http" ) {
						if( content.match(/^.+\.(jpe?g|bmp|png|gif)$/i) ) {
							tout += "<img src='" + content + "' id='media_" + tip_media_cnt + "'>";
							
						}
						tout += "<a href='" + content + "' target='_blank' class='cont_link mediatip' data-tipped-options=\"inline: 'media_" + tip_media_cnt + "'\" ><span>";
						tout += content + "</span></a>";
						tip_media_cnt ++;
					} else {
						tout += content;
					}

				} else {
					tout += "<span class='ad_seo_details'>" + show_inline_warning("{{empty}}") + "</span>";//zzz
				}

			}


			if ( dotName != null ) {

				if ( dotName.substring(0,3) == "og:" ) {
					sections.opengraph.out += wrap(tout);	//zzzz
					if ( dotName == "og:title" ) og_title=1;
					if ( dotName == "og:type" ) og_type=1;
					if ( dotName == "og:url" ) og_url=1;
					if ( dotName == "og:image" ) og_image=1;
					if ( dotName == "og:description" ) og_description=1;
				} else if ( dotName.substring(0,3) == "fb:" ) {
					sections.opengraph.out += wrap(tout);
					if ( dotName == "fb:app_id" ) og_appid=1;
				} else if ( dotName.substring(0,8) == "article:" || dotName.substring(0,6) == "video:" || dotName.substring(0,6) == "music:" ) {
					sections.opengraph.out += wrap(tout);					
				} else if ( dotName.substring(0,8) == "twitter:" ) {
					sections.twitter.out += wrap(tout);
				} else if ( dotName.substring(0,3) == "al:" ) {
					tout_applink += wrap(tout);
				} else if ( ["verify-v1","google-site-verification","360-site-verification","majestic-site-verification","sogou_site_verification","y_key","msvalidate.01","alexaverifyid","wot-verification","baidu-site-verification","yandex-verification","ahrefs-site-verification","p:domain_verify","bitly-verification","botify-site-verification"].indexOf(dotName) !=-1 ) {
					tout_verification += wrap(tout);
				} else if ( dotName.substring(0,4) == "geo." || dotName == "icbm" ) {
					sections.geo.out += wrap(tout);
				} else if ( ["theme-color","format-detection","apple-mobile-web-app-status-bar-style","charset","mssmarttagspreventparsing"].indexOf(dotName) !=-1 || dotName.substring(0,14) == "msapplication-" ) {
					tout_presentation += wrap(tout,"oneline");
				} else if ( ["keywords","description","robots","googlebot"].indexOf(dotName) !=-1 ) {
					sections.common.out += wrap(tout);
				} else if ( ["generator","environment"].indexOf(dotName) !=-1 || dotName.substring(0,7) == "shopify" ) {
					tout_cms += wrap(tout);
				} else if ( ["csrf-param","csrf-token","csp-nonce"].indexOf(dotName) !=-1 ) {
					sections.security.out += wrap(tout);
				} else if ( ["viewport","handheldfriendly","mobileoptimized","apple-mobile-web-app-capable","apple-mobile-web-app-title","apple-mobile-web-app-capable","mobile-web-app-capable"].indexOf(dotName) !=-1 ) {
					sections.mobile.out += wrap(tout);
					if ( dotName == "viewport" ) {
						var viewportData = getViewport(content);
						if ( Object.keys(viewportData.invalidValues).length !== 0 ) {
							sections.mobile.out = show_warning("invalid values: " + obj2csv(viewportData.invalidValues) ) + sections.mobile.out;
							sections.mobile.warnings ++;
						}
						if ( Object.keys(viewportData.unknownProperties).length !== 0 ) {
							sections.mobile.out = show_info("unknown properties: " + obj2csv(viewportData.unknownProperties) ) + sections.mobile.out;
							sections.mobile.info ++;
						}
						if ( Object.keys(viewportData.outcome).length !== 0 ) {
							// sections.mobile.out = show_warning( viewportData.outcome.join(", ") ) + sections.mobile.out;
							for ( var outcomes = 0; outcomes<viewportData.outcome.length; outcomes++ ) {
								sections.mobile.out = show_warning( viewportData.outcome[outcomes]) + sections.mobile.out;
								sections.mobile.warnings ++;
							}
							
						}  						
					}
				} else {
					tout_other += wrap(tout);
				}
			}

		}

		if ( desclen <= 50 && desclen > 0 ) {
			sections.common.out = show_info("{{descriptiontooshort}}") + sections.common.out;
			sections.common.info ++;
		}
		if ( desclen == 0 ) {
			sections.common.out = show_warning("{{missingdescription}}") + sections.common.out;
			sections.common.warnings ++;
		}
		if ( desclen > 170 ) {
			sections.common.out = show_warning("{{descriptiontoolong}}","in 2019 Google SERP descriptions are between 150 and 170 characters") + sections.common.out;
			sections.common.warnings ++;
		}
		if ( keys != 0 ) {
			sections.common.out = show_info("{{keywordsuseless}}") + sections.common.out;
			sections.common.info ++;
		}

		out += show_section( "{{section_common}}", "common", sections.common.out );


		// recap OPENGRAPH
		if (sections.opengraph.out != "") {
			if (og_title + og_type + og_url + og_image + og_description < 5) {
				tmp = "";
				if (og_title == 0) tmp += " og:title ";
				if (og_type == 0) tmp += " og:type ";
				if (og_url == 0) tmp += " og:url ";
				if (og_image == 0) tmp += " og:image ";
				if (og_description == 0) tmp += " og:description ";
				tmp += " {{missing}}";
				tmp = show_warning(tmp,"these elements could be needed for a proper preview in social sharing");
				sections.opengraph.warnings ++;
				sections.opengraph.out = tmp + sections.opengraph.out;
			}
			sections.opengraph.count = 1;
		}

		// recap TWITTER
		if (sections.twitter.out != "") {
			sections.twitter.count = 1;
		}

		// SOCIAL
		var social_out = "";
		social_out += show_section( "OPENGRAPH", "opengraph", sections.opengraph.out );
		social_out += show_section( "TWITTER", "twitter", sections.twitter.out );
		sections.social.info = sections.twitter.info + sections.opengraph.info;
		sections.social.warnings = sections.twitter.warnings + sections.opengraph.warnings;
		sections.social.count = sections.twitter.count + sections.opengraph.count;
		out += show_section( "SOCIAL", "social", social_out );

		out += show_section( "APP LINK", "applink", tout_applink );

// SCHEMA GLOBAL

	var schema_out = "";

	// JSON/LD

	tout = "";
	jtout = [];
	var ll = new Array();
	var list = $$('script[type="application/ld+json"]');
	console.log(list, list.length);
	for(i = 0; i < list.length; i++) {
		tout += "<div class='ad_seo_item'>";
		var jtmp;
		try {
			var rawjson = list[i].innerHTML.replace(/(\r\n|\n|\r)/gm, "");
			jtmp = JSON.parse(rawjson);
			console.log("jtmp",jtmp);
			var jldnodes = traverse(jtmp);
			console.log("jldnodes",jldnodes, jldnodes.length);
			for (var nds = 0; nds < jldnodes.length; nds++) {
				if ( jldnodes[nds].level == 0 ) {
					tout += "<span class='item'>@type</span>: " + jldnodes[nds].type + " ";
					if ( jldnodes[nds].name != undefined ) tout += "<span class='item'>name</span>: " + jldnodes[nds].name + " ";
					if ( jldnodes[nds].id != undefined ) tout += "<span class='item'>id</span>: " + jldnodes[nds].id + " ";
					tout += "<br>";
					jtout.push({'type':jldnodes[nds].type, 'name':jldnodes[nds].name});
				}
			}
		} catch(e) {
			tout += "found, but couldn't get @type<br>";
			jtout.push({'type':'unknown'});
		}

		tout += "</div>";
	}

	

	if ( tout != "" ) {
		schema_out += "<div class='container' data-section='structureddata-jsonld'>";
		schema_out += "<div class='ad_seo_title' data-toggle='structureddata-jsonld'>JSON-LD";
		schema_out += "<span class='tip' title=\"<a href='https://search.google.com/structured-data/testing-tool#url=" + window.location.href + "' target='_blank'>test in Google Structured Data Testing tool</a>\">TIP</span>";
		schema_out += "</div>";
		schema_out += tout;
		schema_out += "</div>";
	}
	jout.jsonld = jtout;

	// RDFA / MICRODATA

	tout = "";
	var ll = new Array();
	var list = $$("[itemprop],[itemprop-reverse]");
	for(i = 0; i < list.length; i++) {

		var prop_name;
		for(attrs = 0; attrs < list[i].attributes.length; attrs++) {
			prop_name = list[i].attributes[attrs].name;
			if ( prop_name == "itemprop" || prop_name == "itemtype" || prop_name == "itemprop-reverse") {
				prop_name += ":"+list[i].attributes[attrs].value;
				if ( ll[ prop_name ] == undefined ) ll[ prop_name ] = 0;
				ll[ prop_name ] = ll[ prop_name ]+1;
			}
		}
	}
	for (i in ll) {
		tout += "<span class='item'>" + i + "</span>&nbsp;<span class='item_count'>(" + ll[i] + ")</span> ";
	}
	
	if ( tout != "" ) {
		schema_out += "<div class='container' data-section='structureddata-rdfa'>";
		schema_out += "<div class='ad_seo_title' data-toggle='structureddata-rdfa'>RDFA / MICRODATA</div>" + tout;
		schema_out += "</div>";
	}

	// MICROFORMATS

		mf_hreview = $$(".hreview").length;
		mf_hcard = $$(".fn").length;
		mf_hcalendar = $$(".dtstart").length;
		mf_hcalendar += $$(".vcalendar").length;
		mf_vcard_o = $$(".vcard");
		mf_vcard = mf_vcard_o.length;
		mf_vevent = $$(".vevent").length;
		mf_xfolkentry = $$(".xfolkentry").length;
		mf_tot = mf_hreview+mf_hcard+mf_hcalendar+mf_vcard+mf_vevent+mf_xfolkentry;

		tout = "";
		if ( mf_tot > 0 ) {
			tout += "<div class='ad_seo_item'>";
			if ( mf_hreview > 0 )		tout += "<span class='item'>hReview</span> <span class='item_count'>(" + mf_hreview + ")</span> ";
			if ( mf_hcard > 0 )			tout += "<span class='item'>hCard(fn)</span> <span class='item_count'>(" + mf_hcard + ")</span> ";
			if ( mf_hcalendar > 0 )		tout += "<span class='item'>hCalandar</span> <span class='item_count'>(" + mf_hcalendar + ")</span> ";
			if ( mf_vcard > 0 )			{
				tout += "<span class='item'>vCard</span> <span class='item_count'>(" + mf_vcard + ")</span> ";
			}
			if ( mf_vevent > 0 )		tout += "<span class='item'>vEvent</span> <span class='item_count'>(" + mf_vevent + ")</span> ";
			if ( mf_xfolkentry > 0 )	tout += "<span class='item'>xFolk</span> <span class='item_count'>(" + mf_xfolkentry + ")</span> ";
			tout += "</div>";
		}
		if ( tout != "" ) {
			schema_out += "<div class='container' data-section='structureddata-micro'>";
			schema_out += "<div class='ad_seo_title' data-toggle='structureddata-micro'>MICROFORMAT</div>" + tout;
			schema_out += "</div>";
		}

	// RDFa

		rdf_review = $$("[typeof~='v:review'],[typeof~='v:Review']").length;
		rdf_summary = $$("[property~='v:summary'],[property~='v:Summary']").length;
		rdf_itemrev = $$("[property~='v:itemreviewed'],[property~='v:Itemreviewed']").length;
		rdf_tot = rdf_review+rdf_summary+rdf_itemrev;

		tout = "";
		if ( rdf_tot > 0 ) {
			tout += "<div class='ad_seo_item'>";
			if ( rdf_review > 0 )		tout += "<span class='item'>review</span> <span class='item_count'>(" + rdf_review + ")</span> ";
			if ( rdf_summary > 0 )		tout += "<span class='item'>summary</span> <span class='item_count'>(" + rdf_summary + ")</span> ";
			if ( rdf_itemrev > 0 )		tout += "<span class='item'>item reviewed</span> <span class='item_count'>(" + rdf_itemrev + ")</span> ";
			tout += "</div>";
		}
		if ( tout != "" ) {
			schema_out += "<div class='container' data-section='structureddata-rdfa2'>";
			schema_out += "<div class='ad_seo_title' data-toggle='structureddata-rdfa2'>RDFa</div>" + tout;
			schema_out += "</div>";
		}

// CLOSE SCHEMA.ORG

	// STRUCTURED
		out += show_section( "{{section_structureddata}}", "structureddata", schema_out );

	// SECURITY
		out += show_section( "SECURITY", "security", sections.security.out );

	// GEO
		// if ( tout_geo != "" ) out += "<div class='ad_seo_title'>GEO</div>" + tout_geo;
		out += show_section( "GEO", "geo", sections.geo.out );

	// MOBILE
		out += show_section( "MOBILE", "mobile", sections.mobile.out );

	// CMS
		out += show_section( "CMS", "cms", tout_cms );

	// A REL

		var ll = new Array();
		tout = "";
		var list = $$("a[rel]");
		for(i = 0; i < list.length; i++) {
			var rel = list[i].rel;
			if ( ll[ rel ] == undefined ) ll[ rel ] = 0;
			ll[ rel ] = ll[ rel ]+1;
		}
		for (i in ll) {
			tout += "<div class='ad_seo_item'><span class='item'>" + i + "</span>&nbsp;<span class='item_count'>(" + ll[i] + ")</span></div>";
		}

		// if ( tout != "" ) out += "<div class='ad_seo_title'>A REL / XFN</div><div class='ad_seo_item'>" + tout + "</div>";
		out += show_section( "A REL / XFN", "arelxfn", tout );

	// A REV (to check)

		var ll = new Array();
		tout = "";
		var list = $$("a[rev]");
		for(i = 0; i < list.length; i++) {
			var rev = list[i].rev;
			if ( ll[ rev ] == undefined ) ll[ rev ] = 0;
			ll[ rev ] = ll[ rev ]+1;
		}
		for (i in ll) {
			tout += "<span class='item'>" + i + "</span>&nbsp;<span class='item_count'>(" + ll[i] + ")</span> ";
		}

		// if ( tout != "" ) out += "<div class='ad_seo_title'>A REV</div><div class='ad_seo_item'>" + tout + "</div>";
		out += show_section( "A REV", "arev", tout );


	// COMMONTAG (to check)

		commontag = $$("a[typeof='ctag:Tag']").length;
		tout = "";
		if ( commontag > 0 )	tout += "<span class='item'>ctag:Tag</span>&nbsp;<span class='item_count'>(" + commontag + ")</span> ";
		if ( tout != "" )		out += "<div class='ad_seo_title'>{{section_commontags}}</div><div class='item_count'>" + tout + "</div>";

	// VERIFICATION
	out += show_section( "{{section_siteverification}}", "verification", tout_verification );

	// OTHER

	out += show_section( "{{section_othermetadata}}", "othermetadata", tout_other );

	// LINKS
	out += show_section( "LINK TAGS", "links", tout_links );

	// RESOURCE HINTS
		out += show_section( "{{section_resourcehints}}", "rhints", tout_rhints );

	// PRESENTATION
		out += show_section( "{{section_presentation}}", "presentation", tout_presentation );

	// EXTERNAL SCRIPTS

		var ll = new Array();
		var lld = new Array();
		var list = $$("script[src^=http]");

		for(i = 0; i < list.length; i++) {
			if ( list[i].src != undefined ) {

				var src = list[i].src.toLowerCase();
				var srcd = src.split('/')[2];

				if ( ll[ srcd ] == undefined ) ll[ srcd ] = 0;
				ll[ srcd ] = ll[ srcd ]+1;
				if ( lld[ srcd ] == undefined ) lld[ srcd ] = "";
				lld[ srcd ] = lld[ srcd ]+src+"<br/>";

			}
		}

		for (i in ll) {
			sections.script.out += "<div class='ad_seo_item'><img src='http://www.google.com/s2/favicons?domain=" + i + "'>" + i + " ";
			if ( ll[i]>1 ) sections.script.out += "<span class='item_count'>(" + ll[i] + ")</span>";
			sections.script.out += "<span class='extra'>" + lld[i] + "</span>";
			sections.script.out += "</div>";
		}

		out += show_section( "SCRIPT", "script", sections.script.out );

	// HEADERS ////////////////////////////////

		// tout = "";
		// wout = "";

		var html_h1 = $$("h1").length;

		var html_h1 = $$("h1").length;
		if ( html_h1 > 0 ) {
			if ( html_h1 > 1 ) {
				sections.headers.out += show_warning("{{toomanyh1}}<span class='item_count'>(" + html_h1 + " {{items}})</span>","The H1 tag should describe the topic of the page.<br>More than one could dilute the SEO efforts on one keyword phrase or sentence");
				sections.headers.warnings ++;
			} else {
				// 1 H1
				var h1_len = $$("h1")[0].innerText.length;
				if ( h1_len < 20 || h1_len > 70 ) {
					sections.headers.out += show_warning("H1 should be 20-70 characters<span class='item_count'>(" + h1_len + " {{characters}})</span>","If it’s too short, you’re wasting valuable space, but if it’s too long, you’re diluting the power of the tags");	// https://neilpatel.com/blog/h1-tag/
					sections.headers.warnings ++;
				}
			}
		} else {
			sections.headers.out += show_warning("{{missingh1tag}}","This makes the document structure not clearly defined and could become a SEO-related issue");
			sections.headers.warnings ++;
		}

		var html_headers = $$("h1,h2,h3,h4,h5,h6");
		var level = null;
		var hskip = false;
		for(i = 0; i < html_headers.length; i++) {
			var new_level = parseInt(html_headers[i].tagName.substr(-1),10);
			if ( level != null ) {
				hskip = ( new_level - level > 1 );
			}
			sections.headers.out += "<div class='ad_seo_item'><div class='str_" + html_headers[i].tagName + "'><span class='attr_name" + ( hskip ? " hskip" : "" ) + "'>" + html_headers[i].tagName.toLowerCase() + "</span> " + html_headers[i].innerText + " <span class='item_count'>(" + html_headers[i].innerText.trim().length + " characters)</span>";
			if ( html_headers[i].innerText.trim().length == 0 ) {
				sections.headers.out += " " + show_inline_info("{{empty}}");
				sections.headers.info ++;
			}  
			if ( level == null && new_level > 1 ) {
				sections.headers.out += " " + show_inline_info("first header tag should be h1");
				sections.headers.info ++;
			}
			if (hskip) {
				sections.headers.out += " " + show_inline_info("found h" + new_level + ", h" + (level+1) + " expected");
				sections.headers.info ++;
			}
			sections.headers.out += "</div></div>" ;
			
			level = new_level;
		}
		if ( sections.headers.out != "" ) sections.headers.count = 1;

		// if ( tout != "" || wout != "" ) {
		// 	out += "<div class='ad_seo_title'>HEADERS</div>" + wout + tout;
		// }

		// out += show_section( "HEADERS", "headers", sections.headers.out );


	// HTML ////////////////////////////////////////////

		wout = "";
		sections.html.out += "<div class='ad_seo_item'>";

		var html_html = $$("html").length;
		if ( html_html > 0 ) {
			sections.html.out += show_item("&lt;html&gt;", html_html, false);
		} else {
			wout += show_warning("missinghtmltag");
			sections.html.warnings ++;
		}

		// var html_h1 = $$("h1").length;
		// if ( html_h1 > 0 ) {
		// 	sections.html.out += show_item("&lt;h1&gt;",html_h1, html_h1 > 1);
		// }

		var html_img = $$("img").length;
		if ( html_img > 0 ) {
			sections.html.out += "<span class='item'>&lt;img&gt;</span> <span class='item_count'>(" + html_img + ")</span> ";
			// var html_imgnoalt = $$('img:not([alt])').length;
			// if ( html_imgnoalt > 0 ) {
			// 	wout += show_warning(html_imgnoalt + " {{missingaltp1}} " + html_img + ") {{missingaltp2}}", "ALT text strengthens the message of your content with search engine spiders and improves the accessibility of your website");
			// 	sections.html.warnings ++;
			// }
		}

		var html_iframe = $$("iframe").length;
		if ( html_iframe > 0 ) sections.html.out += "<span class='item'>&lt;iframe&gt;</span> <span class='item_count'>(" + html_iframe + ")</span> ";

		var html_canvas = $$("canvas").length;
		if ( html_canvas > 0 ) sections.html.out += "<span class='item'>&lt;canvas&gt;</span> <span class='item_count'>(" + html_canvas + ")</span> ";

		sections.html.out += "</div>";
		sections.html.out = wout + sections.html.out;
		sections.html.count = 1;

	
	// VIDEO EMBED ////////////////////////////////////////

		
		var html_video = $$("video");
		if ( html_video.length > 0 ) {
			tout = "";	
			for(i = 0; i < html_video.length; i++) {
				var src = html_video[i].src;
				if ( src )  {
					tout += "embed <a class='item' href='" + src + "'>" + url2domain(src).url + "</a>" + ( url2domain(src).protocol == "blob:" ? " ({{streaming}})" : "" ) + "<br>";
				} else {
					// console.log("no SRC");
					var sources = html_video[i].children;
					for (var s = 0; s < html_video[i].children.length; s++) {
						if ( html_video[i].children[s].src ) {
							src = html_video[i].children[s].src;
							tout += "embed <a class='item' href='" + src + "'>" + url2domain(src).url + "</a>" + ( url2domain(src).protocol == "blob:" ? " ({{streaming}})" : "" ) + "<br>";
						}
					}
				}
			}
			if ( tout != "" ) {
				sections.videos.out += "<div class='ad_seo_item'>" + tout + "</div>"
				sections.videos.count ++;
			};
		} else {
			// no video tag
		}

		// VIDEO LINK /////////////////////////////////////////////

		var extensions = ["mp3", "webm"];
		var html_video = $$("a");
		if ( html_video.length > 0 ) {
			tout = "";
			for(i = 0; i < html_video.length; i++) {
				var href = html_video[i].href;
				if (href.baseVal != null) href = href.baseVal;	// is SVGAnimatedString
				var ext = href.slice((href.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();	// https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
				if ( extensions.includes(ext) ) {
					tout += "link <a class='item' href='" + href + "'>" + url2domain(href).url + "</a><br>";
					sections.videos.count ++;
				}
			}
			if ( tout != "" ) sections.videos.out += "<div class='ad_seo_item'>" + tout + "</div>";
		} else {
			// no video link
		}

		// out += show_section( "VIDEOS", "videos", sections.videos.out );

	// IMAGES & LARGE IMAGES ///////////////////////////////

		function get_image_info(o) {
			var i = {
				"src": o.src,
				"w": o.naturalWidth,
				"h": o.naturalHeight,
				"ratio": o.naturalWidth / o.naturalHeight,
				"mp": ( o.naturalWidth * o.naturalHeight / 1000000 ).toFixed(1),
				"alt": o.alt,
				"title": o.title,
				"loading": o.loading
			};

			if ( i.src.startsWith("data:") ) i.src = i.src.substring(0, 40) + " [...]";

			if ( i.ratio > 1 ) {
				i.ratio_name = "landscape orientation";
			} else if ( i.ratio < 1 ) {
				i.ratio_name = "portrait orientation";
			} else  {
				i.ratio_name = "square";
			}

			return i;
		}

		var images = $$("img");
		var images_list = "";
		var images_count = 0;
		var images_no_alt = 0;
		var images_no_title = 0;
		var images_no_loading = 0;
		for(var i = 0; i < images.length; i++){
			var image = get_image_info(images[i]);

			if ( image.mp >=2 ) {
				var u = url2domain(image.src);
				if ( u ) {
					sections.largeimages.out += "<div class='ad_seo_item'>";
					sections.largeimages.out += "<a class='item' href='" + image.src + "'>" + u.url + "</a> " + image.w + "x" + image.h + " - ";
					sections.largeimages.out += image.mp + "MP - ";
					sections.largeimages.out += image.ratio_name;
					sections.largeimages.out += "</div>";
					sections.largeimages.count ++;
				}
			}

			if ( image.src ) {
				images_list += "<tr><td style='width:50%;'><a class='item' href='" + image.src + "'>" + image.src + "</a></td><td><span class='nowrap'>" + image.w + "x" + image.h + "</span>" + (image.mp >= .25 ? " (" + image.mp + "MP)" : "") + "</td>" + ( image.loading != "auto" ? "<td>"+image.loading+"</td>" : "<td class='bg_info' title='LOADING missing'></td>" ) + ( image.alt ? "<td>"+image.alt+"</td>" : "<td class='bg_warning' title='ALT missing'></td>" ) + ( image.title ? "<td>"+image.title+"</td>" : "<td class='bg_info' title='TITLE missing'></td>" ) + "</tr>";
				images_count ++;
				if ( !image.alt ) images_no_alt ++;
				if ( !image.title ) images_no_title ++;
				if ( image.loading == "auto" ) images_no_loading ++;
				
			} else {
				// NO SRC
				// images_list += "<tr><td>" + "no src" + "</td><td>" + ( image.alt ? image.alt : "" ) + "</td><td>" + ( image.title ? image.title : "" ) + "</td></tr>";
			}
		}

		if ( images_list != "" ) {

			if ( images_no_alt  ) {
				sections.images.out += show_warning(images_no_alt + " {{missingaltp1}} " + images_count + ") {{missingaltp2}}", "ALT text strengthens the message of your content with search engine spiders and improves the accessibility of your website");
				sections.images.warnings ++;
			}
			if ( images_no_title  ) {
				sections.images.out += show_info(images_no_title + " {{missingtitlep1}} " + images_count + ") {{missingtitlep2}}", "TITLE text strengthens the message of your content with search engine spiders.");
				sections.images.info ++;
			}
			if ( images_no_loading  ) {
				sections.images.out += show_info(images_no_loading + " {{missingloadingp1}} " + images_count + ") {{missingloadingp2}}", "LOADING attribute improves page loading speed.");
				sections.images.info ++;
			}			

			sections.images.out += "<div class='ad_seo_item'><table cellspacing=0 class='table'><tr><th>SRC</th><th>SIZE</th><th>LOADING</th><th>ALT</th><th>TITLE</th></tr>" + images_list + "</table></div>";
			sections.images.count = 1;
		}

		// data


	// MEDIA

	var media_out = "";
	media_out += show_section( "LARGE IMAGES", "largeimages", sections.largeimages.out );
	media_out += show_section( "VIDEOS", "videos", sections.videos.out );
	sections.media.info = sections.largeimages.info + sections.videos.info;
	sections.media.warnings = sections.largeimages.warnings + sections.videos.warnings;
	sections.media.count = sections.largeimages.count + sections.videos.count;
	out += show_section( "MEDIA", "media", media_out );

	// HTML5

		var doctype
		if ( document.doctype ) {
			doctype = new XMLSerializer().serializeToString(document.doctype);
		} else {
			doctype = "";
		}

		var html5_tags = $$("article,aside,audio,bdi,canvas,command,datalist,details,figcaption,figure,footerheader,hgroup,keygen,mark,meter,nav,output,progress,rp,rt,ruby,section,source,summary,time,track,video").length;
		var obsolete_tags = $$("acronym,applet,basefont,big,center,dir,font,frame,frameset,strike,tt").length;
		var html5_score;
		sections.html5report.out += "<div class='ad_seo_item'>{{doctypeis}} ";
		if ( doctype == "<!DOCTYPE html>" ) {
			sections.html5report.out += "HTML5,";
			html5_score = 3;
		} else {
			sections.html5report.out += "{{nothtml5}},";
			html5_score = 1;
		}
		if ( html5_tags > 0 ) {
			sections.html5report.out += " {{html5tags}}";
			if ( obsolete_tags > 0 ) {
				sections.html5report.out += ", {{html4tags}}.";
				html5_score += 1;
			} else {
				sections.html5report.out += " {{noobsoletetags}}.";
				html5_score += 2;
			}
		} else {
			sections.html5report.out += " {{nohtml5tags}}";
			if ( obsolete_tags > 0 ) {
				sections.html5report.out += " {{html4tags}}.";
				html5_score -= 1;
			} else {
				sections.html5report.out += ", {{noobsoletetags}}.";
			}
		}

		sections.html5report.out += "<br>";
		for (i=1 ; i <=5 ; i++ ) {
			if ( i <= html5_score ) {
				sections.html5report.out += "<span style='color:yellow'>&starf;</span>";
			} else {
				sections.html5report.out += "<span style='color:#770'>&starf;</span>";
			}
		}
		sections.html5report.out += "</div>";
		sections.html5report.count = 1;

		// out += "<div class='ad_seo_title'>{{section_htmlreport}}</div><div class='ad_seo_item'>" + tout;

		// out += show_section( "{{section_htmlreport}}", "html5", sections.html5report.out );




	// MARKUP

	var markup_out = "";
	markup_out += show_section( "{{section_htmltags}}", "html", sections.html.out );
	markup_out += show_section( "HEADERS", "headers", sections.headers.out );
	markup_out += show_section( "IMAGES", "images", sections.images.out );
	markup_out += show_section( "{{section_htmlreport}}", "html5", sections.html5report.out );
	sections.markup.info = sections.headers.info + sections.html.info + sections.html5report.info + sections.images.info;
	sections.markup.warnings = sections.headers.warnings + sections.html.warnings + sections.html5report.warnings + sections.images.warnings;
	sections.markup.count = sections.headers.count + sections.html.count + sections.html5report.count + sections.images.count;
	out += show_section( "MARKUP", "markup", markup_out );				




		out += "</div>";


		out = out.replace(/\{\{(.+?)\}\}/g, function(match, contents, offset, input_string) {
      		return (chrome.i18n.getMessage(contents)||"[*?*?*]");
    	});

		sendResponse({
			farewell: "counted",
			out: out,
			warnings: warnings,
			jout: jout,
			sections: sections
		});

		console.log(sections);

	}

});
