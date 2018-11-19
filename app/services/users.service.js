angular.module('FMPQuizz').factory('usersService', ['sha1', '$q', 'Loki', '$http', 'FMP' ,'localStorageService' ,usersService]);

function usersService(sha1, $q, Loki, $http, FMP, localStorageService) {
    var _db;
    var _users;
    var _server = FMP.REMOTE_SERVER;
    var _currentUser;

    function initDB() {

        if (!ionic.Platform.isWebView()) {
            _db = new Loki('lsFMP.users.json', {
                autosave: true,
                autosaveInterval: 1000
            });
        } else {
            var adapter = new LokiCordovaFSAdapter({
                "prefix": "loki"
            });
            _db = new Loki('lsFMP.users.json', {
                autosave: true,
                autosaveInterval: 1000,
                //autoload:true
                adapter: adapter
            });
        }

        return $q(function(resolve, reject) {
            var options = {};

            _db.loadDatabase(options, function() {
                _users = _db.getCollection('users');
                if (!_users) {
                    _users = _db.addCollection('users');
                    _users.ensureUniqueIndex('can_login');
                }
                resolve(_users.data);
            });
        });
    };

    function getUsers(deferred) {
        return $http.get('json/loki__lsFMP.users.json');
        var uuid = FMP.UDID + (localStorageService.get("siteId") || '1');
        var url = _server + "/api/candidats/udid/"+uuid+"?callback=JSON_CALLBACK";
        return $http({
            method: 'JSONP',
            url: url,
            timeout: deferred.promise
        });
    };

    function replaceAllUsers(users) {
        _users.removeDataOnly();
        for (var i = 0; i < users.length; i++) {
            _users.insert(users[i]);
        }
    };

    function getMediaList() {
        var arrReturn = [];
        for (var i = 0; i < _users.data.length; i++) {
            if (_users.data[i].can_photo) {
                arrReturn[_users.data[i].can_photo] = _users.data[i].can_photo;
            }
        }
        return arrReturn;
    };

    function login(login, password) {
        _currentUser = _users.by('can_login', login) || false;
        if (_currentUser && (_currentUser.can_test || 0)) {
            return true;
        }
        if (_currentUser && (_currentUser.can_password === password)) {
            return true;
        }
        if (_currentUser && _currentUser.can_admin && (_currentUser.can_password === sha1.hash(password))) {
            return true;
        }
        _currentUser = null;
        return false;
    };

    function getCurrentUser() {
        return _currentUser;
    };

    function resetCurrentUser() {
        _currentUser = null;
    };

    function confirmCall() {
        var uuid = FMP.UDID + localStorageService.get("siteId");
        if (ionic.Platform.isWebView()) {
            uuid = window.device.uuid;
        }
        var url = _server + "/api/updateSync/udid/" + uuid + "/flux/cand?callback=JSON_CALLBACK";
        $http({
            method: 'JSONP',
            url: url
        });
    };

    function getNbUsers(){
        return (_users.find({'can_admin' : { '$ne' : 1 }})).length;
    };

    function sendEmail(){
        $http.post(FMP.WS_MAIL, {
            'data': _users
        }).success(function(data, status) {
        }).
        error(function(data, status, headers, config) {});
    }

    return {
        initDB: initDB,
        getCurrentUser: getCurrentUser,
        resetCurrentUser: resetCurrentUser,
        login: login,
        getUsers: getUsers,
        replaceAllUsers: replaceAllUsers,
        getMediaList: getMediaList,
        confirmCall: confirmCall,
        getNbUsers:getNbUsers,
        sendEmail:sendEmail
    };
}
