import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

import { env } from '../config/env.js';
import User from '../models/User.js';

export async function face(req, res) {
  // Make sure the live image and reference image were uploaded.
  if (
    !req.files?.image?.[0] ||
    !req.files?.reference?.[0]
  ) {
    return res.status(400).json({
      message:
        'Both live image and consented reference image are required',
    });
  }

  try {
    // Get the currently logged-in voter.
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Voter not found',
      });
    }

    // A voter must have a stored demo voter document.
    if (!user.documentReference) {
      return res.status(400).json({
        message: 'No voter document is registered for this account',
      });
    }

    // Make sure the stored document still exists.
    try {
      await fs.access(user.documentReference);
    } catch {
      return res.status(400).json({
        message: 'Registered voter document could not be found',
      });
    }

    // Read the stored voter document.
    const documentBuffer = await fs.readFile(
      user.documentReference
    );

    const documentFilename =
      path.basename(user.documentReference);

    const documentExtension =
      path.extname(documentFilename).toLowerCase();

    let documentMimeType = 'application/octet-stream';

    if (
      documentExtension === '.jpg' ||
      documentExtension === '.jpeg'
    ) {
      documentMimeType = 'image/jpeg';
    } else if (documentExtension === '.png') {
      documentMimeType = 'image/png';
    } else if (documentExtension === '.webp') {
      documentMimeType = 'image/webp';
    } else if (documentExtension === '.bmp') {
      documentMimeType = 'image/bmp';
    } else if (documentExtension === '.pdf') {
      documentMimeType = 'application/pdf';
    }

    // Create multipart form data for the AI service.
    const fd = new FormData();

    // Current/live face.
    fd.append(
      'image',
      req.files.image[0].buffer,
      {
        filename: req.files.image[0].originalname,
        contentType: req.files.image[0].mimetype,
      }
    );

    // Registered reference face.
    fd.append(
      'reference',
      req.files.reference[0].buffer,
      {
        filename: req.files.reference[0].originalname,
        contentType: req.files.reference[0].mimetype,
      }
    );

    // Registered voter document.
    fd.append(
      'document',
      documentBuffer,
      {
        filename: documentFilename,
        contentType: documentMimeType,
      }
    );

    // Send face images + voter document to the AI service.
    const r = await axios.post(
      `${env.AI_SERVICE_URL}/verify`,
      fd,
      {
        headers: fd.getHeaders(),
        timeout: 30000,
      }
    );

    const faceVerified = r.data.verified === true;
    const ageEligible = r.data.ageEligible === true;

    // Both conditions are required.
    const eligible =
      faceVerified &&
      ageEligible;

    if (eligible) {
      const updatedUser =
        await User.findByIdAndUpdate(
          req.user._id,
          {
            verificationStatus: 'verified',
            eligibilityStatus: 'eligible',
          },
          {
            new: true,
          }
        );

      return res.json({
        ...r.data,
        verificationStatus:
          updatedUser.verificationStatus,
        eligibilityStatus:
          updatedUser.eligibilityStatus,
      });
    }

    // Face failed OR age check failed.
    const updatedUser =
      await User.findByIdAndUpdate(
        req.user._id,
        {
          verificationStatus: faceVerified
            ? 'verified'
            : 'rejected',

          eligibilityStatus: 'not_eligible',
        },
        {
          new: true,
        }
      );

    return res.json({
      ...r.data,
      verificationStatus:
        updatedUser.verificationStatus,
      eligibilityStatus:
        updatedUser.eligibilityStatus,
    });

  } catch (e) {
    return res.status(
      e.response?.status || 503
    ).json({
      message:
        e.response?.data?.detail ||
        e.response?.data?.message ||
        'AI service unavailable',

      detail: e.message,
    });
  }
}