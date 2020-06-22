const TSORT = require('tsort');

// Debug toggle
const DEBUG = false;

class PermissionDependencyResolver{
	constructor(dependencies){
		this.dependencies = dependencies;
	}


	/**
	* Get a list of Dependences needed for a passed permission or array of permissions
	* @method getDependencyList
	* @param {Array} permissions
	* @param {String} permissions
	* @return {Array} returns dependencyList 
  */
	getDependencyList(permissions){
		if (DEBUG){console.log(`DEBUG: \tPermissionDependencyResolver.getDependencyList(${permissions})`);}
		// Default to Null and null check after each call to getDependencyList().
		let dependencyList = null;

		// Param checking
		if (permissions){
			try{
				let _dependencyList = [];
				if (typeof permissions == 'string' || Array.isArray(permissions)) {
					// Extract Dependency list for specific permission
					if (Array.isArray(permissions)){
						// For each permission, get the dependancy for the permission
						permissions.forEach(permission => {
							const dependencies = this.dependencies[permission];
							if (dependencies){
								_dependencyList.push(...dependencies);
							}
						});
					}else{
						_dependencyList = this.dependencies[permissions];
					}
				}
				// Remove duplicate entries.
				dependencyList = [...new Set(_dependencyList)];
			}catch(error){
				console.log(`Error: PermissionDependencyResolver.getDependencyList(${permissions}):${error}`);
			}
		}

		return dependencyList; 
	}


	/**
	* Tests the passed existingPermissions to see if they are a valid combination
	* @method isValidExistingPermission
	* @param {Array} existingPermissions
	* @return {Boolean} returns true or false 
  */
	isValidExistingPermission(existingPermissions){
		if (DEBUG){console.log(`DEBUG: \tPermissionDependencyResolver.isValidExistingPermission(${existingPermissions})`);}
		let _isValidExistingPermission = false;

		// Param Checking
		if(existingPermissions){
			// Get Dependency List for existing permissions.
			const dependencyList = this.getDependencyList(existingPermissions);

			if(dependencyList){
				// Check that each permission in Dependency List is in the existing permissions
				_isValidExistingPermission = dependencyList.every(permission => existingPermissions.includes(permission));
			}
		}

		return _isValidExistingPermission;
	}


	/**
	* Tests the existing permission to see if we can add a new permission.
	* @method canGrant
	* @param {Array} existing
	* @param {Array} permToBeGranted
	* @return {Boolean} returns true or false 
  */
	canGrant(existing, permToBeGranted){
		if (DEBUG){console.log(`DEBUG: \tPermissionDependencyResolver.canGrant(${existing},${permToBeGranted})`);}
		if (!this.isValidExistingPermission(existing)){
			throw this.InvalidBasePermissionsError().message;
		}

		let _canGrant = false;

		// Param Checking
		if (permToBeGranted){
			// Get Dependency List for permToBeGranted
			const dependencyList = this.getDependencyList(permToBeGranted);
			if (dependencyList){
				// Check that each permission in Dependency List is in the existing permissions
				_canGrant = dependencyList.every(permission => existing.includes(permission));
			}
		}

		return _canGrant;
	}


	/**
	* Tests the existing permission to see if we can remove a permission without making existing an invalid combination.
	* @method canDeny
	* @param {Array} existing
	* @param {Array} permToBeDenied
	* @return {Boolean} returns true or false 
  */
	canDeny(existing, permToBeDenied){
		if (DEBUG){console.log(`DEBUG: \tPermissionDependencyResolver.canDeny(${existing},${permToBeDenied})`);}
		if (!this.isValidExistingPermission(existing)){
			throw this.InvalidBasePermissionsError().message;
		}

		let _canDeny = false;

		// Param Checking
		if (permToBeDenied){
			// Remove permToBeDenied from existing
			let permissionAfterRemoving = existing.filter(item => item !== permToBeDenied);
			// Get Dependency List for permissionAfterRemoving
			const dependencyList = this.getDependencyList(permissionAfterRemoving);
			if(dependencyList){
				// Check that each permission in Dependency List is in permissionAfterRemoving list.
				_canDeny = dependencyList.every(permission => permissionAfterRemoving.includes(permission));
			}
		}

		return _canDeny;
	}


	/**
	* Sorts an Array of given list of permissions into the order that they should be granted to satisfy dependencies
	* @method sort
	* @param {Array} permissions
	* @return {Array} returns tsort().sort()
  */
	sort(permissions){
		if (DEBUG){console.log(`DEBUG: \tPermissionDependencyResolver.sort(${permissions})`);}
		let _sort = TSORT();
	
		// Param Checking.
		if (permissions){
			permissions.forEach(permission => {
				// Get Dependency List for each permission.
				const dependencyList  = this.getDependencyList(permission);

				if(dependencyList){
					// If the Dependency List is array and has elements.
					if(dependencyList && dependencyList.length > 0){
						// For each permission in Dependency List
						dependencyList.forEach(per => {
							// Add Dependency List permission to _sort with the Origional Permission
							_sort.add(per, permission);
						});
					}else{
						// If Dependency List is not array, add to _sort with the Origional Permission
						_sort.add(permission);
					}
				}
			});
		}

		return _sort.sort();
	}


	InvalidBasePermissionsError(){
		return {
			name:'InvalidBasePermissionsError',
			message:'Invalid Base Permissions',
			stack:Error().stack
		}
	}
}

module.exports = PermissionDependencyResolver