angular.module('FMPQuizz.tuto.controller', [])

.controller('tutoCtrl', function($scope, localStorageService, $cordovaMedia, $timeout, audioService) {
    $scope.audio = audioService.getCurrentAudio();
    $scope.myActiveIndex = 0;
    $scope.swiperOptions = {
        direction: 'horizontal',
        pagination: false,
        effect: 'slide',
        threshold: 60,
        onSlideChangeStart: function(swiper) {
            $scope.setCurrentSlide(swiper.activeIndex, true);
        }
    };
    if (ionic.Platform.isWebView()) {
        $scope.mediaPath = (cordova.file.documentsDirectory).replace('file://', '');
    } else {
        $scope.mediaPath = "http://www.backoffice-challenge.com/";
    }
    $scope.slidesTut = localStorageService.get("slidesTut");
    $scope.setCurrentSlide = function($index, verif) {
        audioService.stopAudio();
        if (!verif) {
            $scope.myActiveIndex = $index;
            if ($scope.slidesTut[$index].sld_audio) {
                $timeout(function() {
                    audioService.playAudio($scope.slidesTut[$index].sld_audio);
                }, 500);
            }
        } else {
            $scope.$apply(function() {
                $scope.myActiveIndex = $index;
                if ($scope.slidesTut[$index].sld_audio) {
                    $timeout(function() {
                        audioService.playAudio($scope.slidesTut[$index].sld_audio);
                    }, 500);
                }
            });
        }

    };

    $scope.playAudio = function(src) {
        audioService.playAudio(src);
    };

    $scope.toogleAudioButton = function() {
        audioService.toogleAudioButton();
    };

    $scope.$on('$ionicView.beforeLeave', function() {
        audioService.stopAudio();
    });

    if ($scope.slidesTut[0].sld_audio) {
        $timeout(function() {
            audioService.playAudio($scope.slidesTut[0].sld_audio);
        }, 400);
    }

});
