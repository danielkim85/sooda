angular.module("SoodaApp", []).controller("SoodaCtrl", function($scope) {
  console.info('start');
  if(window.navigator.userAgent.indexOf('iPhone') != -1){
    console.info('i am an iPhone');
    if(window.navigator.standalone == true){
      console.info('i am a standalone');
    } else {
      console.info('i am not a standalone');
      $scope.showInstall = true;
    }
  } else {
    console.info('i am not an iphone');
    //$scope.showInstall = true;
  }
});
