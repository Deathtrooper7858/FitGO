import re

def resolve_conflicts_keep_head(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern: <<<<<< HEAD ... ======= ... >>>>>>> hash
    # We keep the HEAD section (between <<<<<<< HEAD and =======)
    # and discard the other section (between ======= and >>>>>>>)
    pattern = r'<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n.*?>>>>>>> [0-9a-f]+\r?\n'
    
    def replace_conflict(m):
        return m.group(1) + '\r\n'
    
    resolved = re.sub(pattern, replace_conflict, content, flags=re.DOTALL)
    
    remaining = re.findall(r'<<<<<<<', resolved)
    print(f'Remaining conflicts after resolution: {len(remaining)}')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(resolved)
    
    print(f'Done: {filepath}')

resolve_conflicts_keep_head(r'app\(tabs)\planner\index.tsx')
