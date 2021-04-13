angular.module("SoodaApp", []).controller("SoodaCtrl", async function($scope, $http) {

  const redirect_uri = window.location.protocol + '//' + window.location.host;

  const getToken = function() {
    return $http.get('/auth/accessToken?redirect_uri=' + redirect_uri + '&code=' + code);
  };

  const getAuthUri = function() {
    return $http.get('/auth?redirect_uri=' + redirect_uri);
  };

  /* wrap this in another directive */
  const getMessages = function(userToken) {
    const email = userToken.email;
    const token = userToken.token
    return $http.get('/messages/?refresh_token=' + token + '&email=' + email);
  };
  /* wrap this in another directive */

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

  const userToken = localStorage.getItem('userToken');
  if(userToken) {
    $scope.showMain = true;
    //Do main logic
    try {
      const response = await getMessages(JSON.parse(userToken));
      console.info(response);
      $scope.welcome = response.data.messages.length + ' messages';
      $scope.$apply();
    } catch(err) {
      console.error(err);
      localStorage.removeItem("userToken");
      //TODO move to error page to avoid loop
      window.location.href = '/?error=' + JSON.stringify(err);
    }
  }

  const params = new URLSearchParams(location.search);

  const error = params.get('error');
  if(error){
    console.error(error);
  }

  const code = params.get('code');
  if(code) {
    $scope.authed = true;
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
