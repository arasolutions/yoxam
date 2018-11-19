angular.module('FMPQuizz.questionnaire.controller', [])

.controller('questionnaireCtrl', function($scope, $rootScope, $timeout, $ionicModal, $ionicPopup, $stateParams, $state, audioService, examensService) {
    var isTuto = false;
    $scope.audio = audioService.getCurrentAudio();
    if ($state.current.name === "menu.questionnaireTuto") {
        isTuto = true;
    }
    $scope.myActiveIndex = 0;
    $scope.data.afficheExit = false;
    var currentExamen = examensService.getCurrentExamen();
    var currentQtr = currentExamen.univers[$stateParams.idxU].questionnaires[$stateParams.idxQ];
    if (isTuto) {
        $scope.data.slides = currentQtr.slidesTut;
        $scope.data.timeMax = currentQtr.qtr_tut_delai;
        $scope.data.afficheAide = false;
        $scope.timer = currentQtr.qtr_tut_delai;
        if (currentQtr.slidesTut[0].sld_audio) {
            $timeout(function() {
                audioService.playAudio(currentQtr.slidesTut[0].sld_audio);
            }, 500);
        }
    } else {
        $scope.data.aideTxt = currentQtr.slidesTut[0].sld_txt;
        $scope.data.slides = currentQtr.slides;
        $scope.data.timeMax = currentQtr.qtr_delai;
        if (currentQtr.qtr_docu==='<br>'){
            currentQtr.qtr_docu='';
        }
        $scope.data.docu = currentQtr.qtr_docu;
        $scope.data.afficheAide = true;
        $scope.timer = currentQtr.inProgressTimer || currentQtr.qtr_delai;
    }
    $scope.timer_display = convertTimer($scope.timer);

    currentExamen.inProgressIdxU = $stateParams.idxU;
    currentExamen.inProgressIdxQ = $stateParams.idxQ;
    examensService.updateExamen(currentExamen);
    $rootScope.$broadcast('menuUpdate');

    $ionicModal.fromTemplateUrl('app/questionnaire/aideModal.html', {
        id:'1',
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.aideModal = modal;
    });

    $ionicModal.fromTemplateUrl('app/questionnaire/aideDocu.html', {
        id:'2',
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.aideDocu = modal;
    });

    $scope.swiperOptions = {
        direction: 'horizontal',
        pagination: false,
        effect: 'slide',
        threshold: 60,
        onSlideChangeStart: function(swiper) {
            $scope.setCurrentSlide(swiper.activeIndex, true);
        }
    };

    function str_pad_left(string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    }

    function convertTimer(timer) {
        var minutes = Math.floor(timer / 60);
        var seconds = timer - minutes * 60;
        return str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
    };

    // Timer
    var mytimeout = null; // the current timeoutID
    // actual timer method, counts down every second, stops on zero
    $scope.onTimeout = function() {
        if (!isTuto && $scope.timer % 3 === 0) {
            currentQtr.inProgressTimer = $scope.timer;
            examensService.updateExamen(currentExamen);
        }
        if ($scope.timer === 0) {
            $scope.$broadcast('timer-stopped', 0);
            $timeout.cancel(mytimeout);
            return;
        }
        $scope.timer--;
        $scope.timer_display = convertTimer($scope.timer);
        mytimeout = $timeout($scope.onTimeout, 1000);
    };
    // functions to control the timer
    // starts the timer
    $scope.startTimer = function() {
        mytimeout = $timeout($scope.onTimeout, 1000);
        $scope.started = true;
    };

    // stops and resets the current timer
    $scope.stopTimer = function() {
        /*if (closingModal != true) {
            $scope.$broadcast('timer-stopped', $scope.timer);
        }*/
        $scope.timer = $scope.timeForTimer;
        $scope.started = false;
        $scope.paused = false;
        $timeout.cancel(mytimeout);
    };
    // pauses the timer
    $scope.pauseTimer = function() {
        $scope.$broadcast('timer-stopped', $scope.timer);
        $scope.started = false;
        $scope.paused = true;
        $timeout.cancel(mytimeout);
    };

    $scope.endExamen = function() {
        $scope.stopTimer();
        currentQtr.finished = true;
        currentExamen.inProgressIdxQ = null;
        var allQtrFinished = true;
        for (var i = 0; i < currentExamen.univers[$stateParams.idxU].questionnaires.length; i++) {
            if (!currentExamen.univers[$stateParams.idxU].questionnaires[i].finished) {
                allQtrFinished = false;
                break;
            }
        }
        if (allQtrFinished) {
            currentExamen.inProgressIdxU = -1;
            currentExamen.univers[$stateParams.idxU].finished = true;

            var allUniFinished = true;
            for (var i = 0; i < currentExamen.univers.length; i++) {
                if (!currentExamen.univers[i].finished) {
                    allUniFinished = false;
                    break;
                }
            }
            currentExamen.finished = allUniFinished;
            examensService.updateExamen(currentExamen);
            if (allUniFinished) {
                if (!currentExamen.can_test) {
                    examensService.syncCurrentExamen();
                }
                var alertPopup = $ionicPopup.alert({
                    title: 'Terminé',
                    okText: 'OK',
                    okType: 'button-balanced',
                    template: 'Merci pour votre participation.'
                });
                alertPopup.then(function(res) {});
            }
            $rootScope.$broadcast('menuUpdate');
            $state.go('menu.home');
        } else {
            examensService.updateExamen(currentExamen);
            $state.go('menu.univers', {
                idxU: $stateParams.idxU
            });
        }
    };

    // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
    $scope.$on('timer-stopped', function(event, remaining) {
        if (remaining === 0) {
            if (!isTuto) {
                //pas de endExamen sinon le user peut killer l'app sans cliquer sur OK
                if ($scope.aideDocu.isShown()){
                    $scope.aideDocu.hide();
                }
                $scope.endExamen();
                var alertPopup = $ionicPopup.alert({
                    title: 'Temps écoulé',
                    okText: 'OK',
                    okType: 'button-balanced',
                    template: 'Le temps alloué à ce questionnaire est écoulé, merci de sélectionner un nouveau questionnaire.'
                });
                alertPopup.then(function(res) {});
            } else {
                showFinTuto(true);
            }
        }
    });

    $scope.setCurrentSlide = function($index, verif) {
        if (isTuto && $index !== 0) {
            audioService.stopAudio();
        }
        if (!verif) {
            $scope.myActiveIndex = $index;
        } else {
            $scope.$apply(function() {
                $scope.myActiveIndex = $index;
            });
        }
    };
    $scope.getClass = function(reponse, multi) {
        if (!reponse.r_user) {
            return 'button-outline';
        }
        return '';
    };

    $scope.openAide = function() {
        $scope.pauseTimer();
        $scope.aideModal.show();
    };

    $scope.openDocu = function() {
        $scope.aideDocu.show();       
    };

    // Execute action on hide modal
    $scope.$on('modal.hidden', function(event, modal) {
        if (modal.id==='1') {
            $scope.startTimer();
            $scope.data.afficheAide = false;
        }
    });


    $scope.refreshPagination = function(slide) {
        //Maj de la pagination
        //Une reponse est donnée, on parcours l'intégralité des blocs du slide
        var isPartiel = false;
        var isComplet = true;
        var isRepondu;
        var j;
        for (var i = 0; i < slide.blocs.length; i++) {
            if (slide.blocs[i].questions[0]) {
                // bloc de type 1 / 2 
                if (slide.blocs[i].questions[0].q_type === 3 || slide.blocs[i].questions[0].q_type === 4) {
                    //on parcours l'intégralité des questions
                    for (j = 0; j < slide.blocs[i].questions.length; j++) {
                        //si une réponse existe
                        if (slide.blocs[i].questions[j].r_id) {
                            isPartiel = true;
                            if (!isComplet) {
                                break;
                            }
                        } else {
                            isComplet = false;
                            if (isPartiel) {
                                break;
                            }
                        }
                    }
                    if (!isComplet && isPartiel) {
                        break;
                    }
                }
                // bloc de type 3 / 4 (case à cocher)
                else {
                    //on parcours l'intégralité des questions
                    for (j = 0; j < slide.blocs[i].questions.length; j++) {
                        //on parcours l'intégralité des réponses
                        isRepondu = false;
                        for (var k = 0; k < slide.blocs[i].questions[j].reponses.length; k++) {
                            //si une réponse existe la question est considérée répondu
                            if (slide.blocs[i].questions[j].reponses[k].checked) {
                                isRepondu = true;
                                break;
                            }
                        }
                        if (isRepondu) {
                            isPartiel = true;
                            if (!isComplet) {
                                break;
                            }
                        } else {
                            isComplet = false;
                            if (isPartiel) {
                                break;
                            }
                        }
                    }
                    if (!isComplet && isPartiel) {
                        break;
                    }
                }
            }
        }
        if (isComplet) {
            slide.sld_etat = 3;
        } else if (isPartiel) {
            slide.sld_etat = 2;
        } else {
            slide.sld_etat = 1;
        }
    };

    $scope.askQuit = function() {
        if (currentQtr.allAnswered) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Quitter?',
                cancelText: 'Non',
                cancelType: 'button-balanced',
                okText: 'Oui',
                okType: 'button-assertive',
                template: 'Souhaitez-vous quitter le questionnaire?'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    $scope.endExamen();
                }
            });
        }
    };

    $scope.checkLastReponse = function() {
        if (!currentQtr.allAnswered) {
            var allAnswered = true;
            for (var i = 0; i < $scope.data.slides.length; i++) {
                if ($scope.data.slides[i].sld_etat !== 3) {
                    allAnswered = false;
                    break;
                }
            }
            if (allAnswered) {
                if (!isTuto) {
                    currentQtr.allAnswered = true;
                    examensService.updateExamen(currentExamen);
                    $scope.data.afficheAide = false;
                    $scope.data.afficheExit = true;

                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Quitter?',
                        cancelText: 'Non',
                        cancelType: 'button-balanced',
                        okText: 'Oui',
                        okType: 'button-assertive',
                        template: 'Vous avez terminé ce questionnaire avant le temps imparti, souhaitez vous quitter ce questionnaire ? Si vous restez sur ce questionnaire, le bouton <i class="icon ion-close-circled assertive"></i> vous permettra de quitter à tout moment.'
                    });
                    confirmPopup.then(function(res) {
                        if (res) {
                            $scope.endExamen();
                        }
                    });
                } else {
                    $scope.stopTimer();
                    showFinTuto(false);
                }
            }
        }
    };

    function showFinTuto(isSlow) {
        var alertPopup = $ionicPopup.alert({
            title: 'Fin du tutoriel',
            okText: 'OK',
            okType: 'button-balanced',
            template: 'Bonne chance!'
        });

        alertPopup.then(function(res) {
            $scope.showWaiting();
            $state.go('menu.questionnaire', {
                idxU: $stateParams.idxU,
                idxQ: $stateParams.idxQ
            });

        });
    };

    $scope.checkReponse = function(slide, question, reponse, manualCheck) {
        if (manualCheck) {
            reponse.checked = !reponse.checked;
        }
        var multi = question.q_multi || false;
        if (!multi && reponse.checked) {
            for (var i = 0; i < question.reponses.length; i++) {
                if (question.reponses[i].r_id !== reponse.r_id) {
                    question.reponses[i].checked = false;
                }
            }
        }
        $scope.refreshPagination(slide);
        $scope.checkLastReponse();
        if (!isTuto) {
            examensService.updateExamen(currentExamen);
        }
    };

    $scope.selectReponse = function(slide, question, reponse, replace_txt) {
        reponse.checked = !reponse.checked;
        for (var i = 0; i < question.reponses.length; i++) {
            if (question.reponses[i].r_id !== reponse.r_id) {
                question.reponses[i].checked = false;
            }
        }
        //replace_txt est à true seulement pour le bloc 1
        var isComplet = true;
        //Gére le clic sur une meme réponse
        if (question.r_id === reponse.r_id) {
            delete question.r_id;
            if (replace_txt) {
                question.q_txt = question.q_txt.replace(reponse.r_txt, '...');
                delete question.r_txt;
            }
        } else {
            question.r_id = reponse.r_id;
            if (replace_txt) {
                if (question.r_txt) {
                    question.q_txt = question.q_txt.replace(question.r_txt, reponse.r_txt);
                } else {
                    question.q_txt = question.q_txt.replace('...', reponse.r_txt);
                }
                question.r_txt = reponse.r_txt;
            }
        }
        $scope.refreshPagination(slide);
        $scope.checkLastReponse();
        //if (!isTuto) {
        examensService.updateExamen(currentExamen);
        //}
    };

    $scope.playAudio = function(src) {
        audioService.playAudio(src);
    };

    $scope.toogleAudioButton = function() {
        audioService.toogleAudioButton();
    };

    $scope.$on('$ionicView.beforeLeave', function() {
        if (isTuto) {
            audioService.stopAudio();
        }
    });
    if (!isTuto) {
        $timeout(function() {
            $scope.hideWaiting();
            $scope.startTimer()
        }, 3000);
    } else {
        $scope.startTimer();
    }
});
