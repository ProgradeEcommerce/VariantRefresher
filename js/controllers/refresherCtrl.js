four51.app.controller('RefresherCtrl', ['$scope', '$sce', '$route', 'Product', function ($scope, $sce, $route, Product) {
	// new logic to compile a list of calls for each category InteropID
	function retreiveAllItems() {
		var getAll = [];
		$scope.products = [];
		angular.forEach($scope.tree, function(cat){
			getAll.push(Product.search(cat.InteropID, null, null, function (products, count) {
				console.log(products);
				$scope.products.push(products);
				$scope.productCount = $scope.productCount + count;
				$scope.productLoadingIndicator = false;
				$scope.searchLoading = false;
			}, $scope.settings.currentPage, $scope.settings.pageSize));
			if (cat.SubCategories.length > 0) {
				angular.forEach(cat.SubCategories, function(subcat){
					getAll.push(Product.search(subcat.InteropID, null, null, function (products, count) {
						console.log(products);
						$scope.products.push(products);
						$scope.productCount = $scope.productCount + count;
						$scope.productLoadingIndicator = false;
						$scope.searchLoading = false;
					}, $scope.settings.currentPage, $scope.settings.pageSize));
					if (subcat.SubCategories.length > 0) {
						angular.forEach(subcat.SubCategories, function(subsubcat){
							getAll.push(Product.search(subsubcat.InteropID, null, null, function (products, count) {
								console.log(products);
								$scope.products.push(products);
								$scope.productCount = $scope.productCount + count;
								$scope.productLoadingIndicator = false;
								$scope.searchLoading = false;
							}, $scope.settings.currentPage, $scope.settings.pageSize));
						});
					}
				});
			}
		});
        $q.all(getAll).then(function(response){
			console.log(response);
		}, function(response) {
			console.log(response);
		});
	}
}]);