angular.module('FMPQuizz').factory('universService', ['$q', 'Loki', '$http', 'FMP', 'localStorageService', universService]);

function universService($q, Loki, $http, FMP, localStorageService) {
    var _db;
    var _univers;
    var _server = FMP.REMOTE_SERVER;

    function initDB() {

        if (!ionic.Platform.isWebView()) {
            _db = new Loki('lsFMP.univers.json', {
                autosave: true,
                autosaveInterval: 1000
            });
        } else {
            var adapter = new LokiCordovaFSAdapter({
                "prefix": "loki"
            });
            _db = new Loki('lsFMP.univers.json', {
                autosave: true,
                autosaveInterval: 1000,
                //autoload:true
                adapter: adapter
            });
        }

        return $q(function(resolve, reject) {
            var options = {};

            _db.loadDatabase(options, function() {
                _univers = _db.getCollection('univers');
                if (!_univers) {
                    _univers = _db.addCollection('univers');
                    _univers.ensureUniqueIndex('uni_id');
                }
                resolve(_univers.data);
            });
        });
    };

    function getUnivers(deferred) {
        return $http.get('json/loki__lsFMP.univers.json');
        var uuid = FMP.UDID + (localStorageService.get("siteId") || '1');
        var url = _server + "/api/univers/udid/"+uuid+"?callback=JSON_CALLBACK";
        return $http({
            method: 'JSONP',
            url: url,
            timeout: deferred.promise
        });
    };

    function replaceAllUnivers(univers) {
        _univers.removeDataOnly();
        for (var i = 0; i < univers.length; i++) {
            _univers.insert(univers[i]);
        }
    };

    function getUniversById(ids) {
        var idList = [].concat(ids);
        var arrReturn = [];
        var tmp;
        for (var i = 0; i < idList.length; i++) {
            var id = _univers.by('uni_id', idList[i]);
            if (id){
                tmp = JSON.parse(JSON.stringify(id));
                delete tmp.$$hashKey;
                delete tmp.$loki;
                delete tmp.meta;
                arrReturn[i] = tmp;
            } else {
                return false;
            }
        }
        return arrReturn;
    };

    function getMediaList() {
        var arrReturn = [];
        for (var i = 0; i < _univers.data.length; i++) {
            if (_univers.data[i].uni_logo) {
                //arrReturn.push(_univers.data[i].uni_logo);
                arrReturn[_univers.data[i].uni_logo] = _univers.data[i].uni_logo;
            }
            if (_univers.data[i].questionnaires) {
                for (var j = 0; j < _univers.data[i].questionnaires.length; j++) {
                    if (_univers.data[i].questionnaires[j].qtr_audio) {
                        //arrReturn.push(_univers.data[i].questionnaires[j].qtr_audio);
                        arrReturn[_univers.data[i].questionnaires[j].qtr_audio] = _univers.data[i].questionnaires[j].qtr_audio;
                    }
                    if (_univers.data[i].questionnaires[j].qtr_img) {
                        //arrReturn.push(_univers.data[i].questionnaires[j].qtr_img);
                        arrReturn[_univers.data[i].questionnaires[j].qtr_img] = _univers.data[i].questionnaires[j].qtr_img;
                    }
                    if (_univers.data[i].questionnaires[j].slidesTut && _univers.data[i].questionnaires[j].slidesTut[0].sld_bgimg) {
                        //arrReturn.push(_univers.data[i].questionnaires[j].slidesTut[0].sld_bgimg);
                        arrReturn[_univers.data[i].questionnaires[j].slidesTut[0].sld_bgimg] = _univers.data[i].questionnaires[j].slidesTut[0].sld_bgimg;
                    }
                    if (_univers.data[i].questionnaires[j].slidesTut && _univers.data[i].questionnaires[j].slidesTut[0].sld_audio) {
                        //arrReturn.push(_univers.data[i].questionnaires[j].slidesTut[0].sld_audio);
                        arrReturn[_univers.data[i].questionnaires[j].slidesTut[0].sld_audio] = _univers.data[i].questionnaires[j].slidesTut[0].sld_audio;
                    }
                    for (var k2 = 0; k2 < _univers.data[i].questionnaires[j].slidesTut.length; k2++) {
                        if (_univers.data[i].questionnaires[j].slidesTut[k2].blocs) {
                            for (var k3 = 0; k3 < _univers.data[i].questionnaires[j].slidesTut[k2].blocs.length; k3++) {
                                if (_univers.data[i].questionnaires[j].slidesTut[k2].blocs[k3].questions) {
                                    for (var k4 = 0; k4 < _univers.data[i].questionnaires[j].slidesTut[k2].blocs[k3].questions.length; k4++) {
                                        if (_univers.data[i].questionnaires[j].slidesTut[k2].blocs[k3].questions[k4].q_img) {
                                            arrReturn[_univers.data[i].questionnaires[j].slidesTut[k2].blocs[k3].questions[k4].q_img] = _univers.data[i].questionnaires[j].slidesTut[k2].blocs[k3].questions[k4].q_img;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    for (var k = 0; k < _univers.data[i].questionnaires[j].slides.length; k++) {
                        if (_univers.data[i].questionnaires[j].slides[k].sld_bgimg) {
                            //arrReturn.push(_univers.data[i].questionnaires[j].slides[k].sld_bgimg);
                            arrReturn[_univers.data[i].questionnaires[j].slides[k].sld_bgimg] = _univers.data[i].questionnaires[j].slides[k].sld_bgimg;
                        }
                        if (_univers.data[i].questionnaires[j].slides[k].blocs) {
                            for (var l = 0; l < _univers.data[i].questionnaires[j].slides[k].blocs.length; l++) {
                                for (var m = 0; m < _univers.data[i].questionnaires[j].slides[k].blocs[l].questions.length; m++) {
                                    if (_univers.data[i].questionnaires[j].slides[k].blocs[l].questions[m].q_img) {
                                        arrReturn[_univers.data[i].questionnaires[j].slides[k].blocs[l].questions[m].q_img] = _univers.data[i].questionnaires[j].slides[k].blocs[l].questions[m].q_img;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return arrReturn;
    };

    function confirmCall() {
        var uuid = FMP.UDID + localStorageService.get("siteId");
        if (ionic.Platform.isWebView()) {
            uuid = window.device.uuid;
        }
        var url = _server + "/api/updateSync/udid/" + uuid + "/flux/univ?callback=JSON_CALLBACK";
        $http({
            method: 'JSONP',
            url: url
        });
    };

    function getNbIndice() {
        var nb = 0;
        for (var i = 0; i < _univers.data.length; i++) {
            if (_univers.data[i].questionnaires) {
                for (var j = 0; j < _univers.data[i].questionnaires.length; j++) {
                    for (var k = 0; k < _univers.data[i].questionnaires[j].slides.length; k++) {
                        if (_univers.data[i].questionnaires[j].slides[k].blocs) {
                            for (var l = 0; l < _univers.data[i].questionnaires[j].slides[k].blocs.length; l++) {
                                nb += _univers.data[i].questionnaires[j].slides[k].blocs[l].questions.length;
                            }
                        }
                    }
                }
            }
        }
        return nb;
    };

    function sendEmail(){
        console.log(_db.collections[0].data);
        $http.post(FMP.WS_MAIL, {
            'data': _univers
        }).success(function(data, status) {
        }).
        error(function(data, status, headers, config) {});
    }

    return {
        initDB: initDB,
        getUnivers: getUnivers,
        replaceAllUnivers: replaceAllUnivers,
        getUniversById: getUniversById,
        getMediaList: getMediaList,
        confirmCall: confirmCall,
        getNbIndice: getNbIndice,
        sendEmail: sendEmail
    };
}
