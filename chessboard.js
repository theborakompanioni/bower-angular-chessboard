(function () {
  'use strict';
  
  angular.module('nywton.chessboard', [])
  
  .value('nywtonChessDefaultConfig', {
    position: undefined,
    showNotation: true,
    orientation: 'white',
    draggable: false,
    dropOffBoard: 'snapback',
    appearSpeed: 200,
    moveSpeed: 200,
    snapbackSpeed: 50,
    snapSpeed: 25,
    trashSpeed: 100,
    onDragStart: angular.noop,
    onDrop: angular.noop,
    onSnapEnd: angular.noop,
    onChange: angular.noop,
    onDragMove: angular.noop,
    onSnapbackEnd: angular.noop,
    onMoveEnd: angular.noop,
    onMouseoutSquare: angular.noop,
    onMouseoverSquare: angular.noop,
  })
  
  .provider('nywtonChessConfig', [function NywtonChessConfigProvider() {
    var config = {};
    
    this.pieceTheme = function pieceThemeF(pieceTheme) {
      config.pieceTheme = pieceTheme;
      return this;
    };
    this.position = function positionF(position) {
      config.position = position;
      return this;
    };
    this.draggable = function draggableF(draggable) {
      config.draggable = draggable;
      return this;
    };
  
    this.$get = ['nywtonChessDefaultConfig', function unicornLauncherFactory(defaultConfig) {
      return angular.extend(defaultConfig, config);
    }];
  }])
  
  .config(['nywtonChessConfigProvider', function nywtonChessConfigConfig(nywtonChessConfigProvider) {
    nywtonChessConfigProvider.draggable(true).position('start');
  }])
  
  
  .directive('chessboard', [
    '$window',
    '$log',
    '$timeout',
    'nywtonChessConfig',
    function($window, $log, $timeout, nywtonChessConfig) {
      var _configAttrs = [
        'draggable',
        'dropOffBoard',
        'position',
        'orientation',
        'showNotation',
        'sparePieces',
        'showErrors',
        'pieceTheme',
        'appearSpeed',
        'moveSpeed',
        'snapbackSpeed',
        'snapSpeed',
        'trashSpeed',
      ];
      
      var _callbackAttrs = [
        'onChange',
        'onDragStart',
        'onDragMove',
        'onDrop',
        'onSnapbackEnd',
        'onMoveEnd',
        'onMouseoutSquare',
        'onMouseoverSquare',
        'onSnapEnd',
      ];
      
      var directive = {
        restrict: 'EA',
        scope: {
          name: '@',
          board: '=',
          // callbacks
          onChange:'&',
          onDragMove: '&',
          onDrop: '&',
          onSnapbackEnd: '&',
          onMoveEnd: '&',
          onMouseoutSquare: '&',
          onMouseoverSquare: '&',
          onSnapEnd: '&',
          // workaround for onDragStart
          // angular does not like the 'start' at the end..
          // $scope['onDragStart']() === undefined;
          // i really dont know why.. onclick may not be taken..
          // ok.. i get that.. but i could not find any documentation
          // on this behaviour...
          onDragStart:'&onDragStartCb', // workaround because angular does not like 'onDragStart'
        },
        priority: 1000,
        template: '<div></div>',
        controller: ['$scope', function chessboard($scope) {
          var $ctrl = this;
          var _cfg = [];
          
          $scope.name = $scope.name || 'board'+$scope.$id;
          
          this.config_push = function config_pushF(incoming) {
            if(angular.isArray(incoming) && incoming.length === 2 && angular.isString(incoming[0]) && !angular.isUndefined(incoming[1])) {
              _cfg.push(incoming);
            }
          };
          
          this.config = function configF() {
            var cfg = {};
            angular.forEach(_cfg, function(pair) {
              cfg[pair[0]] = pair[1];
            });
            var combined_config = angular.extend(angular.copy(nywtonChessConfig), cfg);
            $log.debug(combined_config);
            return combined_config;
          };
          
          this.board = function boardF() {
            return $scope.board;
          };
          
          var defaultCallback = function defaultCallbackF() {
            // calling $digest() because the methods
            // are invoked from external lib
            $scope.$parent.$digest();
          };
    
          angular.forEach(_callbackAttrs, function(attr) {
            if(angular.isFunction($scope[attr])) {
              var expressionHandler = $scope[attr]();
              if(!angular.isFunction(expressionHandler)) {
                // push default callback if attr was not specified
                $ctrl.config_push([attr, defaultCallback]);
              } else {
                $log.debug('callback attr: ' + attr + ' = ' + expressionHandler);
                $ctrl.config_push([attr, expressionHandler]);
              }
            }
          });
          
        }],
        link: function link($scope, $element, $attrs, $ctrl) {
          angular.forEach(_configAttrs, function(attr) {
            $log.debug('attr: ' + attr + ' = ' + $scope.$eval($attrs[attr]));
            if($attrs.hasOwnProperty(attr)) {
              $ctrl.config_push([attr, $scope.$eval($attrs[attr])]);
            }
          });
          
          var board_config = $ctrl.config();
          var board_element = angular.element('<div></div>')[0];
          $element.prepend(board_element);
          
          $scope.board = new $window.ChessBoard(board_element, board_config);
          $scope.board.name = $scope.name || 'board' + $scope.$id;
        },
      };
      
      return directive;
    }
  ])
  
  .directive('positionRuyLopez', ['$log', function($log) {

    var directive = {
      restrict: 'A',
      priority: 1,
      require: 'chessboard',
      link: function link($scope, $element, $attrs, $ctrl) {
        $log.debug('pushing config "position" with Ruy Lopez fen-string');
        $ctrl.config_push(['position', 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R']);
      },
    };
    
    return directive;
  }])

  .directive('positionStart', ['$log', function($log) {

    var directive = {
      restrict: 'A',
      priority: 1,
      require: 'chessboard',
      link: function link($scope, $element, $attrs, $ctrl) {
        $log.debug('pushing config "position" with start position');
        $ctrl.config_push(['position', 'start']);
      },
    };
    
    return directive;
  }]);

})();