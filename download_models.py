import sys
import time
from tqdm import tqdm

class DockerFriendlyProgressBar(tqdm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._last_print_time = time.time()
        self._last_n = 0

    def update(self, n=1):
        super().update(n)
        current_time = time.time()
        total = self.total if self.total else 1
        percent_diff = (self.n - self._last_n) / total
        if current_time - self._last_print_time > 10 or percent_diff >= 0.05 or self.n == self.total:
            percent = (self.n / total * 100) if self.total else 0
            n_mb = self.n / (1024 * 1024)
            total_mb = total / (1024 * 1024) if self.total else 0
            desc = self.desc if self.desc else "Download"
            print(f"[{desc}] Downloaded {n_mb:.1f}MB / {total_mb:.1f}MB ({percent:.1f}%)", flush=True)
            self._last_print_time = current_time
            self._last_n = self.n

# Monkey patch tqdm
import tqdm as tqdm_module
tqdm_module.tqdm = DockerFriendlyProgressBar
import tqdm.auto as tqdm_auto
tqdm_auto.tqdm = DockerFriendlyProgressBar

# Monkey patch huggingface_hub tqdm
try:
    import huggingface_hub.utils as hf_utils
    hf_utils.tqdm = DockerFriendlyProgressBar
except ImportError:
    pass

model_type = sys.argv[1] if len(sys.argv) > 1 else "all"

if model_type == "embedding" or model_type == "all":
    print("--- Loading Alibaba-NLP/gte-multilingual-base ---", flush=True)
    from sentence_transformers import SentenceTransformer
    SentenceTransformer('Alibaba-NLP/gte-multilingual-base', trust_remote_code=True)
    print("--- Embedding model load complete ---", flush=True)

if model_type == "reranker" or model_type == "all":
    print("--- Loading BAAI/bge-reranker-v2-m3 ---", flush=True)
    from sentence_transformers import CrossEncoder
    CrossEncoder('BAAI/bge-reranker-v2-m3')
    print("--- Reranker model load complete ---", flush=True)
