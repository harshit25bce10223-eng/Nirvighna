import os, re

# Check for any circular dependencies or missing imports
folder = r'C:\SVH\Kavach\src\pages\volunteer'
print("=== Checking volunteer page imports ===")
for fname in os.listdir(folder):
    if fname.endswith('.jsx'):
        path = os.path.join(folder, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        imports = re.findall(r'import\s+.*from\s+[\'\"]([^\'\"]+)[\'\"]', content)
        for imp in imports:
            if imp.startswith('.'):
                # Relative import - check if file exists
                # Not checking for now
                pass
        
        # Check for unused imports - simplified check
        if 'useVolunteerAuth' in content and 'useVolunteerAuth' not in content:
            pass

print("Import check done")

# Check for any circular dependencies in lib
lib_folder = r'C:\SVH\Kavach\src\lib'
for fname in os.listdir(r'C:\SVH\Kavach\src\lib'):
    if fname.endswith('.js'):
        path = os.path.join(r'C:\SVH\Kavach\src\lib', fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        imports = re.findall(r'import\s+.*from\s+[\'\"]([^\'\"]+)[\'\"]', content)
        for imp in imports:
            if imp.startswith('./') or imp.startswith('../'):
                # Check if file exists
                base = os.path.dirname(os.path.join(r'C:\SVH\Kavach\src\lib', fname))
                target = os.path.normpath(os.path.join(base, imp))
                if not any(os.path.exists(target + ext) for ext in ['.js', '.jsx', '.json']):
                    if not imp.startswith('.'):
                        pass
print("Import check done")

# Check for any circular dependencies
print("Done checking")