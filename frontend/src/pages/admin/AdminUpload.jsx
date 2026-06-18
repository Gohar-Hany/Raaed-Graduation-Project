import { useState, useEffect } from 'react';
import FileUpload from '../../components/FileUpload';
import { uploadFile, processFiles, pushToIndex, getProjects } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Cpu, Database, Loader2, CheckCircle, ArrowRight, Upload, Search, AlertCircle, Plus, FolderOpen } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Upload', desc: 'Upload file to server', Icon: Upload },
  { id: 'process', label: 'Process', desc: 'Extract & chunk content', Icon: Cpu },
  { id: 'index', label: 'Index', desc: 'Push to vector database', Icon: Search },
];

export default function AdminUpload() {
  const [projectId, setProjectId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [projects, setProjects] = useState([]);
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); // { name, fileId, assetName }
  const [processMode, setProcessMode] = useState('uploaded'); // 'uploaded' | 'all'
  const toast = useToast();

  useEffect(() => {
    getProjects()
      .then(list => {
        setProjects(list);
        // Don't auto-select — let user choose
      })
      .catch(err => toast.error('Failed to fetch projects'));
  }, []);

  // The effective project ID to use (either selected or new)
  const effectiveProjectId = isCreatingNew
    ? newCourseName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    : projectId;

  const handleUpload = async (file, onProgress) => {
    if (!effectiveProjectId) {
      toast.error('Please select or create a course first');
      throw new Error('No course selected');
    }
    const result = await uploadFile(effectiveProjectId, file, onProgress);
    // Store the uploaded file info for targeted processing
    setUploadedFiles(prev => [
      ...prev,
      {
        name: file.name,
        fileId: result.file_id,
        assetName: result.asset_name || null,
      }
    ]);
    // Mark upload step as done
    setPipelineStatus(prev => ({ ...prev, upload: 'done' }));
    return result;
  };

  const runPipeline = async () => {
    if (!effectiveProjectId) {
      toast.error('Please select or create a course first');
      return;
    }

    setPipelineStatus({ upload: 'done', process: 'running' });
    try {
      let processResult;

      if (processMode === 'uploaded' && uploadedFiles.length > 0) {
        // Process only the uploaded files, one by one
        let totalChunks = 0;
        let totalFiles = 0;

        for (const uf of uploadedFiles) {
          const result = await processFiles(effectiveProjectId, {
            fileId: uf.assetName || uf.fileId,
            doReset: false, // Don't reset — only add the new file's chunks
          });
          totalChunks += result.inserted_chunks || 0;
          totalFiles += result.processed_files || 0;
        }
        processResult = { inserted_chunks: totalChunks, processed_files: totalFiles };
      } else {
        // Process all files in the project
        processResult = await processFiles(effectiveProjectId, { doReset: true });
      }

      setPipelineStatus({ upload: 'done', process: 'done', index: 'running' });
      toast.success(`Processed ${processResult.processed_files} file(s), ${processResult.inserted_chunks} chunks`);

      const indexResult = await pushToIndex(effectiveProjectId, processMode === 'all');
      setPipelineStatus({ upload: 'done', process: 'done', index: 'done' });
      toast.success(`Indexed ${indexResult.inserted_items_count} items to vector DB`);
      setLastResult({ ...processResult, ...indexResult });

      // Refresh projects list in case a new one was created
      if (isCreatingNew) {
        const list = await getProjects();
        setProjects(list);
        setProjectId(effectiveProjectId);
        setIsCreatingNew(false);
        setNewCourseName('');
      }
      // Clear uploaded files tracking
      setUploadedFiles([]);
    } catch (err) {
      const failed = Object.entries(pipelineStatus).find(([, v]) => v === 'running')?.[0] || 'process';
      setPipelineStatus(prev => ({ ...prev, [failed]: 'error' }));
      toast.error(`Pipeline failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">Upload Files</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Upload course materials and process them through the RAG pipeline
        </p>
      </div>

      {/* Course / Project Selector */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
          Target Course
        </label>

        {/* Toggle: Existing vs New */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsCreatingNew(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !isCreatingNew
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            <FolderOpen size={16} />
            Existing Course
          </button>
          <button
            onClick={() => setIsCreatingNew(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isCreatingNew
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            <Plus size={16} />
            New Course
          </button>
        </div>

        {isCreatingNew ? (
          <div className="w-full max-w-md">
            <input
              type="text"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="Enter course name (e.g., Machine Learning)"
              className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-surface-900 dark:text-surface-100 shadow-sm placeholder-surface-400"
            />
            {newCourseName.trim() && (
              <p className="text-xs text-surface-400 mt-1.5">
                Course ID: <span className="font-mono text-primary-500">{effectiveProjectId}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            {projects.length === 0 ? (
              <div className="px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 text-sm text-surface-400">
                No courses found. Create a new one first.
              </div>
            ) : (
              <>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-surface-900 dark:text-surface-100 shadow-sm hover:border-surface-300 dark:hover:border-surface-600 cursor-pointer"
                >
                  <option value="" disabled>Select a course...</option>
                  {projects.map(p => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_id}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-surface-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </>
            )}
          </div>
        )}

        {/* Validation message */}
        {!effectiveProjectId && (
          <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            {isCreatingNew ? 'Please enter a course name to continue' : 'Please select a course to continue'}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div className={`bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card transition-opacity ${!effectiveProjectId ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
          Step 1: Upload Files
        </h3>
        <FileUpload
          onUpload={handleUpload}
          accept=".pdf,.txt"
          multiple
        />

        {/* Uploaded files tracking */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-accent-50 dark:bg-accent-950/20 border border-accent-200 dark:border-accent-800/50">
            <p className="text-xs font-medium text-accent-700 dark:text-accent-400 mb-1">
              {uploadedFiles.length} file(s) uploaded in this session:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uploadedFiles.map((uf, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-100 dark:bg-accent-900/30 text-xs font-medium text-accent-700 dark:text-accent-300">
                  <CheckCircle size={10} />
                  {uf.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Processing Pipeline */}
      <div className={`bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card transition-opacity ${!effectiveProjectId ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">
              Step 2: Process & Index
            </h3>
            <p className="text-sm text-surface-400 mt-0.5">
              Extract text, create chunks, and index into the vector database
            </p>
          </div>
          <button
            onClick={runPipeline}
            disabled={Object.values(pipelineStatus).includes('running') || !effectiveProjectId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-all hover:shadow-glow active:scale-95"
          >
            {Object.values(pipelineStatus).includes('running') ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Cpu size={16} />
            )}
            Run Pipeline
          </button>
        </div>

        {/* Process Mode Toggle */}
        <div className="mb-5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/30 border border-surface-200 dark:border-surface-700/50">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2 uppercase tracking-wider">
            Processing Mode
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setProcessMode('uploaded')}
              disabled={uploadedFiles.length === 0}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                processMode === 'uploaded'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:border-surface-300'
              } ${uploadedFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Uploaded Files Only ({uploadedFiles.length})
            </button>
            <button
              onClick={() => setProcessMode('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                processMode === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:border-surface-300'
              }`}
            >
              All Course Files (Full Reprocess)
            </button>
          </div>
          {processMode === 'all' && (
            <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              This will reset and reprocess all files in the course. May take a long time for large courses.
            </p>
          )}
        </div>

        {/* Pipeline Steps */}
        <div className="flex items-center gap-4">
          {PIPELINE_STEPS.map((step, i) => {
            const status = pipelineStatus[step.id];
            return (
              <div key={step.id} className="flex items-center gap-4 flex-1">
                <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  status === 'running' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' :
                  status === 'done' ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30' :
                  status === 'error' ? 'border-danger-500 bg-danger-50 dark:bg-danger-950/30' :
                  'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      status === 'running' ? 'bg-primary-100 dark:bg-primary-900/50' :
                      status === 'done' ? 'bg-accent-100 dark:bg-accent-900/50' :
                      status === 'error' ? 'bg-danger-100 dark:bg-danger-900/50' :
                      'bg-surface-200 dark:bg-surface-700'
                    }`}>
                      <step.Icon size={20} className={
                        status === 'running' ? 'text-primary-500' :
                        status === 'done' ? 'text-accent-500' :
                        status === 'error' ? 'text-danger-500' :
                        'text-surface-400'
                      } />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{step.label}</p>
                      <p className="text-xs text-surface-400">{step.desc}</p>
                    </div>
                    {status === 'running' && <Loader2 size={16} className="animate-spin text-primary-500 ml-auto" />}
                    {status === 'done' && <CheckCircle size={16} className="text-accent-500 ml-auto" />}
                    {status === 'error' && <AlertCircle size={16} className="text-danger-500 ml-auto" />}
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight size={18} className="text-surface-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Results */}
        {lastResult && (
          <div className="mt-6 p-4 rounded-xl bg-accent-50 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 animate-slide-up">
            <h4 className="text-sm font-semibold text-accent-700 dark:text-accent-400 mb-2">Pipeline Complete</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-surface-400">Files Processed</p>
                <p className="font-bold text-surface-900 dark:text-surface-100">{lastResult.processed_files || 0}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Chunks Created</p>
                <p className="font-bold text-surface-900 dark:text-surface-100">{lastResult.inserted_chunks || 0}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Vectors Indexed</p>
                <p className="font-bold text-surface-900 dark:text-surface-100">{lastResult.inserted_items_count || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
