//--- Config Vars ---
var data_url = 'temp/test.json';
var client_name = window.location.hash.replace(/^#\//, '');

//--- Define Angular App
var newCityPlayer = angular.module('newCityPlayer', ['ngRoute', 'ngSanitize', 'door3.css']);

newCityPlayer.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/:client', {
		controller: 'messageController',
		templateUrl: 'partials/message.html',	
		css: 'styles/clients/' + client_name + '.css'
	}).otherwise({
		// redirectTo: '/demo'
	});
}]);

newCityPlayer.factory('PlayerData', ['$http', '$q', function($http, $q){
	var ret = {};
	
	ret.getData = function(){
		var raw = $http({
			method: 'GET',	
			url: data_url,
			cache: false
		});		
		return $q.all({'raw':raw});
	};
	
	return ret;
}]);


newCityPlayer.directive('message', function() {    
    return {
        link: function($scope, element, attrs) {	
        	// following block is to enable pageNavigation(), which needs a number of images, served by ngRepeat, but not by
        	// ngSrc, because the images are served by the JSON feed.
            var watch = $scope.$watch(function() {
                return element.children().length;
            }, function() {
                $scope.$evalAsync(function() {
   					$scope.pageNavigation();               
            		
            		if($scope.touch_enabled === 1){
            			$scope.enableTouch(element);	
            		}
                });
            });
        },
    };
});

newCityPlayer.directive('messageSelect', function() {    
	return{
		link: function($scope, e, attrs){
			$scope.setMessageSelect(e, $scope.message_index);
		}
	};
});

newCityPlayer.controller('messageController', 
						 ['$scope', '$interval', '$http', '$sce', '$location', '$route', 'dateFilter', 'PlayerData',
						 function($scope, $interval, $http, $sce, $location, $route, dateFilter, PlayerData){
		$scope.setData = function(){
			PlayerData.getData().then(function(player_data, status){		
				$scope.touch_enabled = parseInt(player_data.raw.data[0].touch);
				$http({
					method: 'GET',
					url: player_data.raw.data[0].feed_url,
					cache: false
				}).success(function(data){			
					$scope.messages = data;
					$scope.message_index = 0;
					$scope.setMessage($scope.message_index);
				}).error(function(data, status){
					console.log(status);
				});
			});		
		};
		
		$scope.setData();
		
		$scope.setMessage = function(index){
			$scope.message_index = index;
			$scope.raw_message = $scope.messages[$scope.message_index];
			$scope.message = $sce.trustAsHtml($scope.raw_message.message);
			$scope.message_name = $scope.raw_message.name;	
			
			$scope.duration = $scope.raw_message.duration;
			$scope.transition = $scope.raw_message.transition;
			
			$scope.startMessage();
		};
		
		$scope.setNextMessage = function(){
			var i = parseInt($scope.message_index);
			i++;
			if(i >= $scope.messages.length){
				// $route.reload();
				$scope.setData();
			} else{ 			 	
				$scope.setMessage(i);	
			}	
			// $scope.setMessage(i);	
		};
		
		$scope.setPrevMessage = function(){
			var i = parseInt($scope.message_index);
			if(i <= 0){
				i = $scope.messages.length;
			}
			i--;
			$scope.setMessage(i);
		};
		
		//---------------- Timer functions -------------


		function updateDuration(){
			if(update_duration){
				$scope.duration = $scope.duration - 1;			
			
				if($scope.duration < 0){
		    		$scope.setNextMessage();
		    	}	
			} 
		}

		var stop;
			
		startTimer = function(){
			stop = $interval(function(){
				updateDuration();			
			}, 1000);
		};
		
		function stopTimer(){
			if(angular.isDefined(stop)){
				$interval.cancel(stop);
				stop = undefined;			
			}
		};	
	
		$scope.$on('$destroy', function(){
			stopTimer();
		});
		
		
		$scope.startMessageTimer = function(){
			update_duration = true;
			jQuery('#start_message_timer').hide();
			jQuery('#stop_message_timer').show();
		};
		
		$scope.stopMessageTimer = function(){
			update_duration = false;
			jQuery('#start_message_timer').show();
			jQuery('#stop_message_timer').hide();
		};
		

		startTimer();
		$scope.startMessageTimer();
	
		//----------------- Page Flipper Functions ----------
		function setPageNumber(index){
			$scope.current_page_number = index + 1;
		}	
		
		 $scope.showPage = function(index_modifier){
			var pages = jQuery('.converted_page');
			var index = normalizeIndex(firstVisibleIndex(pages) + index_modifier, pages);
			$scope.stopMessageTimer();
			jQuery(pages).hide();
			jQuery(pages[index]).show();
			setPageNumber(index);					
		};
			
		$scope.showNextPage = function(){
			$scope.showPage(1);			
		};
		
		$scope.showPrevPage = function(){
			$scope.showPage(-1);
		};
		
		$scope.pageNavigation = function(){
			var pages = jQuery('.converted_page');
		
			if(pages.length > 0){
				pages.hide();
				jQuery('#page_navigation').show();
				setPageNumber(0);
			} else {
				jQuery('#page_navigation').hide();
			}
			
			$scope.total_pages = pages.length;
			
			jQuery(pages).first().show();
		};
		
		//--- Transitions --- 
		
		var fadeInMessage = function(){
			jQuery('#message').css({
				opacity: 0,
				visibility: 'visible'
			}).animate({
				opacity: 1.0	
			}, 1500, function(){
				// $scope.pageNavigation();
			});
		};
		
		$scope.messageTransition = function(){
			if(typeof $scope.transition != 'undefined'){
				switch($scope.transition){
					case 'fadein':		
						fadeInMessage();
				}
			}
			
		};
		
		$scope.setMessageSelect = function(index){	
			if(index == $scope.message_index){
				return 'active';
			}
		};
				
		$scope.startMessage = function(){
			jQuery('#message').css('visibility', 'hidden');
			
			$scope.messageTransition();
			
			$scope.setMessageSelect(jQuery('#message_select', $scope.index));
		};
		
		var touch_has_been_enabled = false;
		
		//--- Touch Features ---
		$scope.enableTouch = function(box){
			if(!touch_has_been_enabled){
				touch_has_been_enabled = true;
				jQuery(box).closest('#message').swipe({
					swipe: function(event, direction, distance, duration, fingerCount){
							if(direction === 'right'){
								$scope.setNextMessage();
							} else if(direction === 'left') {
								$scope.setPrevMessage();
							} else if(direction === 'up'){
								$scope.showNextPage();
							} else if(direction === 'down'){
								$scope.showPrevPage();
							}
					}
				});
			}
		};
		
		
}]);

newCityPlayer.directive('weatherForecasts', function(){
	return{
		templateUrl: 'partials/forecasts.html'
	};
});

newCityPlayer.controller('weatherForecastController', ['$scope', '$http', '$interval', 'PlayerData', 
						 function($scope, $http, $interval, PlayerData){
	var stop;
		
	startTimer = function(){
		stop = $interval(function(){
			$scope.setData();			
		}, 1800000);
	};
	
	function stopTimer(){
		if(angular.isDefined(stop)){
			$interval.cancel(stop);
			stop = undefined;			
		}
	};
	
	$scope.$on('$destroy', function(){
		stopTimer();
	});
		
	$scope.setData = function(){
		PlayerData.getData().then(function(player_data){;
			if(parseInt(player_data.raw.data[0].weather.enabled) === 1){
				$http.get(player_data.raw.data[0].weather.forecast).success(function(data, status){			
					$scope.forecasts = data.forecast.simpleforecast.forecastday;
					$scope.local = $scope.forecasts[0].date.tz_long;
				}).error(function(data, status){
					console.log(status);
				});
			} else {
				stopTimer();
			}
		});
	};

	startTimer();
	$scope.setData();	
}]);

newCityPlayer.directive('currentWeather', function(){
	return{
		templateUrl: 'partials/weather.html'
	};	
});

newCityPlayer.controller('currentWeatherController', ['$scope', '$http', '$interval', 'PlayerData', 
						 function($scope, $http, $interval, PlayerData){
	var stop;
		
	startTimer = function(){
		stop = $interval(function(){
			$scope.setData();			
		}, 60000);
	};
	
	function stopTimer(){
		if(angular.isDefined(stop)){
			$interval.cancel(stop);
			stop = undefined;			
		}
	};
	
	$scope.$on('$destroy', function(){
		stopTimer();
	});
		
	$scope.setData = function(){
		PlayerData.getData().then(function(player_data){
			if(parseInt(player_data.raw.data[0].weather.enabled) === 1){
				$http.get(player_data.raw.data[0].weather.current).success(function(data){
					$scope.weather = data.current_observation;
				}).error(function(data, status){
					console.log(status);
				});	
			} else {
				stopTimer();
			}
		});
	};
	
	startTimer();
	$scope.setData();
}]);

newCityPlayer.directive('tickers', function(){
	return{
		templateUrl: 'partials/tickers.html',
		transclude: true,
		
		controller: ['$scope', '$http', 'PlayerData', function($scope, $http, PlayerData){
			PlayerData.getData().then(function(player_data, status){

				var scrollers = player_data.raw.data[1].scrollers;
		
				$http.get(scrollers[0]).success(function(data){
					if(data.length > 0){
						$scope.ticker1 = data;
					}
				}).error(function(data, status){
					console.log(status);
				});
		
				$http.get(scrollers[1]).success(function(data){
					if(data.length > 0){
						$scope.ticker2 = data;
					}
				}).error(function(data, status){
					console.log(status);
				});
			});	
		}],
	};
});

// newCityPlayer.directive('ticker', function(){  
	 // return {
	 	// require: '^^tickers',
	 	// transclude: true,
        // link: function($scope, element, attrs, tickers_controller) {
            // // var watch = $scope.$watch(function() {
                // // return element.children().length;
            // // }, function() {
                // // $scope.$evalAsync(function() {
    	      			// console.log(tickers_controller);
//                 	
                // // });
            // // });		
	   		// }
    // };
// });

newCityPlayer.controller('clockController', ['$scope', '$interval', '$http', 'PlayerData', function($scope, $interval, $http, PlayerData){
	$scope.current_time_format = 'MMMM dd, yyyy h:mm:ss a';		

	function updateCurrentTime(){	
		$scope.current_time = Date.now();	
	}

	var stop;

	startTimer = function(){
		stop = $interval(function(){
			updateCurrentTime();						
		}, 1000);
	};
	
	function stopTimer(){
		if(angular.isDefined(stop)){
			$interval.cancel(stop);
			stop = undefined;			
		}
	};
	
	$scope.$on('$destroy', function(){
		stopTimer();
	});
	
	startTimer();
}]);