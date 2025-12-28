#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script to remove ALL broken emoji characters from Cart.jsx"""

import re

def fix_cart_emojis():
    filepath = r'c:\ekirmen\src\backoffice\pages\CompBoleteria\Cart.jsx'
    
    try:
        # Read the file
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count original broken emojis
        broken_patterns = [
            r'<span[^>]*>ðŸ[^<]*</span>',
            r'<span[^>]*>Ã°[^<]*</span>',
            r'ðŸ\w+',
            r'Ã°\S+',
        ]
        
        original_count = 0
        for pattern in broken_patterns:
            original_count += len(re.findall(pattern, content))
        
        # Remove broken emoji spans - replace with empty spans
        # Pattern 1: <span>ðŸ...</span> or <span>Ã°...</span>
        content = re.sub(r'<span([^>]*)>ðŸ[^<]*</span>', r'<span\1></span>', content)
        content = re.sub(r'<span([^>]*)>Ã°[^<]*</span>', r'<span\1></span>', content)
        
        # Pattern 2: Standalone broken emojis
        content = re.sub(r'ðŸ\w+', '', content)
        content = re.sub(r'Ã°\S+', '', content)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Successfully cleaned {filepath}")
        print(f"   Found and removed ~{original_count} broken emoji patterns")
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == '__main__':
    import sys
    sys.exit(fix_cart_emojis())
