#!/usr/bin/env python3
"""
Download Dev B primary sources (UT HPO PDFs, AAMC A-23, AACOM grid) into scripts/data/.

Uses curl (SSL) so it matches typical developer environments. Re-run anytime to refresh.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
_ROOT = _SCRIPTS.parent

# (url, relative path under scripts/data/)
DOWNLOADS: list[tuple[str, str]] = [
    (
        "https://healthprofessions.utexas.edu/media/277/download",
        "hpo/ut_hpo_tmdsas_2022.pdf",
    ),
    (
        "https://healthprofessions.utexas.edu/media/337/download",
        "hpo/ut_hpo_amcas_2023.pdf",
    ),
    (
        "https://healthprofessions.utexas.edu/media/275/download",
        "hpo/ut_hpo_aacomas_2022.pdf",
    ),
    (
        "https://healthprofessions.utexas.edu/media/231/download",
        "hpo/ut_hpo_tmdsas_2021.pdf",
    ),
    (
        "https://healthprofessions.utexas.edu/media/232/download",
        "hpo/ut_hpo_amcas_2021.pdf",
    ),
    (
        "https://www.aamc.org/media/6091/download",
        "aamc/A-23_2023.pdf",
    ),
    (
        "https://prehealth.gmu.edu/wp-content/uploads/AACOM-GPA-vs-MCAT-Acceptance-Percentage-2018-2021.pdf",
        "aacom/aacom_grid_aggregated_2018_2021.pdf",
    ),
]


def main() -> None:
    data_root = _SCRIPTS / "data"
    data_root.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []
    for url, rel in DOWNLOADS:
        dest = data_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_suffix(dest.suffix + ".tmp")
        print(f"Fetching {rel} …")
        r = subprocess.run(
            [
                "curl",
                "-fsSL",
                "--retry",
                "3",
                "--retry-delay",
                "1",
                "-A",
                (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "-e",
                "https://healthprofessions.utexas.edu/",
                "-o",
                str(tmp),
                url,
            ],
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            if tmp.exists():
                tmp.unlink()
            if dest.exists():
                print(
                    f"FAILED {url}; keeping existing file: {dest.name}",
                    file=sys.stderr,
                )
                failures.append(f"{rel} (used existing)")
                continue
            print(f"FAILED {url}: {r.stderr or r.stdout}", file=sys.stderr)
            failures.append(rel)
            continue
        tmp.replace(dest)
        print(f"  → {dest} ({dest.stat().st_size} bytes)")
    if failures:
        print("Completed with warnings:")
        for item in failures:
            print(f"  - {item}")
    else:
        print("Done.")


if __name__ == "__main__":
    main()
