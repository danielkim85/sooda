angular.module('main', ['ngSanitize','menu','action'])
  .directive('main', function($http,$rootScope){
    return{
      scope:{
        userToken:'='
      },
      templateUrl: 'components/main/main.tpl.html',
      link: async function($scope){
        //pull down detection
        document.addEventListener('touchstart', function(e) { swipeStart($('.content[index=0]'),e); }, false);
        document.addEventListener('touchend', function(e) {
            swipeEnd($('.content.last'), $('action'), main, e);
          }, false
        );
        //end of pull down detection

        let userToken, isLoading;

        //ifarme load event
        window.onMyFrameLoad = function(iframe) {
          if(!iframe.attr('src')) {
            return;
          }

          $('.hourglass_empty_message').hide();
          const uid = iframe.attr('uid');
          const iframeWidth = $('iframe[uid=' + uid + ']')[0].contentWindow.document.body.scrollWidth;
          const originalWidth = iframe.width();
          const originalHeight = iframe.height();
          const zoomRatio = originalWidth / iframeWidth;
          if(zoomRatio >= 1) {
            return;
          }

          iframe.css('transform-origin','0 0');
          iframe.css('transform','scale(' + zoomRatio + ')');
          iframe.css('width',originalWidth / zoomRatio);
          iframe.css('height',originalHeight / zoomRatio);
        }

        const getMessages = function(start,end) {
          console.info('fetching messages ' + start + ' ' + end);
          const email = userToken.email;
          const token = userToken.token;
          const url = '/messages/list/seen/?refresh_token=' + token + '&email=' + email +
                      '&start=' + start + '&end=' + end;
          return $http.get(url);
        };

        $scope.$watch('userToken',async function(nv){
          if(!nv) {
            return;
          }
          userToken = nv;
          main();
        });

        $scope.reset = function() {
          localStorage.removeItem('messages');
          window.location.href = '/';
        }

        $scope.refresh = function() {
          window.location.href = '/';
        }

        let lastIndex;
        $scope.getMessage = async function(index,uid) {
          $scope.selectedIndex = index;
          if(lastIndex !== undefined) {
            $scope.messages[lastIndex].selected = false;
          }
          lastIndex = index;
          const email = userToken.email;
          const token = userToken.token;
          $scope.messages[index].isSeen = true;
          $scope.messages[index].selected = true;
          $scope.messages[index].url = '/messages/get/' + uid + '/?refresh_token=' + token + '&email=' + email;
        }

        $scope.formatDate = function(date) {
          return new Date(date).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'});
        }

        $scope.parsedMap = {};
        const parseMessages = function(messages) {
          return messages;

          //still testing merging logic
          /*
          let parsedArray = [];
          for(let message of messages) {
            const emailSplit = message.from.email ? message.from.email.split('@') : [message.from.name];
            const domain = emailSplit.length > 1 ? emailSplit[1] : emailSplit[0];
            message.domain = domain;
            if(!$scope.parsedMap[domain]) {
              $scope.parsedMap[domain] = {count : 0};
              parsedArray.push(message);
            }
            const isSeen = message.attrs.flags.length > 0 && message.attrs.flags[0] === '\\Seen';
            if(!isSeen) {
              $scope.parsedMap[domain].count++;
            }
          }
          console.info(parsedArray);
          return parsedArray;
          */
        };

        const checkNew = async function() {
          $scope.isLoading = true;
          const response = await getMessages($scope.messages[0].id+1,-1);
          $scope.isLoading = false;
          $scope.$apply();
          if(response.data.messages.length === 0) {
            return;
          }
          if(response.data.reset) {
            $scope.reset();
          }
          $scope.messages = parseMessages(response.data.messages).concat($scope.messages);
          $scope.$apply();
          localStorage.setItem('messages', JSON.stringify($scope.messages));
        };

        let messages;
        const main = async function(refresh) {
          if($scope.isLoading) {
            return;
          }

          if(refresh && await checkNew()) {
            return;
          }

          //try getting from local storage during first time execution
          if(messages === undefined) {
            messages = JSON.parse(localStorage.getItem('messages'));
          }

          //found something in cache
          //refresh !== false means this is bottom refresh
          if(messages !== null && refresh !== false) {
            console.info(messages);
            $scope.messages = messages;
            await checkNew();
            return;
          }

          $scope.isLoading = true;
          //nothing in local storage, try getting it from service
          let response;
          try {
            const end = refresh === false ? $scope.messages[$scope.messages.length-1].id-1 : -1;
            const start = end === -1 ? -1 : end - 20;
            response = await getMessages(start,end);
          } catch(err) {
            if(err.data === 'invalid_client') {
              localStorage.removeItem('userToken');
              window.location.href = '/?error=' + JSON.stringify(err);
            }
            console.error(err);
          } finally {
            console.info('fetched ' + response.data.messages.length);
            console.info(response.data.messages);
            if(refresh !== false) {
              $scope.messages = parseMessages(response.data.messages);
            }
            else {
              $scope.messages.push(...parseMessages(response.data.messages));
            }

            localStorage.setItem('messages', JSON.stringify($scope.messages));
          }

          //final cleanup
          $scope.isLoading = false;
          $scope.$apply();
          topEle = bottomEle = windowHeight = isTop = bottomEleHeight = undefined;
        };
      }
    };
  });
