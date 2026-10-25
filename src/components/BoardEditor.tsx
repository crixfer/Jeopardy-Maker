import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Download, Upload, Sparkles, Check, Play, Edit3, HelpCircle, Save, FileSpreadsheet, Zap, Copy, Lightbulb } from 'lucide-react';
import { Game, Category, Question, TieBreakerQuestion } from '../types/game';
import { DEFAULT_GAMES } from '../utils/defaultGames';
import { CsvImporterModal } from './CsvImporterModal';

export const MAX_TIE_BREAKER_QUESTIONS = 10;

interface BoardEditorProps {
  initialGame?: Game | null;
  onSaveGame: (game: Game) => void;
  onLaunchGame: (game: Game) => void;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  initialGame,
  onSaveGame,
  onLaunchGame,
}) => {
  const [game, setGame] = useState<Game>(
    initialGame || {
      id: `game-${Date.now()}`,
      title: 'My Custom Classroom Jeopardy',
      description: 'Custom trivia game created for our class.',
      isPublic: true,
      categories: JSON.parse(JSON.stringify(DEFAULT_GAMES[0].categories)),
      tieBreakerQuestions: JSON.parse(JSON.stringify(DEFAULT_GAMES[0].tieBreakerQuestions || [])),
    }
  );

  const [activeEditQuestion, setActiveEditQuestion] = useState<{
    catIndex: number;
    qIndex: number;
  } | null>(null);

  const [aiPromptTopic, setAiPromptTopic] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [showCategoryPickerForTb, setShowCategoryPickerForTb] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Tie Breaker Management (Max 10 questions)
  const tieBreakerCount = game.tieBreakerQuestions?.length || 0;

  const handleAddTieBreaker = () => {
    if (tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS) return;
    const currentTbs = game.tieBreakerQuestions || [];
    const newTb: TieBreakerQuestion = {
      id: `tb-${Date.now()}-${currentTbs.length + 1}`,
      question: '',
      answer: '',
      hint: '',
    };
    setGame({
      ...game,
      tieBreakerQuestions: [...currentTbs, newTb],
    });
  };

  const handleUpdateTieBreaker = (index: number, fields: Partial<TieBreakerQuestion>) => {
    const currentTbs = [...(game.tieBreakerQuestions || [])];
    if (!currentTbs[index]) return;
    currentTbs[index] = { ...currentTbs[index], ...fields };
    setGame({ ...game, tieBreakerQuestions: currentTbs });
  };

  const handleDeleteTieBreaker = (index: number) => {
    const currentTbs = (game.tieBreakerQuestions || []).filter((_, i) => i !== index);
    setGame({ ...game, tieBreakerQuestions: currentTbs });
  };

  const handleMoveTieBreaker = (index: number, direction: 'up' | 'down') => {
    const currentTbs = [...(game.tieBreakerQuestions || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentTbs.length) return;
    const temp = currentTbs[index];
    currentTbs[index] = currentTbs[target];
    currentTbs[target] = temp;
    setGame({ ...game, tieBreakerQuestions: currentTbs });
  };

  const handleQuickAddFromCategory = (catIndex: number, qIndex: number) => {
    if (tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS) return;
    const sourceCat = game.categories[catIndex];
    const sourceQ = sourceCat?.questions?.[qIndex];
    if (!sourceQ) return;
    const newTb: TieBreakerQuestion = {
      id: `tb-cat-${Date.now()}`,
      question: sourceQ.question,
      answer: sourceQ.answer,
      hint: sourceQ.hint || `Context: ${sourceCat.title}`,
    };
    setGame({
      ...game,
      tieBreakerQuestions: [...(game.tieBreakerQuestions || []), newTb],
    });
    setShowCategoryPickerForTb(false);
  };

  const handleSuggestThematicTieBreaker = () => {
    if (tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS) return;
    const firstCat = game.categories[0]?.title || 'Key Knowledge';
    const sampleThematicQ: TieBreakerQuestion = {
      id: `tb-thematic-${Date.now()}`,
      question: `Sudden Death Challenge (${game.title}): What foundational concept or key discovery is central to ${firstCat}?`,
      answer: `Core Principle of ${firstCat}`,
      hint: `Contextual playoff question for ${game.title}`,
    };
    setGame({
      ...game,
      tieBreakerQuestions: [...(game.tieBreakerQuestions || []), sampleThematicQ],
    });
  };

  // Reorder Category Left
  const moveCategoryLeft = (index: number) => {
    if (index <= 0) return;
    const newCategories = [...game.categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index - 1];
    newCategories[index - 1] = temp;
    setGame({ ...game, categories: newCategories });
  };

  // Reorder Category Right
  const moveCategoryRight = (index: number) => {
    if (index >= game.categories.length - 1) return;
    const newCategories = [...game.categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index + 1];
    newCategories[index + 1] = temp;
    setGame({ ...game, categories: newCategories });
  };

  // Reorder Question Up
  const moveQuestionUp = (catIndex: number, qIndex: number) => {
    if (qIndex <= 0) return;
    const newCategories = [...game.categories];
    const questions = [...newCategories[catIndex].questions];
    const temp = questions[qIndex];
    questions[qIndex] = questions[qIndex - 1];
    questions[qIndex - 1] = temp;
    newCategories[catIndex] = { ...newCategories[catIndex], questions };
    setGame({ ...game, categories: newCategories });
  };

  // Reorder Question Down
  const moveQuestionDown = (catIndex: number, qIndex: number) => {
    const questions = game.categories[catIndex].questions;
    if (qIndex >= questions.length - 1) return;
    const newCategories = [...game.categories];
    const newQuestions = [...questions];
    const temp = newQuestions[qIndex];
    newQuestions[qIndex] = newQuestions[qIndex + 1];
    newQuestions[qIndex + 1] = temp;
    newCategories[catIndex] = { ...newCategories[catIndex], questions: newQuestions };
    setGame({ ...game, categories: newCategories });
  };

  // Add Category
  const handleAddCategory = () => {
    if (game.categories.length >= 6) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      title: `Category ${game.categories.length + 1}`,
      questions: [100, 200, 300, 400, 500].map((points, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        points,
        question: `Question for ${points} points`,
        answer: `Answer for ${points} points`,
      })),
    };
    setGame({ ...game, categories: [...game.categories, newCat] });
  };

  // Delete Category
  const handleDeleteCategory = (catIndex: number) => {
    if (game.categories.length <= 1) return;
    const newCategories = game.categories.filter((_, i) => i !== catIndex);
    setGame({ ...game, categories: newCategories });
  };

  // Add Question to category
  const handleAddQuestion = (catIndex: number) => {
    const cat = game.categories[catIndex];
    const nextPoints = (cat.questions.length + 1) * 100;
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      points: nextPoints,
      question: `New question for ${nextPoints} points`,
      answer: `Answer`,
    };
    const newCategories = [...game.categories];
    newCategories[catIndex] = {
      ...cat,
      questions: [...cat.questions, newQuestion],
    };
    setGame({ ...game, categories: newCategories });
  };

  // Delete Question
  const handleDeleteQuestion = (catIndex: number, qIndex: number) => {
    const newCategories = [...game.categories];
    newCategories[catIndex].questions = newCategories[catIndex].questions.filter(
      (_, i) => i !== qIndex
    );
    setGame({ ...game, categories: newCategories });
    setActiveEditQuestion(null);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(game, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${game.title.toLowerCase().replace(/\s+/g, '_')}_jeopardy.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title && Array.isArray(parsed.categories)) {
          if (Array.isArray(parsed.tieBreakerQuestions)) {
            parsed.tieBreakerQuestions = parsed.tieBreakerQuestions.slice(0, MAX_TIE_BREAKER_QUESTIONS);
          }
          setGame(parsed);
        } else {
          alert('Invalid Jeopardy game JSON format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Load Template
  const handleLoadTemplate = (templateId: string) => {
    const template = DEFAULT_GAMES.find((g) => g.id === templateId);
    if (template) {
      setGame({
        ...JSON.parse(JSON.stringify(template)),
        id: `game-${Date.now()}`,
      });
    }
  };

  // Instant Topic Board Generator
  const handleGenerateTopicBoard = () => {
    const topic = aiPromptTopic.trim() || 'General Science';
    setIsGenerating(true);

    setTimeout(() => {
      // Procedurally generate a rich 5x5 board tailored to the requested topic
      const generatedGame: Game = {
        id: `game-${Date.now()}`,
        title: `${topic} Championship`,
        description: `Custom Jeopardy battle exploring ${topic}.`,
        isPublic: true,
        categories: [
          {
            id: `cat-gen-1`,
            title: `${topic} Fundamentals`,
            questions: [
              { id: `q-1`, points: 100, question: `What is the core definition or starting concept of ${topic}?`, answer: `Fundamental Principle` },
              { id: `q-2`, points: 200, question: `Which key figure or discovery helped establish ${topic}?`, answer: `Pioneering Pioneer` },
              { id: `q-3`, points: 300, question: `Name a common term or standard unit used in ${topic}.`, answer: `Standard Terminology` },
              { id: `q-4`, points: 400, question: `Which major breakthrough revolutionized modern ${topic}?`, answer: `Revolutionary Discovery`, isDailyDouble: true },
              { id: `q-5`, points: 500, question: `What challenging problem in ${topic} was famously solved in recent history?`, answer: `Milestone Solution` },
            ],
          },
          {
            id: `cat-gen-2`,
            title: `Key Terminology`,
            questions: [
              { id: `q-6`, points: 100, question: `What basic vocabulary word in ${topic} means "to analyze or break down"?`, answer: `Deconstruction / Analysis` },
              { id: `q-7`, points: 200, question: `What Latin or Greek prefix is commonly seen in ${topic}?`, answer: `Root Origin` },
              { id: `q-8`, points: 300, question: `What term describes when two ideas in ${topic} are directly opposite?`, answer: `Antithesis / Polarization` },
              { id: `q-9`, points: 400, question: `What formula or theorem is central to mastering ${topic}?`, answer: `The Primary Theorem` },
              { id: `q-10`, points: 500, question: `What is the most misunderstood misconception in ${topic}?`, answer: `The Common Fallacy` },
            ],
          },
          {
            id: `cat-gen-3`,
            title: `Famous Milestones`,
            questions: [
              { id: `q-11`, points: 100, question: `In what century did major developments in ${topic} first accelerate globally?`, answer: `The Modern Era` },
              { id: `q-12`, points: 200, question: `Which country or region is renowned for historic contributions to ${topic}?`, answer: `Historic Center` },
              { id: `q-13`, points: 300, question: `What landmark event changed the way researchers approach ${topic}?`, answer: `The Grand Summit` },
              { id: `q-14`, points: 400, question: `Which award or honor is recognized as the highest distinction in ${topic}?`, answer: `The Grand Prize` },
              { id: `q-15`, points: 500, question: `What paradigm shift in ${topic} replaced previous outdated theories?`, answer: `The New Paradigm` },
            ],
          },
          {
            id: `cat-gen-4`,
            title: `Real-World Applications`,
            questions: [
              { id: `q-16`, points: 100, question: `How do everyday people interact with ${topic} in daily life?`, answer: `Everyday Application` },
              { id: `q-17`, points: 200, question: `Which modern technology or tool relies directly on principles of ${topic}?`, answer: `Digital Innovation` },
              { id: `q-18`, points: 300, question: `How does ${topic} contribute to environmental or social solutions?`, answer: `Sustainable Impact` },
              { id: `q-19`, points: 400, question: `In what high-tech industry is expertise in ${topic} in highest demand?`, answer: `Cutting-Edge Sector` },
              { id: `q-20`, points: 500, question: `What futuristic research could change the trajectory of ${topic} by 2030?`, answer: `Future Frontier` },
            ],
          },
          {
            id: `cat-gen-5`,
            title: `Mastery Challenge`,
            questions: [
              { id: `q-21`, points: 100, question: `True or False: Mastering ${topic} requires understanding basic cause-and-effect.`, answer: `True` },
              { id: `q-22`, points: 200, question: `Which famous quote or proverb best encapsulates ${topic}?`, answer: `Knowledge is Power` },
              { id: `q-23`, points: 300, question: `What experiment or case study is taught to all newcomers of ${topic}?`, answer: `Classic Case Study` },
              { id: `q-24`, points: 400, question: `What paradox or dilemma frequently arises in advanced ${topic}?`, answer: `The Central Paradox` },
              { id: `q-25`, points: 500, question: `Name the crowning achievement that symbolizes complete mastery of ${topic}.`, answer: `Universal Grandmastery` },
            ],
          },
        ],
        tieBreakerQuestions: [
          {
            id: `tb-gen-1`,
            question: `Sudden Death Challenge (${topic}): What fundamental principle or central law defines the entire field of ${topic}?`,
            answer: `The Core Axiom of ${topic}`,
            hint: `Foundational law in ${topic}.`,
          },
          {
            id: `tb-gen-2`,
            question: `Sudden Death Challenge (${topic}): Which breakthrough innovation or discovery revolutionized modern ${topic}?`,
            answer: `The Primary Innovation`,
            hint: `Milestone achievement in ${topic}.`,
          },
          {
            id: `tb-gen-3`,
            question: `Sudden Death Challenge (${topic}): What is the most famous question or paradox still debated in ${topic}?`,
            answer: `The Central Paradox of ${topic}`,
            hint: `Widely discussed topic dilemma.`,
          },
        ],
      };

      setGame(generatedGame);
      setIsGenerating(false);
      setShowAiModal(false);
    }, 600);
  };

  const handleImportCsvCategories = (importedCategories: Category[], replaceAll: boolean) => {
    if (replaceAll) {
      setGame({
        ...game,
        categories: importedCategories,
      });
    } else {
      setGame({
        ...game,
        categories: [...game.categories, ...importedCategories],
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSave = () => {
    onSaveGame(game);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-indigo-900/60 p-4 sm:p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <input
            type="text"
            value={game.title}
            onChange={(e) => setGame({ ...game, title: e.target.value })}
            placeholder="Game Title"
            className="text-2xl sm:text-3xl font-black bg-transparent text-white border-b border-dashed border-slate-700 hover:border-amber-400 focus:border-amber-400 focus:outline-none w-full max-w-xl transition-colors"
          />
          <input
            type="text"
            value={game.description}
            onChange={(e) => setGame({ ...game, description: e.target.value })}
            placeholder="Brief description for students/teachers..."
            className="text-xs sm:text-sm text-slate-400 bg-transparent w-full max-w-xl focus:outline-none"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Load Template */}
          <select
            onChange={(e) => e.target.value && handleLoadTemplate(e.target.value)}
            defaultValue=""
            className="bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="" disabled>Load Template...</option>
            {DEFAULT_GAMES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          {/* Instant Topic Generator */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Board</span>
          </button>

          {/* Import CSV / Spreadsheet */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
            title="Import questions directly from CSV or Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            title="Download JSON to share with teachers"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Game'}</span>
          </button>

          {/* Launch & Play Now */}
          <button
            onClick={() => onLaunchGame(game)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Game</span>
          </button>
        </div>
      </div>

      {/* Drag-and-Drop & Visual Card Grid Editor */}
      <div className="bg-slate-950/80 border-2 border-indigo-900/60 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Board Structure ({game.categories.length} Categories)
            </h2>
          </div>

          {game.categories.length < 6 && (
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category Column</span>
            </button>
          )}
        </div>

        {/* Categories Columns */}
        <div
          className="grid gap-3 sm:gap-4 min-w-[750px]"
          style={{ gridTemplateColumns: `repeat(${game.categories.length}, minmax(0, 1fr))` }}
        >
          {game.categories.map((category, catIndex) => (
            <div
              key={category.id}
              className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-3 flex flex-col space-y-3 shadow-lg"
            >
              {/* Category Header with Reorder Arrows */}
              <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveCategoryLeft(catIndex)}
                      disabled={catIndex === 0}
                      title="Move Category Left"
                      className="p-1 rounded hover:bg-indigo-900 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveCategoryRight(catIndex)}
                      disabled={catIndex === game.categories.length - 1}
                      title="Move Category Right"
                      className="p-1 rounded hover:bg-indigo-900 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {game.categories.length > 1 && (
                    <button
                      onClick={() => handleDeleteCategory(catIndex)}
                      title="Delete Category"
                      className="p-1 rounded hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={category.title}
                  onChange={(e) => {
                    const newCats = [...game.categories];
                    newCats[catIndex].title = e.target.value;
                    setGame({ ...game, categories: newCats });
                  }}
                  className="w-full bg-slate-900 text-center font-extrabold text-xs sm:text-sm text-amber-300 border border-slate-700 rounded-lg p-1.5 focus:border-amber-400 focus:outline-none"
                  placeholder="Category Name"
                />
              </div>

              {/* Questions Stack */}
              <div className="space-y-2 flex-1">
                {category.questions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    onClick={() => setActiveEditQuestion({ catIndex, qIndex })}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      activeEditQuestion?.catIndex === catIndex && activeEditQuestion?.qIndex === qIndex
                        ? 'bg-indigo-600/30 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-400 text-xs">
                        {question.points} PTS
                      </span>
                      {question.isDailyDouble && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                          2x
                        </span>
                      )}

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuestionUp(catIndex, qIndex);
                          }}
                          disabled={qIndex === 0}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuestionDown(catIndex, qIndex);
                          }}
                          disabled={qIndex === category.questions.length - 1}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-300 line-clamp-2 mt-1">
                      {question.question}
                    </p>
                  </div>
                ))}

                {/* Add Question Card */}
                {category.questions.length < 6 && (
                  <button
                    onClick={() => handleAddQuestion(catIndex)}
                    className="w-full py-2 border border-dashed border-slate-800 hover:border-indigo-600 text-slate-500 hover:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tile</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sudden Death Tie Breaker Questions Section (Max 10) */}
      <div className="bg-slate-950/80 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Sudden Death Tie Breakers
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : tieBreakerCount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {tieBreakerCount} / {MAX_TIE_BREAKER_QUESTIONS} Max Questions
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium max-w-2xl mt-0.5">
                Add up to 10 custom tie breaker questions specifically for this board. When teams tie for 1st place, random tie breakers are drawn from this contextual pool to keep playoffs relevant to your topic.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Clone from Category Tile */}
            <button
              type="button"
              onClick={() => setShowCategoryPickerForTb(true)}
              disabled={tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Pick an existing question from your board to clone into the tie breaker pool"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clone from Categories</span>
            </button>

            {/* Quick Suggest Thematic */}
            <button
              type="button"
              onClick={handleSuggestThematicTieBreaker}
              disabled={tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Add a contextual sudden-death challenge based on this board's title"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggest Context Question</span>
            </button>

            {/* Add Tie Breaker Question Button */}
            <button
              type="button"
              onClick={handleAddTieBreaker}
              disabled={tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tie Breaker</span>
            </button>
          </div>
        </div>

        {/* Empty state or questions list */}
        {tieBreakerCount === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">No Custom Tie Breaker Questions Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Without custom questions, general fallback trivia will be used during playoffs. Add up to 10 context-specific questions for <strong>"{game.title}"</strong> so tie breakers stay focused on your curriculum!
              </p>
            </div>
            <div className="flex gap-2 pt-1 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleAddTieBreaker}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-all hover:scale-105 active:scale-95"
              >
                + Add First Tie Breaker Question
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryPickerForTb(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
              >
                Clone from Board Categories
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(game.tieBreakerQuestions || []).map((tbQ, tbIdx) => (
              <div
                key={tbQ.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors shadow-md group"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-black flex items-center justify-center">
                      #{tbIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Sudden Death Card
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveTieBreaker(tbIdx, 'up')}
                      disabled={tbIdx === 0}
                      title="Move Question Up"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTieBreaker(tbIdx, 'down')}
                      disabled={tbIdx === tieBreakerCount - 1}
                      title="Move Question Down"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTieBreaker(tbIdx)}
                      title="Delete Question"
                      className="p-1 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Form fields inline */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                      Question Prompt
                    </label>
                    <textarea
                      rows={2}
                      value={tbQ.question}
                      onChange={(e) => handleUpdateTieBreaker(tbIdx, { question: e.target.value })}
                      placeholder="e.g. In chemistry, what element has the symbol Au?"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        value={tbQ.answer}
                        onChange={(e) => handleUpdateTieBreaker(tbIdx, { answer: e.target.value })}
                        placeholder="e.g. Gold"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                        Teacher Hint (Optional)
                      </label>
                      <input
                        type="text"
                        value={tbQ.hint || ''}
                        onChange={(e) => handleUpdateTieBreaker(tbIdx, { hint: e.target.value })}
                        placeholder="e.g. From Latin 'Aurum'"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Details Editor Drawer / Modal */}
      {activeEditQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-indigo-600 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Edit Question Tile</span>
              </h3>

              <button
                onClick={() => setActiveEditQuestion(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            {(() => {
              const { catIndex, qIndex } = activeEditQuestion;
              const q = game.categories[catIndex]?.questions[qIndex];
              if (!q) return null;

              const updateQuestion = (fields: Partial<Question>) => {
                const newCats = [...game.categories];
                newCats[catIndex].questions[qIndex] = { ...q, ...fields };
                setGame({ ...game, categories: newCats });
              };

              return (
                <div className="space-y-3.5">
                  <div className="flex gap-3">
                    <div className="w-1/2">
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                        Point Value
                      </label>
                      <input
                        type="number"
                        step={50}
                        value={q.points}
                        onChange={(e) => updateQuestion({ points: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono font-bold text-amber-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="w-1/2 flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                        <input
                          type="checkbox"
                          checked={!!q.isDailyDouble}
                          onChange={(e) => updateQuestion({ isDailyDouble: e.target.checked })}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Daily Double (2x Stakes)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Question Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={q.question}
                      onChange={(e) => updateQuestion({ question: e.target.value })}
                      placeholder="e.g. This is the largest planet in our solar system..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Correct Answer
                    </label>
                    <input
                      type="text"
                      value={q.answer}
                      onChange={(e) => updateQuestion({ answer: e.target.value })}
                      placeholder="e.g. Jupiter"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Teacher Hint (Optional)
                    </label>
                    <input
                      type="text"
                      value={q.hint || ''}
                      onChange={(e) => updateQuestion({ hint: e.target.value })}
                      placeholder="e.g. Named after the Roman king of the gods"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(catIndex, qIndex)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Tile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveEditQuestion(null)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Topic Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-indigo-600 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Generate Custom Board</h3>
                <p className="text-xs text-slate-400">
                  Type any school subject or topic to build a full 5x5 board in seconds!
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Topic or Subject
              </label>
              <input
                type="text"
                value={aiPromptTopic}
                onChange={(e) => setAiPromptTopic(e.target.value)}
                placeholder="e.g. Ancient Greece, Cell Biology, Shakespeare, US Constitution"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerateTopicBoard}
                disabled={isGenerating}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow transition-all active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? 'Generating Board...' : 'Create 5x5 Board'}
              </button>

              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Question Picker for Tie Breakers Modal */}
      {showCategoryPickerForTb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-indigo-600 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Copy className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Clone Tile into Tie Breaker
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any tile below to copy its question & answer into this board's tie breaker pool ({tieBreakerCount}/{MAX_TIE_BREAKER_QUESTIONS}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryPickerForTb(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {game.categories.map((cat, cIdx) => (
                <div key={cat.id} className="bg-slate-950/60 rounded-2xl border border-slate-800 p-3 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    {cat.title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.questions.map((q, qIdx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleQuickAddFromCategory(cIdx, qIdx)}
                        disabled={tieBreakerCount >= MAX_TIE_BREAKER_QUESTIONS}
                        className="text-left p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {q.points} PTS
                          </span>
                          <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                            + Clone
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white line-clamp-2">
                          "{q.question}"
                        </p>
                        <span className="text-[11px] text-emerald-400 font-semibold line-clamp-1 mt-1">
                          Ans: {q.answer}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryPickerForTb(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV / Spreadsheet Importer Modal */}
      <CsvImporterModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImportCategories={handleImportCsvCategories}
      />
    </div>
  );
};
