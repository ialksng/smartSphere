const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from a file buffer based on its MIME type.
 */
const extractTextFromBuffer = async (buffer, mimetype) => {
    try {
        if (mimetype === 'application/pdf') {
            
            // 1. Hunt for the actual extraction function safely
            let parsePDF = null;
            if (typeof pdfParse === 'function') {
                parsePDF = pdfParse;
            } else if (pdfParse && typeof pdfParse.default === 'function') {
                parsePDF = pdfParse.default;
            } else {
                // If it is STILL broken, log exactly what it is to the Render console
                console.error("=== PDF-PARSE DEBUG INFO ===");
                console.error("Export Type:", typeof pdfParse);
                console.error("Export Content:", pdfParse);
                console.error("============================");
                throw new Error(`pdf-parse package is corrupted. Check Render Logs. Export type: ${typeof pdfParse}`);
            }

            // 2. Extract the text
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