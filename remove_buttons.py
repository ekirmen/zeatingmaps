#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script to remove broken emoji icon buttons from Boleteria.jsx"""

import sys

def remove_broken_buttons():
    filepath = r'c:\ekirmen\src\backoffice\pages\Boleteria.jsx'
    
    try:
        # Read the file
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Remove lines 1128-1139 (Python uses 0-based indexing, so 1127-1138)
        # Lines to remove: 1128, 1129, 1130, 1131, 1132, 1133, 1134, 1135, 1136, 1137, 1138, 1139
        new_lines = lines[:1127] + lines[1139:]
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        print(f"✅ Successfully removed 12 lines (1128-1139) from {filepath}")
        print(f"   Total lines before: {len(lines)}")
        print(f"   Total lines after: {len(new_lines)}")
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(remove_broken_buttons())
