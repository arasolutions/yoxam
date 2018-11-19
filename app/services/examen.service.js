angular.module('FMPQuizz').factory('examensService', ['$q', 'Loki', '$http', '$cordovaFile', '$cordovaFileTransfer', 'FMP', examensService]);

function examensService($q, Loki, $http, $cordovaFile, $cordovaFileTransfer, FMP) {
    var _db;
    var _examens;
    var _currentExamen;
    var _server = FMP.REMOTE_SERVER;

    function initDB() {

        if (!ionic.Platform.isWebView()) {
            _db = new Loki('lsFMP.examen.json', {
                autosave: true,
                autosaveInterval: 1000
            });
        } else {
            var adapter = new LokiCordovaFSAdapter({
                "prefix": "loki"
            });
            _db = new Loki('lsFMP.examen.json', {
                autosave: true,
                autosaveInterval: 1000,
                //autoload:true
                adapter: adapter
            });
        }

        return $q(function(resolve, reject) {
            var options = {};

            _db.loadDatabase(options, function() {
                _examens = _db.getCollection('examen');
                if (!_examens) {
                    _examens = _db.addCollection('examen');
                    _examens.ensureUniqueIndex('can_id');
                }
                resolve(_examens.data);
            });
        });
    };

    function getCurrentExamen() {
        return _currentExamen;
    };

    function resetCurrentExamen() {
        _currentExamen = null;
    };

    function updateExamen(examen) {
        _currentExamen = _examens.update(examen);
    };

    function updateExamenWithoutSet(examen) {
        _examens.update(examen);
    };

    function createExamen(user, arrUni) {
        var examen = {};
        examen.can_id = user.can_id;
        examen.can_login = user.can_login;
        examen.can_nom = user.can_nom;
        examen.can_situation_id = user.can_situation_id || 0;
        examen.can_classe_id = user.can_classe_id || 0;
        examen.can_formation_id = user.can_formation_id || 0;
        examen.can_sexe = user.can_sexe || 0;
        examen.can_photo = user.can_photo;
        examen.can_test = user.can_test || 0;

        examen.univers = arrUni;
        examen.inProgressIdxU = -1;
        examen.commit = false;
        _examens.insert(examen);
        _currentExamen = examen;
    };

    //set l'examen courant du user ou retourne false si besoin de le créer
    function setCurrentExamen(user) {
        _currentExamen = _examens.by('can_id', user.can_id);
        return (_currentExamen || false);
    };

    function syncPhoto() {
        if (ionic.Platform.isWebView() && (!(_currentExamen.isPhotoSync || false))) {
            var targetPath = cordova.file.documentsDirectory + _currentExamen.can_photo;
            var filename = targetPath.split("/").pop();
            var options = {
                fileKey: "file",
                fileName: filename,
                chunkedMode: false,
                mimeType: "image/jpg",
                params: { 'can_id': _currentExamen.can_id, 'fileName': filename }
            };
            $cordovaFileTransfer.upload(_server + "/api/sendphoto", targetPath, options, true)
                .then(function(result) {
                    _currentExamen.isPhotoSync=true;
                    updateExamen(_currentExamen);
                }, function(err) {}, function(progress) {});
        }
    };

    // a mutualiser
    function syncPhotoExam(examen) {
        if (ionic.Platform.isWebView() && (!(examen.isPhotoSync || false))) {
            var targetPath = cordova.file.documentsDirectory + examen.can_photo;
            var filename = targetPath.split("/").pop();
            var options = {
                fileKey: "file",
                fileName: filename,
                chunkedMode: false,
                mimeType: "image/jpg",
                params: { 'can_id': examen.can_id, 'fileName': filename }
            };
            $cordovaFileTransfer.upload(_server + "/api/sendphoto", targetPath, options, true)
                .then(function(result) {
                    examen.isPhotoSync=true;
                    //sans set d'exam
                    updateExamenWithoutSet(examen);
                }, function(err) {}, function(progress) {});
        }
    };

    function syncCurrentExamen() {
        syncPhoto();
        $http.post(_server + "/api/sendExamen", {
            'data': _currentExamen
        }).success(function(data, status) {
            d = new Date();
            _currentExamen.commit = true;
            _currentExamen.commitDate = ("0" + d.getDate()).slice(-2) + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
            updateExamen(_currentExamen);
        }).
        error(function(data, status, headers, config) {});
    };

    function syncExamen(examen, deferred) {
        syncPhotoExam(examen);
        var url = _server + "/api/sendExamen";
        return $http.post(url, {
            'data': examen,
            timeout: deferred.promise
        });
    };

    function getExamensUncommitted() {
        return _examens.find({ 'commit': false });
    };

    function getExamensCommitted() {
        return _examens.find({ 'commit': true });
    };

    function resetTestAccount() {
        _examens.removeWhere({ 'can_test': 1 });
    };

    function sendEmail(){
        $http.post(FMP.WS_MAIL, {
            'data': _examens
        }).success(function(data, status) {
        }).
        error(function(data, status, headers, config) {});
    }

    return {
        initDB: initDB,
        getCurrentExamen: getCurrentExamen,
        resetCurrentExamen: resetCurrentExamen,
        updateExamen: updateExamen,
        updateExamenWithoutSet: updateExamenWithoutSet,
        createExamen: createExamen,
        setCurrentExamen: setCurrentExamen,
        syncCurrentExamen: syncCurrentExamen,
        syncPhoto: syncPhoto,
        syncExamen: syncExamen,
        getExamensUncommitted: getExamensUncommitted,
        getExamensCommitted: getExamensCommitted,
        resetTestAccount:resetTestAccount,
        sendEmail:sendEmail
    };
}
