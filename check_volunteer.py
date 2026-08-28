import os, re

folder = r'C:\SVH\Kavach\src\pages\volunteer'
for f in os.listdir(folder):
    if f.endswith('.jsx'):
        path = os.path.join(folder, f)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        issues = []
        if 'console.log' in content: issues.append('console.log')
        if 'debugger' in content: issues.append('debugger')
        if 'TODO' in content.upper(): issues.append('TODO')
        if 'FIXME' in content.upper(): issues.append('FIXME')
        if issues:
            print(f'{f}: {issues}')
        else:
            print(f'{os.path.basename(path)}: OK')

# Also check KV
folder2 = r'C:\SVH\Kavach-Volunteer\src\pages\volunteer'
if os.path.exists(folder2):
    for f in os.listdir(folder2):
        if f.endswith('.jsx'):
            path = os.path.join(folder2, f)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            issues = []
            if 'console.log' in content: issues.append('console.log')
            if 'debugger' in content: issues.append('debugger')
            if 'TODO' in content.upper(): issues.append('TODO')
            if 'FIXME' in content.upper(): issues.append('FIXME')
            if issues:
                print(f'KV {os.path.basename(path)}: {issues}')
            else:
                print(f'KV {os.path.basename(path)}: OK')