four51.app.controller('CategoryCtrl', ['$routeParams', '$sce', '$scope', '$451', 'Category', 'Product', 'Nav', '$q', 'ProductDisplayService', 'Variant',
function ($routeParams, $sce, $scope, $451, Category, Product, Nav, $q, ProductDisplayService, Variant) {
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
	$scope.retrieveAllItems = function() {
		$scope.productLoadingIndicator = true;
		var getAll = [];
		$scope.allProducts = [];
		$scope.listOProducts = {};
		Category.tree(function (data) {
			$scope.catInterops = [];
			angular.forEach(data, function(cat){
				$scope.catInterops.push(cat.InteropID);
				if (cat.SubCategories.length > 0) {
					addSubCategories(cat);
				}
			});
			catSearch(0);
		});
	}

	function addSubCategories(c) {
		angular.forEach(c.SubCategories, function(s) {
			$scope.catInterops.push(s.InteropID);
			if (s.SubCategories.length > 0) {
				addSubCategories(s);
			}
		});
	}

	function catSearch(i) {
		Product.search($scope.catInterops[i], null, null, function (products, count) {
			angular.forEach(products, function(p){
				if (!$scope.listOProducts[p.ExternalID] && p.Type == 'VariableText'){
					$scope.allProducts.push(p);
					$scope.listOProducts[p.ExternalID] = p;
				}
			});
			$scope.productCount = $scope.productCount + count;
			if ($scope.catInterops[i + 1]){
				catSearch(i+1);
			}
			else {
				$scope.variantErrors = [];
				updateAllVariants(0);
			}
		}, $scope.settings.currentPage, $scope.settings.pageSize);
	}

	function updateAllVariants(i) {
		$scope.currentProgress = i;
		variantGetter(i, [], 0, 1);
	}

	function variantGetter(i, variantList, variantCount, page) {
		ProductDisplayService.getProductAndVariant($scope.allProducts[i].InteropID, null, function (data) {
			angular.forEach(data.product.Variants, function(v) {
				variantList.push(v);
			});
			variantCount += data.product.Variants.length;
			if (variantCount < data.product.VariantCount) {
				variantGetter(i, variantList, variantCount, page + 1)
			}
			else {
				if (variantList.length > 0) {
					getFullVariant(i, variantList, 0);
				}
				else if ($scope.allProducts[i + 1]) {
					updateAllVariants(i + 1);
				}
			}
		}, page, 100, null);
	}

	function getFullVariant(pi, variantList, vi) {
		ProductDisplayService.getProductAndVariant($scope.allProducts[pi].InteropID, variantList[vi].InteropID, function (data) {
			variantList[vi] = data.variant;
			if (variantList[vi + 1]) {
				getFullVariant(pi, variantList, vi + 1);
			}
			else {
				updateVariant(pi, variantList, 0);
			}
		}, 1, 100, null);
	}

	function updateVariant(pi, variantList, vi) {
		var newErrors = [];
        angular.forEach(variantList[vi].Specs, function(spec){
			var newErrors = [];
            if ($scope.variableDatabase[spec.Name]) {
                spec.Value = $scope.variableDatabase[spec.Name];
			}
			if(spec.Required && !spec.Value) {
				newErrors.push(spec.Label || spec.Name + ' is a required field.');
				variantList[vi].refused = true;
			}
			if(spec.Value && spec.Value > spec.Maxlength) {
				newErrors.push(spec.Label || spec.Name + ' is beyond the character limit.');
				variantList[vi].refused = true;
			}
			if (newErrors.length > 0){
				$scope.variantErrors.push({
				Item : $scope.allProducts[pi].ExternalID,
				Variant : variantList[vi].ExternalID,
				Errors : newErrors
				});
			}
        });
		if (!variantList[vi].refused) {
			Variant.save(variantList[vi], function(data){
				if (variantList[vi + 1]){
					updateVariant(pi, variantList, vi + 1);
				}
				else if ($scope.allProducts[pi + 1]){
					updateAllVariants(pi + 1);
				}
				else {
					alert('You made it!');
				}
			});
		}
		else {
			if (variantList[vi + 1]){
				updateVariant(pi, variantList, vi + 1);
			}
			else if ($scope.allProducts[pi + 1]){
				updateAllVariants(pi + 1);
			}
			else {
				alert('You made it!');
			}
		}
	}
}]);