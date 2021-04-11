angular.module("SoodaApp", []).controller("SoodaCtrl", function($scope, $http) {
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
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if(code) {
    $scope.googleAuthed = true;
    console.log('setting code : ' + code);
    localStorage.setItem('code', code);
  }

  $scope.login = function() {
    const redirect_uri = window.location.protocol + '//' + window.location.host;
    if(!$scope.googleAuthed) {
      $http.get('/auth?redirect_uri=' + redirect_uri).then(
        function (response) {
          window.location.href = response.data;
        },
        function (error) {
          console.error(error);
        }
      )
    }
  };
});
