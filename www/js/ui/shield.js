

shield.index = angular.module('shield', ['ionic', 'ionic.contrib.frostedGlass'])
.config( [
    '$compileProvider',
    function( $compileProvider )
    {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|ftp|whatsapp|sms):/);
    }
])
.filter('formatTimestamp', function formatTimestamp($filter){
  return function(ts){
    return NRS.formatTimestamp(parseInt(ts));
  }
})
.filter('formatAmount', function formatAmount($filter){
  return function(priceNQT){
	return NRS.convertToNXT(priceNQT);
  }
})
.filter('formatPrice', function formatPrice($filter){
  return function(priceNQT, decimal){
	return NRS.calculateOrderPricePerWholeQNT(priceNQT, decimal);
  }
})
.filter('formatQuantity', function formatQuantity($filter){
  return function(quantityQNT, decimal){
	return NRS.convertToQNTf(quantityQNT, decimal);
  }
})
.filter('formatBalance', function formatBalance($filter){
  return function(asset){
    return NRS.convertToQNTf(asset.quantityQNT, asset.decimals);
  }
})
.filter('split', function() {
	return function(input, charVal, i) {
		var splitArr = input.split(charVal);
		return splitArr[i];
	}
})
.run(function ($ionicPlatform){
$ionicPlatform.registerBackButtonAction(function () {
    if($state.current.name=="login"){
		navigator.app.exitApp();
  } else {
  }
}, 100);
});

shield.isControlKey = function(charCode) {
	if (charCode >= 32)
		return false;
	if (charCode == 10)
		return false;
	if (charCode == 13)
		return false;

	return true;
}

shield.getSelectedText = function () {
	var t = "";
	if (window.getSelection) {
		t = window.getSelection().toString();
	} else if (document.getSelection) {
		t = document.getSelection().toString();
	} else if (document.selection) {
		t = document.selection.createRange().text;
	}
	return t;
}

shield.keydownevent = function(e, txt, maxFractionLength) {
	var charCode = !e.charCode ? e.which : e.charCode;

	if (shield.isControlKey(charCode) || e.ctrlKey || e.metaKey) {
		return;
	}


	if (maxFractionLength) {
		if (charCode == 110 || charCode == 190) {
			if (txt.indexOf(".") != -1) {
				e.preventDefault();
				return false;
			} else {
				return;
			}
		}
	}

	var input = txt + String.fromCharCode(charCode);

	var afterComma = input.match(/\.(\d*)$/);

	if (afterComma && afterComma[1].length > maxFractionLength) {
		var selectedText = shield.getSelectedText();

		if (selectedText != txt) {
			e.preventDefault();
			return false;
		}
	}

	if (charCode == 8 || charCode == 37 || charCode == 39 || charCode == 46 || (charCode >= 48 && charCode <= 57 && !isNaN(String.fromCharCode(charCode))) || (charCode >= 96 && charCode <= 105)) {
		return;
	} else {
		e.preventDefault();
		return false;
	}
}
