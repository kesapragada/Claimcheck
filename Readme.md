# ClaimCheck - Intelligent Document Processor

ClaimCheck is a full-stack application designed to automate and streamline the insurance/claims verification process. It allows users to upload PDF documents, extracts key fields using OCR, and tracks the job status in real time.

## Core Features

-   Secure User Authentication: JWT-based authentication for secure access.
-   Asynchronous Job Processing: Utilizes a BullMQ queue with Redis to process large documents without blocking the UI.
-   Real-Time Status Updates: Employs a scalable Socket.IO architecture with a Redis adapter to provide instant feedback on job status.
-   Human-in-the-Loop Correction: Allows users to view and manually correct extracted data for 100% accuracy.
-   **Robust, Scalable Backend:** Built with Node.js, Express, and Mongoose, designed with production-readiness in mind.

## Technical Deep Dive

### OCR and Field Extraction

The current implementation uses **Tesseract.js** for Optical Character Recognition (OCR) and a **regex-based parser** to extract key fields (Name, Date, Amount).

#### **Current Limitations & Future Improvements:**

The regex-based approach is a robust proof-of-concept designed to handle common variations in document labels (e.g., "Name", "Claimant", "Applicant"). However, it has inherent limitations and may fail on documents with highly unpredictable or unstructured layouts.

A production-grade system would require a more advanced approach. The next steps for this feature would be:

1.  **Layout-Aware OCR:** Integrate a service like Google Cloud Vision or AWS Textract, which provides not just raw text but also positional data (bounding boxes) for each word.
2.  **Named-Entity Recognition (NER):** Use a pre-trained NLP model (e.g., from spaCy or Hugging Face) to identify entities like `PERSON`, `DATE`, and `MONEY` within the OCR text, making the extraction less dependent on specific labels.
3.  **Heuristic-Based Logic:** Combine positional data and NER results. For example, find the `MONEY` entity closest to the word "Total" or "Amount Due". This makes the system far more resilient to layout changes.

This project deliberately uses a self-contained regex parser to demonstrate the core architectural pipeline without introducing dependencies on costly third-party cloud AI services, while clearly defining the path to a more advanced implementation.