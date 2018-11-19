angular.module('FMPQuizz.check.controller', [])

.controller('checkCtrl', function($scope, $stateParams, FMP, usersService, universService, examensService, localStorageService, $state, $ionicPlatform, $timeout, $q, $ionicLoading, $cordovaFileTransfer, $cordovaFile) {

    $scope.logs = [];
    var versionRemote;
    var versionLocale = localStorageService.get("userDBversion") || "";
    var versionRemoteUnivers;
    var versionLocaleUnivers = localStorageService.get("universDBversion") || "";
    var nbdl = 0;

    //Pour prévisu
    if (!ionic.Platform.isWebView()) {
        var siteId = $stateParams.siteId || 1;
        localStorageService.set("siteId", siteId);
        localStorageService.set("tabToBO", true);
    }

    $scope.showWaiting = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="android" class="spinner-balanced"></ion-spinner><br>Chargement...'
        });
    };
    $scope.hideWaiting = function() {
        $ionicLoading.hide();
    };

    function gotoLogin() {
        nbdl++;
        if (nbdl === 2) {
            $state.go('login');
        }
    };

    var download = function(nbThread, mediaList) {
        var prom = [];
        /*for (var i = 0; i < nbThread; i++) {
            if (mediaList[i]) {
                (function(url, logs) {
                    var targetPath;
                    if (ionic.Platform.isWebView()) {
                        targetPath = cordova.file.documentsDirectory + url;
                        $cordovaFile.checkFile(cordova.file.documentsDirectory, url)
                            .then(function(success) {
                                logs.push('Url : ' + url + ' -> already exists');
                            }, function(error) {
                                logs.push('Url : ' + url + ' -> download');
                                prom.push($cordovaFileTransfer.download(FMP.REMOTE_SERVER_MEDIA + url, targetPath, {}, true));
                            });
                    } else {
                        //SImulation fct asynchrone
                        prom.push($timeout(function() {
                            logs.push('Download PC : ' + url);
                        }, 1000));
                    }
                })(mediaList[i], $scope.logs);
            }
        }*/
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
        //for (var i = 0; i < mediaList.length; i++) {
        for (mediaItem in mediaList) {
            (function(media, logs) {
                if (ionic.Platform.isWebView()) {
                    targetPath = cordova.file.documentsDirectory + media;
                    $cordovaFile.checkFile(cordova.file.documentsDirectory, media)
                        .then(function(success) {
                            done();
                            //logs.push('-> already exists');
                        }, function(error) {
                            //logs.push('-> to download : ' + media);
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
            //$scope.logs.push('Lacement $q.all');
            $q.all(prom).then(function(result) {
                //$scope.logs.push('Lacement $q.all - then ' + JSON.stringify(result, null, 4));
                if (ionic.Platform.isWebView()) {
                    //$scope.logs.push('Promise All (Device)');
                    /*for (var i = 0; i < result.length; i++) {
                        $scope.logs.push('Downloaded here : ' + result[i].nativeURL);
                    }*/
                    //$scope.img = result[0].nativeURL;
                } else {
                    $scope.logs.push('Promise All (PC)');
                }
                $scope.logs.push('Traitement terminé');
                gotoLogin();
            }, function(reason) {
                //$scope.logs.push('Promise Failed!');
                $scope.logs.push('JSON Fail : ' + JSON.stringify(reason, null, 4));
                for (var i = 0; i < reason.length; i++) {
                    $scope.logs.push(i + ' : ' + reason[i]);
                }
            });
        });

        /* for (var i = 0; i < mediaList.length; i++) {
             if (ionic.Platform.isWebView()) {
                 targetPath = cordova.file.documentsDirectory + mediaList[i];
                 $cordovaFile.checkFile(cordova.file.documentsDirectory, mediaList[i])
                     .then(function(success) {
                         logs.push('Url : ' + mediaList[i] + ' -> already exists');
                     }, function(error) {
                         logs.push('Url : ' + mediaList[i] + ' -> download');
                         prom.push($cordovaFileTransfer.download(FMP.REMOTE_SERVER_MEDIA + mediaList[i], targetPath, {}, true));
                     });
             } else {
                 //SImulation fct asynchrone
                 prom.push($timeout(function() {
                     logs.push('Download PC : ' + mediaList[i]);
                 }, 1000));
             }
         }*/
        /*$scope.logs.push('Lacement $q.all');
        $q.all(prom).then(function(result) {
            $scope.logs.push('Lacement $q.all - then ' + JSON.stringify(result, null, 4));
            if (ionic.Platform.isWebView()) {
                //$scope.logs.push('Promise All (Device)');
                for (var i = 0; i < result.length; i++) {
                    $scope.logs.push('Downloaded here : ' + result[i].nativeURL);
                }
                //$scope.img = result[0].nativeURL;
            } else {
                $scope.logs.push('Promise All (PC)');
            }
            /*mediaList = mediaList.slice(nbThread);
            if (mediaList.length > 0) {
                download(nbThread, mediaList);
            } else {
                $scope.logs.push('End');
            }*/
        /*$scope.logs.push('End');
        }, function(reason) {
            $scope.logs.push('Promise Failed!');
            $scope.logs.push('JSON : ' + JSON.stringify(reason, null, 4));
            for (var i = 0; i < reason.length; i++) {
                $scope.logs.push(i + ' : ' + reason[i]);
            }
        });*/
    };
    var getUsers = function() {
        //Chargement de la base locale, appel asyn pour s'assurer que tout est chargé dans _users
        usersService.initDB()
            .then(function(users) {
                //Appels du WS
                var deferred = $q.defer();
                usersService.getUsers(deferred)
                    .then(function(server) {
                        usersService.confirmCall();
                        versionRemote = server.data.version || "";
                        $scope.logs.push("version R / L : " + versionRemote + ' VS ' + versionLocale + ' -> refresh : ' + (versionRemote !== versionLocale));
                        //si retour et version changée alors on remplace
                        if (versionRemote !== versionLocale) {
                            $scope.logs.push("Refresh de la base users");
                            usersService.replaceAllUsers(server.data.candidats.concat(server.data.administrateurs));
                            //médias des users
                            var mediaList = usersService.getMediaList();
                            //mediaList['media/candidats/default.png'] = 'media/candidats/default.png';
                            download(3, mediaList);
                            localStorageService.set("userDBversion", versionRemote);
                        } else {
                            gotoLogin();
                        }
                        //$state.go('login');
                    }, function(reject) {
                        $scope.logs.push("getUsers : Erreur ou timeout");
                        gotoLogin();
                        //$state.go('login');
                    });
                $timeout(function() {
                    deferred.resolve(); // this aborts the request!
                }, 15000);
            });
    };

    var getUnivers = function() {
        //Chargement de la base locale, appel asyn pour s'assurer que tout est chargé dans _users
        universService.initDB()
            .then(function(users) {
                //Appels du WS
                var deferred = $q.defer();
                universService.getUnivers(deferred)
                    .then(function(server) {
                            universService.confirmCall();
                            versionRemoteUnivers = server.data.version || "";
                            $scope.logs.push("version (univers) R / L : " + versionRemoteUnivers + ' VS ' + versionLocaleUnivers + ' -> refresh : ' + (versionRemoteUnivers !== versionLocaleUnivers));
                            //si retour et version changée alors on remplace
                            if (versionRemoteUnivers !== versionLocaleUnivers) {
                                $scope.logs.push("Refresh de la base univers + DL des médias");
                                universService.replaceAllUnivers(server.data.univers);
                                //médias de l'univers
                                var mediaList = universService.getMediaList();
                                //médias du tuto gen
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
                                download(3, mediaList);
                                localStorageService.set("universDBversion", versionRemoteUnivers);
                                localStorageService.set("site_img", server.data.site_img);
                                localStorageService.set("slidesTut", server.data.slidesTut);
                                var defaultVal = [{ 'id': 0, 'libelle': '' }];
                                localStorageService.set("listeSituation", defaultVal.concat(server.data.listeSituation));
                                localStorageService.set("listeClasse", defaultVal.concat(server.data.listeClasse));
                                localStorageService.set("listeFormation", defaultVal.concat(server.data.listeFormation));
                            } else {
                                gotoLogin();
                            }
                            //$state.go('login');
                        },
                        function(reject) {
                            $scope.logs.push("getUnivers : Erreur ou timeout");
                            gotoLogin();
                            //$state.go('login');
                        });
                $timeout(function() {
                    deferred.resolve(); // this aborts the request!
                }, 15000);
            });
    };

    var initExamens = function() {
        examensService.initDB()
            .then(function() {

            });
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

    if (ionic.Platform.isWebView()) {
        $scope.logs.push('uuid : ' + window.device.uuid);
    }

    if (window.indexedDB) {
        $scope.logs.push('cordova-plugin-wkwebview-engine : OK');
    } else {
        $scope.logs.push('cordova-plugin-wkwebview-engine : KO');
    }

    $timeout(function() {
        getUsers();
        getUnivers();
        initExamens();
    }, 300);

});
