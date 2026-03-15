import os
import re

def replace_hardcoded_urls(root_dir):
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.js'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if 'http://localhost:5000' in content:
                        new_content = re.sub(r'\'http://localhost:5000/api[^\']*\'', lambda m: m.group(0).replace('\'http://localhost:5000/api', '`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}').replace('\'', '`'), content)
                        new_content = re.sub(r'"http://localhost:5000/api[^"]*"', lambda m: m.group(0).replace('"http://localhost:5000/api', '`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}').replace('"', '`'), new_content)
                        new_content = re.sub(r'`http://localhost:5000/api[^`]*`', lambda m: m.group(0).replace('`http://localhost:5000/api', '`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}'), new_content)
                        
                        new_content = re.sub(r'\'http://localhost:5000\'', '(import.meta.env.VITE_API_URL?.replace(\'/api\', \'\') || "http://localhost:5000")', new_content)
                        new_content = re.sub(r'"http://localhost:5000"', '(import.meta.env.VITE_API_URL?.replace(\'/api\', \'\') || "http://localhost:5000")', new_content)
                        new_content = new_content.replace('`http://localhost:5000/', '`${(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000")}/')
                        
                        new_content = new_content.replace('io(\'http://localhost:5000\'', 'io((import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000")')
                        
                        if content != new_content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f'Updated {file_path}')
                except Exception as e:
                    print(f'Error reading {file_path}: {e}')

replace_hardcoded_urls(r'd:\FAST SEMESTERS\SEMESTER 8\FYP-II\Lab2Home Latest\Lab2-Home\src')
