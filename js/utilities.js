function firstVisibleIndex(collection){
	var index;
	for(var i = 0; i < collection.length; i++){
		if(jQuery(collection[i]).is(':visible')){
			return i;	
		}
	}
}

function normalizeIndex(i, collection){
	var ret = i;
	
	if(i >= collection.length){
		ret = 0;
	} else if(i < 0) {
		ret = collection.length -1;
	}
	
	return ret;
}