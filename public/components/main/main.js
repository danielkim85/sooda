angular.module('main', [])
  .directive('main', function($http,$rootScope){
    return{
      scope:{
        userToken:'='
      },
      templateUrl: 'components/main/main.tpl.html',
      link: async function($scope){
        const getMessages = function(userToken,size) {
          const email = userToken.email;
          const token = userToken.token
          return $http.get('/messages/?refresh_token=' + token + '&email=' + email + '&size=' + size);
        };

        $scope.$watch('userToken',async function(nv){
          if(!nv) {
            return;
          }
          main(nv);
        });
        const main = async function(nv) {
          let response;
          try {
            response = await getMessages(nv,20);
          } catch(err) {
            if(err.data === 'invalid_client') {
              localStorage.removeItem('userToken');
              window.location.href = '/?error=' + JSON.stringify(err);
            }
            console.error(err);
          } finally {
            console.info(response.data.messages);
            $scope.messages = response.data.messages;
            //$scope.welcome = response.data.messages.length + ' messages';
            $scope.$apply();
          }
        };
      }
    };
  });
