#!/usr/bin/env python3
"""
Batch PPTX to JSON Converter

Usage:
    python batch_convert.py <input_dir> <output_dir> [--category "Category Name"]
"""

import argparse
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="Batch convert PPTX files to JSON"
    )
    parser.add_argument("input_dir", type=Path, help="Directory containing PPTX files")
    parser.add_argument("output_dir", type=Path, help="Output directory for JSON files")
    parser.add_argument("--category", help="Category name for all files (optional)")

    args = parser.parse_args()

    # Validate input directory
    if not args.input_dir.exists():
        print(f"Error: Input directory not found: {args.input_dir}")
        sys.exit(1)

    # Create output directory
    args.output_dir.mkdir(parents=True, exist_ok=True)

    # Get script directory (where this script is located)
    script_dir = Path(__file__).parent.resolve()
    parse_script = script_dir / "parse_pptx.py"

    # Find all PPTX files
    pptx_files = list(args.input_dir.glob("*.pptx"))

    if not pptx_files:
        print(f"No PPTX files found in: {args.input_dir}")
        return

    print(f"\nStarting batch conversion...")
    print(f"Input directory: {args.input_dir}")
    print(f"Output directory: {args.output_dir}")
    if args.category:
        print(f"Category: {args.category}")
    print(f"\nFound {len(pptx_files)} PPTX files\n")

    # Track statistics
    successful = 0
    failed = 0

    # Process each file
    for pptx_file in pptx_files:
        output_file = args.output_dir / f"{pptx_file.stem}.json"

        print(f"Processing: {pptx_file.name}")

        # Build command
        cmd = ["poetry", "run", "python", str(parse_script), str(pptx_file), str(output_file)]

        # Use provided category or filename as category name
        category = args.category if args.category else pptx_file.stem
        cmd.extend(["--category", category])

        # Run conversion
        try:
            result = subprocess.run(
                cmd,
                cwd=script_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout per file
            )

            if result.returncode == 0:
                print(f"✓ Success: {output_file.name}\n")
                successful += 1
            else:
                print(f"✗ Failed: {pptx_file.name}")
                print(f"  Error: {result.stderr[:200]}\n")
                failed += 1

        except subprocess.TimeoutExpired:
            print(f"✗ Failed: {pptx_file.name} (timeout)\n")
            failed += 1
        except Exception as e:
            print(f"✗ Failed: {pptx_file.name} ({e})\n")
            failed += 1

    # Print summary
    print("=" * 40)
    print("Batch Conversion Complete")
    print("=" * 40)
    print(f"Total files:  {len(pptx_files)}")
    print(f"Successful:   {successful}")
    if failed > 0:
        print(f"Failed:       {failed}")
    print()

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    main()
