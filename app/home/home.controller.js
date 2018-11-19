angular.module('FMPQuizz.home.controller', [])

.controller('homeCtrl', function($scope, examensService, $rootScope) {
	var examen = examensService.getCurrentExamen();
    $scope.univers = examen.univers;
});
