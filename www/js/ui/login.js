
shield.globalPassPhrase = "";
shield.globalAddress = "";

shield.index.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('login', {
      url: '/log-in',
      templateUrl: 'templates/log-in.html',
      controller: 'LogInCtrl'
    })
   $urlRouterProvider.otherwise('/log-in');
})
.controller('LogInCtrl', function($scope, $state, $ionicModal) {
$scope.passphrase = {
        text: ''
};
$scope.globalAddress = "";
$scope.showPassphrase = "ion-eye";
$scope.passPhrase = "text";

$scope.switchPassphraseView = function()
{
	if($scope.passPhrase === "text")
	{
		$scope.showPassphrase = "ion-eye-disabled";
		$scope.passPhrase = "password";
	}
	else
	{
		$scope.showPassphrase = "ion-eye";
		$scope.passPhrase = "text";
	}
}

$scope.passPhraseEntered = function()
{
if($scope.passphrase.text == "")
{
	$scope.qrcode = "";
	$scope.globalAddress = "";
}
else
{
	shield.globalPassPhrase = $scope.passphrase.text;
	var secretPhraseBytes = converters.stringToByteArray($scope.passphrase.text);
	var digest = shield.simpleHash(secretPhraseBytes);
	var publicKey = converters.byteArrayToHexString(curve25519.keygen(digest).p);

	var hex = converters.hexStringToByteArray(publicKey);
	shield._hash.init();
	shield._hash.update(hex);
	var account = shield._hash.getBytes();
	account = converters.byteArrayToHexString(account);
	var slice = (converters.hexStringToByteArray(account)).slice(0, 8);
	var accountId = shield.byteArrayToBigInteger(slice).toString();

	var address = new NxtAddress();
	if (address.set(accountId))
	{
		$scope.globalAddress = shield.globalAddress = address.toString();
	}
}
};

$scope.logIn = function() {
	$scope.passphrase.text = "";
	$state.go('account');
};

$scope.logOut = function() {
	delete $scope.passphrase.text;
	delete shield.globalPassPhrase;
	delete shield.globalAddress;
	//save to file
	if(navigator.app)
		navigator.app.exitApp();
};

$ionicModal.fromTemplateUrl('templates/qr.html', {
	scope: $scope
}).then(function(qr) {
	$scope.qr = qr;
});

$scope.showQR = function(){
if(shield.globalAddress != "")
{
	$scope.passphrase.text = "";
	var qrCode = qrcode(3, 'M');
    var text = shield.globalAddress.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
	qrCode.addData(text);
	qrCode.make();
	$scope.qrcode = qrCode.createImgTag(5);
	$scope.qr.show();
}
};
})
