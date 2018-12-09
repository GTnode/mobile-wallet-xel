
var shield = (function(shield, $, undefined) {
//var peers = ['explorer.xel.org', 'mr-hyde.xeline.org', 'dr-jekyll.xeline.org'];
var peers = ['explorer.xel.org', 'mr-hyde.xeline.org', 'dr-jekyll.xeline.org' ];

var peerTraverse = 0;
var HTTP = "http://";
var HTTPS = "https://";
shield.PORT = "17876";
var ITR2_PEER_TRAVERSE = 150; //for mobile devices do not try to reach more than this number of peers in second iteration of peer discovery
var SLEEP_TIME = 5000; //5000 = 5 seconds
var peersfrmDB = [];
var apipeersfrmDB = [];
shield.database = new loki('shield.json');
var peersdbs;
var apipeersdb;
var api_disabled_peersdb;
var peerbalancedb;
shield.trustedpeersdb;
shield.ADDRESS = "";
shield.PEER_IP = [];

shield.discover = function()
{
	loaderIconText('Peer discovery started..');
	shield.database.removeCollection('peers');
	peersdbs = shield.database.addCollection('peers');

	shield.database.removeCollection('apipeers');
	apipeersdb = shield.database.addCollection('apipeers');

	shield.database.removeCollection('apidisabledpeers');
	api_disabled_peersdb = shield.database.addCollection('apidisabledpeers');

	shield.database.removeCollection('peerbalance');
	peerbalancedb = shield.database.addCollection('peerbalance');

	shield.database.removeCollection('trustedpeers');
	shield.trustedpeersdb = shield.database.addCollection('trustedpeers');

	for(var i = 0; i < peers.length; i++)
	{
		discoverPeers(HTTP + peers[i]);
	}

	setTimeout(executeItr_1, SLEEP_TIME);
}

function executeItr_1()
{
	if(peerTraverse < peers.length-1)
	{
		loaderIconText('Searching peers: ' + peerTraverse + "/" + peers.length);
		setTimeout(executeItr_1, SLEEP_TIME)
		return;
	}
	peerTraverse = 0;
	for(i = 1; i <= peersdbs.data.length; i++)
	{
		data = peersdbs.get(i);
		var ip = HTTP + data.nwpeer;
		peersfrmDB.push(ip);
		discoverPeers(ip);

		if(i >= ITR2_PEER_TRAVERSE)
		{
			break;
		}
	}
	setTimeout(executeItr_2, SLEEP_TIME);
}

function executeItr_2()
{
	var total = peersfrmDB.length;
   if((peerTraverse + ((total*5)/100)) < (total - 1))
   {
		loaderIconText('Searching peers: ' + peerTraverse + "/" + peersfrmDB.length);
		setTimeout(executeItr_2, SLEEP_TIME)
		return;
   }
   peerTraverse = 0;
	for(i = 1; i <= apipeersdb.data.length; i++)
	{
		data = apipeersdb.get(i);
		var ip = data.peer;
		apipeersfrmDB.push(ip);
		trustedPeers(ip);
	}

	setTimeout(executeItr_3, SLEEP_TIME);
}

function executeItr_3()
{
	var total = apipeersfrmDB.length;
   if((peerTraverse + ((total*5)/100)) < (total - 1))
   {
		loaderIconText('Searching peers: ' + peerTraverse + "/" + apipeersfrmDB.length);
		setTimeout(executeItr_3, SLEEP_TIME)
		return;
   }
   populateTrustedPeers();
}

function discoverPeers(ip)
{
	var url = "";
	if(api_disabled_peersdb.findOne({'apidispeer': ip}) != null || apipeersdb.findOne({'peer': ip}) != null)
	{
		peerTraverse++;
		return;
	}

	 if(ip.indexOf(":") != -1)
		url = ip + ':' + shield.PORT +'/nxt?requestType=getPeers';
	else
		url = ip + '/nxt?requestType=getPeers';

	var apiPeers = [];
	$.ajax({
			url: url,
			crossDomain: true,
			type: "POST",
			async: true
		}).done(function(json) {
			if (json.errorCode && !json.errorDescription) {
				json.errorDescription = (json.errorMessage ? json.errorMessage : $.t("server_error_unknown"));
			}
			var parsedjson = $.parseJSON(json);
			var error = false;
			$(parsedjson).each(function(i,val){
				$.each(val,function(k,v){
				  if(k == "peers")
				  {
					  $(v).each(function(j,peer){
						var httppeer = HTTP + peer;
						if(peersdbs.findOne({'nwpeer': peer}) == null && apipeersdb.findOne({'peer': httppeer}) == null && api_disabled_peersdb.findOne({'apidispeer': httppeer}) == null)
						{
							peersdbs.insert({nwpeer: peer });
						}
					});
				  }
				  if(k == "errorDescription")
				  {
					  error = true;
				  }
			});
			});
			if(apipeersdb.findOne({'peer': ip}) == null && !error)
			{
				apipeersdb.insert({peer: ip});
			}
			peerTraverse++;
		}).fail(function(xhr, textStatus, error) {
			if(api_disabled_peersdb.findOne({'apidispeer': ip}) == null)
			{
				api_disabled_peersdb.insert({apidispeer: ip});
			}
			peerTraverse++;
		});
}

function trustedPeers(ip)
{
	var url = '/nxt?requestType=getBalance&account=XEL-K5KL-23DJ-3XLK-22222';
	 if(ip.indexOf(":") != -1)
		url = ip + ':' + shield.PORT + url; //trustedPeers should be called only after paraphrase is entered
	else
		url = ip + url; //trustedPeers should be called only after paraphrase is entered
	var trustedPeers = [];
	$.ajax({
			url: url,
			crossDomain: true,
			type: "POST",
			async: true
		}).done(function(json) {
			if (json.errorCode && !json.errorDescription) {
				json.errorDescription = (json.errorMessage ? json.errorMessage : $.t("server_error_unknown"));
			}
			var parsedjson = $.parseJSON(json);
			$(parsedjson).each(function(i,balance){
			var balanceVal = 0;
			if(balance.guaranteedBalanceNQT == 'undefined' || balance.guaranteedBalanceNQT == undefined)
				balanceVal = 0;
			else
				balanceVal = balance.guaranteedBalanceNQT;

			peerbalancedb.insert({peer: ip, guaranteedBalanceNQT : balanceVal});
			peerTraverse++;
			});
			}).fail(function(xhr, textStatus, error) {
			peerTraverse++;
		});
}

function populateTrustedPeers()
{
	var balanceList = peerbalancedb.chain().simplesort("guaranteedBalanceNQT").data();
	counter = {}

	balanceList.forEach(function(obj) {
		var key = JSON.stringify(obj.guaranteedBalanceNQT)
		counter[key] = (counter[key] || 0) + 1
	})

	var guranteedBalance = 0;
	var guranteedBalanceCount = 0;
	var init = true;
	for (var m in counter){
		if(init)
		{
			guranteedBalance = m;
			guranteedBalanceCount = counter[m];
			init = false;
		}
		if(counter[m] > guranteedBalanceCount)
		{
			guranteedBalance = m;
			guranteedBalanceCount = counter[m];
		}
	}

	var trustedPeerList = "";
	shield.PEER_IP = [];
	for(var i = 0; i < balanceList.length; i++)
	{
		if(JSON.stringify(balanceList[i].guaranteedBalanceNQT) == guranteedBalance)
		{
			var peerIP = balanceList[i].peer;
			shield.trustedpeersdb.insert({ip_peer : peerIP});
			trustedPeerList = peerIP + "," + trustedPeerList;
			shield.PEER_IP.push(peerIP);
		}
	}

	var userdbs = shield.usersettings.getCollection(shield.USER_SETTING_COLLECTION);

	if(userdbs == null || userdbs == 'undefined')
	{
		userdbs = shield.usersettings.addCollection(shield.USER_SETTING_COLLECTION);
		userdbs.insert({key:shield.TRUSTED_PEERS, value:trustedPeerList});
	}
	else
	{
		var trustedPeerdata = userdbs.findOne({'key' : shield.TRUSTED_PEERS});
		trustedPeerdata.value = trustedPeerList
		userdbs.update(trustedPeerdata);
	}

	try{
		shield.createWrite(shield.FILE_ENTRY);
   } catch (e) {
	}
	shield.getPeer();
	console.log(shield.ADDRESS)
	loaderIcon('hide');
}
	return shield;
 }(shield || {}, jQuery));
