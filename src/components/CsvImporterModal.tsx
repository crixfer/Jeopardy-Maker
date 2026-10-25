import React, { useState } from 'react';
import { Upload, FileText, Download, Check, AlertCircle, X, HelpCircle, Table } from 'lucide-react';
import { Category, Question } from '../types/game';

interface CsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCategories: (categories: Category[], replaceAll: boolean) => void;
}

interface ParsedRow {
  category: string;
  points: number;
  question: string;
  answer: string;
  hint?: string;
  isDailyDouble?: boolean;
}

export const CsvImporterModal: React.FC<CsvImporterModalProps> = ({
  isOpen,
  onClose,
  onImportCategories,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [previewCategories, setPreviewCategories] = useState<Category[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  if (!isOpen) return null;

  // Robust CSV Parser conforming to standard CSV rules (quoted fields, commas, escaped quotes)
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip CRLF
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const processCsvContent = (content: string) => {
    setParseError('');
    setCsvText(content);

    try {
      const rawRows = parseCSV(content);
      if (rawRows.length < 2) {
        setParseError('The CSV file appears empty or has only a header row.');
        setParsedRows([]);
        setPreviewCategories([]);
        return;
      }

      // Check header row (case-insensitive)
      const header = rawRows[0].map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
      
      let catIdx = header.findIndex((h) => h.includes('cat'));
      let ptsIdx = header.findIndex((h) => h.includes('point') || h.includes('pts') || h.includes('score') || h.includes('val'));
      let qIdx = header.findIndex((h) => h.includes('question') || h.includes('clue') || h.includes('prompt'));
      let aIdx = header.findIndex((h) => h.includes('answer') || h.includes('solution') || h.includes('resp'));
      let hintIdx = header.findIndex((h) => h.includes('hint'));
      let ddIdx = header.findIndex((h) => h.includes('dailydouble') || h.includes('double'));

      // If headers aren't detected by name, assume standard 4-column format: Category, Points, Question, Answer
      if (catIdx === -1) catIdx = 0;
      if (ptsIdx === -1) ptsIdx = 1;
      if (qIdx === -1) qIdx = 2;
      if (aIdx === -1) aIdx = 3;
      if (hintIdx === -1 && header.length > 4) hintIdx = 4;

      const dataRows = rawRows.slice(1);
      const rows: ParsedRow[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0 || row.every((c) => !c)) continue;

        const catName = row[catIdx] || `Category 1`;
        const ptsRaw = row[ptsIdx]?.replace(/[^0-9]/g, '');
        const points = ptsRaw ? parseInt(ptsRaw, 10) : (rows.length % 5 + 1) * 100;
        const question = row[qIdx] || `Question ${i + 1}`;
        const answer = row[aIdx] || `Answer`;
        const hint = hintIdx !== -1 ? row[hintIdx] : undefined;
        const isDailyDouble = ddIdx !== -1 ? ['true', 'yes', '1', 'daily double'].includes((row[ddIdx] || '').toLowerCase()) : false;

        rows.push({
          category: catName,
          points: isNaN(points) || points <= 0 ? 100 : points,
          question,
          answer,
          hint,
          isDailyDouble,
        });
      }

      if (rows.length === 0) {
        setParseError('No valid question rows found in the CSV.');
        setParsedRows([]);
        setPreviewCategories([]);
        return;
      }

      setParsedRows(rows);

      // Group rows by category into Category objects
      const categoryMap = new Map<string, Question[]>();
      for (const r of rows) {
        const catKey = r.category.trim();
        if (!categoryMap.has(catKey)) {
          categoryMap.set(catKey, []);
        }
        categoryMap.get(catKey)!.push({
          id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          points: r.points,
          question: r.question,
          answer: r.answer,
          hint: r.hint,
          isDailyDouble: r.isDailyDouble,
        });
      }

      // Convert to Categories array and sort questions within each category by points ascending
      const categories: Category[] = [];
      let catCounter = 1;
      categoryMap.forEach((questions, title) => {
        // Sort questions by point value
        questions.sort((a, b) => a.points - b.points);
        categories.push({
          id: `cat-import-${Date.now()}-${catCounter++}`,
          title: title || `Category ${catCounter}`,
          questions,
        });
      });

      setPreviewCategories(categories);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Error parsing CSV file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      'Category,Points,Question,Answer,Hint',
      'World History,100,"What ancient civilization built the Great Pyramids?","Ancient Egyptians","Located along the Nile River"',
      'World History,200,"In what year did World War II end?","1945","Mid-20th century"',
      'World History,300,"Who was the first female Prime Minister of the United Kingdom?","Margaret Thatcher","Known as the Iron Lady"',
      'World History,400,"What trade route historically connected the East and West?","The Silk Road","Carried silk, spices, and tea"',
      'World History,500,"What treaty officially ended World War I in 1919?","Treaty of Versailles","Signed near Paris"',
      'Science & Nature,100,"What is the chemical formula for table salt?","NaCl","Sodium and Chlorine"',
      'Science & Nature,200,"What planet in our solar system is nicknamed the Red Planet?","Mars","Fourth planet from the Sun"',
      'Science & Nature,300,"What is the powerhouse organelle of the cell?","Mitochondria","Produces ATP energy"',
      'Science & Nature,400,"What is the speed of light in a vacuum approximately?","300,000 km/s (or 186,000 mi/s)","Fastest speed in the universe"',
      'Science & Nature,500,"What particle is exchanged in the strong nuclear force?","Gluon","Binds quarks together"',
      'Literature & Arts,100,"Who wrote the play Romeo and Juliet?","William Shakespeare","The Bard of Avon"',
      'Literature & Arts,200,"What famous artist painted the Mona Lisa?","Leonardo da Vinci","Italian Renaissance polymath"',
      'Literature & Arts,300,"What 1851 novel begins with Call me Ishmael?","Moby-Dick","Written by Herman Melville"',
      'Literature & Arts,400,"Who painted The Starry Night?","Vincent van Gogh","Dutch post-impressionist"',
      'Literature & Arts,500,"In Dante\'s Inferno, how many circles of Hell are there?","Nine","Begins in Limbo"',
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'joypardy_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = () => {
    if (previewCategories.length === 0) return;
    onImportCategories(previewCategories, importMode === 'replace');
    onClose();
  };

  const totalQuestions = previewCategories.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-indigo-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Table className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Import Questions via CSV</h3>
              <p className="text-xs text-slate-400">
                Upload your spreadsheet from Excel, Google Sheets, or CSV files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Template Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-300">
                Need the standard spreadsheet layout? Download our pre-formatted template.
              </span>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragOver
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-slate-700 bg-slate-950/60 hover:border-indigo-500/80'
            }`}
          >
            <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white mb-1">
              Drag and drop your .csv file here, or browse
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Columns: Category, Points, Question, Answer, Hint (optional)
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95">
              <FileText className="w-4 h-4" />
              <span>Browse CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Or Paste CSV Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Or Paste CSV Text Directly:
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => processCsvContent(e.target.value)}
              placeholder="Category,Points,Question,Answer&#10;Science,100,What is H2O?,Water&#10;Science,200,Closest star to Earth?,The Sun"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {previewCategories.length > 0 && (
            <div className="space-y-3 bg-slate-950/80 border border-indigo-900/60 p-4 rounded-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Successfully Parsed {totalQuestions} Questions across {previewCategories.length} Categories
                </span>
              </div>

              {/* Category summary tags */}
              <div className="flex flex-wrap gap-2">
                {previewCategories.map((cat, idx) => (
                  <div
                    key={cat.id || idx}
                    className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-800 text-xs font-semibold text-slate-200 flex items-center gap-2"
                  >
                    <span className="text-amber-400 font-bold">{cat.title}</span>
                    <span className="text-[10px] text-slate-400">
                      ({cat.questions.length} questions)
                    </span>
                  </div>
                ))}
              </div>

              {/* Import Mode Radio */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-indigo-500"
                  />
                  <span>Replace current game board</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-indigo-500"
                  />
                  <span>Append to existing board</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-indigo-900/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyImport}
            disabled={previewCategories.length === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Import ({totalQuestions} Questions)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
