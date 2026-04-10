const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from a file buffer based on its MIME type.
 */
const extractTextFromBuffer = async (buffer, mimetype) => {
    try {
        if (mimetype === 'application/pdf') {
            
            // 1. Handle the NEW pdf-parse v2+ API (Class-based)
            if (pdfParse && typeof pdfParse.PDFParse === 'function') {
                const parser = new pdfParse.PDFParse({ data: buffer });
                try {
                    const result = await parser.getText();
                    // Handle varying return formats
                    return typeof result === 'string' ? result : result.text;
                } finally {
                    // v2 requires manual cleanup to prevent memory leaks on your server
                    if (typeof parser.destroy === 'function') {
                        await parser.destroy();
                    }
                }
            } 
            // 2. Handle the CLASSIC pdf-parse v1 API (Function-based)
            else if (typeof pdfParse === 'function') {
                const data = await pdfParse(buffer);
                return data.text;
            } 
            // 3. Handle transpiled default exports
            else if (pdfParse && typeof pdfParse.default === 'function') {
                const data = await pdfParse.default(buffer);
                return data.text;
            } 
            else {
                throw new Error("Unable to initialize PDF parser. Unrecognized export format.");
            }
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