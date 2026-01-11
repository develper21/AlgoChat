import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

class ImageOptimizer {
  constructor() {
    this.allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.compressionQuality = 80;
    this.thumbnailSize = { width: 150, height: 150 };
    this.mediumSize = { width: 800, height: 600 };
    this.largeSize = { width: 1920, height: 1080 };
  }

  // Validate image file
  validateImage(buffer, mimetype) {
    // Check file size
    if (buffer.length > this.maxFileSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Check mimetype
    const extension = mimetype.split('/')[1];
    if (!this.allowedFormats.includes(extension)) {
      throw new Error(`Unsupported image format: ${extension}`);
    }

    // Check if it's actually an image
    return this.isImageBuffer(buffer);
  }

  // Check if buffer is a valid image
  async isImageBuffer(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height);
    } catch (error) {
      throw new Error('Invalid image file');
    }
  }

  // Get image metadata
  async getMetadata(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      throw new Error('Failed to read image metadata');
    }
  }

  // Generate optimized versions of the image
  async optimizeImage(buffer, options = {}) {
    const {
      format = 'webp',
      quality = this.compressionQuality,
      generateThumbnails = true,
      generateMultipleSizes = true
    } = options;

    try {
      const results = {};
      const metadata = await this.getMetadata(buffer);

      // Original optimized version
      results.original = await this.processImage(buffer, {
        format,
        quality,
        width: options.width || metadata.width,
        height: options.height || metadata.height
      });

      // Generate thumbnails
      if (generateThumbnails) {
        results.thumbnail = await this.processImage(buffer, {
          format,
          quality: 60,
          width: this.thumbnailSize.width,
          height: this.thumbnailSize.height,
          fit: 'cover'
        });
      }

      // Generate multiple sizes
      if (generateMultipleSizes) {
        results.medium = await this.processImage(buffer, {
          format,
          quality: 75,
          width: Math.min(metadata.width, this.mediumSize.width),
          height: Math.min(metadata.height, this.mediumSize.height),
          fit: 'inside'
        });

        results.large = await this.processImage(buffer, {
          format,
          quality: 85,
          width: Math.min(metadata.width, this.largeSize.width),
          height: Math.min(metadata.height, this.largeSize.height),
          fit: 'inside'
        });
      }

      return results;
    } catch (error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  // Process individual image
  async processImage(buffer, options) {
    const {
      format = 'webp',
      quality = 80,
      width,
      height,
      fit = 'inside'
    } = options;

    try {
      let pipeline = sharp(buffer);

      // Resize if dimensions provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit,
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality, effort: 4 });
          break;
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: 9, progressive: true });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality, effort: 4 });
          break;
        default:
          throw new Error(`Unsupported output format: ${format}`);
      }

      const optimizedBuffer = await pipeline.toBuffer();
      
      return {
        buffer: optimizedBuffer,
        size: optimizedBuffer.length,
        format,
        metadata: await sharp(optimizedBuffer).metadata()
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  // Generate blur placeholder
  async generateBlurPlaceholder(buffer, size = 20) {
    try {
      const placeholder = await sharp(buffer)
        .resize(size, size, { fit: 'cover' })
        .modulate({ brightness: 1.2, saturation: 1.2 })
        .blur(2)
        .webp({ quality: 30 })
        .toBuffer();

      return {
        buffer: placeholder,
        size: placeholder.length,
        dataURL: `data:image/webp;base64,${placeholder.toString('base64')}`
      };
    } catch (error) {
      throw new Error(`Blur placeholder generation failed: ${error.message}`);
    }
  }

  // Generate dominant colors
  async getDominantColors(buffer, count = 5) {
    try {
      const { dominant } = await sharp(buffer)
        .resize(100, 100, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple color extraction (in production, use a more sophisticated algorithm)
      const colors = this.extractColors(dominant, count);
      return colors;
    } catch (error) {
      throw new Error(`Color extraction failed: ${error.message}`);
    }
  }

  // Simple color extraction (placeholder implementation)
  extractColors(buffer, count) {
    const colors = [];
    const step = Math.floor(buffer.length / (count * 3));
    
    for (let i = 0; i < count && i * step * 3 < buffer.length; i++) {
      const r = buffer[i * step * 3];
      const g = buffer[i * step * 3 + 1];
      const b = buffer[i * step * 3 + 2];
      
      colors.push({
        hex: this.rgbToHex(r, g, b),
        rgb: { r, g, b },
        percentage: (1 / count) * 100
      });
    }

    return colors;
  }

  // RGB to Hex conversion
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // Generate unique filename
  generateFilename(originalname, format) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = format || 'webp';
    return `${timestamp}_${random}.${extension}`;
  }

  // Save optimized images to disk (for development/local storage)
  async saveOptimizedImages(optimizedImages, uploadDir, filename) {
    try {
      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      const savedFiles = {};

      for (const [size, image] of Object.entries(optimizedImages)) {
        const sizeFilename = size === 'original' ? filename : `${size}_${filename}`;
        const filepath = path.join(uploadDir, sizeFilename);
        
        await fs.writeFile(filepath, image.buffer);
        savedFiles[size] = {
          filename: sizeFilename,
          path: filepath,
          size: image.size,
          url: `/uploads/${sizeFilename}`
        };
      }

      return savedFiles;
    } catch (error) {
      throw new Error(`Failed to save optimized images: ${error.message}`);
    }
  }

  // Clean up temporary files
  async cleanupFiles(filepaths) {
    try {
      await Promise.all(
        filepaths.map(filepath => fs.unlink(filepath).catch(() => {}))
      );
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Get image optimization stats
  getOptimizationStats(originalSize, optimizedImages) {
    const totalOptimizedSize = Object.values(optimizedImages)
      .reduce((total, img) => total + img.size, 0);

    const compressionRatio = ((originalSize - totalOptimizedSize) / originalSize * 100).toFixed(2);

    return {
      originalSize,
      totalOptimizedSize,
      compressionRatio,
      savings: originalSize - totalOptimizedSize,
      versions: Object.keys(optimizedImages).length
    };
  }
}

export default new ImageOptimizer();
