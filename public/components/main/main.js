angular.module('main', ['ngSanitize','menu'])
  .directive('main', function($http,$rootScope){
    return{
      scope:{
        userToken:'='
      },
      templateUrl: 'components/main/main.tpl.html',
      link: async function($scope){
        //pull down detection
        let pStart = {y:0};
        let pStop = {y:0};
        let topEle, bottomEle, windowHeight, isTop, bottomEleHeight;

        $(window).resize(function(){
          windowHeight = undefined;
        });

        function swipeStart(e) {
          if (typeof e['targetTouches'] !== "undefined"){
            let touch = e.targetTouches[0];
            pStart.y = touch.screenY;
          } else {
            pStart.y = e.screenY;
          }
          if(!topEle) {
            topEle = $('.content[index=0]');
          }
          isTop = topEle.position().top === 0;

        }

        function swipeEnd(e){
          if (typeof e['changedTouches'] !== "undefined"){
            let touch = e.changedTouches[0];
            pStop.y = touch.screenY;
          } else {
            pStop.y = e.screenY;
          }
          swipeCheck();
        }

        function swipeCheck(){
          let changeY = pStart.y - pStop.y;
          if(!windowHeight) {
            windowHeight = $(window).height();
          }
          if(!bottomEle) {
            bottomEle = $('.content.last');
          }
          if(!bottomEleHeight) {
            bottomEleHeight = bottomEle.height();
          }

          if (isTop && changeY < -100) {
            main(true);
          }
          else if(bottomEle.offset().top + bottomEle.outerHeight(true) - windowHeight <= bottomEleHeight) {
            main(false);
          }
          isTop = false;
        }
        document.addEventListener('touchstart', function(e){ swipeStart(e); }, false);
        document.addEventListener('touchend', function(e){ swipeEnd(e); }, false);
        //end of pull down detection

        let userToken, isLoading;
        //loading icon trick for iframe content
        window.onMyFrameLoad = function() {
          $('.hourglass_empty_message').hide();
        }

        const getMessages = function(start,size) {
          const email = userToken.email;
          const token = userToken.token;
          const url = '/messages/?refresh_token=' + token + '&email=' + email +
                      '&size=' + size + '&start=' + start;
          return $http.get(url);
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
        $scope.getMessage = async function(index,uid) {
          if(!$scope.messages[index].url) {
            jQuery('.hourglass_empty_message').show();
          }
          if(lastIndex !== undefined) {
            $scope.messages[lastIndex].selected = false;
          }
          lastIndex = index;
          const email = userToken.email;
          const token = userToken.token;
          $scope.messages[index].isSeen = true;
          $scope.messages[index].selected = true;
          $scope.messages[index].url = '/messages/' + uid + '/?refresh_token=' + token + '&email=' + email;
        }

        $scope.formatDate = function(date) {
          return new Date(date).toLocaleString();
        }
        const main = async function(refresh) {
          if(isLoading) {
            return;
          }
          let response;
          try {
            isLoading = true;
            if(refresh) {
              $scope.showLoading = true;
              response = await getMessages(0,1);
            }
            else {
              response = await getMessages($scope.messages ? $scope.messages.length : 0, 20);
            }
          } catch(err) {
            if(err.data === 'invalid_client') {
              localStorage.removeItem('userToken');
              window.location.href = '/?error=' + JSON.stringify(err);
            }
            console.error(err);
          } finally {
            isLoading = false;
            topEle = bottomEle = windowHeight = isTop = bottomEleHeight = undefined;
            console.info(response.data.messages);
            if(!$scope.messages) {
              $scope.messages = response.data.messages;
            }
            else if(refresh) {
              $scope.showLoading = false;
              if(response.data.messages[0].id > $scope.messages[0].id) {
                $scope.refresh();
              }
            }
            else {
              $scope.messages = $scope.messages.concat(response.data.messages);
            }

            $scope.$apply();
          }
        };
      }
    };
  });
