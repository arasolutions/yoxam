angular.module('FMPQuizz.univers.controller', [])

.controller('universCtrl', function($timeout, $scope, $state, $stateParams, $rootScope, examensService) {
    $scope.data = {};
    // Necessaire en cas de reprise de session
    $rootScope.$broadcast('menuUpdate');
    $scope.data.questionnaires = examensService.getCurrentExamen().univers[$stateParams.idxU].questionnaires;

    $scope.clickQtr = function(qtr, index) {
        if (!qtr.finished) {
            $state.go('menu.questionnaireTuto', {
                idxU: $stateParams.idxU,
                idxQ: index
            });
        }
    };

});
