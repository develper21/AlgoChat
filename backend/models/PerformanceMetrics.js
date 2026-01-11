import mongoose from 'mongoose';

const performanceMetricsSchema = new mongoose.Schema({
  // Time period
  timestamp: { type: Date, default: Date.now },
  period: {
    type: String,
    required: true,
    enum: ['minute', 'hour', 'day']
  },
  
  // Server performance
  cpu: {
    usage: { type: Number, default: 0 }, // percentage
    loadAverage: [Number], // 1, 5, 15 minute averages
    cores: { type: Number, default: 0 }
  },
  
  memory: {
    total: { type: Number, default: 0 }, // in bytes
    used: { type: Number, default: 0 }, // in bytes
    free: { type: Number, default: 0 }, // in bytes
    usagePercentage: { type: Number, default: 0 }
  },
  
  // Database performance
  database: {
    connections: { type: Number, default: 0 },
    activeConnections: { type: Number, default: 0 },
    queryTime: { type: Number, default: 0 }, // average in milliseconds
    operations: {
      reads: { type: Number, default: 0 },
      writes: { type: Number, default: 0 },
      updates: { type: Number, default: 0 },
      deletes: { type: Number, default: 0 }
    }
  },
  
  // Network performance
  network: {
    requests: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // average in milliseconds
    throughput: { type: Number, default: 0 }, // requests per second
    errors: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 } // percentage
  },
  
  // Socket.io performance
  sockets: {
    connected: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    disconnections: { type: Number, default: 0 },
    latency: { type: Number, default: 0 } // average in milliseconds
  },
  
  // Storage performance
  storage: {
    totalUsed: { type: Number, default: 0 }, // in bytes
    uploadTime: { type: Number, default: 0 }, // average in milliseconds
    downloadTime: { type: Number, default: 0 }, // average in milliseconds
    operations: { type: Number, default: 0 }
  },
  
  // Cache performance
  cache: {
    hits: { type: Number, default: 0 },
    misses: { type: Number, default: 0 },
    hitRate: { type: Number, default: 0 }, // percentage
    size: { type: Number, default: 0 } // in bytes
  },
  
  // Application metrics
  application: {
    activeUsers: { type: Number, default: 0 },
    activeRooms: { type: Number, default: 0 },
    messagesPerSecond: { type: Number, default: 0 },
    fileUploadsPerSecond: { type: Number, default: 0 }
  },
  
  // Error tracking
  errors: [{
    type: { type: String, required: true },
    count: { type: Number, default: 1 },
    lastOccurred: { type: Date, default: Date.now },
    message: { type: String },
    stack: { type: String }
  }],
  
  // Alerts
  alerts: [{
    type: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    message: { type: String, required: true },
    triggeredAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
  }]
}, {
  timestamps: true,
  // Indexes for performance
  index: [
    { timestamp: -1 },
    { period: 1, timestamp: -1 },
    { 'alerts.severity': 1, timestamp: -1 }
  ]
});

// TTL index for old data (keep 30 days)
performanceMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('PerformanceMetrics', performanceMetricsSchema);
