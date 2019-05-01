angular.module('FMPQuizz.login.controller', ['angular-sha1'])

.controller('loginCtrl', function($scope, $ionicLoading, FMP, $ionicPopup, usersService, examensService, $timeout, universService, $state, localStorageService, $q) {
    var currentUser;
    $scope.clientId = localStorageService.get("clientId") || "";
    $scope.siteId = localStorageService.get("siteId") || "";

    if (ionic.Platform.isWebView()) {
        $scope.mediaPath = (cordova.file.documentsDirectory).replace('file://', '');
        if (clientId===""){
            $scope.mediaPath="";
        }
    } else {
        $scope.mediaPath = FMP.REMOTE_SERVER_MEDIA;
    }

    $ionicLoading.hide();
    usersService.resetCurrentUser();
    examensService.resetCurrentExamen();
    $scope.site_img = localStorageService.get("site_img")||"media/logo-default.png";

    if (typeof navigator.splashscreen !== "undefined") {
        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);
    }
    $scope.versionApp = FMP.VERSION_APP;
    $scope.form = {};
    if ($scope.clientId !== "" && $scope.siteId !== "") {
        var tabToBO = localStorageService.get("tabToBO") || false;
        if (!tabToBO) {
            alertPopup = $ionicPopup.alert({
                title: 'Warning',
                template: 'Cette tablette n\'est pas connue par le Back-office'
            });
            var examensUncommitted = examensService.getExamensUncommitted() || [];
            var examToSync;
            for (var i = 0; i < examensUncommitted.length; i++) {
                examToSync = examensUncommitted[i];
                //examem terminé et non commié
                if (examToSync.finished && !(examToSync.commit || false)) {
                    var d = new Date();
                    var deferred = $q.defer();
                    examensService.syncExamen(examToSync, deferred)
                        .then(function(server) {
                            examToSync.commitDate = ("0" + d.getDate()).slice(-2) + '/' + ("0" + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
                            examToSync.commit = true;
                            examensService.updateExamenWithoutSet(examToSync);
                        }, function(reject) {
                            examToSync.commit = false;
                        });
                    $timeout(function() {
                        deferred.resolve();
                    }, 15000);
                }
            }
        }

        $scope.versionUni = localStorageService.get("universDBversion") + " - " + universService.getNbIndice();
        $scope.versionUser = localStorageService.get("userDBversion") + " - " + usersService.getNbUsers();
    }
    $scope.login = function() {
        var alertContent = {
            title: 'Erreur',
            template: 'Identifiant ou mot de passe invalide.',
            okType: 'button-assertive'
        };
        if ($scope.clientId === "") {
            if ($scope.form.login) {
                var deferred = $q.defer();
                usersService.loginClient($scope.form.login, $scope.form.password, deferred)
                    .then(function(server) {
                        console.log(server);
                        $scope.clientId=server.data.name;
                        localStorageService.set("clientId",$scope.clientId);
                        localStorageService.set("siteList",server.data.siteList); 
                        localStorageService.set("site_img",server.data.logo);                     
                        $state.go('admin');
                        return;
                    }, function(reject) {
  
                    });
                $timeout(function() {
                    deferred.resolve(); // this aborts the request!
                }, 15000);

            } else {
                $ionicPopup.alert(alertContent);
            }
        } else {
            if ($scope.form.login && usersService.login($scope.form.login, $scope.form.password)) {
                // creation de l'examen
                currentUser = usersService.getCurrentUser();
                if (currentUser.can_admin) {
                    $state.go('admin');
                    return;
                }
                var currentExamen = examensService.setCurrentExamen(currentUser);
                if (currentExamen) {
                    if (parseInt(currentExamen.inProgressIdxU) >= 0 && parseInt(currentExamen.inProgressIdxQ) >= 0) {
                        $state.go('menu.questionnaire', {
                            idxU: currentExamen.inProgressIdxU,
                            idxQ: currentExamen.inProgressIdxQ
                        });
                    } else if (parseInt(currentExamen.inProgressIdxU) >= 0) {
                        $state.go('menu.univers', {
                            idxU: currentExamen.inProgressIdxU
                        });
                    } else {
                        //else necessaire car $state.go n'est pas une instruction bloquante
                        $state.go('menu.home');
                    }
                } else {
                    var arrUni = universService.getUniversById(currentUser.univers);
                    if (arrUni) {
                        examensService.createExamen(currentUser, arrUni);
                        $state.go('tuto');
                    } else {
                        var alertPopup = $ionicPopup.alert({
                            title: 'Erreur',
                            template: 'Cet identifiant possède un univers inconnu.',
                            okType: 'button-assertive'
                        });
                    }
                }
            } else {
                $ionicPopup.alert(alertContent);
            }
        }
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
        localStorageService.remove("clientId");
        localStorageService.remove("siteId");
        localStorageService.remove("tabToBO");
        localStorageService.remove("siteList");
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



});