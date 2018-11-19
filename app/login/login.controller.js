angular.module('FMPQuizz.login.controller', ['angular-sha1'])

.controller('loginCtrl', function($scope, $ionicLoading, FMP, $ionicPopup, usersService, examensService, $timeout, universService, $state, localStorageService, $q) {
    var currentUser;
    $ionicLoading.hide();
    usersService.resetCurrentUser();
    examensService.resetCurrentExamen();
    if (typeof navigator.splashscreen !== "undefined") {
        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);
    }

    var tabToBO = localStorageService.get("tabToBO") || false;
    if (!tabToBO){
      alertPopup = $ionicPopup.alert({
        title: 'Warning',
        template: 'Cette tablette n\'est pas connue par le Back-office'
      });
    }

    $scope.form = {};
    $scope.versionUni = localStorageService.get("universDBversion") + " - " + universService.getNbIndice();
    $scope.versionUser = localStorageService.get("userDBversion") + " - " + usersService.getNbUsers();
    $scope.versionApp = FMP.VERSION_APP;

    $scope.login = function() {
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
                if (arrUni){
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
            var alertPopup = $ionicPopup.alert({
                title: 'Erreur',
                template: 'Identifiant ou mot de passe invalide.',
                okType: 'button-assertive'
            });
        }
    };

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

});
