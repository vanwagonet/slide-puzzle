define('prefix', function() {
	var Webkit, Moz, Ms, O, MT = '';
	function check(obj, name) {
		var caps = name.charAt(0).toUpperCase() + name.slice(1);
		return ((name in obj) && name) ||
			(((name = Webkit + caps) in obj) && name) ||
			(((name = Moz + caps) in obj) && name) ||
			(((name = Ms + caps) in obj) && name) ||
			(((name = O + caps) in obj) && name) ||
			MT;
	}
	function js(obj, name) {
		Webkit = 'webkit', Moz = 'moz', Ms = 'ms', O = 'o';
		return check(obj, name);
	}
	function cssom(obj, name) {
		Webkit = 'Webkit', Moz = 'Moz', Ms = 'Ms', O = 'O';
		return check(obj, toCamel(name));
	}
	function dom(obj, name) {
		Webkit = 'WebKit', Moz = 'Moz', Ms = 'Ms', O = 'O';
		return check(obj, name);
	}
	function toDash(prop) {
		return prop.replace(/[A-Z]/g, function(a) { return '-' + a.toLowerCase(); });
	}
	function toCamel(prop) {
		return prop.replace(/-[a-z]/g, function(a) { return a.slice(1).toUpperCase(); });
	}
	return { js:js, cssom:cssom, dom:dom, toDash:toDash, toCamel:toCamel };
});
