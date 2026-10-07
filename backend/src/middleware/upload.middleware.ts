import multer from 'multer'
import path from 'path'
import { env } from '../config/validateEnv'
import { ValidationError } from '../utils/AppError'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const allowed = env.ALLOWED_FILE_TYPES.split(',')
  
  if (!allowed.includes(ext)) {
    return cb(new ValidationError(`Unsupported file type. Allowed: ${env.ALLOWED_FILE_TYPES}`))
  }

  // Reject obvious executables just in case
  const rejected = ['.exe', '.bat', '.sh', '.ps1', '.cmd', '.msi']
  if (rejected.includes(ext)) {
    return cb(new ValidationError('Executable files are not allowed'))
  }

  cb(null, true)
}

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
})
