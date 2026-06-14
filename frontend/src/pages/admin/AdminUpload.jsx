import { useState } from 'react';
import FileUpload from '../../components/FileUpload';
import { uploadFile, processFiles, pushToIndex } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Cpu, Database, Loader2, CheckCircle, ArrowRight, Upload, Search, AlertCircle } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Upload', desc: 'Upload file to server', Icon: Upload },
  { id: 'process', label: 'Process', desc: 'Extract & chunk content', Icon: Cpu },
  { id: 'index', label: 'Index', desc: 'Push to vector database', Icon: Search },
];

export default function AdminUpload() {
  const [projectId, setProjectId] = useState('testproject1');
  const [pipelineStatus, setPipelineStatus] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const toast = useToast();

  const handleUpload = async (file, onProgress) => {
    return await uploadFile(projectId, file, onProgress);
  };

  const runPipeline = async () => {
    setPipelineStatus({ upload: 'done', process: 'running' });
    try {
      const processResult = await processFiles(projectId, { doReset: true });
      setPipelineStatus({ upload: 'done', process: 'done', index: 'running' });
      toast.success(`Processed ${processResult.processed_files} files, ${processResult.inserted_chunks} chunks`);

      const indexResult = await pushToIndex(projectId, true);
      setPipelineStatus({ upload: 'done', process: 'done', index: 'done' });
      toast.success(`Indexed ${indexResult.inserted_items_count} items to vector DB`);
      setLastResult({ ...processResult, ...indexResult });
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

      {/* Project Selector */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Target Project
        </label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-surface-900 dark:text-surface-100"
          placeholder="Enter project ID (e.g., testproject1)"
        />
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
        <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
          Step 1: Upload Files
        </h3>
        <FileUpload
          onUpload={handleUpload}
          accept=".pdf,.txt"
          multiple
        />
      </div>

      {/* Processing Pipeline */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-card">
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
            disabled={Object.values(pipelineStatus).includes('running')}
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
