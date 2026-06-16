import os
import sys
import logging
import argparse
from pathlib import Path
from pypdf import PdfReader, PdfWriter

# Add src to python path
sys.path.append(str(Path(__file__).parent))

# Configuration of argument parsing
parser = argparse.ArgumentParser(description="Test and Verify the Unified PDF Extraction Pipeline")
parser.add_argument(
    "--file",
    type=str,
    default=None,
    help="Path to the PDF/image file to test. If not specified, lists and lets you choose from sample content."
)
parser.add_argument(
    "--pages",
    type=int,
    default=1,
    help="Number of pages to extract from the start of the PDF for testing (0 to process the entire file). Default is 1."
)
parser.add_argument(
    "--accurate-tables",
    action="store_true",
    help="Use accurate table structure extraction mode (instead of fast mode)."
)
parser.add_argument(
    "--no-code",
    action="store_true",
    help="Disable code block detection & formulas."
)
parser.add_argument(
    "--chunk-size",
    type=int,
    default=20,
    help="Page-chunking size for large PDFs. Default is 20."
)
parser.add_argument(
    "--verbose",
    action="store_true",
    help="Enable detailed docling framework log outputs."
)

args = parser.parse_args()

# Set logging level based on verbose flag
logging.basicConfig(
    level=logging.INFO if args.verbose else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Set our script specific logger to INFO
logger = logging.getLogger("verify_script")
logger.setLevel(logging.INFO)

try:
    from controllers._extraction import run_unified_pipeline
    logger.info("[OK] Unified pipeline imports verified successfully.")
except ImportError as e:
    logger.error(f"[ERROR] Import failed: {e}")
    sys.exit(1)

# Directories
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / "pipeline_reference" / "content"
OUTPUT_DIR = ROOT_DIR / "test_output"

# Select File
if args.file:
    target_file = Path(args.file)
else:
    # If no file is provided, let's scan the content directory and let the user select
    if CONTENT_DIR.exists():
        pdf_files = list(CONTENT_DIR.glob("*.pdf")) + list(CONTENT_DIR.glob("*.png")) + list(CONTENT_DIR.glob("*.jpg"))
        if pdf_files:
            print("\nAvailable test files in pipeline_reference/content:")
            for idx, f in enumerate(pdf_files, 1):
                print(f"  [{idx}] {f.name} ({f.stat().st_size / (1024*1024):.2f} MB)")
            
            try:
                choice = input(f"\nSelect file number to test (1-{len(pdf_files)}) [Default 1: {pdf_files[0].name}]: ").strip()
                if choice:
                    target_file = pdf_files[int(choice) - 1]
                else:
                    target_file = pdf_files[0]
            except (ValueError, IndexError):
                print("[Warning] Invalid choice, using default first file.")
                target_file = pdf_files[0]
        else:
            logger.error(f"No PDF or image files found in {CONTENT_DIR}")
            sys.exit(1)
    else:
        logger.error(f"Content directory {CONTENT_DIR} does not exist.")
        sys.exit(1)

if not target_file.exists():
    logger.error(f"[ERROR] File not found: {target_file}")
    sys.exit(1)

print("\n" + "=" * 60)
print(f"  TEST PROFILE:")
print(f"  - Target File:    {target_file.name}")
print(f"  - Pages Limit:    {f'First {args.pages} pages' if args.pages > 0 else 'Full Document'}")
print(f"  - Table Mode:     {'Accurate' if args.accurate-tables else 'Fast'}")
print(f"  - Code Detection: {'Disabled' if args.no_code else 'Enabled'}")
print(f"  - Chunk Size:     {args.chunk_size} pages")
print("=" * 60 + "\n")

# Prepare test PDF (with page limit if specified)
test_source = target_file
temp_pdf_path = None

if args.pages > 0 and target_file.suffix.lower() == ".pdf":
    try:
        reader = PdfReader(str(target_file))
        total_pages = len(reader.pages)
        pages_to_extract = min(args.pages, total_pages)
        
        if pages_to_extract < total_pages:
            temp_pdf_path = Path(__file__).parent / f"temp_test_{target_file.stem}.pdf"
            print(f"Extracting first {pages_to_extract} page(s) out of {total_pages} for testing...")
            
            writer = PdfWriter()
            for p_idx in range(pages_to_extract):
                writer.add_page(reader.pages[p_idx])
            with open(temp_pdf_path, "wb") as f:
                writer.write(f)
            
            test_source = temp_pdf_path
            print(f"[OK] Temporary test file created: {temp_pdf_path.name}")
    except Exception as e:
        logger.error(f"Failed to prepare page-limited test file: {e}. Running full file instead.")

print(f"Starting unified pipeline on: {test_source.name}")
print(f"Output directory: {OUTPUT_DIR}\n")

# Custom print handler to show logs clean of emojis for windows stdout
class ConsoleHandler(logging.Handler):
    def emit(self, record):
        msg = self.format(record)
        # Clean emojis for safety on Windows console
        msg = msg.replace("⚠", "[Warning]").replace("✗", "[Error]").replace("✅", "[OK]")
        print(msg)

# Temporarily catch unified_pipeline logging to output nicely
pipeline_logger = logging.getLogger("unified_pipeline")
pipeline_logger.setLevel(logging.INFO)
# Clear existing handlers
for h in pipeline_logger.handlers[:]:
    pipeline_logger.removeHandler(h)
pipeline_logger.addHandler(ConsoleHandler())

try:
    # Execute
    result = run_unified_pipeline(
        source=str(test_source),
        output_dir=OUTPUT_DIR,
        chunk_size=args.chunk_size,
        no_code=args.no_code,
        fast_tables=not args.accurate_tables
    )
    
    if result:
        markdown, json_data, report = result
        print("\n" + "=" * 60)
        print("  EXTRACTION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(report.summary().replace("⚠", "[Warning]").replace("✗", "[Error]"))
        print("=" * 60)
        
        # Markdown preview
        preview_len = 500
        preview = markdown[:preview_len].strip()
        print("\n--- MARKDOWN OUTPUT PREVIEW (First 500 chars) ---")
        print(preview)
        if len(markdown) > preview_len:
            print("...\n[Truncated]")
        print("-------------------------------------------------")
        
        print(f"\nOutputs successfully saved to:")
        print(f"  - Markdown: {OUTPUT_DIR}/{test_source.stem}.md")
        print(f"  - JSON:     {OUTPUT_DIR}/{test_source.stem}.json")
        print(f"  - Report:   {OUTPUT_DIR}/{test_source.stem}_report.json")
    else:
        print("\n[ERROR] Pipeline returned None.")
        
except Exception as e:
    print(f"\n[ERROR] Error occurred during pipeline execution: {e}")
    import traceback
    traceback.print_exc()

finally:
    # Cleanup
    if temp_pdf_path and temp_pdf_path.exists():
        try:
            os.remove(temp_pdf_path)
            print(f"\nCleaned up temporary file: {temp_pdf_path.name}")
        except Exception:
            pass
