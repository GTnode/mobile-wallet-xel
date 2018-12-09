
shield.index.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('sendNxt', {
      url: '/sendNxt',
      templateUrl: 'templates/sendNxt.html',
      controller: 'SendNxtCtrl'
    });
})
.controller('SendNxtCtrl', function($scope, $state, $http, $ionicPopup, $rootScope, $timeout) {
	$scope.globalAddress = shield.globalAddress;
	$scope.balance = "";
	$scope.amtNxt = {
			text: ''
	};
	$scope.recipient_address = {
			text: ''
	}
	$scope.balance_spinner = true;

$scope.keydownevent = function(e){
	shield.keydownevent(e, $scope.amtNxt.text, 8);
}

$scope.accountBalance = function(){
if(shield.ADDRESS != "" && shield.ADDRESS != undefined ){
	$scope.balance = "";
	$scope.balance_spinner = true;
	$http.get(shield.ADDRESS + '/nxt?requestType=getBalance&account=' + shield.globalAddress)
	.success(function(response) {
		$scope.balance_spinner = false;
		$scope.balance = NRS.convertToNXT(response.unconfirmedBalanceNQT);
	})
	.error(function(response) {
		$scope.balance_spinner = false;
	});
}
}

$scope.checkRecipient = function() {
	$scope.recipient_address.text = $.trim($scope.recipient_address.text);
	if (/^(NXT\-)?[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+\-[A-Z0-9]+/i.test($scope.recipient_address.text)) {
		var address = new NxtAddress();
		if (address.set($scope.recipient_address.text)) {
			return true;
		}
	} else {
			return false;
	}
}

$rootScope.sendNxtCallBack = function(msg)
{
	if(msg == "Success")
	{
		$scope.amtNxt.text = "";
		$scope.recipient_address.text = "";
	}

	var resultPopup = $ionicPopup.show({
	title: 'Send Nxt',
	subTitle: 'Result: Payment ' + msg,
	scope: $scope,
	buttons: [
	{ text: 'Close' }
	]
	});
	resultPopup.then(function(res) {
		resultPopup.close();
	});
	$timeout(function() {
		resultPopup.close(); //close the popup after 3 seconds
	}, 3000);
}

$scope.sendNxtBtnClick = function()
{
	inputOptions = "Recipient: " + $scope.recipient_address.text + "<br>Amount: " + $scope.amtNxt.text + " Nxt<br>Fee: 1 Nxt";
	var inputAmt = parseFloat($scope.amtNxt.text);
	var availableBal = parseFloat($scope.balance);

	if(!$scope.checkRecipient())
	{
		var alertPopup = $ionicPopup.alert({
			title: 'Alert!',
			template: 'Incorrect Recipient XEL Address'
		});
		alertPopup.then(function(res) {
		});
		return;
	}

	if(!isNaN($scope.amtNxt.text) && inputAmt < availableBal)
	{
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirm Send NXT',
			template: inputOptions
		});
		confirmPopup.then(function(res) {
			if(res) {
				var send_amount_NQT = NRS.convertToNQT($scope.amtNxt.text);
				var recipient_addr = String($scope.recipient_address.text);
				shield.sendNxtAmt_BuildHex(send_amount_NQT, recipient_addr, $rootScope.sendNxtCallBack);
			}
		});
	}
	else
	{
		if(isNaN($scope.amtNxt.text))
		{
			var alertPopup = $ionicPopup.alert({
				title: 'Alert!',
				template: 'Incorrect Nxt Amount'
			});
			alertPopup.then(function(res) {
			});
		}
		if(!isNaN($scope.amtNxt.text) && inputAmt > availableBal)
		{
			var alertPopup = $ionicPopup.alert({
				title: 'Alert!',
				template: 'Insufficient balance'
			});
			alertPopup.then(function(res) {
			});
		}
	}
}

$scope.scanBarCode = function()
{
	try {
	cordova.plugins.barcodeScanner.scan(
	  function (result) {
		  if(result.cancelled == false && result.format == "QR_CODE")
		  {
			  $scope.recipient_address.text = String(result.text);
		  }
	  },
	  function (error) {
	  }
   );
   } catch (e) {

		}
}

$scope.accountBalance();
});
