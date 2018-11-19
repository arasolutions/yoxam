angular.module('FMPQuizz.menu.controller', [])

.controller('menuCtrl', function($scope, $ionicPopup, $state, $ionicLoading, $ionicModal, localStorageService, examensService, usersService, $cordovaFile, $cordovaCamera) {
    var currentUser;
    var currentExamen = examensService.getCurrentExamen();
    if (ionic.Platform.isWebView()) {
        $scope.mediaPath = (cordova.file.documentsDirectory).replace('file://', '');
    } else {
        $scope.mediaPath = "http://www.backoffice-challenge.com/";
    }

    $scope.data = {};
    $scope.data.checkHomme = {};
    $scope.data.checkFemme = {};
    $scope.data.grayOn = false;
    $scope.data.activeIdxU = -1;
    $scope.data.site_img = localStorageService.get("site_img");
    $scope.user = usersService.getCurrentUser();
    $scope.user.can_age = $scope.user.can_age || 20;

    $scope.$on('menuUpdate', function(event) {
        currentExamen = examensService.getCurrentExamen();
        $scope.data.activeIdxU = parseInt(currentExamen.inProgressIdxU);
        if ($scope.data.activeIdxU >= 0) {
            $scope.data.grayOn = true;
        } else {
            $scope.data.grayOn = false;
        }
    });

    $ionicModal.fromTemplateUrl('app/menu/ipModal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: false
    }).then(function(modal) {
        $scope.ipModal = modal;
        //Ne pas afficher si reprise exam
        if ($scope.data.activeIdxU < 0) {
            modal.show();
        }
    });

    $scope.myrange = function(tab) {
        var range = [];
        for (var i = 0; i < tab.length; i = i + 3)
            range.push(i);
        return range;
    };

    $scope.takePicture = function() {
        if (ionic.Platform.isWebView()) {
            var options = {
                quality: 100,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                cameraDirection: 1,
                targetWidth: 256,
                targetHeight: 256,
                saveToPhotoAlbum: false,
                correctOrientation: false
            };
            $cordovaCamera.getPicture(options).then(function(imageURI) {
                var idx = imageURI.lastIndexOf('/');
                var newName = currentExamen.can_nom + '_' + currentExamen.can_id + '_' + new Date().getTime() + '.jpg';
                $cordovaFile.copyFile(imageURI.substring(0, idx), imageURI.substring(idx + 1, imageURI.length), cordova.file.documentsDirectory + 'media/candidats/', newName)
                    .then(function(success) {
                        var newPath = 'media/candidats/' + newName;
                        $scope.data.photo = newPath;
                        currentExamen.can_photo = newPath; //utile?
                        // Nouvelle photo => non synchro pas conséquence
                        currentExamen.isPhotoSync = false;
                        examensService.updateExamen(currentExamen);
                    }, function(error) {
                        alert(JSON.stringify(error, null, 4));
                    });

            }, function(err) {
                // error
            });
        } else {
            console.log('Prise de photo');
        }
    };

    $scope.setAgePlus = function(isPlus) {
        if (isPlus && $scope.user.can_age < 60) {
            $scope.user.can_age++;
        } else if (!isPlus && $scope.user.can_age > 16) {
            $scope.user.can_age--;
        }
        currentExamen.can_age = $scope.user.can_age;
    };

    $scope.clickUnivers = function(univers, index) {
        //on ne fait le lien que si pas d'univers en cours (-1)
        if ($scope.data.activeIdxU === -1 && !(univers.finished || false)) {
            $state.go('menu.univers', {
                idxU: index
            });
        }
    };

    $scope.checkSexe = function(isMale) {
        if (isMale) {
            $scope.data.checkHomme.checked = true;
            $scope.data.checkFemme.checked = false;
            currentExamen.can_sexe = 1;
        } else {
            $scope.data.checkHomme.checked = false;
            $scope.data.checkFemme.checked = true;
            currentExamen.can_sexe = 2;
        }
    };
    $scope.ipValidation = function() {
        if ($scope.isComplete()) {
            currentExamen.can_situation_id = $scope.data.selectedSituation.id || 0;
            currentExamen.can_classe_id = $scope.data.selectedClasse.id || 0;
            currentExamen.can_formation_id = $scope.data.selectedFormation.id || 0;
            examensService.updateExamen(currentExamen);
            if (currentExamen.can_photo !== 'media/candidats/default.png') {
                examensService.syncPhoto();
            }
            $scope.ipModal.hide();
        } else {
            //popup champs obligatoires manquants
            var alertPopup = $ionicPopup.alert({
                title: 'Saisie incomplète',
                okText: 'OK',
                okType: 'button-assertive',
                template: 'Tous les champs (hors photo) sont obligatoires, merci de compléter votre saisie.'
            });
            alertPopup.then(function(res) {});
        }
    };

    // A confirm dialog
    $scope.showConfirmLogout = function() {
        if (!$scope.data.grayOn) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Déconnexion',
                template: 'Etes-vous sûr de vouloir vous déconnecter?',
                cancelText: 'Non',
                cancelType: 'button-balanced',
                okText: 'Oui',
                okType: 'button-assertive'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    examensService.resetCurrentExamen();
                    usersService.resetCurrentUser();
                    $state.go('login');
                }
            });
        }
    };

    $scope.isComplete = function() {
        if (currentExamen.can_sexe === 0 || $scope.data.selectedSituation.id === 0 || $scope.data.selectedClasse.id === 0 || $scope.data.selectedFormation.id === 0) {
            return false;
        }
        return true;
    };

    $scope.data.nom = currentExamen.can_nom;
    $scope.data.photo = currentExamen.can_photo;
    $scope.data.univers = currentExamen.univers;

    if (currentExamen.can_sexe === 1) {
        $scope.data.checkHomme.checked = true;
    } else if (currentExamen.can_sexe === 2) {
        $scope.data.checkFemme.checked = true;
    }

    var situation_id = currentExamen.can_situation_id || 0;
    var classe_id = currentExamen.can_classe_id || 0;
    var formation_id = currentExamen.can_formation_id || 0;

    $scope.data.listeSituation = localStorageService.get("listeSituation");
    $scope.data.listeClasse = localStorageService.get("listeClasse");
    $scope.data.listeFormation = localStorageService.get("listeFormation");
    var founded = false;
    var i;
    for (i = 0; i < $scope.data.listeSituation.length; i++) {
        if ($scope.data.listeSituation[i].id === situation_id) {
            $scope.data.selectedSituation = $scope.data.listeSituation[i];
            founded = true;
            break;
        }
    }
    if (!founded) {
        $scope.data.selectedSituation = $scope.data.listeSituation[0];
    }
    founded = false;
    for (i = 0; i < $scope.data.listeClasse.length; i++) {
        if ($scope.data.listeClasse[i].id === classe_id) {
            $scope.data.selectedClasse = $scope.data.listeClasse[i];
            founded = true;
            break;
        }
    }
    if (!founded) {
        $scope.data.selectedClasse = $scope.data.listeClasse[0];
    }
    founded = false;
    for (i = 0; i < $scope.data.listeFormation.length; i++) {
        if ($scope.data.listeFormation[i].id === formation_id) {
            $scope.data.selectedFormation = $scope.data.listeFormation[i];
            founded = true;
            break;
        }
    }
    if (!founded) {
        $scope.data.selectedFormation = $scope.data.listeFormation[0];
    }

    $scope.showWaiting = function(inc) {
        $scope.isLoading = true;
        $ionicLoading.show({
            template: '<ion-spinner icon="android" class="spinner-assertive"></ion-spinner><br>Chargement...'
        });
    };
    $scope.hideWaiting = function() {
        $scope.isLoading = false;
        $ionicLoading.hide();
    };
});
