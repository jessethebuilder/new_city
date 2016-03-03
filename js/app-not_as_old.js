//--- Config Vars ---
// var data_url = 'temp/test_rss.xml';
var data_url = 'temp/test.json';

//--- Define Angular App
var newCityPlayer = angular.module('newCityPlayer', ['ngRoute', 'ngSanitize']);

newCityPlayer.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		// controller: 'newCityPlayerController',
		// templateUrl: 'partials/player.html', 
		// css: 'styles/dev.css'
		redirectTo: '/demo/0'
	}).when('/:client/:message_index', {
		controller: 'newCityPlayerController',
		templateUrl: 'partials/player.html'
	}).when('/:client', {
		redirectTo: '/demo/0'
		// controller: 'newCityPlayerController',
		// css: 'styles/' + $routeParams.client
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

// newCityPlayer.factory('')

newCityPlayer.factory('PlayerData', ['$http', '$q', function($http, $q){
	return{
		messages: function(){
			alert('s');
		var def = $q.defer();
		
		$http({
			method: 'GET',
			url: data_url,
			cache: true
		}).success(function(data){
			
			return{
			messages: $http({
				method: 'GET',
				url: data[0]['feed_url'],
				cache: true
			}).success(function(message_data){
				def.resolve(parseMessageData(message_data));		
			});
		}).error(function(data, status){
			def.reject(status);
			console.log('1231');
		});
		
		return def.promise;
		}
		}
	}
			
			




}]);

newCityPlayer.controller('newCityPlayerController', 
						 ['$scope', '$routeParams', '$interval', '$http', '$sce', '$location', 'dateFilter', 'PlayerData',
						 function($scope, $routeParams, $interval, $http, $sce, $location, dateFilter, PlayerData){
	//------ Get Messages --------
		$scope.messages = PlayerData.messages;
		$scope.message = $sce.trustAsHtml($scope.messages[$routeParams.message_index].message);
				$scope.duration = $scope.messages[$routeParams.message_index].duration;
				

		
		// $scope.message_timer = true;
		
		
		
		// $scope.messages = getMessagesFromData(data);

		//------- Set Player Options ----------------
		// var player_data = parsePlayerData(data);
				
		//not sure what ticker is going to look like
		$scope.ticker = ['Ticker item 1', 'Some news that has some stuff', "dont' think I like Law and Order"];
		$scope.update_time_format = 'MMMM dd, yyyy h:mm:ss a';
		$scope.current_time_format = 'MMMM dd, yyyy h:mm:ss a';
		
		// $scope.update_time = new Date(parseUpdateTime(player_data));
		
		//------------- Navigation Functions --------------
		//Set initial values
		// $scope.message_index = 0;
		$scope.page_index = 0;
		
		function setPageNavigation(){
			var multi_page = $scope.messages[$scope.message_index].pages.length > 1 ? true : false;
			
			if(multi_page){
				jQuery('#page_navigation').show();
			} else {
				jQuery('#page_navigation').hide();
			}
			
			return multi_page;
		}
		
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
			if($scope.message_timer){
				$scope.duration = $scope.duration - 1;			
			console.log($scope.duration);
				if($scope.duration <= 0){
		    		$scope.setNextMessage();
		    	}	
			} 
		}
		
		function updateCurrentTime(){	
			$scope.current_time = Date.now();	
		}
		

		startTimer = function(){
			// if(!angular.isDefined(stop)){
				// stopTimer();
			// }
			stop = $interval(function(){
				updateDuration();			
				updateCurrentTime();							  
				updateAutoUpdate();  	 
				if($scope.update_time <= $scope.current_time){			
					window.location = window.location.pathname;
				}
			}, 1000);
		};
		
		function stopTimer (){
			if(angular.isDefined(stop)){
				$interval.cancel(stop);
				stop = undefined;
				
			}
		};
		
		$scope.startMessageTimer = function(){
			$scope.message_timer = true;
			jQuery('#start_message_timer').hide();
			jQuery('#stop_message_timer').show();
		};
		
		$scope.stopMessageTimer = function(){
			$scope.message_timer = false;
			jQuery('#start_message_timer').show();
			jQuery('#stop_message_timer').hide();
		};
		
		$scope.$on('$destroy', function(){
			stopTimer();
		});
		
		// stopTimer();
		startTimer();
		$scope.startMessageTimer();
	
		//----------------- Page Flipper Functions ----------
		
		$scope.startPageNavigation = function (){
        	
    	};
		
		$scope.$on('$viewContentLoaded', function(){
       		jQuery('.converted_page').hide();
       		// $scope.startPageNavigation(); 
    	});
		
		// stopTimer();
		// $scope.setPage = function(page_index){
			// stopMessageTimer();
			// $scope.setMessage($scope.message_index, page_index);
		// };
// 		
		// $scope.setNextPage = function(){
			// $scope.setPage($scope.page_index + 1);
		// };
// 		
		// $scope.setPrevPage = function(){
			// $scope.setPage($scope.page_index - 1);
		// };
// 		
		// //------------ Ticker Functions ----------------
		// $scope.$on('ngRepeatFinished', function(e){
			// jQuery('#ticker').webTicker();	
// 
		// });
	
}]);
