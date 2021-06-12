angular.module('main', ['ngSanitize','menu'])
  .directive('main', function($http,$rootScope){
    return{
      scope:{
        userToken:'='
      },
      templateUrl: 'components/main/main.tpl.html',
      link: async function($scope){
        //pull down detection
        document.addEventListener('touchstart', function(e){ swipeStart($('.content[index=0]'),e); }, false);
        document.addEventListener('touchend', function(e){ swipeEnd($('.content.last'),main,e); }, false);
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
          console.info(originalWidth);
          console.info(iframeWidth);
          console.info(zoomRatio);
          console.info('adjust zoom ratio');
          iframe.css('transform-origin','0 0');
          iframe.css('transform','scale(' + zoomRatio + ')');
          iframe.css('width',originalWidth / zoomRatio);
          iframe.css('height',originalHeight / zoomRatio);
        }

        const getMessages = function(start,size) {
          console.info('fetching messages with size : ' + size);
          const email = userToken.email;
          const token = userToken.token;
          const url = '/messages/list/seen/?refresh_token=' + token + '&email=' + email +
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
          $scope.messages[index].url = '/messages/get/' + uid + '/?refresh_token=' + token + '&email=' + email;
        }

        $scope.formatDate = function(date) {
          return new Date(date).toLocaleString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'});
        }

        $scope.parsedMap = {};
        const parseMessages = function(messages) {
          return messages;
          //still testing merging logic
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
        };

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
            console.info('fetched ' + response.data.messages.length);
            console.info(response.data.messages);
            if(!$scope.messages) {
              $scope.messages = parseMessages(response.data.messages);
            }
            else if(refresh) {
              $scope.showLoading = false;
              if(response.data.messages[0].id > $scope.messages[0].id) {
                $scope.refresh();
              }
            }
            else {
              $scope.messages = $scope.messages.concat(parseMessages(response.data.messages));
            }

            $scope.$apply();
          }
        };
      }
    };
  });
