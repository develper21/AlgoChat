import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  resource: { type: String, required: true }, // 'users', 'meetings', 'messages', 'settings', 'reports'
  actions: [{ type: String }], // 'create', 'read', 'update', 'delete', 'manage'
  conditions: { type: mongoose.Schema.Types.Mixed } // Additional conditions
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  permissions: [permissionSchema],
  isSystem: { 
    type: Boolean, 
    default: false 
  }, // System roles cannot be deleted
  priority: { 
    type: Number, 
    default: 0 
  }, // Higher priority overrides lower
  isActive: { 
    type: Boolean, 
    default: true 
  },
  userCount: { 
    type: Number, 
    default: 0 
  }, // Cached count of users with this role
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for permission summary
roleSchema.virtual('permissionSummary').get(function() {
  const summary = {};
  this.permissions.forEach(permission => {
    if (!summary[permission.resource]) {
      summary[permission.resource] = [];
    }
    summary[permission.resource].push(...permission.actions);
  });
  
  // Remove duplicates
  Object.keys(summary).forEach(resource => {
    summary[resource] = [...new Set(summary[resource])];
  });
  
  return summary;
});

// Method to check if role has permission
roleSchema.methods.hasPermission = function(resource, action) {
  return this.permissions.some(permission => 
    permission.resource === resource && 
    permission.actions.includes(action)
  );
};

// Method to add permission
roleSchema.methods.addPermission = function(resource, actions, conditions = {}) {
  const existingPermission = this.permissions.find(p => p.resource === resource);
  
  if (existingPermission) {
    // Add new actions to existing permission
    const newActions = Array.isArray(actions) ? actions : [actions];
    existingPermission.actions = [...new Set([...existingPermission.actions, ...newActions])];
    
    // Update conditions if provided
    if (Object.keys(conditions).length > 0) {
      existingPermission.conditions = { ...existingPermission.conditions, ...conditions };
    }
  } else {
    // Create new permission
    this.permissions.push({
      resource,
      actions: Array.isArray(actions) ? actions : [actions],
      conditions
    });
  }
  
  return this.save();
};

// Method to remove permission
roleSchema.methods.removePermission = function(resource, actions) {
  const permissionIndex = this.permissions.findIndex(p => p.resource === resource);
  
  if (permissionIndex !== -1) {
    const permission = this.permissions[permissionIndex];
    
    if (actions && actions.length > 0) {
      // Remove specific actions
      const actionsToRemove = Array.isArray(actions) ? actions : [actions];
      permission.actions = permission.actions.filter(action => 
        !actionsToRemove.includes(action)
      );
      
      // Remove permission if no actions left
      if (permission.actions.length === 0) {
        this.permissions.splice(permissionIndex, 1);
      }
    } else {
      // Remove entire permission
      this.permissions.splice(permissionIndex, 1);
    }
  }
  
  return this.save();
};

// Method to update user count
roleSchema.methods.updateUserCount = async function() {
  const User = mongoose.model('User');
  const count = await User.countDocuments({ roles: this._id });
  this.userCount = count;
  return this.save();
};

// Static method to get all available resources
roleSchema.statics.getAvailableResources = function() {
  return [
    'users',
    'roles', 
    'meetings',
    'messages',
    'settings',
    'reports',
    'audit',
    'system',
    'profile',
    'analytics',
    'integrations',
    'security',
    'compliance'
  ];
};

// Static method to get all available actions
roleSchema.statics.getAvailableActions = function() {
  return [
    'create',
    'read',
    'update', 
    'delete',
    'manage',
    'moderate',
    'export',
    'import',
    'approve',
    'reject',
    'archive',
    'restore'
  ];
};

// Pre-save middleware
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-remove middleware
roleSchema.pre('remove', async function(next) {
  if (this.isSystem) {
    const error = new Error('Cannot delete system roles');
    next(error);
    return;
  }
  
  // Remove role from all users
  const User = mongoose.model('User');
  await User.updateMany(
    { roles: this._id },
    { $pull: { roles: this._id } }
  );
  
  next();
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ priority: -1 });

export default mongoose.model('Role', roleSchema);
