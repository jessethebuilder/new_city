//--- Config Vars ---
var data_url = 'temp/test.json';

//--- Define Angular App
var newCityPlayer = angular.module('newCityPlayer', ['ngRoute', 'ngSanitize']);


newCityPlayer.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		redirectTo: '/demo'
	}).when('/:client', {
		// controller: 'newCityPlayerController',
		// templateUrl: 'partials/message.html',
		// css: 'styles/clients/demo.css'
	}).otherwise({
		redirectTo: '/'
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



newCityPlayer.directive('messageContainer', function() {    
    return {
    	templateUrl: 'partials/message.html',
        link: function($scope, element, attrs) {
            // Trigger when number of children changes,
            // including by directives like ng-repeat
            var watch = $scope.$watch(function() {
                return element.children().length;
            }, function() {
                // Wait for templates to render
                $scope.$evalAsync(function() {
   				// $scope.startMessage();               
                });
            });
        },
    };
});

newCityPlayer.directive('message', function() {    
    return {
        link: function($scope, element, attrs) {
            // Trigger when number of children changes,
            // including by directives like ng-repeat
            var watch = $scope.$watch(function() {
                return element.children().length;
            }, function() {
                // Wait for templates to render
                $scope.$evalAsync(function() {
   				$scope.pageNavigation();               
                });
            });
        },
    };
});

newCityPlayer.controller('messageController', 
						 ['$scope', '$interval', '$http', '$sce', '$location', 'dateFilter', 'PlayerData',
						 function($scope, $interval, $http, $sce, $location, dateFilter, PlayerData){
		PlayerData.getData().then(function(player_data, status){		
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
				i = 0;
			}
			
			$scope.setMessage(i); 	
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
		var stop;

		function updateDuration(){
			if(update_duration){
				$scope.duration = $scope.duration - 1;			
			
				if($scope.duration == 0){
		    		$scope.setNextMessage();
		    	}	
			} 
		}
			
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
		
		$scope.$on('$destroy', function(){
			stopTimer();
		});
		
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
			
			// jQuery(pages).css('display', 'none');	
			// jQuery(pages).first().css('display', 'block');
			
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
		
		$scope.startMessage = function(){
			jQuery('#message').css('visibility', 'hidden');
			
			$scope.messageTransition();
			// $scope.pageNavigation();		
		};
}]);

newCityPlayer.directive('weatherForecasts', function(){
	return{
		templateUrl: 'partials/forecasts.html'
	};
});

newCityPlayer.controller('weatherForecastController', ['$scope', '$http', 'PlayerData', function($scope, $http, PlayerData){
	PlayerData.getData().then(function(player_data){;
		$http.get(player_data.raw.data[0].weather.forecast).success(function(data, status){		
			$scope.forecasts = data.forecast.simpleforecast.forecastday;
			$scope.local = $scope.forecasts[0].date.tz_long;
		}).error(function(data, status){
			console.log(status);
		});
	});
}]);

newCityPlayer.directive('currentWeather', function(){
	return{
		templateUrl: 'partials/weather.html'
	};	
});

newCityPlayer.controller('currentWeatherController', ['$scope', '$http', 'PlayerData', function($scope, $http, PlayerData){
	PlayerData.getData().then(function(player_data){
		$http.get(player_data.raw.data[0].weather.current).success(function(data){
			$scope.weather = data.current_observation;
		}).error(function(data, status){
			console.log(status);
		});	
	});
}]);



newCityPlayer.directive('tickers', function(){  
	  return {
        templateUrl: 'partials/tickers.html',
        
        link: function($scope, element, attrs) {
            // Trigger when number of children changes,
            // including by directives like ng-repeat
            // var watch = $scope.$watch(function() {
                // return element.children().length;
            // }, function() {
                // Wait for templates to render
                // $scope.$evalAsync(function() {
     				// $scope.startTickers();               
                // });
            // });
        },
    };
	
	
    // return {
    	// link: function($scope, element, attrs) {
            // Trigger when number of children changes,
            // including by directives like ng-repeat
            // var watch = $scope.$watch(function() {
                // $scope.startTickers();            	
            // });
        // },
    // };
});

newCityPlayer.controller('tickerController', ['$scope', '$http', 'PlayerData', function($scope, $http, PlayerData){
	PlayerData.getData().then(function(player_data, status){
		// console.log(player_data);
		var scrollers = player_data.raw.data[1].scrollers;
		
		$http.get(scrollers[0]).success(function(data){
			$scope.ticker_1 = data;
		}).error(function(data, status){
			console.log(status);
		});
		
		$http.get(scrollers[1]).success(function(data){
			$scope.ticker_2 = data;
		}).error(function(data, status){
			console.log(status);
		});
	});	
	
	$scope.startTickers = function(){
		jQuery('#tickers').find('.ticker_list').webTicker();
	};
	
}]);

newCityPlayer.controller('clockController', ['$scope', '$interval', '$http', 'PlayerData', function($scope, $interval, $http, PlayerData){
			// PlayerData.getData().then(function(player_data, status){
			// // Get Message Data
				// $http.get(...).success(function(data){			
					// $scope.update_timer = from Player data
				// }).error(function(data, status){
					// console.log(status);
				// });
			// });		
	
	//var update_at_in_seconds = new Date($scope.update_timer).getSeconds();
	//$scope.auto_update_in_seconds = ((Math.floor(Date.parse($scope.update_time) / 1000)) - (Math.floor(Date.now() / 1000)));

	$scope.current_time_format = 'MMMM dd, yyyy h:mm:ss a';		

	function updateCurrentTime(){	
		$scope.current_time = Date.now();	
	}
	
	function updateAutoUpdate(){
		$scope.auto_update_in_seconds = $scope.auto_update_in_seconds - 1;
		
		$scope.auto_update_timer = $scope.auto_update_in_seconds;
		
		var n = $scope.auto_update_in_seconds; 
		var h = Math.floor(n / 3600);
		var m = Math.floor((n % 3600) / 60);
		var s = n - (h * 3600 + m * 60);
		
		s = s < 10 ? '0' + s : s;
		
		var time;
		
		if(h === 0){
			time = m + ":" + s;
		} else {
			m = m < 10 ? '0' + m : m;
			time = h + ":" + m + ":" + s;
		}
		
		$scope.auto_update_timer = time;
	}
	
	var stop;

	startTimer = function(){
		stop = $interval(function(){
			updateCurrentTime();						
			updateAutoUpdate();	  
			if($scope.update_time <= $scope.current_time){			
				window.location = window.location.pathname;
			}
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
