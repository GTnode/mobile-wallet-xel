
var shield = (function(shield, $, undefined) {

shield.FEE_NQT = "100000000";
var httpsConnDone = false;

shield.globalPassPhrase = "";
shield.globalAddress = "";

shield._hash = {
	init: SHA256_init,
	update: SHA256_write,
	getBytes: SHA256_finalize
};

shield.simpleHash = function(message) {
	shield._hash.init();
	shield._hash.update(message);
	return shield._hash.getBytes();
}

shield.byteArrayToBigInteger = function(byteArray, startIndex) {
	var value = new BigInteger("0", 10);
	var temp1, temp2;
	for (var i = byteArray.length - 1; i >= 0; i--) {
		temp1 = value.multiply(new BigInteger("256", 10));
		temp2 = temp1.add(new BigInteger(byteArray[i].toString(10), 10));
		value = temp2;
	}
	return value;
}

shield.signBytes = function(message, secretPhrase) {
	var messageBytes = message;
	var secretPhraseBytes = converters.stringToByteArray(secretPhrase);

	var digest = shield.simpleHash(secretPhraseBytes);
	var s = curve25519.keygen(digest).s;

	var m = shield.simpleHash(messageBytes);

	shield._hash.init();
	shield._hash.update(m);
	shield._hash.update(s);
	var x = shield._hash.getBytes();

	var y = curve25519.keygen(x).p;

	shield._hash.init();
	shield._hash.update(m);
	shield._hash.update(y);
	var h = shield._hash.getBytes();

	var v = curve25519.sign(h, x, s);

	return (v.concat(h));
}

	return shield;
 }(shield || {}, jQuery));
