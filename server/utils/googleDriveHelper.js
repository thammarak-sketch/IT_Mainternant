const { google } = require('googleapis');
const stream = require('stream');
const dotenv = require('dotenv');

dotenv.config();

// Load credentials from environment variable (JSON string)
let credentials;
try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
} catch (err) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', err.message);
}

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Uploads a file buffer to Google Drive
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<string>} The web content link of the uploaded file
 */
async function uploadToDrive(fileBuffer, fileName, mimeType) {
    if (!credentials) {
        throw new Error('Google Drive credentials not configured');
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : [],
    };

    const media = {
        mimeType: mimeType,
        body: bufferStream,
    };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
            supportsAllDrives: true, // Required for Shared Drives
        });

        const fileId = response.data.id;

        // Set permission to anyone with the link can view
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true, // Required for Shared Drives
        });

        // Use thumbnail link for more reliable public embedding
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    } catch (error) {
        console.error('Google Drive Upload Error:', error);
        throw error;
    }
}

module.exports = { uploadToDrive };
