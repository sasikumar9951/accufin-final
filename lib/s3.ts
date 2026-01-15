import {
  GetObjectCommand,
  S3Client,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = {
  // To get list of my uploaded files in user dashboard
  listOfUsersSentFiles: (userId: string) => {
    return `user-uploads/${userId}/sent`;
  },
  // To get list of Admin Responses files in user dashboard
  listOfUsersReceivedFiles: (userId: string) => {
    return `user-uploads/${userId}/received`;
  },
  // To get path while uploading user file to s3 in user dashboard
  // Now uses folderId instead of folderPath for UUID-based folder structure
  getUserSendingFilePath: (
    userId: string,
    filename: string,
    folderId?: string
  ) => {
    const folder = folderId ? `/${folderId}` : "";
    return `user-uploads/${userId}/sent${folder}/${filename}`;
  },
  // To get path while uploading Admin Response file to s3 in admin dashboard
  // Now uses folderId instead of folderPath for UUID-based folder structure
  getUserReceivedFilePath: (
    userId: string,
    filename: string,
    folderId?: string
  ) => {
    const folder = folderId ? `/${folderId}` : "";
    return `user-uploads/${userId}/received${folder}/${filename}`;
  },

  // To get path for testimonial image uploads
  getTestimonialImagePath: (filename: string) => {
    const timestamp = Date.now();
    return `testimonials/${timestamp}/${filename}`;
  },

  getAdminPrivateUploadPath: (
    adminId: string,
    userId: string,
    filename: string,
    folderId?: string
  ) => {
    const folder = folderId ? `/${folderId}` : "";
    return `admin-private-uploads/${adminId}/${userId}${folder}/${filename}`;
  },

  getUserProfilePicturePath: (userId: string, filename: string) => {
    return `user-uploads/${userId}/profile/${filename}`;
  },
};

// S3 client instance
const s3Client = new S3Client({
  region: process.env.SECRET_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.SECRET_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_AWS_SECRET_ACCESS_KEY!,
  },
});

// Delete a single file from S3
export const deleteFileFromS3 = async (filePath: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.SECRET_AWS_S3_BUCKET!,
      Key: filePath,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
};

// Delete all files in a folder (recursive)
export const deleteFolderFromS3 = async (
  folderPath: string
): Promise<boolean> => {
  try {
    // Ensure folder path ends with /
    const normalizedPath = folderPath.endsWith("/")
      ? folderPath
      : `${folderPath}/`;

    // List all objects with the folder prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.SECRET_AWS_S3_BUCKET!,
      Prefix: normalizedPath,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return true; // Folder is already empty
    }

    // Delete all objects in the folder
    const deletePromises = listResponse.Contents.map(async (object) => {
      if (!object.Key) {
        return;
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.SECRET_AWS_S3_BUCKET!,
        Key: object.Key,
      });
      return s3Client.send(deleteCommand);
    });

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error deleting folder from S3:", error);
    return false;
  }
};

// Delete multiple files from S3
export const deleteMultipleFilesFromS3 = async (
  filePaths: string[]
): Promise<boolean> => {
  try {
    const deletePromises = filePaths.map(async (filePath) => {
      const command = new DeleteObjectCommand({
        Bucket: process.env.SECRET_AWS_S3_BUCKET!,
        Key: filePath,
      });
      return s3Client.send(command);
    });

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error deleting multiple files from S3:", error);
    return false;
  }
};

export const getSignedUrlFromPath = async (path: string) => {
  const s3 = new S3Client({
    region: process.env.SECRET_AWS_REGION!,
    credentials: {
      accessKeyId: process.env.SECRET_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_AWS_SECRET_ACCESS_KEY!,
    },
  });
  const command = new GetObjectCommand({
    Bucket: process.env.SECRET_AWS_S3_BUCKET!,
    Key: path,
  });
  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60 * 12,
  }); // 12 hours
  return signedUrl;
};

// Copy S3 object from one path to another
export const copyS3Object = async (
  sourcePath: string,
  destinationPath: string
): Promise<boolean> => {
  try {
    const copyCommand = new CopyObjectCommand({
      Bucket: process.env.SECRET_AWS_S3_BUCKET!,
      CopySource: `${process.env.SECRET_AWS_S3_BUCKET}/${encodeURI(sourcePath)}`,
      Key: destinationPath,
    });

    await s3Client.send(copyCommand);
    return true;
  } catch (error) {
    try {
      const encodedSource = `${process.env.SECRET_AWS_S3_BUCKET}/${encodeURI(
        sourcePath
      )}`;
      // Log helpful context for debugging copy errors (safe, no secrets)
      console.error(
        "Error copying S3 object",
        {
          copySource: encodedSource,
          destinationKey: destinationPath,
        },
        error
      );
    } catch (_) {
      // Fallback logging in case encoding throws unexpectedly
      console.error("Error copying S3 object (fallback log)", error);
    }
    return false;
  }
};

// Move S3 object (copy then delete original)
export const moveS3Object = async (
  sourcePath: string,
  destinationPath: string
): Promise<boolean> => {
  try {
    // First copy to new location
    const copySuccess = await copyS3Object(sourcePath, destinationPath);
    if (!copySuccess) {
      return false;
    }

    // Then delete original
    const deleteSuccess = await deleteFileFromS3(sourcePath);
    return deleteSuccess;
  } catch (error) {
    console.error("Error moving S3 object:", error);
    return false;
  }
};

// Batch move multiple S3 objects
export const batchMoveS3Objects = async (
  operations: { source: string; destination: string }[]
): Promise<boolean> => {
  try {
    // Process moves in parallel
    const movePromises = operations.map(({ source, destination }) =>
      moveS3Object(source, destination)
    );

    const results = await Promise.all(movePromises);

    // Return true only if all moves succeeded
    return results.every((result) => result === true);
  } catch (error) {
    console.error("Error in batch move S3 objects:", error);
    return false;
  }
};

// Batch copy multiple S3 objects
export const batchCopyS3Objects = async (
  operations: { source: string; destination: string }[]
): Promise<boolean> => {
  try {
    // Process copies in parallel
    const copyPromises = operations.map(({ source, destination }) =>
      copyS3Object(source, destination)
    );

    const results = await Promise.all(copyPromises);

    // Return true only if all copies succeeded
    return results.every((result) => result === true);
  } catch (error) {
    console.error("Error in batch copy S3 objects:", error);
    return false;
  }
};
