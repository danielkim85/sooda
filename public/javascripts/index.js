//suppress console
if(window.location.host !== 'localhost:3000') {
  let console = {};
  const methods = ['info','log','warn','error'];
  for(const method of methods) {
    console[method] = function() {};
  }
  window.console = console;
}

angular.module("SoodaApp", ['main']).controller("SoodaCtrl", async function($scope, $http) {

  const redirect_uri = window.location.protocol + '//' + window.location.host;

  const getToken = function() {
    return $http.get('/auth/accessToken?redirect_uri=' + redirect_uri + '&code=' + code);
  };

  const getAuthUri = function() {
    return $http.get('/auth?redirect_uri=' + redirect_uri);
  };

  if(window.navigator.userAgent.indexOf('iPhone') != -1) {
    //console.info('i am an iPhone');
    if(window.navigator.standalone == true){
      //console.info('i am a standalone');
    } else {
      //console.info('i am not a standalone');
      $scope.showInstall = true;
    }
  } else {
    //console.info('i am not an iphone');
    //$scope.showInstall = true;
  }

  const userToken = localStorage.getItem('userToken');
  if(userToken) {
    $scope.userToken = JSON.parse(userToken);
  }

  const params = new URLSearchParams(location.search);

  const error = params.get('error');
  if(error){
    console.error(error);
  }

  const code = params.get('code');
  if(code) {
    //get access token
    try {
      const response = await getToken();
      const userToken = {
        email : response.data.email,
        token : response.data.refresh_token
      }
      localStorage.setItem('userToken', JSON.stringify(userToken));
      window.location.href = '/';
    } catch(err) {
      window.location.href = '/?error=' + JSON.stringify(err);
    }
  }

  $scope.login = async function() {
    try {
      const response = await getAuthUri();
      window.location.href = response.data;
    } catch(err) {
      window.location.href = '/?error=' + JSON.stringify(err);
    }

  };
});
