// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('FMPQuizz', ['ionic', 'ngCordova', 'lokijs', 'FMPQuizz.constants', 'angular-svg-round-progress', 'LocalStorageModule', 'FMPQuizz.admin.controller','FMPQuizz.home.controller', 'FMPQuizz.check.controller', 'FMPQuizz.menu.controller', 'FMPQuizz.login.controller', 'FMPQuizz.tuto.controller', 'FMPQuizz.univers.controller', 'FMPQuizz.questionnaire.controller'])

.run(function($ionicPlatform, $state) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        /*if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }*/
        /*if (typeof StatusBar !== "undefined") {
            StatusBar.overlaysWebView(true);
            StatusBar.styleLightContent();
        }*/
        /*setTimeout(function() {
            if (typeof navigator.splashscreen !== "undefined") {
                navigator.splashscreen.hide();
            }
        }, 200);*/
        $state.go('check');
    });
})

.config(function($stateProvider, $urlRouterProvider, localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('lsFMP');
    $stateProvider
        .state('waitload', {
            url: "/waitload",
            cache: true,
            templateUrl: "app/check/waitload.html"
        })
        .state('admin', {
            url: "/admin",
            cache: false,
            templateUrl: "app/admin/admin.html",
            controller: 'adminCtrl'
        })
        .state('check', {
            url: "/check/:siteId?",
            cache: true,
            templateUrl: "app/check/check.html",
            controller: 'checkCtrl'
        })
        .state('login', {
            url: "/login",
            cache: false,
            templateUrl: "app/login/login.html",
            controller: 'loginCtrl'
        })
        .state('tuto', {
            url: "/tuto",
            cache: false,
            templateUrl: "app/tuto/tuto.html",
            controller: 'tutoCtrl'
        })
        .state('menu', {
            url: '/menu',
            abstract: false,
            cache: false,
            templateUrl: 'app/menu/menu.html',
            controller: 'menuCtrl'
        })
        .state('menu.home', {
            url: '/home',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/home/home.html',
                    controller: 'homeCtrl'
                }
            }
        })
        .state('menu.univers', {
            url: '/univers/:idxU',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/univers/univers.html',
                    controller: 'universCtrl'
                }
            }
        })
        .state('menu.questionnaireTuto', {
            url: '/univers/:idxU/:idxQ/tuto',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/questionnaire/questionnaireTuto.html',
                    controller: 'questionnaireCtrl'
                }
            }
        })
        .state('menu.questionnaire', {
            url: '/univers/:idxU/:idxQ',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/questionnaire/questionnaire.html',
                    controller: 'questionnaireCtrl'
                }
            }
        });
    $urlRouterProvider.otherwise('/waitload');
});
