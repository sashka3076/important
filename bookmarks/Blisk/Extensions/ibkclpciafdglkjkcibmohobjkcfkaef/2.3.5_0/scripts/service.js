var $ = document.querySelector.bind(document);						// single
var $$ = document.querySelectorAll.bind(document);					// array
var fromId = document.getElementById.bind(document);				// single
var fromClass = document.getElementsByClassName.bind(document);		// array
var fromTag = document.getElementsByTagName.bind(document);			// array

String.prototype.bool = function() {
    return (/^true$/i).test(this);
};

function html(id,text){
	fromId(id).innerHTML = text;
}

function favlnk(url,txt) {
	return "<div class='ad_seo_item'><img src='http://www.google.com/s2/favicons?domain=" + url + "' class='inlineFavicon'> <a href='" + url + "' class='cont_link' target='_blank'><span>" + txt + "</span></a></div>";
}

function injectCSS(file){ /* obsolete */
	var link = document.createElement("link");
	link.href = chrome.extension.getURL(file);
	link.type = "text/css";
	link.rel = "stylesheet";
	document.getElementsByTagName("head")[0].appendChild(link);

}

function wrap(text, cssclass) {
	if ( cssclass == undefined ) cssclass = "";
	return "<div class='ad_seo_item " + cssclass + "'>" + text + "</div>";
}

function show_item(name, cnt, warning){
	return "<span class='item'>" + name + "</span> <span class='item_count" + (warning != false ? " warning" : "" ) + "'>(" + cnt + ")</span> ";
}

function show_info(txt, tip){
  var out = "<div class='ad_seo_item'><div class='ad_seo_item_inner'><div class='info'><span>{{info}}</span> " + txt + "</div></div>";
  if ( tip != undefined ) out += "<span class='tip' title=\"" + tip + "\">TIP</span>";
  out += "</div>";
  return out;
}

function show_warning(txt, tip){
	warnings ++;
  var out = "<div class='ad_seo_item'><div class='ad_seo_item_inner'><div class='warning'><span>{{warning}}</span> " + txt + "</div></div>";
  if ( tip != undefined ) out += "<span class='tip' title=\"" + tip + "\">TIP</span>";
  out += "</div>";
  return out;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function show_inline_warning(txt){
	warnings ++;
	return "<span class='warning'>{{warning}}</span> " + txt;
}

function show_inline_info(txt){
	return "<span class='info'>{{info}}</span> " + txt;
}

function url2domain(url) {
	// console.log("url2domain",url);
	if ( url ) {
		const u = new URL(url);
		u.url = ( u.hostname == "" ? u.origin : u.hostname );
		return u;
	} else {
		return null;
	}
}

// JSON-LD

function traverse (x, l) {
  if (l == undefined) {
    l=1;
    traverse_out = [];
    traverse_minlevel = null;
  }
  if (isArr(x)) {
    traverseArray(x, l+1)
  } else if ((typeof x === 'object') && (x !== null)) {
    traverseObject(x, l+1);
  }
  return traverse_out;
}

function traverseArray (arr, l) {
  arr.forEach(function (x) {
    traverse(x, l);
  })
}

function traverseObject (obj, l) {
  if ( obj["@type"] ) {
    if (traverse_minlevel == null) traverse_minlevel = l;
    // console.log("T-OBJ", l-traverse_minlevel,obj);
    traverse_out.push( {"type":obj["@type"], "id":obj["@id"], "name":obj["name"], "level":l-traverse_minlevel} );
  }
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      traverse(obj[key], l);
    }
  }
}

function isArr (o) {
  return Object.prototype.toString.call(o) === '[object Array]'
}

// DOCTYPE

function obj2csv(o) {
  var out = [];
  for (var k in o) {
      if (o.hasOwnProperty(k)) {
          out.push( k + "=" + o[k] );
      }
  }
  return out.join(", ");
}

function getViewport(S) {

  function parseMetaViewPortContent(S) {
    S = S.toLowerCase();
    var c = {
      validProperties: {},
      unknownProperties: {},
      invalidValues: {},
      outcome: []
    };
    var i = 1;
    while (i <= S.length) {
      while (i <= S.length && RegExp(' |\x0A|\x09|\0d|,|;|=').test(S[i - 1])) {
        i++;
      }
      if (i <= S.length) {
        i = parseProperty(c, S, i);
      }
    }
    if (c.validProperties.width != "device-width") {
      c.outcome.push("width in viewport should be set to 'device-width'");
    }
    if (c.validProperties["maximum-scale"]) {
      c.outcome.push("maximum-scale in viewport should not be set");
    }
    if (c.validProperties["user-scalable"] != "yes" && c.validProperties["user-scalable"] != undefined) {
      c.outcome.push("user-scalable in viewport should be set to 'yes'");
    }
    return c;
  }

  var propertyNames = "width height initial-scale minimum-scale maximum-scale user-scalable shrink-to-fit viewport-fit".split(" ");

  function parseProperty(c, S, i) {
    var start = i;
    while (i <= S.length && !RegExp(' |\x0A|\x09|\0d|,|;|=').test(S[i - 1])) {
      i++;
    }
    if (i > S.length || RegExp(',|;').test(S[i - 1])) {
      return i;
    }
    var propertyName = S.slice(start - 1, i - 1);
    while (i <= S.length && !RegExp(',|;|=').test(S[i - 1])) {
      i++;
    }
    if (i > S.length || RegExp(',|;').test(S[i - 1])) {
      return i;
    }
    while (i <= S.length && RegExp(' |\x0A|\x09|\0d|=').test(S[i - 1])) {
      i++;
    }
    if (i > S.length || RegExp(',|;').test(S[i - 1])) {
      return i;
    }
    start = i;
    while (i <= S.length && !RegExp(' |\x0A|\x09|\0d|,|;|=').test(S[i - 1])) {
      i++;
    }
    var propertyValue = S.slice(start - 1, i - 1);
    setProperty(c, propertyName, propertyValue);
    return i;
  }

  function setProperty(c, name, value) {
    if (propertyNames.indexOf(name) >= 0) {
      var number = parseFloat(value);
      if (!isNaN(number)) {
        c.validProperties[name] = number;
        return;
      }
      var string = value.toLowerCase();

      if (string === "yes" || string === "no" || string === "device-width" || string === "device-height" || (name.toLowerCase() === 'viewport-fit' && (string === 'auto' || string === 'cover'))) {
        c.validProperties[name] = string;
        return;
      }
      c.validProperties[name] = null;
      c.invalidValues[name] = value;
    } else {
      c.unknownProperties[name] = value;
    }
  }

  return parseMetaViewPortContent(S);

};
