

shield.index.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('account', {
      url: '/account',
      templateUrl: 'templates/account.html',
      controller: 'AccountCtrl'
    });
})
.controller('AccountCtrl', function($scope, $state) {
	$scope.globalAddress = shield.globalAddress;
	  $scope.items = [
    { id: "sendNxt", option: '		Send', detail: 'Send amount to XEL Address', icon: 'ion-card' },
	{ id: "messages", option: '		Message', detail: 'Read, Compose, Send messages', icon: 'ion-chatboxes' },
	{ id: "transactions", option: '		Transactions', detail: 'View transactions of your account' , icon: 'ion-arrow-swap'},
  ];
})
