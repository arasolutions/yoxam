angular.module('FMPQuizz.admin.controller', [])

.controller('adminCtrl', function($scope, FMP, $http, $ionicPopup, usersService, universService, examensService, localStorageService, $state, $ionicPlatform, $timeout, $q, $ionicLoading, $cordovaFileTransfer, $cordovaFile) {

    var examensUncommitted = examensService.getExamensUncommitted() || [];
    var examensCommitted = examensService.getExamensCommitted() || [];
    $scope.logs = [];
    $scope.data = {};

    $scope.examens = examensUncommitted.concat(examensCommitted);

    $scope.synch = function(examen) {
        $ionicLoading.show({
            template: '<ion-spinner icon="android" class="spinner-assertive"></ion-spinner><br>Envoi ...'
        });
        var d = new Date();
        var deferred = $q.defer();
        examensService.syncExamen(examen, deferred)
            .then(function(server) {
                examen.commitDate = ("0" + d.getDate()).slice(-2) + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
                examen.commit = true;
                examensService.updateExamenWithoutSet(examen);
                $ionicLoading.hide();
            }, function(reject) {
                examen.commit = false;
                $ionicLoading.hide();
            });
        $timeout(function() {
            deferred.resolve();
        }, 15000);
    };

    $scope.showConfirmLogout = function() {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Déconnexion',
            template: 'Etes-vous sûr de vouloir vous déconnecter?',
            cancelText: 'Annuler',
            cancelType: 'button-stable',
            okText: 'Oui',
            okType: 'button-positive'
        });
        confirmPopup.then(function(res) {
            if (res) {
                $state.go('login');
            }
        });
    };

    $scope.clearLogs = function() {
        $scope.logs = [];
    };

    $scope.setName = function() {
        $scope.data.configPane = false;
        var uuid = FMP.UDID + $scope.data.siteId;
        if (ionic.Platform.isWebView()) {
            uuid = window.device.uuid;
        }
        localStorageService.set("tabToBO", true);
        localStorageService.set("siteId", $scope.data.siteId);
        var url = FMP.REMOTE_SERVER + "/api/updatetab/udid/" + uuid + "/label/" + $scope.data.label + "/siteid/" + $scope.data.siteId + "?callback=JSON_CALLBACK";
        $http({
            method: 'JSONP',
            url: url
        });
    };

    $scope.pushInfos = function() {
        $scope.clearLogs();
        var versionUser = localStorageService.get("userDBversion") || "";
        var versionUnivers = localStorageService.get("universDBversion") || "";
        if (ionic.Platform.isWebView()) {
            $scope.logs.push('uuid : ' + window.device.uuid);
        } else {
            $scope.logs.push('uuid : Navigateur PC');
        }
        $scope.logs.push('Version User : ' + versionUser);
        $scope.logs.push('Version Univers : ' + versionUnivers);
    };

    var download = function(mediaList) {
        var prom = [];
        var targetPath;
        var downloadList = [];
        var remaining = 0;
        var deferred = $q.defer();
        var done = function() {
            remaining--;
            if (remaining === 0) {
                deferred.resolve(1);
            }
        }
        for (mediaItem in mediaList) {
            remaining++;
        }
        for (mediaItem in mediaList) {
            (function(media, logs) {
                if (ionic.Platform.isWebView()) {
                    targetPath = cordova.file.documentsDirectory + media;
                    $cordovaFile.checkFile(cordova.file.documentsDirectory, media)
                        .then(function(success) {
                            done();
                        }, function(error) {
                            downloadList.push(media);
                            done();
                        });
                } else {
                    //SImulation fct asynchrone
                    prom.push($timeout(function() {
                        logs.push('Download PC : ' + media);
                        downloadList.push(media);
                        done();
                    }, 1000));
                }
            })(mediaItem, $scope.logs)
        }
        var promise = deferred.promise;
        promise.then(function(result) {
            $scope.logs.push('Verif terminée, à DL : ' + downloadList.length);
            var prom = [];
            var targetPath;
            for (var i = 0; i < downloadList.length; i++) {
                if (ionic.Platform.isWebView()) {
                    targetPath = cordova.file.documentsDirectory + downloadList[i];
                    prom.push($cordovaFileTransfer.download(FMP.REMOTE_SERVER_MEDIA + downloadList[i], targetPath, {}, true));
                } else {
                    prom.push($timeout(function() {}, 1000));
                }
            }
            $q.all(prom).then(function(result) {
                if (ionic.Platform.isWebView()) {

                } else {
                    $scope.logs.push('Promise All (PC)');
                }
                $scope.logs.push('Traitement terminé');
            }, function(reason) {
                //$scope.logs.push('Promise Failed!');
                $scope.logs.push('JSON Fail : ' + JSON.stringify(reason, null, 4));
                for (var i = 0; i < reason.length; i++) {
                    $scope.logs.push(i + ' : ' + reason[i]);
                }
            });
        });
    };

    $scope.forceSyncCan = function() {
        $scope.clearLogs();
        //Appels du WS
        var deferred = $q.defer();
        usersService.getUsers(deferred)
            .then(function(server) {
                usersService.confirmCall();
                $scope.logs.push("Refresh de la base users");
                usersService.replaceAllUsers(server.data.candidats.concat(server.data.administrateurs));
                var mediaList = usersService.getMediaList();
                download(mediaList);
                localStorageService.set("userDBversion", server.data.version || "");
            }, function(reject) {
                $scope.logs.push("getUsers : Erreur ou timeout");
            });
        $timeout(function() {
            deferred.resolve(); // this aborts the request!
        }, 15000);
    };

    $scope.forceSyncUni = function() {
        $scope.clearLogs();

        var deferred = $q.defer();
        universService.getUnivers(deferred)
            .then(function(server) {
                    universService.confirmCall();
                    $scope.logs.push("Refresh de la base univers");
                    universService.replaceAllUnivers(server.data.univers);
                    var mediaList = universService.getMediaList();
                    if (server.data.site_img) {
                        mediaList[server.data.site_img] = server.data.site_img;
                    }
                    for (var j = 0; j < server.data.slidesTut.length; j++) {
                        if (server.data.slidesTut[j].sld_audio) {
                            //mediaList.push(server.data.slidesTut[j].sld_audio);
                            mediaList[server.data.slidesTut[j].sld_audio] = server.data.slidesTut[j].sld_audio;
                        }
                        if (server.data.slidesTut[j].sld_bgimg) {
                            //mediaList.push(server.data.slidesTut[j].sld_bgimg);
                            mediaList[server.data.slidesTut[j].sld_bgimg] = server.data.slidesTut[j].sld_bgimg;
                        }
                    }
                    download(mediaList);
                    localStorageService.set("universDBversion", server.data.version || "");
                    localStorageService.set("slidesTut", server.data.slidesTut);
                    localStorageService.set("site_img", server.data.site_img);
                    var defaultVal = [{ 'id': 0, 'libelle': '' }];
                    localStorageService.set("listeSituation", defaultVal.concat(server.data.listeSituation));
                    localStorageService.set("listeClasse", defaultVal.concat(server.data.listeClasse));
                    localStorageService.set("listeFormation", defaultVal.concat(server.data.listeFormation));
                },
                function(reject) {
                    $scope.logs.push("getUnivers : Erreur ou timeout");
                });
        $timeout(function() {
            deferred.resolve(); // this aborts the request!
        }, 15000);
    };

    $scope.resetLS = function() {
        localStorageService.remove('userDBversion');
        localStorageService.remove('users.json');
        localStorageService.remove('universDBversion');
        localStorageService.remove('univers.json');
        localStorageService.remove('examen.json');
        localStorageService.remove("slidesTut");
        localStorageService.remove("listeSituation");
        localStorageService.remove("listeClasse");
        localStorageService.remove("listeFormation");
        localStorageService.remove("site_img");
        if (ionic.Platform.isWebView()) {
            $cordovaFile.removeFile(cordova.file.dataDirectory, 'loki__lsFMP.univers.json')
                .then(function(success) {
                    $timeout(function() { window.location.reload(true); }, 1000);
                }, function(error) {});
            $cordovaFile.removeFile(cordova.file.dataDirectory, 'loki__lsFMP.users.json')
                .then(function(success) {}, function(error) {});
            $cordovaFile.removeFile(cordova.file.dataDirectory, 'loki__lsFMP.examen.json')
                .then(function(success) {}, function(error) {});
        } else {
            window.location.reload(true);
        }
    };

    $scope.resetTestAccount = function() {
        examensService.resetTestAccount();
    };

    $scope.sendEmail = function() {
        $timeout(function() {
            universService.sendEmail();
        }, 2000);
         $timeout(function() {
            usersService.sendEmail();
        }, 1000);
        examensService.sendEmail();
    };

});
