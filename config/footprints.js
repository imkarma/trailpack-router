module.exports = {
  models: {
    routes: {
      create: {
        method: 'POST',
        path: '/{model}',
        handler: 'FootprintController.create'
      },
      find: {
        method: 'GET',
        path: '/{model}',
        handler: 'FootprintController.find'
      },
      findOne: {
        method: 'GET',
        path: '/{model}/{id}',
        handler: 'FootprintController.findOne'
      },
      update: {
        method: [ 'PUT', 'PATCH' ],
        path: '/{model}/{id?}',
        handler: 'FootprintController.update'
      },
      destroy: {
        method: 'DELETE',
        path: '/{model}/{id?}',
        handler: 'FootprintController.destroy'
      },
      createAssociation: {
        method: 'POST',
        path: '/{parentModel}/{parentId}/{childModel}',
        handler: 'FootprintController.createAssociation'
      },
      findAssociation: {
        method: 'GET',
        path: '/{parentModel}/{parentId}/{childModel}',
        handler: 'FootprintController.findAssociation'
      },
      findOneAssociation: {
        method: 'GET',
        path: '/{parentModel}/{parentId}/{childModel}/{childId}',
        handler: 'FootprintController.findAssociation'
      },
      updateAssociation: {
        method: 'PUT',
        path: '/{parentModel}/{parentId}/{childModel}/{childId?}',
        handler: 'FootprintController.updateAssociation'
      },
      destroyAssociation: {
        method: 'DELETE',
        path: '/{parentModel}/{parentId}/{childModel}/{childId?}',
        handler: 'FootprintController.destroyAssociation'
      }
    }
  }
}
