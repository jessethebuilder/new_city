//------------------------ Hammer --------------------------------------------
function enableHammer(box){
	Hammer(jQuery(box).get(0)).on('dragstart', function(event) {
	  console.log('dragstart', event);
	});
	
	Hammer(jQuery(box).get(0)).on('drag', function(event){
	  // console.log('drag', event.gesture.deltaX, event.gesture.deltaY)
	  var target = event.target;
	  jQuery(target).css({
	    'transform': 'translate(' + event.gesture.deltaX + 'px,' + event.gesture.deltaY + 'px)'
	  });
	});
	
	Hammer(document.body).on('release', function(event){
	  console.log('release', event);
	  event.gesture.preventDefault();
	});
	
	Hammer(document.body).on('dragend', function(event) {
	  console.log('dragend', event);
	  
	  jQuery(event.target).css({'transform': 'translate(0,0)'});
	  // debugger;
	  var dropEl = document.elementFromPoint(event.gesture.center.pageX, event.gesture.center.pageY);
	  console.log('dropped on', dropEl);
	  if (jQuery(dropEl).hasClass('drop-target')) {
	    console.log('dropped on drop target');
	  }
	});
	jQuery(document.body).on('mousedown', '[draggable]', function(event){
	
	  console.log('mousedown', event);
	});
	jQuery(document.body).on('mouseup', '[draggable]', function(event){
	  
	  console.log('mouseup', event);
	  event.preventDefault();
	});
}
//------------------------ End Hammer Mod -------------------------------------

//--- Config Vars ---
var data_url = 'temp/test.json';
var client_name = window.location.hash.replace(/^#\//, '');

//--- Define Angular App
var newCityPlayer = angular.module('newCityPlayer', ['ngRoute', 'ngSanitize', 'door3.css']);

newCityPlayer.config(['$routeProvider',
function($routeProvider) {
	$routeProvider.when('/:client', {
		controller : 'messageController',
		templateUrl : 'partials/message.html',
		css : 'styles/clients/' + client_name + '.css'
	}).otherwise({
		// redirectTo: '/demo'
	});
}]);

newCityPlayer.factory('PlayerData', ['$http', '$q',
function($http, $q) {
	var ret = {};

	ret.getData = function() {
		var raw = $http({
			method : 'GET',
			url : data_url,
			cache : false
		});
		return $q.all({
			'raw' : raw
		});
	};

	return ret;
}]);

newCityPlayer.directive('message', function() {
	return {
		link : function($scope, element, attrs) {
			// following block is to enable pageNavigation(), which needs a number of images, served by ngRepeat, but not by
			// ngSrc, because the images are served by the JSON feed.
			var watch = $scope.$watch(function() {
				return element.children().length;
			}, function() {
				$scope.$evalAsync(function() {
					$scope.enableTouch(element);

					$scope.pageNavigation();
				});
			});
		},
	};
});

newCityPlayer.directive('messageSelect', function() {
	return {
		link : function($scope, e, attrs) {
			$scope.setMessageList(e, $scope.message_index);
		}
	};
});

newCityPlayer.controller('messageController', ['$scope', '$interval', '$http', '$sce', '$location', '$route', 'dateFilter', 'PlayerData',
function($scope, $interval, $http, $sce, $location, $route, dateFilter, PlayerData) {
	$scope.setData = function() {
		PlayerData.getData().then(function(player_data, status) {
			$http({
				method : 'GET',
				url : player_data.raw.data[0].feed_url,
				cache : false
			}).success(function(data) {
				$scope.messages = data;
				$scope.message_index = 0;
				$scope.setMessage($scope.message_index);
				$scope.selected_message = $scope.message; 
				// $scope.message.name;
			}).error(function(data, status) {
				console.log(status);
			});
		});
	};

	$scope.setData();

	$scope.setMessage = function(index) {
		$scope.message_index = index;
		$scope.raw_message = $scope.messages[$scope.message_index];
		$scope.message = $sce.trustAsHtml($scope.raw_message.message);
		$scope.message_name = $scope.raw_message.name;

		$scope.duration = $scope.raw_message.duration;
		$scope.initial_duration = $scope.duration;
		$scope.transition = $scope.raw_message.transition;

		$scope.selectedMessage = $scope.raw_message;

		$scope.startMessage();
	};

	$scope.setNextMessage = function() {
		var i = parseInt($scope.message_index);
		i++;
		if (i >= $scope.messages.length) {
			$scope.setData();
		} else {
			$scope.setMessage(i);
		}
	};

	$scope.setPrevMessage = function() {
		var i = parseInt($scope.message_index);
		if (i <= 0) {
			i = $scope.messages.length;
		}
		i--;
		$scope.setMessage(i);
	};

	//---------------- Timer functions -------------
	$scope.updateMessage = function() {
		if ($scope.multipage && $scope.current_page_number != $scope.total_pages - 1) {
			$scope.duration = $scope.initial_duration;
			$scope.setNextPage();
			$scope.startMessageTimer();
		} else {
			$scope.setNextMessage();
		}
	};

	$scope.updateDuration = function() {
		if (update_duration) {
			$scope.duration = $scope.duration - 1;

			if ($scope.duration < 0) {
				$scope.updateMessage();
			}
		}
	};

	var stop;

	$scope.startTimer = function() {
		stop = $interval(function() {
			$scope.updateDuration();
		}, 1000);
	};

	$scope.stopTimer = function() {
		if (angular.isDefined(stop)) {
			$interval.cancel(stop);
			stop = undefined;
		}
	};

	$scope.$on('$destroy', function() {
		$scope.stopTimer();
	});

	$scope.startMessageTimer = function() {
		update_duration = true;
		jQuery('#start_message_timer').hide();
		jQuery('#stop_message_timer').show();
	};

	$scope.stopMessageTimer = function() {
		update_duration = false;
		jQuery('#start_message_timer').show();
		jQuery('#stop_message_timer').hide();
	};

	$scope.startTimer();
	$scope.startMessageTimer();

	//----------------- Page Navigation ----------

	$scope.setPageNumber = function(index) {
		$scope.current_page_number = index + 1;
	};

	$scope.setPage = function(index_modifier) {
		var pages = jQuery('.converted_page');
		var index = normalizeIndex(firstVisibleIndex(pages) + index_modifier, pages);
		$scope.stopMessageTimer();
		jQuery(pages).hide();
		jQuery(pages[index]).show();
		$scope.messageTransition();
		$scope.setPageNumber(index);
	};

	$scope.setNextPage = function() {
		$scope.setPage(1);
	};

	$scope.setPrevPage = function() {
		$scope.setPage(-1);
	};

	$scope.pageNavigation = function() {
		var pages = jQuery('.converted_page');

		if (pages.length > 1) {
			pages.hide();
			jQuery('#page_navigation').show();
			$scope.setPageNumber(0);
			$scope.multipage = true;
		} else {
			jQuery('#page_navigation').hide();
			$scope.multipage = false;
		}

		$scope.total_pages = pages.length;

		jQuery(pages).first().show();
	};

	//--- Transitions ---

	$scope.fadeInMessage = function() {
		jQuery('#message').find('.nc_component').css({
			opacity : 0,
			visibility : 'visible'
		}).animate({
			opacity : 1.0
		}, 1500, function() {
			// $scope.pageNavigation();
		});
	};

	$scope.messageTransition = function() {
		if ( typeof $scope.transition != 'undefined') {
			switch($scope.transition) {
			case 'fadein':
				$scope.fadeInMessage();
			}
		}

	};

	$scope.setMessageList = function(index) {
		if (index == $scope.message_index) {
			return 'active';
		}
	};

	$scope.startMessage = function() {
		// jQuery('#message').css('visibility', 'hidden');

		$scope.messageTransition();

		$scope.setMessageList(jQuery('#message_list', $scope.index));
	};

	var touch_has_been_enabled = false;

	//--- Touch Features ---
	$scope.enableTouch = function(box) {
		var m = $(box).closest('#message');
		
		if (!touch_has_been_enabled) {
			touch_has_been_enabled = true;
			
			// enableHammer(m.find(message_inner));
			// // var h = new Hammer(box);
			// var el = document.getElementById('message');
			// var h = new Hammer(el, {
				// behavior:{
					// userDrag: true
				// }
			// });
			// h.on('swipe', function(ev){
				// console.log(ev);
			// });
// 			
			
			m.find('.nc_component').swipe({
				swipe : function(event, direction, distance, duration, fingerCount) {
					if(distance > 200){
						if (direction === 'right') {
							$scope.setNextMessage();
						} else if (direction === 'left') {
							$scope.setPrevMessage();
						} else if (direction === 'down') {
							$scope.setNextPage();
						} else if (direction === 'up') {
							$scope.setPrevPage();
						}
					}	
				}
			});
			
			m.draggable();
		}
	};
}]);

newCityPlayer.directive('weatherForecasts', function() {
	return {
		templateUrl : 'partials/forecasts.html'
	};
});

newCityPlayer.controller('weatherForecastController', ['$scope', '$http', '$interval', 'PlayerData',
function($scope, $http, $interval, PlayerData) {
	var stop;

	$scope.startTimer = function() {
		stop = $interval(function() {
			$scope.setData();
		}, 1800000);
	};

	$scope.stopTimer = function() {
		if (angular.isDefined(stop)) {
			$interval.cancel(stop);
			stop = undefined;
		}
	};

	$scope.$on('$destroy', function() {
		$scope.stopTimer();
	});

	$scope.setData = function() {
		PlayerData.getData().then(function(player_data) {;
			if (parseInt(player_data.raw.data[0].weather.enabled) === 1) {
				$http.get(player_data.raw.data[0].weather.forecast).success(function(data, status) {
					$scope.forecasts = data.forecast.simpleforecast.forecastday;
					$scope.local = $scope.forecasts[0].date.tz_long;
				}).error(function(data, status) {
					console.log(status);
				});
			} else {
				$scope.stopTimer();
			}
		});
	};

	$scope.startTimer();
	$scope.setData();
}]);

newCityPlayer.directive('currentWeather', function() {
	return {
		templateUrl : 'partials/weather.html'
	};
});

newCityPlayer.controller('currentWeatherController', ['$scope', '$http', '$interval', 'PlayerData',
function($scope, $http, $interval, PlayerData) {
	var stop;

	$scope.startTimer = function() {
		stop = $interval(function() {
			$scope.setData();
		}, 60000);
	};

	$scope.stopTimer = function() {
		if (angular.isDefined(stop)) {
			$interval.cancel(stop);
			stop = undefined;
		}
	};

	$scope.$on('$destroy', function() {
		$scope.stopTimer();
	});

	$scope.setData = function() {
		PlayerData.getData().then(function(player_data) {
			if (parseInt(player_data.raw.data[0].weather.enabled) === 1) {
				$http.get(player_data.raw.data[0].weather.current).success(function(data) {
					$scope.weather = data.current_observation;
				}).error(function(data, status) {
					console.log(status);
				});
			} else {
				$scope.stopTimer();
			}
		});
	};

	$scope.startTimer();
	$scope.setData();
}]);

//--- Tickers ---

newCityPlayer.directive('ticker', function(){
	return {
		scope:{
			'ticker': '='
		},
		templateUrl: 'partials/ticker.html',
		controller: ['$scope', '$http', 'PlayerData', function($scope, $http, PlayerData){
			$scope.setData = function(){
				PlayerData.getData().then(function(player_data, status){	
					$http.get(player_data.raw.data[1].scrollers[$scope.ticker_index]).success(function(data){
						$scope.data = data;
					}).error(function(data, status){
						console.log(status);
					});
				});
			};
			
			$scope.setData();

		}],
		link: function($scope, e, attrs, controller){
			// Set ticker_index for controller above
			$scope.ticker_index = parseInt(attrs.ticker.replace(/ticker/, '')) - 1;
			

			$scope.startTicker = function(){
				var ticker_inner = jQuery(e).find('.ticker_inner');
				ticker_inner.hide();
			
				window.setTimeout(function(){
				ticker_inner.show();
				jQuery(e).marquee({
					speed: 6000, 
					// speed: 2000,
					pauseOnHover: true,
					});			
				}, 500);
				
				jQuery(e).bind('finished', function(){
					$scope.setData();
				});
			};
			
			$scope.startTicker();
		
		}
	};	
});

newCityPlayer.controller('clockController', ['$scope', '$interval', '$http', 'PlayerData',
function($scope, $interval, $http, PlayerData) {
	$scope.current_time_format = 'MMMM dd, yyyy h:mm:ss a';

	$scope.updateCurrentTime = function() {
		$scope.current_time = Date.now();
	};

	var stop;

	$scope.startTimer = function() {
		stop = $interval(function() {
			$scope.updateCurrentTime();
		}, 1000);
	};

	$scope.stopTimer = function() {
		if (angular.isDefined(stop)) {
			$interval.cancel(stop);
			stop = undefined;
		}
	};

	$scope.$on('$destroy', function() {
		$scope.stopTimer();
	});

	$scope.startTimer();
}]);

//--- end NewCityPlayerApp ---

var close_weather_countdown;

function _toggleWeather(){
	jQuery('#weather_components').toggle(400, function(){
		if(jQuery(this).is(':visible')){
			close_weather_countdown = window.setTimeout(function(){
				jQuery('#weather_components').hide(400);
			}, 30000);
		} else {
			window.clearTimeout(close_weather_countdown);
		}
	});	
}

function toggleWeather() {
	// Effects elements in 2 controllers (weatherController and forecastController), so this logic is outside of the Angular App
	jQuery('#toggle_weather').find('.click_control').click(function() {
		_toggleWeather();
	});
}

jQuery(function() {
	toggleWeather();
}); 