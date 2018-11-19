angular.module('FMPQuizz').factory('audioService', ['$cordovaMedia', audioService]);

function audioService($cordovaMedia) {
    var _audio = {};
    _audio.play_run = false;

    function playAudio(src) {
        _audio.play_run = true;
        if (ionic.Platform.isWebView()) {
            if (_audio.media) {
                _audio.media.release();
            }
            //valable seulement sur IOS
            _audio.media = $cordovaMedia.newMedia((cordova.file.documentsDirectory + src).replace('file://', ''));
            _audio.media.play();
        } else {
            console.log('lecture mp3 : ' + src);
        }
    };

    function toogleAudioButton() {
        if (ionic.Platform.isWebView()) {
            if (_audio.play_run) {
                _audio.media.pause();
            } else {
                _audio.media.play();
            }
        } else {
            if (_audio.play_run) {
                console.log('Pause: ' + _audio.play_run);
            } else {
                console.log('Play : ' + _audio.play_run);
            }
        }
        _audio.play_run = !_audio.play_run;
    };

    function getCurrentAudio() {
        return _audio;
    };

    function stopAudio() {
        if (ionic.Platform.isWebView() && _audio.play_run) {
            _audio.media.stop();
        }
    };

    return {
        playAudio: playAudio,
        toogleAudioButton: toogleAudioButton,
        getCurrentAudio: getCurrentAudio,
        stopAudio: stopAudio

    };
}
