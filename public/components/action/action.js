angular.module('action', [])
  .directive('action', function($rootScope){
    return{
      scope:{
        selectedIndex : '=selectedIndex'
      },
      templateUrl: 'components/action/action.tpl.html',
      link: function($scope){
        $scope.close = function(index) {
          $scope.$parent.messages[index].selected = !$scope.$parent.messages[index].selected;
          $scope.selectedIndex = undefined;
        }

        $scope.showUnread = function() {
          $scope.$parent.showUnread = !$scope.$parent.showUnread;
        }
/*
        $scope.$watch('selectedIndex', function(value){

        });
 */
      }
    };
  });
