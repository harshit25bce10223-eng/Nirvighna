import os, re

folder = r'C:\SVH\Kavach\src\pages\volunteer'
print("=== Checking volunteer pages for useEffect cleanup ===")
for fname in os.listdir(folder):
    if fname.endswith('.jsx'):
        path = os.path.join(folder, fname)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'useEffect' in content:
            # Count useEffect and cleanup functions
            use_effect_count = content.count('useEffect')
            cleanup_count = content.count('return () =>')
            if use_effect_count > cleanup_count:
                print(f'{fname}: useEffect({use_effect_count}) vs cleanup({cleanup_count}) - MISSING CLEANUP')

# Also check KV
folder2 = r'C:\SVH\Kavach-Volunteer\src\pages\volunteer'
if os.path.exists(folder2):
    for fname in os.listdir(folder2):
        if fname.endswith('.jsx'):
            path = os.path.join(folder2, fname)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'useEffect' in content:
                use_effect_count = content.count('useEffect')
                cleanup_count = content.count('return () =>')
                if use_effect_count > cleanup_count:
                    print(f'KV {fname}: useEffect({use_effect_count}) vs cleanup({cleanup_count}) - MISSING CLEANUP')

print("Done checking useEffect cleanup")