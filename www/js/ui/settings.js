
shield.PEER_INPUT = false;
shield.PEER_IP_UI = "";
shield.PEER_PORT_UI = "";
shield.index.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('settings', {
      url: '/settings',
      templateUrl: 'templates/settings.html',
      controller: 'SettingsCtrl'
    })
})
.controller('SettingsCtrl', function($scope, $state, $ionicLoading, $http, $ionicPopup) {
$scope.$on('$ionicView.enter', function(){
	if(shield.PEER_INPUT == true)
	{
		if(shield.PEER_IP_UI != "")
		{
			$scope.select.name = "node";
			$scope.peerInput = true;
			$scope.ip.text = shield.PEER_IP_UI;
			$scope.port.text = shield.PEER_PORT_UI;
		}
	}
	else
	{
		$scope.peerInput = false;
		$scope.select.name = "auto";
	}
});

$scope.httpsConnDone = false;
$scope.select = {name : 'auto'};
$scope.ip = {text : ''};
$scope.port = {text : ''};
$scope.peerInput = false;

$scope.peerSettings = function(){
	if($scope.select.name == "node")
	{
		shield.PEER_INPUT = $scope.peerInput = true;
	}
	else
	{
		shield.PEER_INPUT = $scope.peerInput = false;
		shield.discover();
	}
}

$scope.testNode = function()
{
	$ionicLoading.show({duration: 30000, noBackdrop: true, template: '<ion-spinner icon="android"></ion-spinner>'});
	$scope.httpsConnDone = false;
	$scope.testIPAddress();
	$ionicLoading.hide();
}

$scope.testIPAddress = function()
{
		var ip = String($scope.ip.text).replace(/\s+/g, '');
		var port = String($scope.port.text).replace(/\s+/g, '');
		var addr = "";
		if(port)
		{
			addr = ip + ":" + port;
		}
		else
		{
			addr = ip;
		}

		if($scope.httpsConnDone)
			addr = shield.HTTPS_NODE + addr;
		else
			addr = shield.HTTP_NODE + addr;

	$http.get(addr +'/nxt?requestType=getBlockchainStatus')
    .success(function(response) {
		if(response.numberOfBlocks > 0)
		{
			var IP = "";
			if($scope.httpsConnDone)
			{
				IP = shield.HTTPS_NODE + ","+ String($scope.ip.text);
				shield.ADDRESS = shield.HTTPS_NODE;
			}
			if(!$scope.httpsConnDone)
			{
				IP = shield.HTTP_NODE + "," + String($scope.ip.text);
				shield.ADDRESS = shield.HTTP_NODE;
			}

			PORT = String($scope.port.text);
			var nodeDetails = IP + "," + PORT;
			shield.ADDRESS = shield.ADDRESS + String($scope.ip.text) + ":" + PORT;
			var userdbs = shield.usersettings.getCollection(shield.USER_SETTING_COLLECTION);
			if(userdbs != undefined)
			{
				var trustedPeerdata = userdbs.findOne({'key' : shield.TRUSTED_PEERS});
				trustedPeerdata.value = nodeDetails;
				shield.PEER_IP_UI = $scope.ip.text;
				shield.PEER_PORT_UI = $scope.port.text;
			}
			$ionicLoading.show({ template: "<span>Node connection success!</span>", noBackdrop: true, duration: 2000 });
		}
		else
		{
			$ionicLoading.show({ template: "<span class='assertive'>Error returned by Node. Please check the your Node configuration!</span>", noBackdrop: true, duration: 3000 });
		}
	})
	.error(function(response) {
		if (!$scope.httpsConnDone)
		{
			$scope.httpsConnDone = true;
			$scope.testIPAddress();//failed with http, try https
		}
		else
		{
			$ionicLoading.show({ template: "<span class='assertive'>Node Unreachable. Please check the your Node configuration.</span>", noBackdrop: true, duration: 3000 });
		}
	});
}
});
