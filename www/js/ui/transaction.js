

var shield = (function(shield, $, undefined) {

shield.TRANSACTION_TYPE = 0;
shield.TYPE_MESSAGING = 1;
shield.TYPE_COLORED_COINS = 2;
shield.SUBTYPE_MESSAGING_ARBITRARY_MESSAGE = 0;
shield.SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT = 2;
shield.SUBTYPE_COLORED_COINS_BID_ORDER_PLACEMENT = 3;
shield.SUBTYPE_COLORED_COINS_ASK_ORDER_CANCELLATION = 4;
shield.SUBTYPE_COLORED_COINS_BID_ORDER_CANCELLATION = 5;
shield.SUBTYPE_MESSAGING_VOTE_CASTING = 3;
shield.NO_VOTE_VALUE = -128;	//Byte.MIN_VALUE
shield.PAYMENT = "Payment";
shield.MESSAGE = "Message";
shield.ENCRYPTED_MESSAGE = "encryptedMessage";
shield.PUBLIC_KEY_ANN = "publicKeyAnnouncement";
shield.ENCRYPT_SELF_MESSAGE = "encryptToSelfMessage";
shield.PHASING = "phasing";
shield.PRUNABLE_PLAIN_MESSAGE = "prunablePlainMessage";
shield.PRUNABLE_ENCRYPTED_MESSAGE = "prunableEncryptedMessage";

shield.OTHER = "Other";

function getFlags() {
	var flags = 0;
	var position = 1;
	position <<= 1;
	position <<= 1;
	position <<= 1;
	return flags;
}

function pad(length, value) {
	var array = [];
	for (var i = 0; i < length; i++) {
		array[i] = value;
	}
	return array;
}

function padWithZero(length)
{
	var aZero = [0];
	var arrayZero = aZero;
	for (var i = 0; i < length-1; i++) {
		arrayZero = arrayZero.concat(aZero);
	}
	return array;
}

function areByteArraysEqual(bytes1, bytes2) {
	if (bytes1.length !== bytes2.length)
		return false;

	for (var i = 0; i < bytes1.length; ++i) {
		if (bytes1[i] !== bytes2[i])
			return false;
	}
	return true;
}

function verifyBytes(signature, message, publicKey) {
	var signatureBytes = converters.hexStringToByteArray(signature);
	var messageBytes = converters.hexStringToByteArray(message);
	var publicKeyBytes = converters.hexStringToByteArray(publicKey);
	var v = signatureBytes.slice(0, 32);
	var h = signatureBytes.slice(32);
	var y = curve25519.verify(v, h, publicKeyBytes);

	var m = shield.simpleHash(messageBytes);

	shield._hash.init();
	shield._hash.update(m);
	shield._hash.update(y);
	var h2 = shield._hash.getBytes();

	return areByteArraysEqual(h, h2);
}

shield.sendNxtAmt_BuildHex = function(amountNQT, recipientID, callbackFunc){
	var buffer = [];
	var LONG_BYTE_LENGTH = 8;
	var TRANSACTION_SUBTYPE = 0;
	var deadline = 20;
	var ecBlockHeight = 0;
	var ecBlockId = 0;
	var version = 1;

	var hexTrans;
	var secretPhraseBytes = converters.stringToByteArray(shield.globalPassPhrase);
	var digest = shield.simpleHash(secretPhraseBytes);
	var publicKey = converters.byteArrayToHexString(curve25519.keygen(digest).p);
	var timestamp = Math.floor(Date.now() / 1000) - 1385294400;
	hexTrans = converters.byteArrayToHexString([shield.TRANSACTION_TYPE]);
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([version << 4]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(timestamp)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([160]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([5]));
	hexTrans = hexTrans.concat(publicKey);

	var nxtAddr = new NxtAddress();
	nxtAddr.set(recipientID);
	var recipient = (new BigInteger(nxtAddr.account_id())).toByteArray().reverse();
	recipient = recipient.concat(pad( LONG_BYTE_LENGTH - recipient.length, 0 ));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(recipient.slice(0, LONG_BYTE_LENGTH)));

	var amount = (new BigInteger(amountNQT)).toByteArray().reverse();
	amount = amount.concat(pad(LONG_BYTE_LENGTH - amount.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(amount.slice(0, LONG_BYTE_LENGTH)));

	var fee = (new BigInteger(shield.FEE_NQT)).toByteArray().reverse();
	fee = fee.concat(pad(LONG_BYTE_LENGTH - fee.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(fee.slice(0, LONG_BYTE_LENGTH)));

	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(32,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(64,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(16,0)));

	buffer = converters.hexStringToByteArray(hexTrans);
	//verifyAndSignTransactionBytes(buffer, "sendnxt");
	var signature = shield.signBytes(buffer, shield.globalPassPhrase);
	var buffTillSignature = buffer.slice(0, 96);
	var buffAfterSignature = buffer.slice(96+64);
	var signed = buffTillSignature;
	signed = signed.concat(signature);
	signed = signed.concat(buffAfterSignature);
	var tx = converters.byteArrayToHexString(signed);

	broadcastTransaction(tx, callbackFunc);
}

shield.placeAssetOrder_BuildHex = function(type, asset, quantity, price, order, callbackFunc){
    assetID = asset.toString();
	quantityQNT = quantity.toString();
	priceNQT = price.toString();
	orderID = order.toString();
	var buffer = []; var hexTrans;
	var LONG_BYTE_LENGTH = 8;

	var amountNQT = 0; var ecBlockHeight = 0; var ecBlockId = 0; var version = 1;

	var secretPhraseBytes = converters.stringToByteArray(shield.globalPassPhrase);
	var digest = shield.simpleHash(secretPhraseBytes);
	var publicKey = converters.byteArrayToHexString(curve25519.keygen(digest).p);
	var timestamp = Math.floor(Date.now() / 1000) - 1385294400;
	hexTrans = converters.byteArrayToHexString([shield.TYPE_COLORED_COINS]);
	var bitVersion = version << 4;
	if(type == "buy")
		 hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | shield.SUBTYPE_COLORED_COINS_BID_ORDER_PLACEMENT]));
	else if(type == "sell")
		 hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | shield.SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT]));
	else if(type == "buy_cancel")
		 hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | shield.SUBTYPE_COLORED_COINS_BID_ORDER_CANCELLATION]));
	else if(type == "sell_cancel")
		 hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | shield.SUBTYPE_COLORED_COINS_ASK_ORDER_CANCELLATION]));

	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(timestamp)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([160]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([5]));
	hexTrans = hexTrans.concat(publicKey);
	var nxtAddr = new NxtAddress();
	nxtAddr.set("XEL-B7G6-TD4T-RVXR-8KEQR"); //creator ID, Genesis account id
	var creatorID = (new BigInteger(nxtAddr.account_id())).toByteArray().reverse();
	creatorID = creatorID.concat(pad( LONG_BYTE_LENGTH - creatorID.length, 0 ));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(creatorID.slice(0, LONG_BYTE_LENGTH)));
	var amount = (new BigInteger(String(amountNQT))).toByteArray().reverse();
	amount = amount.concat(pad(LONG_BYTE_LENGTH - amount.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(amount.slice(0, LONG_BYTE_LENGTH)));
	var fee = (new BigInteger(shield.FEE_NQT)).toByteArray().reverse();
	fee = fee.concat(pad(LONG_BYTE_LENGTH - fee.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(fee.slice(0, LONG_BYTE_LENGTH)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(32,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(64,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(16,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([version]));
	if(type == "buy" || type == "sell")
	{
		var asset = (new BigInteger(assetID)).toByteArray().reverse();
		asset = asset.concat(pad(LONG_BYTE_LENGTH - asset.length, 0));
		hexTrans = hexTrans.concat(converters.byteArrayToHexString(asset.slice(0, LONG_BYTE_LENGTH)));

		var quantity = (new BigInteger(quantityQNT)).toByteArray().reverse();
		quantity = quantity.concat(pad(LONG_BYTE_LENGTH - quantity.length, 0));
		hexTrans = hexTrans.concat(converters.byteArrayToHexString(quantity.slice(0, LONG_BYTE_LENGTH)));

		var price = (new BigInteger(priceNQT)).toByteArray().reverse();
		price = price.concat(pad(LONG_BYTE_LENGTH - price.length, 0));
		hexTrans = hexTrans.concat(converters.byteArrayToHexString(price.slice(0, LONG_BYTE_LENGTH)));
	}
	else
	{   //cancellation of bid\ask orders with orderID as input
		var order = (new BigInteger(orderID)).toByteArray().reverse();
		order = order.concat(pad(LONG_BYTE_LENGTH - order.length, 0));
		hexTrans = hexTrans.concat(converters.byteArrayToHexString(order.slice(0, LONG_BYTE_LENGTH)));
	}

	buffer = converters.hexStringToByteArray(hexTrans);
	//verifyAndSignTransactionBytes(buffer, "asset");
	var signature = shield.signBytes(buffer, shield.globalPassPhrase);
	var buffTillSignature = buffer.slice(0, 96);
	var buffAfterSignature = buffer.slice(96+64);
	var signed = buffTillSignature; signed = signed.concat(signature); signed = signed.concat(buffAfterSignature);
	var tx = converters.byteArrayToHexString(signed);
	broadcastTransaction(tx, callbackFunc);
}

shield.castVote_BuildHex = function(pollid, vote, callbackFunc){
    pollID = pollid.toString();
	var buffer = []; var hexTrans;
	var LONG_BYTE_LENGTH = 8;

	var amountNQT = 0; var ecBlockHeight = 0; var ecBlockId = 0; var version = 1;

	var secretPhraseBytes = converters.stringToByteArray(shield.globalPassPhrase);
	var digest = shield.simpleHash(secretPhraseBytes);
	var publicKey = converters.byteArrayToHexString(curve25519.keygen(digest).p);
	var timestamp = Math.floor(Date.now() / 1000) - 1385294400;
	hexTrans = converters.byteArrayToHexString([shield.TYPE_MESSAGING]);
	var bitVersion = version << 4;
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | shield.SUBTYPE_MESSAGING_VOTE_CASTING]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(timestamp)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([160]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([5]));
	hexTrans = hexTrans.concat(publicKey);
	var nxtAddr = new NxtAddress();
	nxtAddr.set("XEL-B7G6-TD4T-RVXR-8KEQR"); //creator ID, Genesis account id
	var creatorID = (new BigInteger(nxtAddr.account_id())).toByteArray().reverse();
	creatorID = creatorID.concat(pad( LONG_BYTE_LENGTH - creatorID.length, 0 ));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(creatorID.slice(0, LONG_BYTE_LENGTH)));
	var amount = (new BigInteger(String(amountNQT))).toByteArray().reverse();
	amount = amount.concat(pad(LONG_BYTE_LENGTH - amount.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(amount.slice(0, LONG_BYTE_LENGTH)));
	var fee = (new BigInteger(shield.FEE_NQT)).toByteArray().reverse();
	fee = fee.concat(pad(LONG_BYTE_LENGTH - fee.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(fee.slice(0, LONG_BYTE_LENGTH)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(32,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(64,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(16,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([version]));

	var poll = (new BigInteger(pollID)).toByteArray().reverse();
	poll = poll.concat(pad(LONG_BYTE_LENGTH - poll.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(poll.slice(0, LONG_BYTE_LENGTH)));

	hexTrans = hexTrans.concat(converters.byteArrayToHexString([vote.length]));

	for(var i = 0; i < vote.length; i++)
	{
		hexTrans = hexTrans.concat(converters.byteArrayToHexString([vote[i]]));
	}

	buffer = converters.hexStringToByteArray(hexTrans);
	verifyAndSignTransactionBytes(buffer, "vote");
	var signature = shield.signBytes(buffer, shield.globalPassPhrase);
	var buffTillSignature = buffer.slice(0, 96);
	var buffAfterSignature = buffer.slice(96+64);
	var signed = buffTillSignature; signed = signed.concat(signature); signed = signed.concat(buffAfterSignature);
	var tx = converters.byteArrayToHexString(signed);
	//prompt("", tx);
	broadcastTransaction(tx, callbackFunc);
}

shield.build = function(type, subType){
	var buffer = []; var hexTrans;
	var LONG_BYTE_LENGTH = 8;

	var amountNQT = 0; var version = 1;

	var secretPhraseBytes = converters.stringToByteArray(shield.globalPassPhrase);
	var digest = shield.simpleHash(secretPhraseBytes);
	var publicKey = converters.byteArrayToHexString(curve25519.keygen(digest).p);
	var timestamp = Math.floor(Date.now() / 1000) - 1385294400;
	hexTrans = converters.byteArrayToHexString([type]);
	var bitVersion = version << 4;
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | subType]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(timestamp)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([160]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([5]));
	hexTrans = hexTrans.concat(publicKey);
	var nxtAddr = new NxtAddress();
	nxtAddr.set("XEL-B7G6-TD4T-RVXR-8KEQR"); //creator ID, Genesis account id
	var creatorID = (new BigInteger(nxtAddr.account_id())).toByteArray().reverse();
	creatorID = creatorID.concat(pad( LONG_BYTE_LENGTH - creatorID.length, 0 ));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(creatorID.slice(0, LONG_BYTE_LENGTH)));
	var amount = (new BigInteger(String(amountNQT))).toByteArray().reverse();
	amount = amount.concat(pad(LONG_BYTE_LENGTH - amount.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(amount.slice(0, LONG_BYTE_LENGTH)));
	var fee = (new BigInteger(shield.FEE_NQT)).toByteArray().reverse();
	fee = fee.concat(pad(LONG_BYTE_LENGTH - fee.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(fee.slice(0, LONG_BYTE_LENGTH)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(32,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(64,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(16,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([version]));
	return hexTrans;
}

shield.message_BuildHex = function(data, nonce, messageType, recipient, messageFee, callbackFunc){
	var buffer = []; var hexTrans;
	var LONG_BYTE_LENGTH = 8;

	var amountNQT = 0; var ecBlockHeight = 0; var ecBlockId = 0; var version = 1;

	var secretPhraseBytes = converters.stringToByteArray(shield.globalPassPhrase);
	var digest = shield.simpleHash(secretPhraseBytes);
	var publicKey = converters.byteArrayToHexString(curve25519.keygen(digest).p);
	var timestamp = Math.floor(Date.now() / 1000) - 1385294400; // 86400; //+ 1209600

	hexTrans = converters.byteArrayToHexString([shield.TYPE_MESSAGING]);
	var bitVersion = version << 4;
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([bitVersion | shield.SUBTYPE_MESSAGING_ARBITRARY_MESSAGE]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(timestamp)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([160]));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([5]));
	hexTrans = hexTrans.concat(publicKey);
	var nxtAddr = new NxtAddress();
	nxtAddr.set(recipient);
	var creatorID = (new BigInteger(nxtAddr.account_id())).toByteArray().reverse();
	creatorID = creatorID.concat(pad( LONG_BYTE_LENGTH - creatorID.length, 0 ));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(creatorID.slice(0, LONG_BYTE_LENGTH)));
	var amount = (new BigInteger(String(amountNQT))).toByteArray().reverse();
	amount = amount.concat(pad(LONG_BYTE_LENGTH - amount.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(amount.slice(0, LONG_BYTE_LENGTH)));
	var fee = (new BigInteger(messageFee)).toByteArray().reverse();
	fee = fee.concat(pad(LONG_BYTE_LENGTH - fee.length, 0));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(fee.slice(0, LONG_BYTE_LENGTH)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(32,0)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(64,0)));

	var flags = 0;
	var position = 1;
	if (shield.MESSAGE == messageType) {
		flags |= position;
	}
	position <<= 1;
	if (shield.ENCRYPTED_MESSAGE == messageType) {
		flags |= position;
	}
	position <<= 1;
	if (shield.PUBLIC_KEY_ANN == messageType) {
		flags |= position;
	}
	position <<= 1;
	if (shield.ENCRYPT_SELF_MESSAGE == messageType) {
		flags |= position;
	}
	position <<= 1;
	if (shield.PHASING == messageType) {
		flags |= position;
	}
	position <<= 1;
	if (shield.PRUNABLE_PLAIN_MESSAGE == messageType) {
		flags |= position;
	}
	position <<= 1;
	if (shield.PRUNABLE_ENCRYPTED_MESSAGE == messageType) {
		flags |= position;
	}


	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(flags))); //flags
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(pad(12,0))); //BLOCK HEIGHT 4 + EC BLOCK ID 8 BYTES
	hexTrans = hexTrans.concat(converters.byteArrayToHexString([version]));

	/*if( messageType == shield.PRUNABLE_PLAIN_MESSAGE)// || messageType == shield.PRUNABLE_ENCRYPTED_MESSAGE)
	{
		var utf8Bytes = NRS.getUtf8Bytes(data);
		var messageHex = converters.byteArrayToHexString(utf8Bytes);
		var sha256 = CryptoJS.algo.SHA256.create();
		sha256.update(converters.byteArrayToWordArrayEx([1])); //isText
		sha256.update(converters.byteArrayToWordArrayEx( utf8Bytes ));
		messageHash = converters.byteArrayToHexString(converters.wordArrayToByteArrayEx(sha256.finalize()));
		//messageHash = converters.byteArrayToHexString(converters.wordArrayToByteArrayImpl(sha256.finalize(), false));
		hexTrans = hexTrans.concat(messageHash);

	}*/
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(converters.int32ToBytes(data.length | -2147483648)));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(data));
	hexTrans = hexTrans.concat(converters.byteArrayToHexString(nonce));

	buffer = converters.hexStringToByteArray(hexTrans);
	//verifyAndSignTransactionBytes(buffer, "message");
	var signature = shield.signBytes(buffer, shield.globalPassPhrase);
	var buffTillSignature = buffer.slice(0, 96);
	var buffAfterSignature = buffer.slice(96+64);
	var signed = buffTillSignature; signed = signed.concat(signature); signed = signed.concat(buffAfterSignature);
	var tx = converters.byteArrayToHexString(signed);
	//prompt("", tx+"&prunableAttachmentJSON="+JSON.stringify(prunableJSONMsg));
	broadcastTransaction(tx, callbackFunc);
}

function verifyAndSignTransactionBytes(byteArray, type) {
	var transaction = {};
	transaction.type = byteArray[0];
	transaction.version = (byteArray[1] & 0xF0) >> 4;
	transaction.subtype = byteArray[1] & 0x0F;
	transaction.timestamp = String(converters.byteArrayToSignedInt32(byteArray, 2));
	transaction.deadline = String(converters.byteArrayToSignedShort(byteArray, 6));
	transaction.publicKey = converters.byteArrayToHexString(byteArray.slice(8, 40));
	transaction.recipient = String(converters.byteArrayToBigInteger(byteArray, 40));
	transaction.amountNQT = String(converters.byteArrayToBigInteger(byteArray, 48));
	transaction.feeNQT = String(converters.byteArrayToBigInteger(byteArray, 56));
	var refHash = byteArray.slice(64, 96);
	transaction.referencedTransactionFullHash = converters.byteArrayToHexString(refHash);
	if (transaction.referencedTransactionFullHash == "0000000000000000000000000000000000000000000000000000000000000000") {
		transaction.referencedTransactionFullHash = "";
	}
	transaction.flags = 0;
	if (transaction.version > 0) {
		transaction.flags = converters.byteArrayToSignedInt32(byteArray, 160);
		transaction.ecBlockHeight = String(converters.byteArrayToSignedInt32(byteArray, 164));
		transaction.ecBlockId = String(converters.byteArrayToBigInteger(byteArray, 168));
	}
	if(type == "asset")
	{
		transaction.ver = (byteArray[176] & 0xF0) >> 4;
		transaction.assetId = String(converters.byteArrayToBigInteger(byteArray, 177));
		transaction.quantityQNT = String(converters.byteArrayToBigInteger(byteArray, 185));
		transaction.priceNQT = String(converters.byteArrayToBigInteger(byteArray, 193));
	}
	if(type == "vote")
	{
		transaction.ver = (byteArray[176] & 0xF0) >> 4;
		transaction.pollid = String(converters.byteArrayToBigInteger(byteArray, 177));
		transaction.length = String(byteArray[185]);
		transaction.vote = [];
		var index = 0;
		for(var i = 186; i < transaction.length; i++)
		{
			transaction.vote[index++] = String(byteArray[i]);
		}
	}
	if(type == "message")
	{
		// transaction.length = String(converters.byteArrayToSignedInt32(byteArray, 176));
		// var messageBytes = byteArray.slice(180, 184);
		// transaction.message = String(converters.byteArrayToString(messageBytes));
		// transaction.message = "";
	}
}

function broadcastTransaction(tx, callbackFunc)
{
	if(shield.ADDRESS != "" && shield.ADDRESS != undefined ){
	var url = shield.ADDRESS +'/nxt?requestType=broadcastTransaction&transactionBytes=' + tx;
	$.ajax({
			url: url,
			crossDomain: true,
			type: "POST",
			async: true
		}).done(function(json) {
			if (json.errorCode && !json.errorDescription) {
				json.errorDescription = (json.errorMessage ? json.errorMessage : $.t("error_unknown"));
				if(callbackFunc)
				{
					callbackFunc(errorDescription);
				}
			}
			else
			{
				var parsedjson = $.parseJSON(json);
				if(callbackFunc)
				{
					callbackFunc(parsedjson);
				}
			}
		}).fail(function(xhr, textStatus, error) {

		});
	}
}

	return shield;
 }(shield || {}, jQuery));
