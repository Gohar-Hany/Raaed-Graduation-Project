import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FileUpload({
  onUpload,
  accept = '.pdf,.txt',
  maxSize = 50 * 1024 * 1024,
  multiple = false,
}) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const processFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      id: Date.now() + Math.random(),
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }, []);

  const handleChange = (e) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const uploadFile = async (fileObj) => {
    setFiles(prev =>
      prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f)
    );

    try {
      const result = await onUpload(fileObj.file, (progress) => {
        setFiles(prev =>
          prev.map(f => f.id === fileObj.id ? { ...f, progress } : f)
        );
      });
      setFiles(prev =>
        prev.map(f => f.id === fileObj.id ? { ...f, status: 'success', progress: 100, result } : f)
      );
    } catch (err) {
      setFiles(prev =>
        prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', error: err.message } : f)
      );
    }
  };

  const uploadAll = () => {
    files.filter(f => f.status === 'pending').forEach(uploadFile);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group
          ${dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 scale-[1.02]'
            : 'border-surface-300 dark:border-surface-700 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-800/50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          dragActive
            ? 'gradient-primary shadow-glow-lg scale-110'
            : 'bg-surface-100 dark:bg-surface-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
        }`}>
          <Upload size={28} className={`transition-colors ${dragActive ? 'text-white' : 'text-surface-400 group-hover:text-primary-500'}`} />
        </div>
        <p className="text-surface-900 dark:text-surface-100 font-semibold mb-1">
          {dragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-surface-400">
          or <span className="text-primary-500 font-medium">browse files</span>
        </p>
        <p className="text-xs text-surface-400 mt-2">
          Supports PDF and TXT files • Max {formatSize(maxSize)}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-surface-600 dark:text-surface-300">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-all hover:shadow-glow active:scale-95"
              >
                <Upload size={16} />
                Upload {pendingCount > 1 ? `All (${pendingCount})` : ''}
              </button>
            )}
          </div>

          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 animate-slide-up"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                f.status === 'success' ? 'bg-accent-100 dark:bg-accent-900/30' :
                f.status === 'error' ? 'bg-danger-100 dark:bg-danger-900/30' :
                'bg-primary-100 dark:bg-primary-900/30'
              }`}>
                {f.status === 'success' ? <CheckCircle size={18} className="text-accent-500" /> :
                 f.status === 'error' ? <AlertCircle size={18} className="text-danger-500" /> :
                 f.status === 'uploading' ? <Loader2 size={18} className="text-primary-500 animate-spin" /> :
                 <FileText size={18} className="text-primary-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-surface-400">{formatSize(f.size)}</span>
                  {f.status === 'error' && (
                    <span className="text-xs text-danger-500">{f.error}</span>
                  )}
                </div>
                {f.status === 'uploading' && (
                  <div className="mt-1.5 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-300"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {(f.status === 'pending' || f.status === 'error') && (
                <button
                  onClick={() => removeFile(f.id)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-500/10 transition-all"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
