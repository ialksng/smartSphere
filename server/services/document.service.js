const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from a file buffer based on its MIME type.
 */
const extractTextFromBuffer = async (buffer, mimetype) => {
    try {
        if (mimetype === 'application/pdf') {
            // FIX: Safely unwrap the function whether it is a CommonJS or ESM export
            const parsePDF = pdfParse.default || pdfParse; 
            
            const data = await parsePDF(buffer);
            return data.text;
        } 
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // .docx files
            const result = await mammoth.extractRawText({ buffer: buffer });
            return result.value;
        } 
        else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
            return buffer.toString('utf-8');
        } 
        else {
            throw new Error('Unsupported file type. Please upload PDF, DOCX, TXT, or MD.');
        }
    } catch (error) {
        console.error("Extraction Error:", error);
        throw new Error(`Text extraction failed: ${error.message}`);
    }
};

module.exports = { extractTextFromBuffer };