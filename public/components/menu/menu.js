angular.module('menu', [])
  .directive('menu', function($rootScope){
    return{
      scope:{
      },
      templateUrl: 'components/menu/menu.tpl.html',
      link: function($scope){
        $scope.refresh = function() {
          $scope.$parent.reset();
        }
      }
    };
  });
