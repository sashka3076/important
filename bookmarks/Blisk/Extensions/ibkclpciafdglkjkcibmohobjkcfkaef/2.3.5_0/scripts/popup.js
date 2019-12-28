var bg = chrome.extension.getBackgroundPage();

var menu = {};
var sections; // defined and updated in content_script

function tools(url){

	console.log("@tools");

	//url = tab.url;
	url = url.replace("https://", "");
	url = url.replace("http://", "");
	url = url.split("?")[0];
	domain = url.split("/")[0];

	parts = domain.split(".");
	if ( parts.length > 2 ) parts = parts.slice(1);

	sdomain = parts.join(".");

	html("linksinfo","<b>The following links will analyze this URL: " + domain + "</b><br><span style='color:#ddd'>TIP: ctrl-click to open the links keeping this pop-up open.</span><br><br>");

	var ref = "?referer=http://goo.gl/ffGBYq";
	var refadd = "&referer=http://goo.gl/ffGBYq";

	// SEO
	var out = "";

	// Safety
	out = "";
	out += favlnk("http://www.google.com/safebrowsing/diagnostic?site="+domain+refadd,"Google Safe Browsing");	// safety - ok2019
	out += favlnk("http://www.siteadvisor.com/sites/"+domain+ref,"McAfee SiteAdvisor");						// safety - ok2019
	out += favlnk("http://www.mywot.com/en/scorecard/"+domain+ref,"WOT");										// safety rating - ok2019
	out += favlnk("http://safeweb.norton.com/report/show?url="+domain+refadd,"Norton Safe Web");					// safety rating - ok2019
	html( "links2" , out );

	out = "";
	out += favlnk("http://www.alexa.com/siteinfo/"+domain+ref,"Alexa");					// traffic - ok2019
	out += favlnk("http://www.majesticseo.com/reports/site-explorer/summary/"+domain+ref,"MajesticSEO");	// backlinks - ok2019
	out += favlnk("http://www.semrush.com/info/"+domain+ref,"SEMRush (login required)");					// keyword
	out += favlnk("http://www.wmtips.com/tools/info/?url="+domain+refadd,"WMTIPS");			// traffic info - ok2019
	// out += favlnk("http://siteanalytics.compete.com/"+sdomain+ref,"Compete");				// traffic keywords
	//out += favlnk("https://www.google.com/adplanner/site_profile#siteDetails?identifier="+domain,"Google Ad Planner");	// info traffic keywords
	//out += favlnk("http://trends.google.com/websites?q="+domain,"Google Trends");	// traffic
	//out += favlnk("http://www.majesticseo.com/search.php?q="+domain+refadd,"MajesticSEO");	// backlinks
	// out += favlnk("http://www.quantcast.com/"+domain+ref,"Quantacast");	// info
	// out += favlnk("http://www.serpanalytics.com/sites/"+domain+ref,"SERPAnalytics");		// traffic keywords
	//out += favlnk("http://serversiders.com/"+domain,"Serversiders");				// info traffic
	html( "links1" , out );

	// Social
	out = "";
	out += favlnk("https://search.google.com/structured-data/testing-tool#url="+url,"Google Structured Data Testing Tool");		// checker - ok2019
	out += favlnk("https://developers.facebook.com/tools/debug/og/object?q="+url+refadd,"Open Graph Object Debugger (FB)");		// checker - ok2019
	out += favlnk("http://developers.pinterest.com/rich_pins/validator/?link="+url+refadd,"Rich Pins validator (Pinterest)");	// checker - ok2019
	out += favlnk("https://sitechecker.pro/seo-report/https://"+domain,"Sitechecker");					// pagetest - ok2019
	out += favlnk("https://web.dev/measure","web.dev Measure");					// pagetest - ok2019
	out += favlnk("http://www.wmtips.com/tools/keyword-density-analyzer/?url=http://"+domain+refadd,"Keyword Density Analyzer");	// keywords - ok2019
	// out += favlnk("https://plus.google.com/ripple/details?url="+url+refadd,"Ripples Explorer (G+)");								//
	// out += favlnk("http://backtweets.com/search?q="+domain+refadd,"BackTweets");													// comunity
	html( "links4" , out );

	// Other
	out = "";
	out += favlnk("http://whois.domaintools.com/"+domain+ref,"DomainTools");					// info
	out += favlnk("http://images.google.com/images?q=site:"+sdomain+refadd,"Google Images");
	out += favlnk("http://www.intodns.com/"+sdomain+ref,"intoDNS");
	out += favlnk("http://www.wmtips.com/go/copyscape/https://"+url+ref,"Copyscape Plagiarism");
	out += favlnk("http://web.archive.org/web/*/"+url,"WaybackMachine");
	// out += favlnk("http://nibbler.silktide.com/reports/"+domain+ref,"Nibbler");					// info
	html( "links3" , out );
}

document.addEventListener('DOMContentLoaded', function(){
	// request on popup open
	chrome.runtime.sendMessage({mex: {action:"pageInfo"} }, function(response) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			// console.log("tabs",tabs[0].url);
			if ( tabs[0].url.substring(0, 25) == "https://chrome.google.com" ) {
				html("out-inner","Can't work on the Chrome Web Store pages, sorry.");
			} else {
				if ( response.cnt == -1 ) {
					html("out-inner","Not available in Chrome special pages and local files, sorry.");
				} else {
					if ( response.out != undefined ) {
						sections = response.sections;
						html("out-inner",response.out);
						Tipped.create('.tip', { detach: true, fadeOut: 0, hideOnClickOutside: true } );
						
						chrome.storage.sync.get(['menu'], function(result) {
							menu = result.menu;	// set global
							if ( menu == undefined ) {
								menu = {};
							}

							jQuery("[data-toggle]").each(function(){
								var target = jQuery(this).data("toggle");
								var st_target = "toggle_" + target;
								if ( menu[st_target] == "hide" ) {
									jQuery("[data-section=" + target + "]").addClass("hidden");
								}
							})

						});

						// JSON-LD test
						if ( response.jout.jsonld.length > 0 ) {
							var tmp = JSON.stringify({'jsonld':response.jout.jsonld, 'url':tabs[0].url});
							bg._gaq.push(['_trackEvent', 'test jsonld', tmp]);
						} else {
							// console.log("no JSON-LD");
						}

					} else {
						html("out-inner","No data. Please wait for the page to load.<br>If the extension was just installed or automatically updated, you need to refresh the page.<br");
					}
				}
			}

			jQuery("#menu>span").click(function(){
				var target = jQuery(this).data("target");
				if ( target == "pagedata" ) {
					jQuery(".minitoolbar").show();
				} else {
					jQuery(".minitoolbar").hide();
				}

				if ( jQuery(this).attr("class") != "active" ) {
					jQuery("#outer").scrollTop(0);
					jQuery("#menu span").removeClass("active");
					jQuery(this).addClass("active");
					jQuery(".panel").hide();

					localStorage.setItem("section", target );


					switch (target) {
						case "pagedata":
							jQuery("#out").show();
							break;

						case "onlinetools":
							jQuery("#tools").show();
							break;

						case "options":
							jQuery("#options").show();
							break;

						case "about":
							jQuery("#about").show();
							break;

					}

				}
			});

			jQuery("[data-toggle]").click(function(){
				var target = jQuery(this).data("toggle");
				var st_target = "toggle_" + target;
				if ( jQuery("[data-section=" + target + "]").hasClass("hidden") ) {
					// remove
					jQuery("[data-section=" + target + "]").removeClass("hidden");
					menu[st_target] = "show";
					chrome.storage.sync.set({"menu": menu}, function() {});
				} else {
					// add
					jQuery("[data-section=" + target + "]").addClass("hidden");
					menu[st_target] = "hide";
					chrome.storage.sync.set({"menu": menu}, function() {});
				}
			})

			jQuery("[data-target=" + localStorage.getItem("section") + "]").click();

			jQuery("#showNofollow").click(function() {
				var checked = jQuery(this).prop('checked');
				bg.setTF("nofollow",checked);
				// message to BG
				chrome.extension.sendRequest({action: 'nofollow' , value:checked}, function(response) {
				   //console.log(response.result);
				});
			});

			jQuery("#closeAll").click(function() {
				jQuery("[data-toggle]").each(function(){
					var target = jQuery(this).data("toggle");
					var st_target = "toggle_" + target;
					menu[st_target] = "hide";
					jQuery("[data-section=" + target + "]").addClass("hidden");
				})
				chrome.storage.sync.set({"menu": menu}, function() {});
			});

			jQuery("#openAll").click(function() {
				jQuery("[data-toggle]").each(function(){
					var target = jQuery(this).data("toggle");
					var st_target = "toggle_" + target;
					menu[st_target] = "show";
					jQuery("[data-section=" + target + "]").removeClass("hidden");
				})
				chrome.storage.sync.set({"menu": menu}, function() {});
			});

			jQuery("#isDebug").click(function() {
				var checked = jQuery(this).prop('checked');
				bg.setTF("isdebug",checked);
			});


			tools(tabs[0].url);

			// "activate" links
			var links = document.getElementsByTagName("a");
			for (var i = 0; i < links.length; i++) {
				(function () {
					var ln = links[i];
					var location = ln.href;
					ln.onclick = function (e) {
						bg._gaq.push(['_trackEvent', 'onlinetool', this.innerText ]);
						e.preventDefault();
						var ctrl = e.ctrlKey || (e.which == 2);
						chrome.tabs.create({active: (!ctrl) , url: location});
						if ( !ctrl ) window.close();
					};
				})();
			}

			jQuery("#showNofollow").prop('checked', bg.getTF("nofollow") );
			jQuery("#isDebug").prop('checked', bg.getTF("isdebug") );
			bg._gaq.push(['_trackEvent', 'popup open', tabs[0].url]);

		});
	});

	jQuery('[data-trans]').each(function(){
		jQuery(this).html( chrome.i18n.getMessage( jQuery(this).data("trans") ) );
		jQuery(this).removeAttr("data-trans");
	});

});
