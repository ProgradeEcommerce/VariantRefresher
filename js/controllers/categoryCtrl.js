four51.app.controller('CategoryCtrl', ['$routeParams', '$sce', '$scope', '$451', 'Category', 'Product', 'Nav', '$q',
function ($routeParams, $sce, $scope, $451, Category, Product, Nav, $q) {
	$scope.productLoadingIndicator = true;
	$scope.settings = {
		currentPage: 1,
		pageSize: 100
	};
	$scope.trusted = function(d){
		if(d) return $sce.trustAsHtml(d);
	}

	function _search() {
		$scope.searchLoading = true;
		Product.search($routeParams.categoryInteropID, null, null, function (products, count) {
			$scope.products = products;
			$scope.productCount = count;
			$scope.productLoadingIndicator = false;
			$scope.searchLoading = false;
		}, $scope.settings.currentPage, $scope.settings.pageSize);
	}

	$scope.$watch('settings.currentPage', function(n, o) {
		if (n != o || (n == 1 && o == 1))
			_search();
	});

	if ($routeParams.categoryInteropID) {
	    $scope.categoryLoadingIndicator = true;
        Category.get($routeParams.categoryInteropID, function(cat) {
            $scope.currentCategory = cat;
	        $scope.categoryLoadingIndicator = false;
        });
    }
	else if($scope.tree){
		$scope.currentCategory ={SubCategories:$scope.tree};
	}


	$scope.$on("treeComplete", function(data){
		if (!$routeParams.categoryInteropID) {
			$scope.currentCategory ={SubCategories:$scope.tree};
		}
		retreiveAllItems();
	});

    // panel-nav
    $scope.navStatus = Nav.status;
    $scope.toggleNav = Nav.toggle;
	$scope.$watch('sort', function(s) {
		if (!s) return;
		(s.indexOf('Price') > -1) ?
			$scope.sorter = 'StandardPriceSchedule.PriceBreaks[0].Price' :
			$scope.sorter = s.replace(' DESC', "");
		$scope.direction = s.indexOf('DESC') > -1;
	});

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