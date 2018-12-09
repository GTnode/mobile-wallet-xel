

shield.index.config(function($stateProvider, $urlRouterProvider) {
})
.config(function($stateProvider, $urlRouterProvider) {
$stateProvider
.state('transactions', {
	url: "/transactions",
	templateUrl: "transactions.html",
	controller: 'transactionsListCtrl'
})
})
.controller('transactionsListCtrl', function($scope, $ionicLoading, $http, $state, $timeout, $filter) {
$scope.showTransactions = function(){
if(shield.ADDRESS != "" && shield.ADDRESS != undefined ){
	var transactionsdb = 'undefined';
	$scope.groups = [];
	$scope.toggleGroup = function(group) {
		if ($scope.isGroupShown(group)) {
		  $scope.shownGroup = null;
		} else {
		  $scope.shownGroup = group;
		}
	};

	$scope.isGroupShown = function(group) {
		return $scope.shownGroup === group;
	};

	$scope.transactionSearch = {text : ''};

	$scope.clearTransactionSearch = function()
	{
		$scope.transactionSearch.text = "";
		$scope.filterTransactions();
	}

	$scope.filterTransactions = function(e){
		var regexVal = {'$regex': new RegExp($scope.transactionSearch.text,"i")}
		$scope.groups = transactionsdb.find({'$or':[{type: regexVal}, {dateTime: regexVal}, {from: regexVal}]});
	}

	$scope.getType = function(type, subtype) {
		if(type == shield.TRANSACTION_TYPE)
				return { transtype : shield.PAYMENT, icon : "ion-card" };
		if(type == shield.TYPE_COLORED_COINS && subtype == shield.SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT)
				return { transtype : shield.SELL_ORDER, icon : 'ion-arrow-graph-down-right assertive' };
		if(type == shield.TYPE_COLORED_COINS && subtype == shield.SUBTYPE_COLORED_COINS_BID_ORDER_PLACEMENT)
				return { transtype : shield.BUY_ORDER, icon : 'ion-arrow-graph-up-right balanced' };
		if(type == shield.TYPE_COLORED_COINS && (subtype == shield.SUBTYPE_COLORED_COINS_ASK_ORDER_CANCELLATION || subtype == shield.SUBTYPE_COLORED_COINS_BID_ORDER_CANCELLATION))
				return { transtype : shield.SELL_CANCEL, icon : 'ion-android-cancel assertive' };
		if(type == shield.TYPE_MESSAGING && subtype == shield.SUBTYPE_MESSAGING_VOTE_CASTING)
				return { transtype : shield.VOTE, icon : 'ion-speakerphone' };
		if(type == shield.TYPE_MESSAGING && subtype == shield.SUBTYPE_MESSAGING_ARBITRARY_MESSAGE)
				return { transtype : shield.MESSAGE, icon : 'ion-chatboxes' };
		return { transtype : shield.OTHER, icon : 'ion-arrow-swap' };
	}

	$scope.isFromShown = function(group){
		var retVal = $scope.isGroupShown(group);
		return ((group.type.indexOf("+") != -1) ? true : false) && retVal;
	}

	$scope.isToShown = function(group){
		var retVal = $scope.isGroupShown(group);
		return ((group.type.indexOf("-") != -1) ? true : false) && retVal
	}

	$scope.isAssetShown = function(group)
	{
		return group.asset && $scope.isGroupShown(group);
	}

	$ionicLoading.show({
		duration: 30000,
		noBackdrop: true,
		template: '<ion-spinner icon="spiral"></ion-spinner>'
	});

	$http.get(shield.ADDRESS + '/nxt?requestType=getBlockchainTransactions&account=' + shield.globalAddress)
    .success(function(response) {
		shield.database.removeCollection('transactions');
		transactionsdb = shield.database.addCollection('transactions');
		$ionicLoading.hide();
		$scope.groups = [];
		for (var i=0; i < response.transactions.length; i++) {
			var trans = response.transactions[i];

			var fromAdd = "";
			var toAddr = "";
			var transType = $scope.getType(trans.type, trans.subtype)

			if(transType.transtype == shield.PAYMENT || transType.transtype == shield.MESSAGE)
			{
				var nxtAddress;
				var address = new NxtAddress();
				if (address.set(trans.sender))
					nxtAddress = address.toString();

				var addressRecipient = new NxtAddress();
				addressRecipient.set(trans.recipient);
				if(nxtAddress == shield.globalAddress)
				{
					if(transType.transtype == shield.PAYMENT)
						transType.transtype = "-" + NRS.convertToNXT(trans.amountNQT) + " NXT";
					transType.icon += " assertive";
					fromAdd = address.toString();
					toAddr = addressRecipient.toString();
				}
				else
				{
					if(transType.transtype == shield.PAYMENT)
						transType.transtype = "+" + NRS.convertToNXT(trans.amountNQT) + " NXT";
					transType.icon += " balanced";
					fromAdd = address.toString();
					toAddr = addressRecipient.toString();
				}
			}

			var confirmationsBlocks = '1440+';
			var confirmationsDispColor = "balanced";
			if(trans.confirmations < 1440)
			{
				confirmationsBlocks = trans.confirmations;
				confirmationsDispColor = "assertive";
			}

			transactionsdb.insert({type : transType.transtype, icon : transType.icon, amount : trans.amountNQT, time: trans.timestamp, from : fromAdd, to : toAddr, asset: trans.attachment.asset, confirmations : confirmationsBlocks, confirmDispColor : confirmationsDispColor, fee : trans.feeNQT, dateTime : $filter('formatTimestamp')(trans.timestamp)})
			;
			$scope.groups = transactionsdb.chain().simplesort("time").data();
		}
	})
	.error(function(response) {
	});
}
}
$scope.showTransactions();
});
