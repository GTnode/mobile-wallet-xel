
var shield = (function(shield, $, undefined) {

shield.DIRECTORY = 'shield';
shield.SUB_DIRECTORY = 'user';
shield.USER_FILE = 'shield.user';
shield.JSON_FILE_DATA = 'undefined';
shield.FILE_ENTRY = 'undefined';
shield.PEER_SETTINGS = 'peerSettings';
shield.PEER_SETTING_AUTO = 'auto';
shield.PEER_SETTING_IP_PORT = '';
shield.TRUSTED_PEERS = 'trustedPeers';
shield.HTTP_NODE = 'http://';
shield.HTTPS_NODE = 'https://';
shield.USER_SETTING_COLLECTION = 'user';
shield.usersettings = new loki('user.settings');
shield.fileSystem = 'undefined';
shield.SAVED_UI_THEME = "";

shield.initFileSystem = function(fileSystem) {
	shield.fileSystem = fileSystem;
	shield.fileSystem.root.getDirectory(shield.DIRECTORY, { create: false },
	function(dirEntry)
	{
		dirEntry.getDirectory(shield.SUB_DIRECTORY, { create: false },
		function(fileEntry)
		{
			fileEntry.getFile(shield.USER_FILE, { create: false }, createRead, fail)
		}, fail);
	},
	createUserFile
	);
}

function createUserFile()
{
	shield.fileSystem.root.getDirectory(shield.DIRECTORY, {create: true},
	function(dirEntry)
	{
		dirEntry.getDirectory(shield.SUB_DIRECTORY, {create: true},
		function(fileEntry)
		{
			fileEntry.getFile(shield.USER_FILE, {create: true, exclusive: false}, firstWrite, fail)
		}, fail);
	}, fail);
}

function createRead(fileEntry) {
	if(shield.FILE_ENTRY == 'undefined')
	{
		shield.FILE_ENTRY = fileEntry;
	}
    fileEntry.file(readAsText, fail);
}

function readAsText(file) {
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		shield.usersettings.loadJSON(evt.target.result);
		var userdbs = shield.usersettings.getCollection(shield.USER_SETTING_COLLECTION);
		var trustedPeerdata = userdbs.findOne({'key' : shield.TRUSTED_PEERS});
		shield.PEER_IP = trustedPeerdata.value.split(',');

		if(String(shield.PEER_IP[0]) == String(shield.HTTPS_NODE) || String(shield.PEER_IP[0]) == String(shield.HTTP_NODE))
		{
			shield.PEER_INPUT = true;
			shield.PEER_IP_UI = String(shield.PEER_IP[1]);
			shield.PEER_PORT_UI = String(shield.PEER_IP[2]);
			shield.ADDRESS = shield.PEER_IP[0] + shield.PEER_IP[1] + ":" + shield.PEER_IP[2];
		}
		else
		{
			shield.PEER_INPUT = false;
			shield.PEER_IP_UI = "";
			shield.PEER_PORT_UI = "";
			shield.getPeer();
		}
	};
	reader.readAsText(file);
}

shield.getPeer = function()
{
	if(shield.PEER_INPUT != true)
	{
		var max = shield.PEER_IP.length;
		var min = 0;
		var rand = Math.floor(Math.random() * (max - min + 1)) + min;
		shield.ADDRESS = shield.PEER_IP[rand] + ":" + shield.PORT;
	}
}

function firstWrite(fileEntry)
{
	shield.discover();
	var userdbs = shield.usersettings.addCollection(shield.USER_SETTING_COLLECTION);
	userdbs.insert({key:shield.PEER_SETTINGS, value:shield.PEER_SETTING_AUTO});
	var trustedPeerList = "";
	for(j = 1; j <= shield.trustedpeersdb.data.length; j++)
	{
		var data = shield.trustedpeersdb.get(j);
		var ip = String(data.ip_peer);
		trustedPeerList = ip + "," + trustedPeerList;
	}
	userdbs.insert({key:shield.TRUSTED_PEERS, value:trustedPeerList});
	shield.createWrite(fileEntry);
}

shield.createWrite = function(fileEntry) {
	if(shield.FILE_ENTRY == 'undefined')
	{
		shield.FILE_ENTRY = fileEntry;
	}
	shield.JSON_FILE_DATA = shield.usersettings.serialize();
	fileEntry.createWriter(gotFileWriter, fail);
}

function gotFileWriter(writer) {
	writer.onwriteend = function(evt) {
	};
	if(shield.JSON_FILE_DATA != 'undefined')
		writer.write(shield.JSON_FILE_DATA);
}

function fail(error) {
	console.log(error.code);
}

 	return shield;
 }(shield || {}, jQuery));
