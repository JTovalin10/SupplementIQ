import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase, getAuthenticatedUser } from '../lib/supabase';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Validation middleware
const validateRequest = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Upload product image
router.post('/product-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No image file provided',
      });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `products/${uuidv4()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(400).json({
        error: 'Upload failed',
        message: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    res.json({
      message: 'Image uploaded successfully',
      file: {
        path: data.path,
        url: urlData.publicUrl,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload image',
    });
  }
});

// Upload user avatar
router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No avatar file provided',
      });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `avatars/${user.id}.${fileExtension}`;

    // Upload to Supabase Storage (overwrite existing)
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(400).json({
        error: 'Upload failed',
        message: error.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update user error:', updateError);
      return res.status(400).json({
        error: 'Failed to update profile',
        message: updateError.message,
      });
    }

    res.json({
      message: 'Avatar uploaded successfully',
      file: {
        path: data.path,
        url: urlData.publicUrl,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload avatar',
    });
  }
});

// Delete uploaded file
router.delete('/:bucket/:path(*)', async (req: Request, res: Response) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const { bucket, path } = req.params;

    // Only allow users to delete their own files
    if (bucket === 'avatars' && !path.includes(user.id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own files',
      });
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return res.status(400).json({
        error: 'Delete failed',
        message: error.message,
      });
    }

    res.json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete file',
    });
  }
});

export { router as uploadRoutes };
