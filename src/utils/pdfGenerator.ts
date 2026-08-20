import { jsPDF } from 'jspdf';
import { AssignmentSet, QuestionBankItem } from '../types';

export interface PDFExportOptions {
  includeAnswers?: boolean;
  includeExplanations?: boolean;
  includeMarkingScheme?: boolean;
  includeStudentHeader?: boolean; // Name / Roll No / Date fillable blanks
  watermarkText?: string;
  instituteTitle?: string;
  instituteSubtitle?: string;
}

export function generateAssignmentPDF(
  assignment: AssignmentSet,
  allQuestions: QuestionBankItem[],
  options: PDFExportOptions = {}
): jsPDF {
  const {
    includeAnswers = false,
    includeExplanations = false,
    includeMarkingScheme = true,
    includeStudentHeader = true,
    instituteTitle = 'BILEY ACADEMY OF ADVANCED STUDIES',
    instituteSubtitle = 'Class 1 to 12 Academic Foundation & Board Coaching Institute',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Helper function to check and add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = 16;
      renderHeaderMini();
    }
  };

  // Mini header for subsequent pages
  const renderHeaderMini = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `${assignment.title} | Class ${assignment.classLevel} - ${assignment.subjectName}`,
      margin,
      10
    );
    doc.text(
      `Biley Academy`,
      pageWidth - margin,
      10,
      { align: 'right' }
    );
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // Top Banner / Institute Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(instituteTitle, pageWidth / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text(instituteSubtitle, pageWidth / 2, y + 14, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Official Examination & Curriculum Assessment Material', pageWidth / 2, y + 19, { align: 'center' });

  y += 26;

  // Title Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(assignment.title, margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Class: ${assignment.classLevel} (${assignment.stream})   |   Subject: ${assignment.subjectName}   |   Type: ${assignment.type}`,
    margin + 4,
    y + 12
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Chapter: ${assignment.chapter || 'Comprehensive Syllabus'}`,
    margin + 4,
    y + 17
  );

  // Metadata right alignment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Max Marks: ${assignment.totalMarks}`,
    pageWidth - margin - 4,
    y + 6,
    { align: 'right' }
  );

  if (assignment.timeAllowedMinutes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Time Allowed: ${assignment.timeAllowedMinutes} Mins`,
      pageWidth - margin - 4,
      y + 12,
      { align: 'right' }
    );
  }

  if (assignment.dueDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Target Due Date: ${assignment.dueDate}`,
      pageWidth - margin - 4,
      y + 17,
      { align: 'right' }
    );
  }

  // Topic tags badge row
  if (assignment.topicTags && assignment.topicTags.length > 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(59, 130, 246);
    doc.text(
      `Topics: ${assignment.topicTags.join(' • ')}  [Difficulty: ${assignment.difficulty}]`,
      margin + 4,
      y + 21.5
    );
  }

  y += 28;

  // Student Fillable Info Header (if enabled)
  if (includeStudentHeader) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Student Name: _________________________________', margin + 4, y + 7.5);
    doc.text('Roll No: ____________', margin + 85, y + 7.5);
    doc.text('Date: ____________', margin + 125, y + 7.5);
    doc.text('Score: _____ / ' + assignment.totalMarks, pageWidth - margin - 4, y + 7.5, { align: 'right' });

    y += 15;
  }

  // General Instructions
  if (assignment.instructions) {
    checkPageBreak(18);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 12, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('GENERAL INSTRUCTIONS:', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const splitInstructions = doc.splitTextToSize(assignment.instructions.replace(/\n/g, '  |  '), contentWidth - 6);
    doc.text(splitInstructions, margin + 3, y + 8.5);

    y += 15;
  }

  // Divider
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Gather all questions
  const linkedQuestions = assignment.questionIds
    .map((qid) => allQuestions.find((q) => q.id === qid))
    .filter(Boolean) as QuestionBankItem[];

  const customQuestions = assignment.customQuestions || [];

  interface PrintableQuestion {
    index: number;
    text: string;
    type: string;
    marks: number;
    difficulty: string;
    topicTags?: string[];
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
  }

  const combinedQuestions: PrintableQuestion[] = [
    ...linkedQuestions.map((q, idx) => ({
      index: idx + 1,
      text: q.questionText,
      type: q.questionType,
      marks: q.marks,
      difficulty: q.difficulty,
      topicTags: q.topicTags,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.answerExplanation,
    })),
    ...customQuestions.map((cq, idx) => ({
      index: linkedQuestions.length + idx + 1,
      text: cq.questionText,
      type: cq.questionType,
      marks: cq.marks,
      difficulty: cq.difficulty,
      topicTags: cq.topicTags,
      options: cq.options,
      correctAnswer: cq.correctAnswer,
      explanation: cq.answerExplanation,
    })),
  ];

  // Render Questions Section
  combinedQuestions.forEach((q) => {
    checkPageBreak(30);

    // Question Number & Marks Pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    const qNumText = `Q${q.index}.`;
    doc.text(qNumText, margin, y);

    if (includeMarkingScheme) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(`[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, pageWidth - margin, y, { align: 'right' });
    }

    // Difficulty & Type Subtitle Tag
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const metaTag = `(${q.type} • ${q.difficulty}${q.topicTags && q.topicTags.length > 0 ? ` • ${q.topicTags.slice(0, 2).join(', ')}` : ''})`;
    doc.text(metaTag, margin + 10, y);

    y += 5;

    // Question Body Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const splitText = doc.splitTextToSize(q.text, contentWidth - 4);
    doc.text(splitText, margin + 4, y);
    y += splitText.length * 4.5 + 2;

    // Options if MCQ
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`   ${opt}`, margin + 6, y);
        y += 4.5;
      });
      y += 2;
    }

    // Optional Instant Answer (if inline answers enabled)
    if (includeAnswers && q.correctAnswer) {
      checkPageBreak(12);
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin + 4, y, contentWidth - 8, 8, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text(`Correct Answer: ${q.correctAnswer}`, margin + 6, y + 5);

      y += 11;
    }

    // Light dashed divider between questions
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  // Dedicated Answer Key & Explanations Section (Appended on a new page)
  if (includeAnswers || includeExplanations) {
    doc.addPage();
    y = 16;

    // Section Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(251, 191, 36);
    doc.text('OFFICIAL ANSWER KEY & STEP-BY-STEP SOLUTIONS', pageWidth / 2, y + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`${assignment.title} - For Faculty & Self-Evaluation`, pageWidth / 2, y + 10.5, { align: 'center' });

    y += 18;

    combinedQuestions.forEach((q) => {
      checkPageBreak(25);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Question ${q.index}: ${q.type} [${q.marks} Marks]`, margin + 3, y + 5.5);

      if (q.correctAnswer) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text(`Key: ${q.correctAnswer}`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
      }

      y += 11;

      if (q.explanation) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Solution / Explanation:', margin + 3, y);
        y += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const splitExp = doc.splitTextToSize(q.explanation, contentWidth - 6);
        doc.text(splitExp, margin + 3, y);
        y += splitExp.length * 4 + 4;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Direct answer key without step breakdown.', margin + 3, y);
        y += 6;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
    });
  }

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Biley Academy ERP • Question Bank & Assignment System • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadAssignmentPDF(
  assignment: AssignmentSet,
  allQuestions: QuestionBankItem[],
  options: PDFExportOptions = {}
): void {
  const doc = generateAssignmentPDF(assignment, allQuestions, options);
  const cleanTitle = assignment.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const filename = `${cleanTitle}_Class${assignment.classLevel}_${assignment.subjectName}.pdf`;
  doc.save(filename);
}

export function generateQuestionBankPDF(
  questions: QuestionBankItem[],
  filterTitle: string,
  options: PDFExportOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = 16;
      renderHeaderMini();
    }
  };

  const renderHeaderMini = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Question Bank Compilation | ${filterTitle}`, margin, 10);
    doc.text(`Biley Academy`, pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(251, 191, 36);
  doc.text('BILEY ACADEMY QUESTION-ANSWER BANK', pageWidth / 2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(`${filterTitle} (${questions.length} Items Selected)`, pageWidth / 2, y + 14, { align: 'center' });

  y += 25;

  questions.forEach((q, idx) => {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Q${idx + 1}. [Class ${q.classLevel} • ${q.subjectName} • ${q.chapterName}]`, margin, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(`[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, pageWidth - margin, y, { align: 'right' });

    y += 4.5;

    // Difficulty & Topic Tags
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Difficulty: ${q.difficulty}  |  Type: ${q.questionType}  |  Tags: ${q.topicTags.join(', ')}${q.sourceOrYear ? `  |  Source: ${q.sourceOrYear}` : ''}`,
      margin + 2,
      y
    );
    y += 5;

    // Question body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const splitText = doc.splitTextToSize(q.questionText, contentWidth - 4);
    doc.text(splitText, margin + 2, y);
    y += splitText.length * 4.2 + 2;

    // MCQ options
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt) => {
        checkPageBreak(6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`  ${opt}`, margin + 4, y);
        y += 4;
      });
      y += 2;
    }

    // Solution box
    if (options.includeAnswers && (q.correctAnswer || q.answerExplanation)) {
      checkPageBreak(18);
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.rect(margin + 2, y, contentWidth - 4, 12, 'FD');

      if (q.correctAnswer) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(21, 128, 61);
        doc.text(`Answer: ${q.correctAnswer}`, margin + 4, y + 4.5);
      }

      if (q.answerExplanation) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(22, 101, 52);
        const splitSol = doc.splitTextToSize(`Explanation: ${q.answerExplanation}`, contentWidth - 8);
        doc.text(splitSol, margin + 4, y + 8.5);
      }

      y += 14;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Biley Academy Question Bank • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc;
}
