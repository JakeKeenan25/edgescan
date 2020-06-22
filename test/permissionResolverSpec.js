var expect = require('expect')
var PermissionDependencyResolver = require('../lib/permissionDependencyResolver')

describe('PermissionDependencyResolver', function() {

  var simplePermissionDependencies = {
      view: [],
      edit: ['view'],
      alter_tags: ['edit'],
      create: ['view'],
      delete: ['edit']
    }

  var complexPermissionDependencies = Object.assign({
    audit: ['create', 'delete'],
    batch_update: ['edit', 'create']
  }, simplePermissionDependencies)

  it('validates whether permissions can be granted given simple dependencies', function(){
    pdr = new PermissionDependencyResolver(simplePermissionDependencies)
    expect(pdr.canGrant(['view'], 'edit')).toBeTruthy()
    expect(pdr.canGrant(['view'], 'delete')).toBeFalsy()
    expect(pdr.canGrant(['view', 'edit'], 'alter_tags')).toBeTruthy()
    expect(pdr.canGrant(['view'], 'create')).toBeTruthy()
  })

  it('can sort permissions in dependency order given simple dependencies', function(){
    pdr = new PermissionDependencyResolver(simplePermissionDependencies)

    expect(pdr.sort(['edit', 'delete', 'view'])).toEqual(['view', 'edit', 'delete'])

    possible_orderings = [
      ['view', 'edit', 'create', 'alter_tags'],
      ['view', 'create', 'edit', 'alter_tags']
    ]
    // either of the possible orderings are valid for this input
    expect(possible_orderings).toContainEqual(pdr.sort(['create', 'alter_tags', 'view', 'edit']))
  })

  it('validates whether permissions can be denied given simple dependencies', function(){
    pdr = new PermissionDependencyResolver(simplePermissionDependencies)

    expect(pdr.canDeny(['view', 'edit'], 'view')).toBeFalsy()
    expect(pdr.canDeny(['view', 'edit'], 'edit')).toBeTruthy()
    expect(pdr.canDeny(['view', 'edit', 'create'], 'edit')).toBeTruthy()
    expect(pdr.canDeny(['view', 'edit', 'delete'], 'edit')).toBeFalsy()
  })

  it('validates whether permissions can be granted given complex dependencies', function(){
    pdr = new PermissionDependencyResolver(complexPermissionDependencies)

    expect(pdr.canGrant(['view', 'edit', 'delete'], 'batch_update')).toBeFalsy()
    expect(pdr.canGrant(['view', 'edit', 'create'], 'batch_update')).toBeTruthy()
    expect(pdr.canGrant(['view', 'edit', 'delete'], 'audit')).toBeFalsy()
    expect(pdr.canGrant(['view', 'edit', 'delete', 'create'], 'audit')).toBeTruthy()
  })

  it('throws an exception when validating permissions if existing permissions are invalid', function(){
    pdr = new PermissionDependencyResolver(complexPermissionDependencies)

    expect(function () { pdr.canGrant(['edit', 'create'], 'alter_tags') }).toThrowError("Invalid Base Permissions")
    expect(function () { pdr.canGrant(['view', 'delete'], 'alter_tags') }).toThrowError("Invalid Base Permissions")
    expect(function () { pdr.canDeny(['create', 'delete'], 'audit') }).toThrowError("Invalid Base Permissions")
  })

  it('can sort permissions in dependency order given complex dependencies', function(){
    pdr = new PermissionDependencyResolver(complexPermissionDependencies)
    possible_orderings = [
      ['view', 'edit', 'create', 'delete', 'audit'],
      ['view', 'create', 'edit', 'delete', 'audit'],
      ['view', 'edit', 'delete', 'create', 'audit']
    ]

    expect(possible_orderings).toContainEqual(pdr.sort(['audit', 'create', 'delete', 'view', 'edit']))
  })

})
