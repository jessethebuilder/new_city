//--- Config Vars ---
// var data_url = 'temp/test_rss.xml';
var data_url = 'temp/test.json';

//--- Page Nav ---



//--- Define Angular App
var newCityPlayer = angular.module('newCityPlayer', ['ngRoute', 'ngSanitize']);

newCityPlayer.directive('convertedImageContainer', function() {    
    return {
        link: function($scope, element, attrs) {
            // Trigger when number of children changes,
            // including by directives like ng-repeat
            var watch = $scope.$watch(function() {
                return element.children().length;
            }, function() {
                // Wait for templates to render
                $scope.$evalAsync(function() {
                	
     				$scope.handleConvertedPages();               
                });
            });
        },
    };
});

newCityPlayer.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		redirectTo: '/demo/0'
	}).when('/:client/:message_index', {
		controller: 'newCityPlayerController',
		templateUrl: 'partials/player.html'
	}).when('/:client', {
		redirectTo: '/demo/0'
	}).otherwise({
		redirectTo: '/'
	});
}]);

function parseMessageData(messageData){
	var arr = [];
	for(var i = 0; i < messageData.length; i++){
		m = messageData[i];
		
		arr.push({
			message: m.message,
			name: m.name,
			duration: m.duration,
			transition: m.transition
		});
	}
	return arr;
}

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

newCityPlayer.controller('newCityPlayerController', 
						 ['$scope', '$routeParams', '$interval', '$http', '$sce', '$location', 'dateFilter', 'PlayerData',
						 function($scope, $routeParams, $interval, $http, $sce, $location, dateFilter, PlayerData){
		PlayerData.getData().then(function(player_data, status){
			// Get Message Data
			
			$http({
				method: 'GET',
				url: player_data.raw.data[0].feed_url,
				cache: false
			}).success(function(data){			
				$scope.messages = data;
				var raw_message = $scope.messages[$routeParams.message_index];
			 	$scope.message = $sce.trustAsHtml(raw_message.message);
				$scope.duration = raw_message.duration;		
				$scope.message_name = raw_message.name;	
			}).error(function(data, status){
				console.log(status);
			});
			
		});
		

		
		$scope.ticker = ['Ticker item 1', 'Some news that has some stuff', "dont' think I like Law and Order"];
		$scope.update_time_format = 'MMMM dd, yyyy h:mm:ss a';
		$scope.current_time_format = 'MMMM dd, yyyy h:mm:ss a';
		
		
		$scope.setMessage = function(index){
			$location.path('/' + $routeParams.client + '/' + index);
		};
		
		$scope.setNextMessage = function(){
			var i = parseInt($routeParams.message_index);
			i++;
			if(i >= $scope.messages.length){
				i = 0;
			}
			
			$scope.setMessage(i); 	
		};
		
		$scope.setPrevMessage = function(){
			var i = parseInt($routeParams.message_index);
			if(i <= 0){
				i = $scope.messages.length;
			}
			i--;
			$scope.setMessage(i);
		};
		
		
		//---------------- Timer functions -------------
		var stop;
		var update_at_in_seconds = new Date($scope.update_timer).getSeconds();
		$scope.auto_update_in_seconds = ((Math.floor(Date.parse($scope.update_time) / 1000)) - (Math.floor(Date.now() / 1000)));

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
		
		function updateDuration(){
			if(update_duration){
				$scope.duration = $scope.duration - 1;			
				if($scope.duration == 0){
		    		$scope.setNextMessage();
		    	}	
			} 
		}
		
		function updateCurrentTime(){	
			$scope.current_time = Date.now();	
		}
		
		var stop;

		startTimer = function(){
			stop = $interval(function(){
				updateDuration();			
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
		
		$scope.handleConvertedPages = function(){
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
}]);

newCityPlayer.controller('weatherForecastController', ['$http', 'PlayerData', function($http, PlayerData){
	PlayerData.getData().then(function(player_data){;
		$http.get(player_data.raw.data[0].weather.forecast).success(function(data, status){
			
		}).error(function(data, status){
			console.log(status);
		});
	});
}]);