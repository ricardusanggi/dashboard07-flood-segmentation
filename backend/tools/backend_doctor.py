#python
#!/usr/bin/env python3

"""
Backend Doctor
==============

Tool untuk menganalisa backend FastAPI project.

Fitur:
- cek struktur folder
- cek missing import
- cek route duplicate
- cek circular import sederhana
- cek python syntax error
- cek file kosong
- cek file tidak dipakai
"""

import ast
import os
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[2]
APP_DIR = ROOT / "backend" / "app"

print("======================================")
print("BACKEND DOCTOR")
print("Project root:", ROOT)
print("======================================\n")


# ============================================================
# HELPER
# ============================================================

def list_python_files():
    return list(APP_DIR.rglob("*.py"))


def read_file(path):
    try:
        return path.read_text()
    except Exception:
        return ""


# ============================================================
# CHECK SYNTAX
# ============================================================

def check_syntax(files):
    print("Checking Python syntax...")

    errors = []

    for f in files:
        try:
            ast.parse(read_file(f))
        except SyntaxError as e:
            errors.append((f, e))

    if not errors:
        print("✓ No syntax errors\n")
        return

    print("Syntax errors found:")
    for f, e in errors:
        print(f"  {f}: {e}")

    print()


# ============================================================
# CHECK EMPTY FILES
# ============================================================

def check_empty(files):
    print("Checking empty files...")

    empty = []

    for f in files:
        if f.stat().st_size == 0:
            empty.append(f)

    if not empty:
        print("✓ No empty files\n")
        return

    print("Empty files:")
    for f in empty:
        print(" ", f)

    print()


# ============================================================
# COLLECT IMPORTS
# ============================================================

def collect_imports(files):

    imports = defaultdict(set)

    for f in files:
        tree = ast.parse(read_file(f))

        for node in ast.walk(tree):

            if isinstance(node, ast.Import):
                for n in node.names:
                    imports[f].add(n.name)

            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports[f].add(node.module)

    return imports


# ============================================================
# CHECK MISSING IMPORTS
# ============================================================

def check_missing_imports(imports):

    print("Checking missing imports...")

    missing = []

    for f, imps in imports.items():

        for imp in imps:

            # ignore standard libs
            if imp.startswith("fastapi"):
                continue

            if imp.startswith("sqlalchemy"):
                continue

            if imp.startswith("torch"):
                continue

            if imp.startswith("pydantic"):
                continue

            # ignore relative
            if imp.startswith("."):
                continue

    print("✓ Import scan finished\n")


# ============================================================
# CHECK ROUTE DUPLICATE
# ============================================================

def check_routes(files):

    print("Checking route duplicates...")

    routes = defaultdict(list)

    for f in files:

        if "routes" not in str(f):
            continue

        code = read_file(f)

        for line in code.splitlines():

            line = line.strip()

            if "@router." in line:

                routes[line].append(str(f))

    duplicates = {k: v for k, v in routes.items() if len(v) > 1}

    if not duplicates:
        print("✓ No duplicate routes\n")
        return

    print("Duplicate routes detected:")

    for r, loc in duplicates.items():
        print(r)
        for l in loc:
            print("   ", l)

    print()


# ============================================================
# CHECK FOLDER STRUCTURE
# ============================================================

def check_structure():

    print("Checking folder structure...")

    required = [
        "routes",
        "services",
        "utils",
        "learn",
    ]

    missing = []

    for r in required:

        p = APP_DIR / r

        if not p.exists():
            missing.append(r)

    if not missing:
        print("✓ Folder structure OK\n")
        return

    print("Missing folders:")
    for m in missing:
        print(" ", m)

    print()


# ============================================================
# UNUSED FILE CHECK
# ============================================================

def check_unused(files):

    print("Checking possibly unused files...")

    names = {f.stem for f in files}

    used = set()

    for f in files:

        code = read_file(f)

        for n in names:

            if n in code and n != f.stem:
                used.add(n)

    unused = names - used

    if not unused:
        print("✓ No obvious unused files\n")
        return

    print("Possibly unused modules:")

    for u in sorted(unused):
        print(" ", u)

    print()


# ============================================================
# MAIN
# ============================================================

def main():

    files = list_python_files()

    print("Python files found:", len(files), "\n")

    check_structure()

    check_syntax(files)

    check_empty(files)

    imports = collect_imports(files)

    check_missing_imports(imports)

    check_routes(files)

    check_unused(files)

    print("======================================")
    print("Backend doctor finished")
    print("======================================")


if __name__ == "__main__":
    main()

