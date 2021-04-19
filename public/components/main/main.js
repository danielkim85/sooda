angular.module('main', ['ngSanitize'])
  .directive('main', function($http,$rootScope){
    return{
      scope:{
        userToken:'='
      },
      templateUrl: 'components/main/main.tpl.html',
      link: async function($scope){
        let userToken;
        window.onMyFrameLoad = function() {
          jQuery('.hourglass_empty_message').hide();
        }
        const getMessages = function(size) {
          const email = userToken.email;
          const token = userToken.token
          return $http.get('/messages/?refresh_token=' + token + '&email=' + email + '&size=' + size);
        };

        $scope.$watch('userToken',async function(nv){
          if(!nv) {
            return;
          }
          userToken = nv;
          main();
        });

        $scope.refresh = function() {
          window.location.href = '/';
        }

        let lastIndex;
        $scope.loadMessage = async function(index,uid) {
          jQuery('.hourglass_empty_message').show();

          if(lastIndex !== undefined) {
            $scope.messages[lastIndex].selected = false;
          }
          lastIndex = index;
          const email = userToken.email;
          const token = userToken.token;
          $scope.messages[index].selected = true;
          $scope.messages[index].url = '/messages/' + uid + '/?refresh_token=' + token + '&email=' + email;
        }

        const main = async function() {
          let response;
          try {
            response = await getMessages(20);
          } catch(err) {
            if(err.data === 'invalid_client') {
              localStorage.removeItem('userToken');
              window.location.href = '/?error=' + JSON.stringify(err);
            }
            console.error(err);
          } finally {
            console.info(response.data.messages);
            $scope.messages = response.data.messages;
            $scope.$apply();
          }
        };
      }
    };
  });
