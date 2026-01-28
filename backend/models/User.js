import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const subscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  { _id: false }
);

const permissionSchema = new mongoose.Schema({
  resource: { type: String, required: true }, // 'users', 'meetings', 'messages', 'settings', 'reports'
  actions: [{ type: String }], // 'create', 'read', 'update', 'delete', 'manage'
  conditions: { type: mongoose.Schema.Types.Mixed } // Additional conditions
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String },
  permissions: [permissionSchema],
  isSystem: { type: Boolean, default: false }, // System roles cannot be deleted
  priority: { type: Number, default: 0 }, // Higher priority overrides lower
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String },
    pushSubscriptions: [subscriptionSchema],
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    
    // Two-Factor Authentication
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    twoFactorBackupCodes: [{ type: String }],
    twoFactorTempSecret: { type: String },
    twoFactorTempSecretExpires: { type: Date, default: Date.now },
    
    // Enterprise Features
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    primaryRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    department: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, unique: true, sparse: true },
    title: { type: String },
    phone: { type: String },
    location: { type: String },
    
    // Account Status
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
    suspendedAt: { type: Date },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Security
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginIP: { type: String },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date, default: Date.now },
    
    // SSO
    ssoProvider: { type: String }, // 'google', 'microsoft', 'saml', etc.
    ssoId: { type: String },
    isSSOUser: { type: Boolean, default: false },
    
    // Preferences
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      meetingReminders: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true }
    },
    
    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if user is admin
userSchema.virtual('isAdmin').get(function() {
  return this.roles.some(role => role.name === 'admin' || role.name === 'superadmin');
});

// Virtual for checking if user is moderator
userSchema.virtual('isModerator').get(function() {
  return this.roles.some(role => 
    role.name === 'moderator' || 
    role.name === 'admin' || 
    role.name === 'superadmin'
  );
});

// Virtual for effective permissions
userSchema.virtual('effectivePermissions').get(function() {
  const allPermissions = new Set();
  
  this.roles.forEach(role => {
    role.permissions.forEach(permission => {
      permission.actions.forEach(action => {
        allPermissions.add(`${permission.resource}:${action}`);
      });
    });
  });
  
  return Array.from(allPermissions);
});

// Method to check permission
userSchema.methods.hasPermission = function(resource, action) {
  return this.effectivePermissions.includes(`${resource}:${action}`);
};

// Method to check any permission
userSchema.methods.hasAnyPermission = function(resource, actions) {
  return actions.some(action => this.hasPermission(resource, action));
};

// Method to check all permissions
userSchema.methods.hasAllPermissions = function(resource, actions) {
  return actions.every(action => this.hasPermission(resource, action));
};

// Method to add role
userSchema.methods.addRole = function(role) {
  if (!this.roles.includes(role._id)) {
    this.roles.push(role._id);
    if (!this.primaryRole) {
      this.primaryRole = role._id;
    }
  }
};

// Method to remove role
userSchema.methods.removeRole = function(roleId) {
  this.roles = this.roles.filter(id => id.toString() !== roleId.toString());
  if (this.primaryRole && this.primaryRole.toString() === roleId.toString()) {
    this.primaryRole = this.roles.length > 0 ? this.roles[0] : null;
  }
};

// Method to set primary role
userSchema.methods.setPrimaryRole = function(roleId) {
  if (this.roles.includes(roleId)) {
    this.primaryRole = roleId;
  }
};

// Method to check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now();
  next();
});

// Pre-save middleware for role updates
userSchema.pre('save', function(next) {
  if (this.isModified('roles')) {
    this.updatedAt = Date.now();
  }
  next();
});

// Instance methods
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Static method to find by email with roles
userSchema.statics.findByEmailWithRoles = function(email) {
  return this.findOne({ email }).populate('roles primaryRole');
};

// Static method to create system roles
userSchema.statics.createSystemRoles = async function() {
  const Role = mongoose.model('Role');
  
  const systemRoles = [
    {
      name: 'superadmin',
      displayName: 'Super Admin',
      description: 'Full system access with all permissions',
      isSystem: true,
      priority: 100,
      permissions: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'roles', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'meetings', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'messages', actions: ['create', 'read', 'update', 'delete', 'manage', 'moderate'] },
        { resource: 'settings', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'reports', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'audit', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'system', actions: ['create', 'read', 'update', 'delete', 'manage'] }
      ]
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access with limited system permissions',
      isSystem: true,
      priority: 90,
      permissions: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'meetings', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'messages', actions: ['create', 'read', 'update', 'delete', 'moderate'] },
        { resource: 'reports', actions: ['create', 'read'] },
        { resource: 'audit', actions: ['read'] }
      ]
    },
    {
      name: 'moderator',
      displayName: 'Moderator',
      description: 'Content moderation and user management',
      isSystem: true,
      priority: 70,
      permissions: [
        { resource: 'users', actions: ['read', 'update'] },
        { resource: 'meetings', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'messages', actions: ['create', 'read', 'update', 'delete', 'moderate'] },
        { resource: 'reports', actions: ['create', 'read'] }
      ]
    },
    {
      name: 'manager',
      displayName: 'Manager',
      description: 'Team management and reporting',
      isSystem: true,
      priority: 60,
      permissions: [
        { resource: 'users', actions: ['read'] },
        { resource: 'meetings', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'messages', actions: ['create', 'read'] },
        { resource: 'reports', actions: ['create', 'read'] }
      ]
    },
    {
      name: 'user',
      displayName: 'User',
      description: 'Standard user permissions',
      isSystem: true,
      priority: 50,
      permissions: [
        { resource: 'meetings', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'messages', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'profile', actions: ['read', 'update'] }
      ]
    },
    {
      name: 'guest',
      displayName: 'Guest',
      description: 'Limited guest access',
      isSystem: true,
      priority: 10,
      permissions: [
        { resource: 'meetings', actions: ['read'] },
        { resource: 'messages', actions: ['create', 'read'] }
      ]
    }
  ];
  
  for (const roleData of systemRoles) {
    const existingRole = await Role.findOne({ name: roleData.name });
    if (!existingRole) {
      await Role.create(roleData);
    }
  }
};

// Indexes
userSchema.index({ ssoProvider: 1, ssoId: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isSuspended: 1 });
userSchema.index({ department: 1 });
userSchema.index({ manager: 1 });

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  delete obj.twoFactorTempSecret;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

export default mongoose.model('User', userSchema);
